import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool, stepCountIs, convertToModelMessages } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// github models inference endpoint — we use this instead of standard openai
// because our token is a github PAT routed through azure inference
const githubAI = createOpenAI({
  baseURL: "https://models.inference.ai.azure.com",
  apiKey: process.env.GITHUB_TOKEN,
});

// builds the system prompt with dynamic date/time injection and ethical guardrails.
// the ai needs the current timestamp to resolve relative phrases like "tomorrow" or "this monday"
function buildSystemPrompt(): string {
  const now = new Date();
  const formatted = now.toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return `You are MindLens AI Assistant — a friendly, professional navigation and scheduling helper for the MindLens-AI mental health platform.

Current date and time: ${formatted}

YOUR CAPABILITIES:
1. Check real-time counselor availability by querying the database using the checkAvailability tool.
2. Help users navigate the platform (explain pages, buttons, and flows).
3. Answer general questions about platform features.
4. Recommend users the "Take an Emotion Test" feature or booking a counselor.

PLATFORM NAVIGATION GUIDE:
- Landing page "/" has a hero section and overview of the platform.
- "/login" and "/register" are the authentication pages.
- "/dashboard/patient" is the patient home page with a hero, CTA buttons (Take Emotion Test, Book a Session), and a "Browse Counselors" section (scroll down or click "Book a Session" in the navbar).
- "/emotion-test" is the AI Emotion Analysis page where patients can record a video and get emotion analysis from Hume AI, along with counselor recommendations.
- "/dashboard/patient/appointments" shows the patient's upcoming, completed, and missed appointments.
- "/dashboard/patient/profile" is the patient's profile page.
- Patients book sessions by browsing counselors on their home page, selecting a counselor, choosing an available time slot, and confirming the booking.
- "/dashboard/counselor" is the counselor home page.
- "/dashboard/counselor/availability" is where counselors manage their recurring schedule and availability slots.
- "/dashboard/counselor/appointments" shows the counselor's appointments.
- "/dashboard/counselor/profile" is the counselor's profile page.

STRICT ETHICAL RULES (NEVER VIOLATE):
- You must NEVER provide medical advice, mental health diagnoses, therapy, or treatment suggestions.
- If a user describes emotional distress, depression, anxiety, or any mental health symptoms, respond with empathy but firmly redirect them:
  a) Suggest they use the "Take an Emotion Test" feature at the "/emotion-test" page for AI-powered emotional analysis.
  b) Suggest they book a session with a verified counselor through the "Book a Session" option.
  c) If they seem in crisis, remind them to contact emergency services or a crisis helpline.
- Never say things like "You might have depression" or "Try meditation for your anxiety." That crosses into medical advice territory.

RESPONSE STYLE:
- Be warm, concise, and helpful. Use a supportive but professional tone.
- When providing availability info, format it nicely with counselor names, specialties, dates, and times.
- When guiding navigation, give clear step-by-step directions.
- Keep responses short and focused — don't ramble.`;
}

export async function POST(req: Request) {
  try {
    // enforce authentication — only logged-in users can use the chatbot
    const session = await auth();
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages } = await req.json();

    // convert ui messages (parts-based format from useChat v6) to model messages
    // that streamText and the openai provider can understand
    const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: githubAI.chat("gpt-4o-mini"),
    system: buildSystemPrompt(),
    messages: modelMessages,
    stopWhen: stepCountIs(5),
    onError: (event) => {
      console.error("[STREAM_ERROR]", event.error);
    },
    tools: {
      // the main tool that lets the ai query our database for counselor availability.
      // instead of using rag, we give the ai a deterministic function it can call
      // whenever it needs live scheduling data
      checkAvailability: tool({
        description:
          "Check counselor availability by querying the database for unbooked slots. " +
          "Use this when a user asks about available counselors, specific counselor schedules, " +
          "or wants to know who is free on a certain date/time. Also use this to check if a " +
          "specific person is registered as a counselor.",
        inputSchema: z.object({
          date: z
            .string()
            .optional()
            .describe(
              "ISO 8601 date string (e.g. 2025-03-12) to filter slots for a specific day. " +
              "If the user says 'tomorrow', calculate the actual date from the current date provided in context."
            ),
          counselorName: z
            .string()
            .optional()
            .describe(
              "Full or partial name of a specific counselor to search for. " +
              "Case-insensitive search."
            ),
        }),
        execute: async ({ date, counselorName }: { date?: string; counselorName?: string }) => {
          // build the prisma where clause dynamically based on what the ai provided
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const where: any = {
            isBooked: false,
            isBlocked: false,
          };

          // filter by date range if the ai resolved a specific day
          if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);

            where.startTime = {
              gte: startOfDay,
              lte: endOfDay,
            };
          } else {
            // if no date specified, only show future slots (no point showing past availability)
            where.startTime = { gte: new Date() };
          }

          // filter by counselor name using case-insensitive partial match
          if (counselorName) {
            where.counselor = {
              fullName: {
                contains: counselorName,
                mode: "insensitive",
              },
              // only show verified counselors in availability results
              verificationStatus: "VERIFIED",
            };
          } else {
            where.counselor = {
              verificationStatus: "VERIFIED",
            };
          }

          const slots = await prisma.availabilitySlot.findMany({
            where,
            include: {
              counselor: {
                select: {
                  fullName: true,
                  professionalTitle: true,
                  experienceYears: true,
                  hourlyRate: true,
                  specialties: {
                    include: {
                      specialty: { select: { name: true } },
                    },
                  },
                },
              },
            },
            orderBy: { startTime: "asc" },
            take: 20, // cap results to keep the response token count reasonable
          });

          // if searching for a specific counselor name and no slots found,
          // check if they even exist in the system (registered but no availability)
          if (counselorName && slots.length === 0) {
            const counselor = await prisma.counselorProfile.findFirst({
              where: {
                fullName: {
                  contains: counselorName,
                  mode: "insensitive",
                },
              },
              select: {
                fullName: true,
                verificationStatus: true,
              },
            });

            if (!counselor) {
              return {
                found: false,
                message: `No counselor matching "${counselorName}" is registered on MindLens-AI.`,
              };
            }

            if (counselor.verificationStatus !== "VERIFIED") {
              return {
                found: true,
                available: false,
                message: `${counselor.fullName} is registered but their profile is not yet verified by admin.`,
              };
            }

            return {
              found: true,
              available: false,
              message: `${counselor.fullName} is a verified counselor but has no available slots${date ? ` on ${date}` : " at the moment"}.`,
            };
          }

          // transform the raw prisma data into a clean structure for the ai to read
          const formatted = slots.map((slot) => ({
            counselorName: slot.counselor.fullName,
            title: slot.counselor.professionalTitle,
            experience: `${slot.counselor.experienceYears} years`,
            rate: `$${Number(slot.counselor.hourlyRate)}/hr`,
            specialties: slot.counselor.specialties
              .map((s) => s.specialty.name)
              .join(", "),
            date: slot.startTime.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            startTime: slot.startTime.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            endTime: slot.endTime.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }));

          return {
            found: true,
            available: true,
            totalSlots: formatted.length,
            slots: formatted,
            message:
              formatted.length > 0
                ? `Found ${formatted.length} available slot(s).`
                : "No available slots found for the specified criteria.",
          };
        },
      }),
    },
  });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[CHAT_API_ERROR]", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

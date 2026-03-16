"use server";

import { prisma } from "@/lib/prisma";

// the 8 emotion dimensions that match the hume ai output keys
const EMOTION_DIMENSIONS = [
  "Fear",
  "Sadness",
  "Anger",
  "Disgust",
  "Happiness",
  "Surprise",
  "Neutral",
  "Confusion & Overwhelm",
] as const;

type EmotionDimension = (typeof EMOTION_DIMENSIONS)[number];

// maps each specialty tag to which emotion dimensions it covers
// a counselor gets +1 in a dimension for every matching tag they have
const SPECIALTY_TO_EMOTION: Record<string, EmotionDimension[]> = {
  Anxiety: ["Fear"],
  PTSD: ["Fear"],
  Trauma: ["Fear"],
  OCD: ["Fear"],
  Depression: ["Sadness"],
  "Grief & Loss": ["Sadness"],
  "Anger Management": ["Anger"],
  "Self-Esteem": ["Disgust"],
  "Behavioral Therapy": ["Disgust"],
  "Stress Management": ["Confusion & Overwhelm"],
  "Life Coaching / Transitions": ["Confusion & Overwhelm"],
  "General Counseling": ["Happiness", "Surprise", "Neutral"],
};

// cosine similarity between two equal-length vectors
// returns 0 if either vector is all zeros to avoid division by zero
function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }

  const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
  if (magnitude === 0) return 0;

  return dot / magnitude;
}

// builds an 8-dimensional vector for a counselor from their specialty tags
function buildCounselorVector(specialtyNames: string[]): number[] {
  const vec = new Array<number>(EMOTION_DIMENSIONS.length).fill(0);

  for (const tag of specialtyNames) {
    const dimensions = SPECIALTY_TO_EMOTION[tag];
    if (!dimensions) continue;
    for (const dim of dimensions) {
      const idx = EMOTION_DIMENSIONS.indexOf(dim);
      if (idx !== -1) vec[idx] += 1;
    }
  }

  return vec;
}

// converts the aggregated hume scores object into an ordered vector
// matching the EMOTION_DIMENSIONS array order
function buildPatientVector(aggregated: Record<string, number>): number[] {
  return EMOTION_DIMENSIONS.map((dim) => aggregated[dim] ?? 0);
}

export interface RecommendedCounselor {
  id: string;
  fullName: string;
  professionalTitle: string | null;
  bio: string | null;
  hourlyRate: number;
  experienceYears: number;
  image: string | null;
  specialties: string[];
  similarityScore: number;
}

// fetches the patient's latest emotion log, scores all verified counselors
// using cosine similarity, and returns the top matches ranked by relevance
export async function getRecommendedCounselors(
  patientProfileId: string,
  topN = 3
): Promise<RecommendedCounselor[]> {
  // get the most recent emotion log for this patient
  const latestLog = await prisma.emotionLog.findFirst({
    where: { patientProfileId },
    orderBy: { recordedAt: "desc" },
  });

  if (!latestLog) return [];

  // pull the aggregated scores from the stored json
  const json = latestLog.humeAnalysisJson as {
    aggregated?: Record<string, number>;
  };
  const aggregated = json.aggregated;

  if (!aggregated) return [];

  const patientVec = buildPatientVector(aggregated);

  // fetch all verified and onboarded counselors with their specialties
  const counselors = await prisma.counselorProfile.findMany({
    where: {
      verificationStatus: "VERIFIED",
      isOnboarded: true,
    },
    include: {
      specialties: {
        include: { specialty: true },
      },
      user: {
        select: { image: true },
      },
    },
  });

  // score each counselor against the patient's emotion vector
  const scored = counselors.map((counselor) => {
    const tags = counselor.specialties.map((s) => s.specialty.name);
    const counselorVec = buildCounselorVector(tags);
    const score = calculateCosineSimilarity(patientVec, counselorVec);

    return {
      id: counselor.id,
      fullName: counselor.fullName,
      professionalTitle: counselor.professionalTitle,
      bio: counselor.bio,
      hourlyRate: Number(counselor.hourlyRate),
      experienceYears: counselor.experienceYears,
      image: counselor.user.image,
      specialties: tags,
      similarityScore: score,
    };
  });

  // sort by similarity descending and return the top N
  return scored
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, topN);
}

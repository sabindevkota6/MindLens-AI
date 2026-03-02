// Daily.co room creation utility
// Docs: https://docs.daily.co/reference/rest-api/rooms

const DAILY_API_KEY = process.env.DAILY_API_KEY!;
const DAILY_API_URL = "https://api.daily.co/v1";

interface DailyRoom {
  id: string;
  name: string;
  url: string;
  created_at: string;
  config: Record<string, unknown>;
}

export async function createDailyRoom(expiryTime: Date): Promise<DailyRoom> {
  const response = await fetch(`${DAILY_API_URL}/rooms`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      properties: {
        // Room expires 10 minutes after the appointment end time
        exp: Math.floor(expiryTime.getTime() / 1000) + 600,
        enable_chat: true,
        enable_screenshare: true,
        max_participants: 2,
        enable_knocking: false,
        start_video_off: false,
        start_audio_off: false,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Daily room: ${error}`);
  }

  return response.json();
}

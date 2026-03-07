import { importPKCS8, SignJWT } from "jose";

const JAAS_DOMAIN = "8x8.vc";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getJitsiDomain(): string {
  return JAAS_DOMAIN;
}

export function getJitsiAppId(): string {
  return getRequiredEnv("JAAS_APP_ID");
}

export function createMeetingRoomName(appointmentId: string): string {
  return `mindlens-${appointmentId}`;
}

export function createInternalMeetingLink(appointmentId: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${appUrl}/dashboard/meeting/${appointmentId}`;
}

interface MeetingJwtUser {
  id: string;
  name: string;
  email: string;
}

interface CreateMeetingJwtParams {
  roomName: string;
  user: MeetingJwtUser;
  moderator: boolean;
  expiresAt: Date;
}

export async function createMeetingJwt({
  roomName,
  user,
  moderator,
  expiresAt,
}: CreateMeetingJwtParams): Promise<string> {
  const appId = getJitsiAppId();
  const keyId = getRequiredEnv("JAAS_KID");
  const privateKeyPem = getRequiredEnv("JAAS_PRIVATE_KEY").replace(/\\n/g, "\n");
  const privateKey = await importPKCS8(privateKeyPem, "RS256");

  const now = Math.floor(Date.now() / 1000);
  const expiry = Math.max(Math.floor(expiresAt.getTime() / 1000), now + 60);

  return new SignJWT({
    aud: "jitsi",
    iss: "chat",
    sub: appId,
    room: roomName,
    context: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        moderator: moderator ? "true" : "false",
      },
      features: {
        livestreaming: false,
        recording: false,
        transcription: false,
        "outbound-call": false,
        "inbound-call": false,
      },
      room: {
        regex: false,
      },
    },
  })
    .setProtectedHeader({ alg: "RS256", kid: keyId, typ: "JWT" })
    .setNotBefore(now - 10)
    .setExpirationTime(expiry)
    .sign(privateKey);
}

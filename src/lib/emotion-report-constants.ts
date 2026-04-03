// shared emotion UI copy and colors for dashboard + PDF reports

export const EMOTION_COLORS: Record<string, string> = {
  Fear: "#818cf8",
  Sadness: "#60a5fa",
  Anger: "#f87171",
  Disgust: "#4ade80",
  Happiness: "#fbbf24",
  Surprise: "#22d3ee",
  Neutral: "#94a3b8",
  "Confusion & Overwhelm": "#c084fc",
};

export const EMOTION_LIGHT_BG: Record<string, string> = {
  Fear: "#eef2ff",
  Sadness: "#eff6ff",
  Anger: "#fef2f2",
  Disgust: "#f0fdf4",
  Happiness: "#fefce8",
  Surprise: "#ecfeff",
  Neutral: "#f8fafc",
  "Confusion & Overwhelm": "#faf5ff",
};

export const EMOTION_MESSAGES: Record<
  string,
  { headline: string; subtext: string }
> = {
  Fear: {
    headline: "Your analysis suggests a heightened state of alertness.",
    subtext:
      "Fear is your body's natural protection system. Recognizing it is a powerful step toward understanding yourself better.",
  },
  Sadness: {
    headline: "Your analysis reflects a quiet, introspective emotional state.",
    subtext:
      "Sadness is a deeply human experience. Acknowledging it shows real emotional awareness and inner strength.",
  },
  Anger: {
    headline: "Your analysis indicates strong emotional intensity.",
    subtext:
      "Anger often signals that something important to you needs attention. Understanding its roots can bring clarity.",
  },
  Disgust: {
    headline: "Your analysis shows a strong reactive response.",
    subtext:
      "This emotion often relates to personal boundaries. Understanding what triggers it can help you navigate situations more clearly.",
  },
  Happiness: {
    headline: "Your analysis radiates a positive emotional state.",
    subtext:
      "This is wonderful to see. Understanding what brings you joy can help you sustain it in your daily life.",
  },
  Surprise: {
    headline: "Your analysis captures a state of heightened awareness.",
    subtext:
      "Surprise reflects your mind actively processing something unexpected. It's a sign of deep engagement with your world.",
  },
  Neutral: {
    headline: "Your analysis shows a calm, balanced emotional state.",
    subtext:
      "A neutral state reflects composure. It can also mean your deeper feelings need a bit more exploration to surface.",
  },
  "Confusion & Overwhelm": {
    headline: "Your analysis suggests a complex emotional landscape.",
    subtext:
      "Feeling overwhelmed is completely natural. It often means you're processing many things at once — and that's okay.",
  },
};

/** tailwind class triplets for web counselor avatars — single brand color for consistency */
export const AVATAR_TAILWIND = [
  { bg: "bg-primary/10", ring: "ring-primary/20", text: "text-primary" },
] as const;

/** hex pairs for PDF counselor avatar circles — brand teal */
export const AVATAR_PDF_HEX = [
  { bg: "#e0f2f1", text: "#00796B" },
] as const;

export function hashNameToIndex(name: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % modulo;
}

export function getAvatarTailwind(name: string) {
  return AVATAR_TAILWIND[hashNameToIndex(name, AVATAR_TAILWIND.length)];
}

export function getAvatarPdfHex(name: string) {
  return AVATAR_PDF_HEX[hashNameToIndex(name, AVATAR_PDF_HEX.length)];
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const PRIMARY_HEX = "#00796B";
export const PRIMARY_DARK_HEX = "#00695C";

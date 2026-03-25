export type CounselorGateProfile = {
  isOnboarded?: boolean | null;
  professionalTitle?: string | null;
  bio?: string | null;
  experienceYears?: number | null;
  hourlyRate?: unknown;
  dateOfBirth?: Date | null;
  verificationStatus: string;
  documents?: { id: string }[] | null;
};

export function isCounselorProfileComplete(
  profile: CounselorGateProfile | null | undefined
): boolean {
  return Boolean(
    profile?.isOnboarded &&
      profile.professionalTitle &&
      profile.bio &&
      profile.experienceYears != null &&
      profile.hourlyRate != null &&
      profile.dateOfBirth
  );
}

export function counselorHasVerificationDocuments(
  profile: CounselorGateProfile | null | undefined
): boolean {
  return (profile?.documents?.length ?? 0) > 0;
}

export function isCounselorVerified(
  profile: CounselorGateProfile | null | undefined
): boolean {
  return profile?.verificationStatus === "VERIFIED";
}

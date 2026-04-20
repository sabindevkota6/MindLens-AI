"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getRecommendedCounselors,
  type RecommendedCounselor,
} from "@/lib/actions/recommendation";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// using presigned urls
const ALLOWED_CONTENT_TYPES = [
  "video/webm",
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
];

// s3 client configured for aws learner lab
const s3Client = new S3Client({
  region: process.env.MY_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.MY_AWS_SESSION_TOKEN!,
  },
});

export async function getMerUploadUrl(contentType: string): Promise<
  { success: true; signedUrl: string; fileKey: string } | { error: string }
> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  if (session.user.role !== "PATIENT") {
    return { error: "Only patients can upload emotion analysis videos" };
  }

  // validate content type to prevent arbitrary file uploads
  if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
    return { error: "Invalid video format. Accepted: MP4, WebM, MOV, AVI" };
  }

  // unique object key using userId + timestamp to prevent overwrites
  // and keep files organized per patient in the s3 bucket
  const fileKey = `mer-videos/${session.user.id}-${Date.now()}`;

  const command = new PutObjectCommand({
    Bucket: process.env.MY_AWS_BUCKET_NAME!,
    Key: fileKey,
    ContentType: contentType,
  });

  try {
    // 60 second expiry
    // but short enough to limit exposure if the url is leaked
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 60,
    });

    return { success: true, signedUrl, fileKey };
  } catch {
    return { error: "Failed to generate upload URL. Please try again." };
  }
}

// hume ai batch analysis pipeline

const HUME_API_KEY = process.env.HUME_API_KEY!;
const HUME_BASE = "https://api.hume.ai/v0/batch";
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 60000;

// maps hume's 53 micro-emotions into 8 basic emotion buckets
// avoids diagnostic terms and uses only universally recognized emotion labels
const EMOTION_BUCKETS: Record<string, string[]> = {
  Fear: [
    "Anxiety", "Fear", "Horror", "Nervousness", "Vulnerability"
  ],
  Sadness: [

    "Sadness", "Disappointment", "Grief", "Nostalgia", "Pain", "Empathic Pain", "Envy", "Tiredness"
  ],
  Anger: [
    "Anger", "Annoyance", "Contempt"
  ],
  Disgust: [
    "Disgust", "Awkwardness", "Embarrassment", "Guilt", "Shame"
  ],
  Happiness: [
    "Joy", "Amusement", "Contentment", "Elation", "Relief", "Triumph", 
    "Ecstasy", "Pride", "Satisfaction", "Love", "Admiration", "Adoration", 
    "Sympathy", "Craving", "Desire", "Romance", "Aesthetic Appreciation", "Entrancement"
  ],
  Surprise: [
    "Surprise (positive)", "Surprise (negative)", "Awe", "Realization", "Excitement"
  ],

  Neutral: [
    "Neutral", "Calmness", "Concentration", "Sleepiness"
  ],
  "Confusion & Overwhelm": [
    "Confusion", "Doubt", "Hesitation", "Distress", "Interest", "Curiosity",
    "Boredom", "Contemplation"
  ],
};


const microToBucket = new Map<string, string>();
for (const [bucket, labels] of Object.entries(EMOTION_BUCKETS)) {
  for (const label of labels) {
    microToBucket.set(label, bucket);
  }
}


function aggregateEmotions(predictionsJson: any) {
  const bucketNames = Object.keys(EMOTION_BUCKETS);
  const unmapped = new Set<string>();

  
  const modelTotals = new Map<string, number>();
  const modelCounts = new Map<string, number>();

  const sources = Array.isArray(predictionsJson) ? predictionsJson : [predictionsJson];

  for (const source of sources) {
    const results = source?.results?.predictions ?? [];
    for (const prediction of results) {
      const models = prediction?.models ?? {};

      // iterate over each model (face, prosody, language) separately
      for (const [modelName, modelData] of Object.entries(models) as [string, any][]) {
        const groups = modelData?.grouped_predictions ?? [];
        for (const group of groups) {
          for (const pred of group?.predictions ?? []) {
            for (const emo of pred?.emotions ?? []) {
              const bucket = microToBucket.get(emo.name);
              if (bucket) {
                const key = `${modelName}:${bucket}`;
                modelTotals.set(key, (modelTotals.get(key) ?? 0) + emo.score);
                modelCounts.set(key, (modelCounts.get(key) ?? 0) + 1);
              } else {
                unmapped.add(emo.name);
              }
            }
          }
        }
      }
    }
  }

  if (unmapped.size > 0) {
    console.warn("[mer] unmapped hume emotions:", [...unmapped]);
  }

  // collect which models actually produced data
  const modelNames = new Set<string>();
  for (const key of modelTotals.keys()) {
    modelNames.add(key.split(":")[0]);
  }

  const MODEL_WEIGHTS: Record<string, number> = {
    face: 0.25,
    prosody: 0.40,
    language: 0.35,
  };


  const averaged: Record<string, number> = {};

  for (const bucket of bucketNames) {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const model of modelNames) {
      const key = `${model}:${bucket}`;
      const total = modelTotals.get(key) ?? 0;
      const count = modelCounts.get(key) ?? 0;

      if (count > 0) {
        const modelAvg = total / count;
        const weight = MODEL_WEIGHTS[model] ?? 0.33;
        weightedSum += modelAvg * weight;
        totalWeight += weight;
      }
    }

    averaged[bucket] = totalWeight > 0
      ? Math.round((weightedSum / totalWeight) * 10000) / 10000
      : 0;
  }

  // dominant emotion is the bucket with the highest weighted-average score
  const dominantEmotion = Object.entries(averaged)
    .sort(([, a], [, b]) => b - a)[0][0];

  return { averaged, dominantEmotion };
}

// helper to pause execution during polling
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function processEmotionAnalysis(fileKey: string): Promise<
  | {
      success: true;
      logId: string;
      dominantEmotion: string;
      emotions: Record<string, number>;
      recommendations: RecommendedCounselor[];
    }
  | { error: string }
> {
  const session = await auth();
  if (!session?.user) return { error: "Unauthorized" };
  if (session.user.role !== "PATIENT") return { error: "Unauthorized" };

  // need patientProfileId for the emotion log record
  const profile = await prisma.patientProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!profile) return { error: "Patient profile not found" };

  try {
    // generate a temporary read url so hume can fetch the video from s3
    const getCommand = new GetObjectCommand({
      Bucket: process.env.MY_AWS_BUCKET_NAME!,
      Key: fileKey,
    });
    const videoUrl = await getSignedUrl(s3Client, getCommand, {
      expiresIn: 600,
    });

    // start the hume batch inference job with all three modalities
    const jobRes = await fetch(`${HUME_BASE}/jobs`, {
      method: "POST",
      headers: {
        "X-Hume-Api-Key": HUME_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        urls: [videoUrl],
        models: {
          face: {},
          prosody: {},
          language: { granularity: "utterance" },
        },
        transcription: { language: "en" },
      }),
    });

    if (!jobRes.ok) {
      const body = await jobRes.text();
      console.error("[mer] hume job creation failed:", jobRes.status, body);
      return { error: "Failed to start emotion analysis" };
    }

    const { job_id } = await jobRes.json();

    // poll until the async deep learning pipeline completes
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    let status = "";

    while (Date.now() < deadline) {
      await sleep(POLL_INTERVAL_MS);

      const statusRes = await fetch(`${HUME_BASE}/jobs/${job_id}`, {
        headers: { "X-Hume-Api-Key": HUME_API_KEY },
      });

      if (!statusRes.ok) {
        return { error: "Failed to check analysis status" };
      }

      const statusData = await statusRes.json();
      status = statusData.state?.status ?? "";

      if (status === "COMPLETED") break;
      if (status === "FAILED") return { error: "Emotion analysis failed" };
    }

    if (status !== "COMPLETED") {
      return { error: "Analysis timed out. Please try again with a shorter video." };
    }

    // fetch the full predictions payload
    const predictionsRes = await fetch(`${HUME_BASE}/jobs/${job_id}/predictions`, {
      headers: { "X-Hume-Api-Key": HUME_API_KEY },
    });

    if (!predictionsRes.ok) {
      return { error: "Failed to retrieve analysis results" };
    }

    const predictionsJson = await predictionsRes.json();
    const { averaged, dominantEmotion } = aggregateEmotions(predictionsJson);


    const [deleteResult, saveResult] = await Promise.allSettled([
      // permanently delete the video from s3
      s3Client.send(
        new DeleteObjectCommand({
          Bucket: process.env.MY_AWS_BUCKET_NAME!,
          Key: fileKey,
        }),
      ),
      // task b: persist the analysis to the database
      prisma.emotionLog.create({
        data: {
          patientProfileId: profile.id,
          humeAnalysisJson: { raw: predictionsJson, aggregated: averaged },
          dominantEmotion,
        },
      }),
    ]);

    // log if s3 deletion failed but don't block the user
    if (deleteResult.status === "rejected") {
      console.error("s3 video deletion failed:", deleteResult.reason);
    }

    if (saveResult.status === "rejected") {
      return { error: "Failed to save analysis results" };
    }

    const logId = saveResult.value.id;

    // run the recommendation engine using the freshly saved emotion log
    const recommendations = await getRecommendedCounselors(profile.id, 3);

    return {
      success: true,
      logId,
      dominantEmotion,
      emotions: averaged,
      recommendations,
    };
  } catch {
    return { error: "Something went wrong during analysis. Please try again." };
  }
}

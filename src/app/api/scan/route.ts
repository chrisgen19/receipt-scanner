import { NextResponse } from "next/server";
import { z } from "zod";
import { parseReceipt, GEMINI_MODEL_IDS, DEFAULT_MODEL } from "@/lib/gemini";
import type { ReceiptData, GeminiModelId } from "@/lib/gemini";

const requestSchema = z.object({
  image: z.string(),
  mimeType: z.string(),
  model: z.enum(GEMINI_MODEL_IDS).default(DEFAULT_MODEL),
  photoDate: z.optional(z.string()),
});

export type ScanResultEntry =
  | { success: true; data: ReceiptData }
  | { success: false; error: string };

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image, mimeType, model, photoDate } = requestSchema.parse(body);

    const data = await parseReceipt(image, mimeType, model as GeminiModelId);

    // Fallback to photo file date when Gemini couldn't extract a date
    if (!data.date && photoDate) {
      data.date = photoDate;
    }

    return NextResponse.json({ success: true, data } satisfies ScanResultEntry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid request data" },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to parse receipt";
    return NextResponse.json(
      { success: false, error: message } satisfies ScanResultEntry,
      { status: 200 }
    );
  }
}

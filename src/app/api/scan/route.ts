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
  let parsed: z.infer<typeof requestSchema>;

  try {
    const body = await request.json();
    parsed = requestSchema.parse(body);
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues[0]?.message ?? "Invalid request data"
        : "Invalid request body";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const { image, mimeType, model, photoDate } = parsed;
    const data = await parseReceipt(image, mimeType, model as GeminiModelId);

    // Fallback to photo file date when Gemini couldn't extract a date
    if (!data.date && photoDate) {
      data.date = photoDate;
    }

    return NextResponse.json({ success: true, data } satisfies ScanResultEntry);
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Could not extract receipt data from this image. Try a clearer photo.",
      } satisfies ScanResultEntry,
      { status: 200 }
    );
  }
}

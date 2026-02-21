import { NextResponse } from "next/server";
import { z } from "zod";
import { parseReceipt } from "@/lib/gemini";
import type { ReceiptData } from "@/lib/gemini";

const MAX_UPLOADS = Number(process.env.MAX_RECEIPT_UPLOADS ?? "3");

const requestSchema = z.object({
  images: z
    .array(
      z.object({
        image: z.string(),
        mimeType: z.string(),
      })
    )
    .min(1, "At least one image is required")
    .max(MAX_UPLOADS, `Maximum ${MAX_UPLOADS} images allowed`),
});

export type ScanResultEntry =
  | { success: true; data: ReceiptData }
  | { success: false; error: string };

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { images } = requestSchema.parse(body);

    const results: ScanResultEntry[] = [];

    // Process sequentially to avoid API rate limits
    for (const { image, mimeType } of images) {
      try {
        const data = await parseReceipt(image, mimeType);
        results.push({ success: true, data });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to parse receipt";
        results.push({ success: false, error: message });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid request data" },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to scan receipts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { parseReceipt } from "@/lib/gemini";

const requestSchema = z.object({
  image: z.string(),
  mimeType: z.string(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image, mimeType } = requestSchema.parse(body);

    const result = await parseReceipt(image, mimeType);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Failed to scan receipt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

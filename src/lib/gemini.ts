import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { DEFAULT_MODEL } from "@/lib/gemini-models";
import type { GeminiModelId } from "@/lib/gemini-models";

export { GEMINI_MODELS, GEMINI_MODEL_IDS, DEFAULT_MODEL } from "@/lib/gemini-models";
export type { GeminiModelId } from "@/lib/gemini-models";

const genai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY! });

export const receiptItemSchema = z.object({
  name: z.string(),
  quantity: z.coerce.number(),
  price: z.coerce.number(),
});

export const receiptSchema = z.object({
  storeName: z.optional(z.string()),
  date: z.optional(z.string()),
  category: z.optional(z.string()),
  items: z.array(receiptItemSchema).default([]),
  subtotal: z.optional(z.coerce.number()),
  tax: z.optional(z.coerce.number()),
  total: z.coerce.number(),
});

export type ReceiptData = z.infer<typeof receiptSchema>;

const RECEIPT_PROMPT = `Analyze this receipt image and extract the following information as JSON:
- storeName: the name of the store/restaurant (if visible)
- date: the transaction date (if visible), in YYYY-MM-DD format
- items: array of line items, each with name (string), quantity (number), and price (number — the total price for that line item). Use an empty array [] if no itemized line items are visible (e.g. payment slips or transaction confirmations)
- subtotal: the subtotal amount before tax (if visible, otherwise omit)
- tax: the tax amount (if visible, otherwise omit)
- total: the total amount
- category: classify into exactly one of: Food, Health, Transport, Utilities, Bills, Shopping, Entertainment, Education, Other

Return ONLY valid JSON, no markdown or code blocks.
If you can't determine a quantity, default to 1.
Prices should be numbers without currency symbols.`;

/** Sends a receipt image to Gemini and returns structured receipt data */
export const parseReceipt = async (
  base64Image: string,
  mimeType: string,
  model: GeminiModelId = DEFAULT_MODEL
): Promise<ReceiptData> => {
  const response = await genai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType,
            },
          },
          { text: RECEIPT_PROMPT },
        ],
      },
    ],
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error("No response from Gemini");
  }

  // Strip markdown code fences if present
  const cleaned = text
    .replace(/^```(?:json)?\n?/, "")
    .replace(/\n?```$/, "")
    .trim();

  const parsed = JSON.parse(cleaned);
  return receiptSchema.parse(parsed);
};

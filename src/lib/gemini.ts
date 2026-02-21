import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const genai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GEMINI_API_KEY! });

export const receiptItemSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  price: z.number(),
});

export const receiptSchema = z.object({
  storeName: z.optional(z.string()),
  items: z.array(receiptItemSchema),
  subtotal: z.optional(z.number()),
  tax: z.optional(z.number()),
  total: z.number(),
});

export type ReceiptData = z.infer<typeof receiptSchema>;

const RECEIPT_PROMPT = `Analyze this receipt image and extract the following information as JSON:
- storeName: the name of the store/restaurant (if visible)
- items: array of line items, each with name (string), quantity (number), and price (number — the total price for that line item)
- subtotal: the subtotal amount before tax (if visible, otherwise omit)
- tax: the tax amount (if visible, otherwise omit)
- total: the total amount

Return ONLY valid JSON, no markdown or code blocks.
If you can't determine a quantity, default to 1.
Prices should be numbers without currency symbols.`;

/** Sends a receipt image to Gemini and returns structured receipt data */
export const parseReceipt = async (
  base64Image: string,
  mimeType: string
): Promise<ReceiptData> => {
  const response = await genai.models.generateContent({
    model: "gemini-3-flash-preview",
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

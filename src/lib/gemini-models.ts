export const GEMINI_MODELS = [
  { id: "gemini-3-flash-preview", label: "Gemini 3 Flash (Preview)" },
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash (Deprecated)" },
  { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
  { id: "gemini-1.5-flash-8b", label: "Gemini 1.5 Flash 8B" },
] as const;

export type GeminiModelId = (typeof GEMINI_MODELS)[number]["id"];

export const DEFAULT_MODEL: GeminiModelId = "gemini-2.5-flash";

export const GEMINI_MODEL_IDS = GEMINI_MODELS.map((m) => m.id) as [
  GeminiModelId,
  ...GeminiModelId[],
];

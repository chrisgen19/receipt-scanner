"use client";

import { useState } from "react";
import { ReceiptScanner } from "@/components/receipt-scanner";
import { ReceiptResult } from "@/components/receipt-result";
import type { ReceiptData } from "@/lib/gemini";

type AppState = "idle" | "scanning" | "result" | "error";

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [result, setResult] = useState<ReceiptData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (image: string, mimeType: string) => {
    setState("scanning");
    setError(null);

    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, mimeType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to scan receipt");
      }

      setResult(data);
      setState("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setState("error");
    }
  };

  const handleReset = () => {
    setState("idle");
    setResult(null);
    setError(null);
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Receipt Scanner
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Snap a photo or upload a receipt to extract items and totals
          </p>
        </div>

        {state === "result" && result ? (
          <ReceiptResult data={result} onReset={handleReset} />
        ) : (
          <>
            <ReceiptScanner
              onScan={handleScan}
              isLoading={state === "scanning"}
            />
            {state === "error" && error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
                <p className="font-medium">Scan failed</p>
                <p className="mt-1">{error}</p>
                <button
                  onClick={() => setState("idle")}
                  className="mt-2 text-sm font-medium text-red-700 underline hover:no-underline dark:text-red-400"
                >
                  Try again
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

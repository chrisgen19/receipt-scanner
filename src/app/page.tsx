"use client";

import { useState } from "react";
import { ReceiptScanner } from "@/components/receipt-scanner";
import { ReceiptResult } from "@/components/receipt-result";
import type { ScanResultEntry } from "@/app/api/scan/route";
import type { GeminiModelId } from "@/lib/gemini-models";

type AppState = "idle" | "scanning" | "result" | "error";

interface ScanProgress {
  current: number;
  total: number;
}

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [results, setResults] = useState<ScanResultEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ScanProgress | null>(null);

  const handleScan = async (
    images: Array<{ base64: string; mimeType: string; lastModified: number }>,
    model: GeminiModelId
  ) => {
    setState("scanning");
    setError(null);
    setProgress({ current: 0, total: images.length });

    const scanResults: ScanResultEntry[] = [];

    for (let i = 0; i < images.length; i++) {
      setProgress({ current: i + 1, total: images.length });

      try {
        const response = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: images[i].base64,
            mimeType: images[i].mimeType,
            model,
            photoDate: new Date(images[i].lastModified).toISOString().split("T")[0],
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          scanResults.push({
            success: false,
            error: data.error || "Failed to scan receipt",
          });
        } else {
          scanResults.push(data);
        }
      } catch (err) {
        scanResults.push({
          success: false,
          error: err instanceof Error ? err.message : "Something went wrong",
        });
      }
    }

    setProgress(null);
    setResults(scanResults);
    setState("result");
  };

  const handleReset = () => {
    setState("idle");
    setResults(null);
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
            Snap a photo or upload receipts to extract items and totals
          </p>
        </div>

        {state === "result" && results ? (
          <ReceiptResult results={results} onReset={handleReset} />
        ) : (
          <>
            <ReceiptScanner
              onScan={handleScan}
              isLoading={state === "scanning"}
              progress={progress}
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

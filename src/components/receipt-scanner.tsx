"use client";

import { useRef, useState } from "react";

interface ReceiptScannerProps {
  onScan: (image: string, mimeType: string) => void;
  isLoading: boolean;
}

export function ReceiptScanner({ onScan, isLoading }: ReceiptScannerProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileData, setFileData] = useState<{
    base64: string;
    mimeType: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const originalDataUrl = e.target?.result as string;

      // Compress image client-side to reduce payload size
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1024;
        let { width, height } = img;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to JPEG at 80% quality for smaller payload
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setPreview(compressedDataUrl);

        const base64 = compressedDataUrl.split(",")[1];
        setFileData({ base64, mimeType: "image/jpeg" });
      };
      img.src = originalDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleScan = () => {
    if (fileData) {
      onScan(fileData.base64, fileData.mimeType);
    }
  };

  const handleReset = () => {
    setPreview(null);
    setFileData(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {!preview ? (
        <div className="flex w-full flex-col gap-4">
          <div className="rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
              Take a photo of your receipt or upload an image
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
                <CameraIcon />
                Take Photo
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleInputChange}
                  className="hidden"
                />
              </label>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
                <UploadIcon />
                Upload Image
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleInputChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex w-full flex-col items-center gap-4">
          <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Receipt preview"
              className="h-auto w-full"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              disabled={isLoading}
              className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Choose Another
            </button>
            <button
              onClick={handleScan}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isLoading ? (
                <>
                  <SpinnerIcon />
                  Scanning...
                </>
              ) : (
                "Scan Receipt"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      className="animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

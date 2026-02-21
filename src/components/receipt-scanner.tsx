"use client";

import { useRef, useState } from "react";
import {
  GEMINI_MODELS,
  DEFAULT_MODEL,
  type GeminiModelId,
} from "@/lib/gemini-models";

const MAX_UPLOADS = Number(
  process.env.NEXT_PUBLIC_MAX_RECEIPT_UPLOADS ?? "3"
);

interface ImageData {
  base64: string;
  mimeType: string;
  preview: string;
}

interface ReceiptScannerProps {
  onScan: (
    images: Array<{ base64: string; mimeType: string }>,
    model: GeminiModelId
  ) => void;
  isLoading: boolean;
}

export function ReceiptScanner({ onScan, isLoading }: ReceiptScannerProps) {
  const [images, setImages] = useState<ImageData[]>([]);
  const [selectedModel, setSelectedModel] =
    useState<GeminiModelId>(DEFAULT_MODEL);
  const [warning, setWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const originalDataUrl = e.target?.result as string;

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

          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
          const base64 = compressedDataUrl.split(",")[1];
          resolve({ base64, mimeType: "image/jpeg", preview: compressedDataUrl });
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = originalDataUrl;
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const addFiles = async (files: FileList) => {
    setWarning(null);
    const fileArray = Array.from(files);
    const available = MAX_UPLOADS - images.length;

    if (fileArray.length > available) {
      setWarning(
        `You can upload up to ${MAX_UPLOADS} receipts. ${fileArray.length - available} image(s) were not added.`
      );
    }

    const filesToProcess = fileArray.slice(0, available);
    const compressed = await Promise.all(filesToProcess.map(compressImage));
    setImages((prev) => [...prev, ...compressed]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addFiles(files);
    }
    // Reset input so re-selecting the same files works
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCameraInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      addFiles(files);
    }
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setWarning(null);
  };

  const handleScan = () => {
    if (images.length > 0) {
      onScan(
        images.map(({ base64, mimeType }) => ({ base64, mimeType })),
        selectedModel
      );
    }
  };

  const handleReset = () => {
    setImages([]);
    setWarning(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const hasImages = images.length > 0;
  const canAddMore = images.length < MAX_UPLOADS;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Model selector */}
      <div className="flex w-full items-center gap-2">
        <label
          htmlFor="model-select"
          className="shrink-0 text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Model
        </label>
        <select
          id="model-select"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value as GeminiModelId)}
          disabled={isLoading}
          className="w-full appearance-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 transition-colors hover:border-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:border-zinc-600 dark:focus:border-zinc-500"
        >
          {GEMINI_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      {!hasImages ? (
        <div className="flex w-full flex-col gap-4">
          <div className="rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
              Take a photo or upload up to {MAX_UPLOADS} receipt images
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
                  onChange={handleCameraInputChange}
                  className="hidden"
                />
              </label>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
                <UploadIcon />
                Upload Images
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex w-full flex-col items-center gap-4">
          {/* Thumbnail grid */}
          <div className="grid w-full grid-cols-3 gap-3">
            {images.map((img, index) => (
              <div
                key={index}
                className="relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.preview}
                  alt={`Receipt ${index + 1}`}
                  className="aspect-[3/4] w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  disabled={isLoading}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 disabled:opacity-50"
                  aria-label={`Remove receipt ${index + 1}`}
                >
                  <XIcon />
                </button>
              </div>
            ))}
          </div>

          {/* Add more / action buttons */}
          {canAddMore && !isLoading && (
            <div className="flex gap-3">
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
                <CameraIcon />
                Add Photo
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleCameraInputChange}
                  className="hidden"
                />
              </label>
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
                <UploadIcon />
                Add Images
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </label>
            </div>
          )}

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {images.length} of {MAX_UPLOADS} receipts selected
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              disabled={isLoading}
              className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Clear All
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
                `Scan ${images.length === 1 ? "Receipt" : `${images.length} Receipts`}`
              )}
            </button>
          </div>
        </div>
      )}

      {warning && (
        <p className="text-sm text-amber-600 dark:text-amber-400">{warning}</p>
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

function XIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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

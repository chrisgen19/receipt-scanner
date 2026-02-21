"use client";

import type { ReceiptData } from "@/lib/gemini";
import type { ScanResultEntry } from "@/app/api/scan/route";

interface ReceiptResultProps {
  results: ScanResultEntry[];
  onReset: () => void;
}

export function ReceiptResult({ results, onReset }: ReceiptResultProps) {
  const formatPrice = (price: number) => {
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const successResults = results.filter(
    (r): r is Extract<ScanResultEntry, { success: true }> => r.success
  );

  const grandTotal = successResults.reduce(
    (sum, r) => sum + r.data.total,
    0
  );

  return (
    <div className="w-full space-y-4">
      {results.map((entry, index) => (
        <div key={index}>
          {entry.success ? (
            <ReceiptCard
              data={entry.data}
              index={index}
              showHeader={results.length > 1}
              formatPrice={formatPrice}
            />
          ) : (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
              <h3 className="mb-1 text-sm font-semibold text-red-700 dark:text-red-400">
                Receipt #{index + 1} — Failed
              </h3>
              <p className="text-sm text-red-600 dark:text-red-400">
                {entry.error}
              </p>
            </div>
          )}
        </div>
      ))}

      {/* Grand total when multiple successful receipts */}
      {successResults.length > 1 && (
        <div className="rounded-2xl border-2 border-zinc-300 bg-zinc-100 p-6 dark:border-zinc-600 dark:bg-zinc-800">
          <div className="flex justify-between text-lg font-bold text-zinc-900 dark:text-zinc-100">
            <span>Grand Total ({successResults.length} receipts)</span>
            <span className="font-mono">{formatPrice(grandTotal)}</span>
          </div>
        </div>
      )}

      <div className="flex justify-center pt-2">
        <button
          onClick={onReset}
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Scan More Receipts
        </button>
      </div>
    </div>
  );
}

interface ReceiptCardProps {
  data: ReceiptData;
  index: number;
  showHeader: boolean;
  formatPrice: (price: number) => string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  Health: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  Transport: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  Utilities: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  Bills: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  Shopping: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  Entertainment: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  Education: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  Other: "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300",
};

function ReceiptCard({ data, index, showHeader, formatPrice }: ReceiptCardProps) {
  const title = data.storeName ?? `Receipt #${index + 1}`;
  const hasSubheader = data.date || data.category;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      {(showHeader || data.storeName) && (
        <h2 className={`text-center text-lg font-semibold text-zinc-900 dark:text-zinc-100 ${hasSubheader ? "mb-1" : "mb-4"}`}>
          {showHeader ? title : data.storeName}
        </h2>
      )}
      {hasSubheader && (
        <div className="mb-4 flex items-center justify-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          {data.date && <span>{data.date}</span>}
          {data.category && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[data.category] ?? CATEGORY_COLORS.Other}`}>
              {data.category}
            </span>
          )}
        </div>
      )}

      {/* Items table */}
      {data.items.length > 0 && (
        <div className="mb-4 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                <th className="px-4 py-2.5 text-left font-medium text-zinc-600 dark:text-zinc-400">
                  Item
                </th>
                <th className="px-4 py-2.5 text-center font-medium text-zinc-600 dark:text-zinc-400">
                  Qty
                </th>
                <th className="px-4 py-2.5 text-right font-medium text-zinc-600 dark:text-zinc-400">
                  Price
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, itemIndex) => (
                <tr
                  key={itemIndex}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                >
                  <td className="px-4 py-2.5 text-zinc-900 dark:text-zinc-100">
                    {item.name}
                  </td>
                  <td className="px-4 py-2.5 text-center text-zinc-600 dark:text-zinc-400">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-zinc-900 dark:text-zinc-100">
                    {formatPrice(item.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totals */}
      <div className={`space-y-2 ${data.items.length > 0 ? "border-t border-zinc-200 pt-4 dark:border-zinc-700" : ""}`}>
        {data.subtotal != null && (
          <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
            <span>Subtotal</span>
            <span className="font-mono">{formatPrice(data.subtotal)}</span>
          </div>
        )}
        {data.tax != null && (
          <div className="flex justify-between text-sm text-zinc-600 dark:text-zinc-400">
            <span>Tax</span>
            <span className="font-mono">{formatPrice(data.tax)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-semibold text-zinc-900 dark:text-zinc-100">
          <span>Total</span>
          <span className="font-mono">{formatPrice(data.total)}</span>
        </div>
      </div>
    </div>
  );
}

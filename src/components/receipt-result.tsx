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

function ReceiptCard({ data, index, showHeader, formatPrice }: ReceiptCardProps) {
  const title = data.storeName ?? `Receipt #${index + 1}`;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      {(showHeader || data.storeName) && (
        <h2 className={`text-center text-lg font-semibold text-zinc-900 dark:text-zinc-100 ${data.date ? "mb-1" : "mb-4"}`}>
          {showHeader ? title : data.storeName}
        </h2>
      )}
      {data.date && (
        <p className="mb-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          {data.date}
        </p>
      )}

      {/* Items table */}
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

      {/* Totals */}
      <div className="space-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-700">
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

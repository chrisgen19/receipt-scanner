"use client";

import type { ReceiptData } from "@/lib/gemini";

interface ReceiptResultProps {
  data: ReceiptData;
  onReset: () => void;
}

export function ReceiptResult({ data, onReset }: ReceiptResultProps) {
  const formatPrice = (price: number) => {
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        {data.storeName && (
          <h2 className="mb-4 text-center text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {data.storeName}
          </h2>
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
              {data.items.map((item, index) => (
                <tr
                  key={index}
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

      <div className="mt-6 flex justify-center">
        <button
          onClick={onReset}
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Scan Another Receipt
        </button>
      </div>
    </div>
  );
}

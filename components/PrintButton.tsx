"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn-primary px-4 py-2 text-sm font-medium no-print"
    >
      Print / PDF
    </button>
  );
}

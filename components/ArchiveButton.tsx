"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore } from "lucide-react";

export function ArchiveButton({
  apiPath,
  archived,
}: {
  apiPath: string;
  archived: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    startTransition(async () => {
      const res = await fetch(apiPath, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: !archived }),
      });
      if (res.ok) router.refresh();
    });
  };

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className="inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[0.7rem] font-medium transition-colors disabled:opacity-50"
      style={{
        borderColor: archived ? "var(--accent-green)" : "var(--accent-gold)",
        color: archived ? "var(--accent-green)" : "var(--accent-gold)",
        backgroundColor: "transparent",
      }}
      title={archived ? "Pulihkan" : "Arsipkan"}
    >
      {archived ? <ArchiveRestore className="h-3 w-3" /> : <Archive className="h-3 w-3" />}
      {archived ? "Pulihkan" : "Arsipkan"}
    </button>
  );
}

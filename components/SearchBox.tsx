"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function SearchBox({
  basePath,
  paramName = "q",
  initialValue = "",
  placeholder = "Cari...",
  params = {},
  className = "form-input w-full md:w-64",
}: {
  basePath: string;
  paramName?: string;
  initialValue?: string;
  placeholder?: string;
  params?: Record<string, string | undefined>;
  className?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const onChange = (v: string) => {
    setValue(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const sp = new URLSearchParams();
      Object.entries(params).forEach(([k, val]) => {
        if (k !== paramName && val) sp.set(k, val);
      });
      if (v) sp.set(paramName, v);
      const qs = sp.toString();
      router.push(qs ? `${basePath}?${qs}` : basePath);
    }, 350);
  };

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={className}
    />
  );
}

"use client";

import { useState, useRef, KeyboardEvent } from "react";

export function TagInput({
  tags,
  onChange,
  placeholder = "Add more...",
  hint = "Press Enter or comma to add",
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  hint?: string;
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInput("");
    }
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input || (e.key === "," ? "" : ""));
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white p-2 focus-within:ring-2 focus-within:ring-[#7c3aed] focus-within:ring-offset-0">
      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex items-center gap-1 rounded-full bg-[#f3e8ff] px-3 py-1 text-sm font-medium text-[#6b21a8]"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(i)}
              className="rounded-full p-0.5 hover:bg-[#e9d5ff]"
              aria-label={`Remove ${tag}`}
            >
              <span className="sr-only">Remove</span>
              <span aria-hidden>×</span>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.replace(",", ""))}
          onKeyDown={handleKeyDown}
          onBlur={() => input.trim() && addTag(input)}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="min-w-[120px] flex-1 border-0 bg-transparent p-1 text-sm text-[#111111] placeholder-[#6b7280] focus:outline-none"
        />
      </div>
      {hint && (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}

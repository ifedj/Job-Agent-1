"use client";

export function CheckboxGrid({
  options,
  selected,
  onChange,
  columns = 2,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  columns?: number;
}) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {options.map(({ value, label }) => (
        <label
          key={value}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-3 py-2.5 text-sm font-medium text-[#374151] hover:border-[#7c3aed]/40 hover:bg-[#f5f3ff]/50 has-[:checked]:border-[#7c3aed] has-[:checked]:bg-[#f5f3ff]"
        >
          <input
            type="checkbox"
            checked={selected.includes(value)}
            onChange={() => toggle(value)}
            className="h-4 w-4 rounded border-[#e5e7eb] text-[#7c3aed] focus:ring-[#7c3aed]"
          />
          {label}
        </label>
      ))}
    </div>
  );
}

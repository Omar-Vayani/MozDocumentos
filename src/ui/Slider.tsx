import { useId } from 'react';

/** Labelled range input showing its value as a percentage, with a reset link. */
export function SizeSlider({
  label,
  hint,
  value,
  onChange,
  min = 0.5,
  max = 2,
  step = 0.05,
  resetLabel,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  resetLabel?: string;
}) {
  const id = useId();
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="font-semibold">
          {label}
        </label>
        <span className="tabular-nums text-muted text-[0.95rem]" aria-hidden>
          {Math.round(value * 100)}%
        </span>
      </div>
      {hint ? <p className="text-muted text-[0.94rem] leading-snug">{hint}</p> : null}
      <div className="flex items-center gap-3">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-valuetext={`${Math.round(value * 100)}%`}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 min-h-12 accent-[var(--primary)] cursor-pointer"
        />
        {resetLabel && Math.abs(value - 1) > 0.001 ? (
          <button type="button" onClick={() => onChange(1)} className="text-link underline min-h-10 px-1 cursor-pointer text-[0.95rem]">
            {resetLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

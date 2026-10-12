// Form primitives: visible labels, hints, inline errors, large tap targets.

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

export const inputClass =
  'block w-full min-h-12 px-3 py-2 bg-bg text-text border-2 border-border-strong rounded-[var(--radius-sm)] ' +
  'placeholder:text-muted/80 focus:outline-3 focus:outline-focus focus:outline-offset-0 focus:shadow-[inset_0_0_0_2px_var(--border-strong)] ' +
  'aria-[invalid=true]:border-error';

export function Label({ htmlFor, children, className = '' }: { htmlFor?: string; children: ReactNode; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={`block font-semibold mb-1 ${className}`}>
      {children}
    </label>
  );
}

export function Hint({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="text-muted text-[0.94rem] mb-1.5 leading-snug">
      {children}
    </p>
  );
}

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className="text-error font-semibold mb-1.5 flex gap-1">
      <span className="sr-only">Erro:</span>
      {children}
    </p>
  );
}

type WrapProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  badge?: ReactNode;
  children: (ids: { id: string; describedBy?: string }) => ReactNode;
  className?: string;
  id?: string;
};

/** Label + hint + error wrapper that wires aria-describedby. */
export function FieldWrap({ label, hint, error, badge, children, className = '', id: idProp }: WrapProps) {
  const auto = useId();
  const id = idProp ?? auto;
  const hintId = hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`${error ? 'border-l-4 border-error pl-3' : ''} ${className}`}>
      <div className="flex flex-wrap items-baseline gap-x-2">
        <Label htmlFor={id}>{label}</Label>
        {badge}
      </div>
      {hint ? <Hint id={hintId}>{hint}</Hint> : null}
      <FieldError id={errId}>{error}</FieldError>
      {children({ id, describedBy })}
    </div>
  );
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function TextInput(
  { className = '', ...rest },
  ref,
) {
  return <input ref={ref} className={`${inputClass} ${className}`} {...rest} />;
});

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function TextArea(
  { className = '', rows = 4, ...rest },
  ref,
) {
  return <textarea ref={ref} rows={rows} className={`${inputClass} py-2.5 leading-normal ${className}`} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className = '', children, ...rest },
  ref,
) {
  return (
    <div className="relative">
      <select ref={ref} className={`${inputClass} appearance-none pr-10 ${className}`} {...rest}>
        {children}
      </select>
      <svg aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
});

/** Large checkbox with label (used for toggles/optional clauses). */
export function Checkbox({
  label,
  hint,
  checked,
  onChange,
  id: idProp,
  name,
}: {
  label: ReactNode;
  hint?: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  id?: string;
  name?: string;
}) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <div className="flex gap-3 items-start py-1">
      <input
        id={id}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-7 shrink-0 accent-[var(--primary)] border-2 border-border-strong cursor-pointer"
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
      <div>
        <label htmlFor={id} className="font-semibold cursor-pointer leading-snug block pt-0.5">
          {label}
        </label>
        {hint ? (
          <p id={`${id}-hint`} className="text-muted text-[0.94rem] leading-snug mt-0.5">
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function RadioGroup({
  legend,
  hint,
  options,
  value,
  onChange,
  name,
  inline,
  error,
}: {
  legend: ReactNode;
  hint?: ReactNode;
  options: { value: string; label: ReactNode; hint?: ReactNode }[];
  value: string;
  onChange: (v: string) => void;
  name: string;
  inline?: boolean;
  error?: ReactNode;
}) {
  const id = useId();
  return (
    <fieldset className={error ? 'border-l-4 border-error pl-3' : ''} aria-describedby={hint ? `${id}-hint` : undefined}>
      <legend className="font-semibold mb-1">{legend}</legend>
      {hint ? <Hint id={`${id}-hint`}>{hint}</Hint> : null}
      <FieldError>{error}</FieldError>
      <div className={inline ? 'flex flex-wrap gap-x-6 gap-y-1' : 'space-y-1'}>
        {options.map((o) => (
          <div key={o.value} className="flex gap-3 items-start py-1">
            <input
              id={`${id}-${o.value}`}
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="mt-0.5 size-7 shrink-0 accent-[var(--primary)] cursor-pointer"
            />
            <div>
              <label htmlFor={`${id}-${o.value}`} className="cursor-pointer leading-snug block pt-0.5">
                {o.label}
              </label>
              {o.hint ? <p className="text-muted text-[0.94rem] leading-snug">{o.hint}</p> : null}
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

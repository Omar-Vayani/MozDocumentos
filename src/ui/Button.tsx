import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { Icon, type IconName } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'quiet';

const base =
  'inline-flex items-center justify-center gap-2 min-h-12 px-4 font-semibold rounded-[var(--radius)] border select-none ' +
  'transition-colors disabled:opacity-50 disabled:cursor-not-allowed no-underline text-[1rem] leading-tight cursor-pointer';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-text border-primary shadow-[0_2px_0_0_var(--border-strong)] hover:bg-primary-hover active:translate-y-[1px] active:shadow-none',
  secondary:
    'bg-surface text-text border-border shadow-[0_2px_0_0_var(--border)] hover:bg-surface-2 active:translate-y-[1px] active:shadow-none',
  ghost: 'bg-transparent text-text border-transparent hover:bg-surface',
  danger: 'bg-error text-white border-error shadow-[0_2px_0_0_var(--border-strong)] hover:opacity-90 dark:text-black',
  quiet: 'bg-transparent text-link border-transparent underline underline-offset-4 px-1 min-h-10 font-normal hover:decoration-2',
};

export function buttonClass(variant: ButtonVariant = 'primary', extra = '') {
  return `${base} ${variants[variant]} ${extra}`;
}

type Common = { variant?: ButtonVariant; icon?: IconName; iconRight?: IconName; children?: ReactNode; className?: string };

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & Common>(function Button(
  { variant = 'primary', icon, iconRight, children, className = '', type = 'button', ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonClass(variant, className)} {...rest}>
      {icon ? <Icon name={icon} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} /> : null}
    </button>
  );
});

export function ButtonLink({ variant = 'primary', icon, iconRight, children, className = '', ...rest }: LinkProps & Common) {
  return (
    <Link className={buttonClass(variant, className)} {...rest}>
      {icon ? <Icon name={icon} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} /> : null}
    </Link>
  );
}

export function IconButton({
  icon,
  label,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center min-h-12 min-w-12 rounded-[var(--radius)] text-text hover:bg-surface cursor-pointer ${className}`}
      {...rest}
    >
      <Icon name={icon} size={22} />
    </button>
  );
}

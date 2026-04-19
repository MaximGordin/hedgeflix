import { ButtonHTMLAttributes, cloneElement, ReactElement } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 's' | 'm' | 'l';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white border-accent hover:bg-accent-hover hover:border-accent-hover',
  secondary: 'text-text border-border hover:bg-surface-hover',
  danger: 'bg-danger text-white border-danger hover:bg-danger/90 hover:border-danger/90',
  ghost: 'text-text border-transparent hover:bg-surface-hover',
};

const sizeStyles: Record<ButtonSize, string> = {
  s: 'px-3 py-1.5 text-xs',
  m: 'px-5 py-2.5 text-sm',
  l: 'px-7 py-3.5 text-base',
};

export const Button = ({
  variant = 'primary',
  size = 'm',
  asChild = false,
  className = '',
  children,
  ...props
}: ButtonProps) => {
  const styles = `inline-flex items-center justify-center gap-2 rounded-md font-medium cursor-pointer border
      ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  if (asChild) {
    return cloneElement(children as ReactElement<{ className?: string }>, {
      className: styles,
    });
  }

  return (
    <button className={styles} {...props}>
      {children}
    </button>
  );
};

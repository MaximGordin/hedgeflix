'use client';

import { ReactNode } from 'react';
import { useDialogContext } from './DialogContext';

export const DialogTrigger = ({
  children,
  className,
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}) => {
  const { open } = useDialogContext();
  return (
    <button className={className} onClick={open} aria-label={ariaLabel}>
      {children}
    </button>
  );
};

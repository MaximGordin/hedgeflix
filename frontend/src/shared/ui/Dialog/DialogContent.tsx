'use client';

import { ReactNode, useEffect, useRef, MouseEvent  } from 'react';
import { useDialogContext } from './DialogContext';

export function DialogContent({ children }: { children: ReactNode }) {
  const { isOpen, close } = useDialogContext();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!dialogRef.current) {
      return;
    }

    if (isOpen && !dialogRef.current.open) {
      dialogRef.current.showModal();
    } else if (dialogRef.current.open) {
      dialogRef.current.close();
    }
  }, [isOpen]);

  function handleBackdropClick(e: MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) {
      close();
    }
  }
  return (
    <dialog
      ref={dialogRef}
      onClose={close}
      className="fixed top-1/2 left-1/2 -translate-1/2 bg-surface p-3 rounded-sm w-full max-w-[360px] cursor-default"
      onClick={handleBackdropClick}
    >
      {children}
    </dialog>
  );
}

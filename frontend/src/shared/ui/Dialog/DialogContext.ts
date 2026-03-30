'use client';

import { createContext, useContext } from 'react';

type DialogContextType = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

export const DialogContext = createContext<DialogContextType | null>(null);
export const useDialogContext = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be used within <Dialog>');
  }
  return context;
};

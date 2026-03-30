'use client';

import { ReactNode, useMemo, useState } from 'react';
import { DialogContext } from './DialogContext';
import { DialogTrigger } from './DialogTrigger';
import { DialogContent } from './DialogContent';

const DialogRoot = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo(
    () => ({
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }),
    [isOpen],
  );

  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
};

export const Dialog = Object.assign(DialogRoot, {
  Trigger: DialogTrigger,
  Content: DialogContent,
});

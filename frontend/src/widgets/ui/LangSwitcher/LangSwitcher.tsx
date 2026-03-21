import { Globe } from 'lucide-react';

type LangSwitcherProps = {
  className?: string;
}

export const LangSwitcher = ({ className }: LangSwitcherProps) => {
  return (
    <div className={className}>
      <Globe size={17} className="text-muted" />
      <span className="text-sm font-semibold">EN</span>
    </div>
  );
};

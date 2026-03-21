import Link from 'next/link';

import logo from '@/public/images/logo.png';
import { Oswald } from 'next/font/google';
import Image from 'next/image';

const oswald = Oswald({
  variable: '--font-oswald',
  subsets: ['latin'],
});

interface LogoProps {
  width?: number;
  height?: number;
  alt?: string;
  className?: string;
}

export function Logo({
  width = 40,
  height = 40,
  alt = 'HedgeFlix logo',
  className = '',
}: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-x-1 ${className}`}>
      <Image
        src={logo}
        width={width}
        height={height}
        alt={alt}
        loading="eager"
      />
      <div className={`text-xl sm:text-2xl text-accent ${oswald.className}`}>
        Hedge<span>Flix</span>
      </div>
    </Link>
  );
}

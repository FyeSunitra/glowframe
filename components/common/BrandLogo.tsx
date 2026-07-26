import Image from 'next/image';
import { cn } from '@/lib/utils';

type BrandLogoVariant = 'compact' | 'auth' | 'about';

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  priority?: boolean;
}

const variantClasses: Record<BrandLogoVariant, string> = {
  compact: 'size-[52px] rounded-full',
  auth: 'aspect-square w-full max-w-[360px] rounded-full',
  about: 'size-[168px] rounded-[18px] sm:size-[196px] lg:size-[220px] lg:rounded-[22px]',
};

const imageClasses: Record<BrandLogoVariant, string> = {
  compact: 'scale-[1.85]',
  auth: 'scale-[1.85]',
  about: 'scale-[1.9]',
};

export function BrandLogo({ variant = 'compact', priority = false }: BrandLogoProps) {
  return (
    <span
      className={cn(
        'relative block shrink-0 overflow-hidden bg-[#5b2d20]',
        variantClasses[variant],
      )}
    >
      <Image
        src="/images/glowframe-logo.jpg"
        alt="GlowFrame"
        fill
        priority={priority}
        sizes={variant === 'compact' ? '52px' : variant === 'about' ? '(max-width: 639px) 168px, (max-width: 1023px) 196px, 220px' : '(max-width: 900px) 80vw, 360px'}
        className={cn('object-cover', imageClasses[variant])}
      />
    </span>
  );
}

import { cn } from '@/lib/utils';

/**
 * Spinner Component
 * 
 * Loading indicator with multiple sizes and variants.
 * 
 * @example
 * ```tsx
 * <Spinner size="lg" />
 * <Spinner variant="primary" />
 * <Button disabled><Spinner size="sm" className="mr-2" /> Loading...</Button>
 * ```
 */

interface SpinnerProps {
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Color variant */
  variant?: 'default' | 'primary' | 'secondary' | 'white';
  /** Additional CSS classes */
  className?: string;
}

const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const variantClasses = {
  default: 'text-muted-foreground',
  primary: 'text-primary',
  secondary: 'text-secondary-foreground',
  white: 'text-white',
};

export function Spinner({ 
  size = 'md', 
  variant = 'default',
  className 
}: SpinnerProps) {
  return (
    <svg
      className={cn(
        'animate-spin',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Loading Dots Component
 * 
 * Animated dots for indicating loading state.
 * 
 * @example
 * ```tsx
 * <LoadingDots />
 * <LoadingDots size="sm" variant="primary" />
 * ```
 */
interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'primary' | 'white';
  className?: string;
}

export function LoadingDots({ 
  size = 'md', 
  variant = 'default',
  className 
}: LoadingDotsProps) {
  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };
  
  const dotColors = {
    default: 'bg-muted-foreground',
    primary: 'bg-primary',
    white: 'bg-white',
  };
  
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'rounded-full animate-bounce',
            dotSizes[size],
            dotColors[variant]
          )}
          style={{
            animationDelay: `${i * 0.15}s`,
            animationDuration: '0.6s',
          }}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton Loader Component
 * 
 * Placeholder loading state for content.
 * 
 * @example
 * ```tsx
 * <Skeleton className="h-4 w-[250px]" />
 * <Skeleton className="h-20 w-full" />
 * ```
 */
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
    />
  );
}

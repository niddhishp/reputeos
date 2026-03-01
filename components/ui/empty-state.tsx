import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

/**
 * Empty State Component
 * 
 * Displays when there's no data to show, with optional action button.
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   icon={Users}
 *   title="No clients yet"
 *   description="Add your first client to get started with reputation management."
 *   action={{
 *     label: 'Add Client',
 *     href: '/clients/new',
 *   }}
 * />
 * ```
 */

interface EmptyStateProps {
  /** Icon to display */
  icon: LucideIcon;
  /** Title text */
  title: string;
  /** Optional description */
  description?: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  /** Additional CSS classes */
  className?: string;
  /** Compact variant */
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'p-4' : 'p-8',
        className
      )}
    >
      <div 
        className={cn(
          'rounded-full bg-muted flex items-center justify-center mb-4',
          compact ? 'p-3' : 'p-4'
        )}
      >
        <Icon className={cn(
          'text-muted-foreground',
          compact ? 'h-6 w-6' : 'h-8 w-8'
        )} />
      </div>
      
      <h3 className={cn(
        'font-semibold text-foreground mb-2',
        compact ? 'text-base' : 'text-lg'
      )}>
        {title}
      </h3>
      
      {description && (
        <p className={cn(
          'text-muted-foreground mb-4 max-w-sm',
          compact ? 'text-sm' : 'text-base'
        )}>
          {description}
        </p>
      )}
      
      {action && (
        <Button
          onClick={action.onClick}
          size={compact ? 'sm' : 'default'}
          {...(action.href ? { asChild: true } : {})}
        >
          {action.href ? (
            <a href={action.href}>{action.label}</a>
          ) : (
            action.label
          )}
        </Button>
      )}
    </div>
  );
}

'use client';

/**
 * Skip Link Component
 * 
 * Provides keyboard users with a way to skip navigation and jump
 * directly to the main content. Hidden by default, visible on focus.
 * 
 * @example
 * ```tsx
 * // In your layout:
 * <SkipLink />
 * <main id="main-content">
 *   {/* page content... * /}
 * </main>
 * ```
 */

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground 
                 focus:rounded-md focus:shadow-modal focus:font-medium focus:text-sm
                 transition-all duration-fast"
    >
      Skip to main content
    </a>
  );
}

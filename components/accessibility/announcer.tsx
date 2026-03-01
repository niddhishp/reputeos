'use client';

/**
 * Live Region Announcer Component
 * 
 * Announces content changes to screen readers.
 * Use for dynamic content updates, form submissions, and status changes.
 * 
 * @example
 * ```tsx
 * const [status, setStatus] = useState('');
 * 
 * const handleSubmit = async () => {
 *   setStatus('Submitting form...');
 *   await submitForm();
 *   setStatus('Form submitted successfully');
 * };
 * 
 * return (
 *   <form onSubmit={handleSubmit}>
 *     <LiveRegion message={status} priority="polite" />
 *     {/* ...form fields... * /}
 *   </form>
 * );
 * ```
 */

import { useEffect, useState } from 'react';

interface LiveRegionProps {
  /** The message to announce */
  message: string;
  /** Priority level for screen reader announcements */
  priority?: 'polite' | 'assertive';
  /** Unique identifier for this announcer instance */
  id?: string;
}

export function LiveRegion({ 
  message, 
  priority = 'polite',
  id = 'live-region'
}: LiveRegionProps) {
  const [announcement, setAnnouncement] = useState('');
  
  useEffect(() => {
    // Clear first, then announce (ensures screen readers pick up changes)
    if (message) {
      setAnnouncement('');
      const timer = setTimeout(() => setAnnouncement(message), 100);
      return () => clearTimeout(timer);
    }
  }, [message]);
  
  return (
    <div 
      id={id}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      role="status"
    >
      {announcement}
    </div>
  );
}

/**
 * Assertive Announcer for Critical Updates
 * 
 * Use sparingly - interrupts the user immediately.
 * Only for critical errors or time-sensitive information.
 */
export function AssertiveAnnouncer({ message }: { message: string }) {
  return <LiveRegion message={message} priority="assertive" id="assertive-region" />;
}

/**
 * Form Error Announcer
 * 
 * Announces form validation errors to screen readers.
 */
interface FormErrorAnnouncerProps {
  errors: Record<string, string>;
  formId: string;
}

export function FormErrorAnnouncer({ errors, formId }: FormErrorAnnouncerProps) {
  const errorMessage = Object.entries(errors)
    .map(([field, error]) => `${field}: ${error}`)
    .join('. ');
  
  return (
    <div 
      id={`${formId}-errors`}
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      role="alert"
    >
      {errorMessage && `Form has errors: ${errorMessage}`}
    </div>
  );
}

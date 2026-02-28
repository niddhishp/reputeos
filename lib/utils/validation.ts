/**
 * Validation Utilities
 * 
 * This module provides common validation functions for user inputs.
 */

import { z } from 'zod';

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate and sanitize a URL
 */
export function validateURL(url: string, allowedProtocols: string[] = ['https']): string | null {
  try {
    const parsed = new URL(url);
    
    if (!allowedProtocols.includes(parsed.protocol.replace(':', ''))) {
      return null;
    }
    
    return parsed.toString();
  } catch {
    return null;
  }
}

/**
 * Validate an email address
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Common Zod schemas for reuse
 */
export const CommonSchemas = {
  uuid: z.string().uuid(),
  
  email: z.string().email(),
  
  url: z.string().url(),
  
  nonEmptyString: z.string().min(1),
  
  positiveInteger: z.number().int().positive(),
  
  percentage: z.number().min(0).max(100),
  
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  
  hexColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  
  dateISO: z.string().datetime(),
};

/**
 * Create a Zod schema for pagination parameters
 */
export function createPaginationSchema(defaults: { pageSize?: number; maxPageSize?: number } = {}) {
  const { pageSize: defaultPageSize = 20, maxPageSize = 100 } = defaults;

  return z.object({
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce
      .number()
      .min(1)
      .max(maxPageSize)
      .default(defaultPageSize),
  });
}

/**
 * Validate file upload
 */
export function validateFileUpload(
  file: File,
  options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } {
  const { maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/webp'] } = options;

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Check if a string contains potential SQL injection patterns
 */
export function containsSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
    /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    /((\%27)|(\'))union/i,
    /exec(\s|\+)+(s|x)p\w+/i,
    /UNION\s+SELECT/i,
    /INSERT\s+INTO/i,
    /DELETE\s+FROM/i,
    /DROP\s+TABLE/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Check if a string contains potential XSS patterns
 */
export function containsXSS(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
}

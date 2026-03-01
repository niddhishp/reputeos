'use client';

/**
 * Exit Intent Hook
 * 
 * Detects when a user is about to leave the page and triggers a callback.
 * Useful for showing exit-intent modals or offers.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const [showModal, setShowModal] = useState(false);
 *   
 *   useExitIntent(() => setShowModal(true), {
 *     threshold: 30,
 *     maxDisplays: 1,
 *     cooldown: 24 * 60 * 60 * 1000, // 24 hours
 *   });
 *   
 *   return showModal ? <ExitModal /> : null;
 * }
 * ```
 */

import { useEffect, useCallback, useRef } from 'react';

interface UseExitIntentOptions {
  /** Pixel threshold from top of viewport to trigger (default: 30) */
  threshold?: number;
  /** Maximum number of times to trigger (default: 1) */
  maxDisplays?: number;
  /** Cooldown period in milliseconds (default: 24 hours) */
  cooldown?: number;
  /** Storage key for tracking displays */
  storageKey?: string;
  /** Disable on mobile devices */
  disableOnMobile?: boolean;
}

interface ExitIntentState {
  displayCount: number;
  lastDisplayTime: number | null;
}

export function useExitIntent(
  onExitIntent: () => void,
  options: UseExitIntentOptions = {}
) {
  const {
    threshold = 30,
    maxDisplays = 1,
    cooldown = 24 * 60 * 60 * 1000, // 24 hours
    storageKey = 'exit-intent-state',
    disableOnMobile = true,
  } = options;

  const hasTriggered = useRef(false);

  const getState = useCallback((): ExitIntentState => {
    if (typeof window === 'undefined') {
      return { displayCount: 0, lastDisplayTime: null };
    }
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore localStorage errors
    }
    
    return { displayCount: 0, lastDisplayTime: null };
  }, [storageKey]);

  const setState = useCallback((state: ExitIntentState) => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Ignore localStorage errors
    }
  }, [storageKey]);

  const canTrigger = useCallback((): boolean => {
    // Check if already triggered in this session
    if (hasTriggered.current) return false;
    
    // Check mobile
    if (disableOnMobile && typeof window !== 'undefined') {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      if (isMobile) return false;
    }
    
    const state = getState();
    
    // Check max displays
    if (state.displayCount >= maxDisplays) return false;
    
    // Check cooldown
    if (state.lastDisplayTime && Date.now() - state.lastDisplayTime < cooldown) {
      return false;
    }
    
    return true;
  }, [maxDisplays, cooldown, disableOnMobile, getState]);

  const handleMouseLeave = useCallback(
    (e: MouseEvent) => {
      // Only trigger when mouse leaves through the top of the viewport
      if (e.clientY < threshold && canTrigger()) {
        hasTriggered.current = true;
        
        // Update state
        const state = getState();
        setState({
          displayCount: state.displayCount + 1,
          lastDisplayTime: Date.now(),
        });
        
        onExitIntent();
      }
    },
    [threshold, canTrigger, getState, setState, onExitIntent]
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;

    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseLeave]);

  // Reset function for testing
  const reset = useCallback(() => {
    hasTriggered.current = false;
    setState({ displayCount: 0, lastDisplayTime: null });
  }, [setState]);

  return { reset };
}

/**
 * Scroll Depth Hook
 * 
 * Tracks how far a user has scrolled down the page.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const scrollDepth = useScrollDepth();
 *   
 *   useEffect(() => {
 *     if (scrollDepth > 75) {
 *       // User scrolled past 75%
 *     }
 *   }, [scrollDepth]);
 * }
 * ```
 */

import { useState, useEffect } from 'react';

export function useScrollDepth(): number {
  const [scrollDepth, setScrollDepth] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const depth = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollDepth(Math.min(100, Math.max(0, depth)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrollDepth;
}

/**
 * Time on Page Hook
 * 
 * Tracks how long a user has been on the page.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const timeOnPage = useTimeOnPage();
 *   
 *   useEffect(() => {
 *     if (timeOnPage > 30000) { // 30 seconds
 *       // User has been on page for 30 seconds
 *     }
 *   }, [timeOnPage]);
 * }
 * ```
 */

export function useTimeOnPage(): number {
  const [timeOnPage, setTimeOnPage] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      setTimeOnPage(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return timeOnPage;
}

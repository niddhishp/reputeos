/**
 * Animation Configuration Library
 * 
 * Centralized animation configurations for Framer Motion.
 * Use these for consistent animations across the application.
 */

import { Variants, Transition } from 'framer-motion';

// ============================================================================
// Transition Presets
// ============================================================================

export const transitions = {
  /** Ultra-fast for micro-interactions (150ms) */
  fast: { duration: 0.15, ease: [0.4, 0, 0.2, 1] } as Transition,
  
  /** Standard transition (200ms) */
  default: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } as Transition,
  
  /** Slower for page transitions (300ms) */
  slow: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } as Transition,
  
  /** Slower for emphasis (500ms) */
  slower: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } as Transition,
  
  /** Spring for bouncy effects */
  spring: { type: 'spring', stiffness: 300, damping: 30 } as Transition,
  
  /** Gentle spring for subtle effects */
  springGentle: { type: 'spring', stiffness: 200, damping: 25 } as Transition,
  
  /** Bouncy spring for playful effects */
  springBouncy: { type: 'spring', stiffness: 400, damping: 15 } as Transition,
};

// ============================================================================
// Fade Animations
// ============================================================================

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const fadeInLeft: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export const fadeInRight: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

export const fadeInScale: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

// ============================================================================
// Slide Animations
// ============================================================================

export const slideUp: Variants = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 20, opacity: 0 },
};

export const slideDown: Variants = {
  initial: { y: -20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -20, opacity: 0 },
};

export const slideLeft: Variants = {
  initial: { x: 20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 20, opacity: 0 },
};

export const slideRight: Variants = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -20, opacity: 0 },
};

// ============================================================================
// Scale Animations
// ============================================================================

export const scaleUp: Variants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.8, opacity: 0 },
};

export const scaleDown: Variants = {
  initial: { scale: 1.1, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 1.1, opacity: 0 },
};

export const scaleOnPress = {
  whileTap: { scale: 0.98 },
  whileHover: { scale: 1.02 },
  transition: transitions.fast,
};

export const scaleOnPressSmall = {
  whileTap: { scale: 0.95 },
  transition: transitions.fast,
};

// ============================================================================
// Stagger Containers
// ============================================================================

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
};

export const staggerContainerFast: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

export const staggerContainerSlow: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.1,
      staggerDirection: -1,
    },
  },
};

// ============================================================================
// List Item Animations (for stagger children)
// ============================================================================

export const listItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const listItemFade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const listItemScale: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
};

// ============================================================================
// Modal/Dialog Animations
// ============================================================================

export const modalOverlay: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 10 },
};

export const modalSlideUp: Variants = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 50 },
};

// ============================================================================
// Dropdown/Menu Animations
// ============================================================================

export const dropdown: Variants = {
  initial: { opacity: 0, y: -5, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -5, scale: 0.98 },
};

export const dropdownLeft: Variants = {
  initial: { opacity: 0, x: -5, scale: 0.98 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: -5, scale: 0.98 },
};

// ============================================================================
// Toast/Notification Animations
// ============================================================================

export const toastSlideIn: Variants = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 100 },
};

export const toastSlideUp: Variants = {
  initial: { opacity: 0, y: 50 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

// ============================================================================
// Page Transition Animations
// ============================================================================

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

export const pageTransitionFade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const pageTransitionSlide: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

// ============================================================================
// Loading/Skeleton Animations
// ============================================================================

export const pulseAnimation = {
  animate: {
    opacity: [0.5, 1, 0.5],
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'easeInOut',
  },
};

export const shimmerAnimation = {
  animate: {
    backgroundPosition: ['-200% 0', '200% 0'],
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'linear',
  },
};

// ============================================================================
// Error/Shake Animation
// ============================================================================

export const shakeAnimation: Variants = {
  initial: { x: 0 },
  animate: {
    x: [0, -5, 5, -5, 5, 0],
    transition: {
      duration: 0.4,
    },
  },
};

// ============================================================================
// Hover Effects
// ============================================================================

export const hoverLift = {
  whileHover: { y: -2, transition: transitions.fast },
  whileTap: { y: 0 },
};

export const hoverScale = {
  whileHover: { scale: 1.02, transition: transitions.fast },
  whileTap: { scale: 0.98 },
};

export const hoverGlow = {
  whileHover: {
    boxShadow: '0 4px 20px rgba(59, 130, 246, 0.25)',
    transition: transitions.fast,
  },
};

// ============================================================================
// Number Counter Animation Helper
// ============================================================================

export const countUpConfig = {
  duration: 1.5,
  ease: [0.4, 0, 0.2, 1],
};

// ============================================================================
// Viewport Animation Config (for useInView)
// ============================================================================

export const viewportConfig = {
  once: true,
  margin: '-100px',
  amount: 0.1,
};

export const viewportConfigStrict = {
  once: true,
  margin: '-50px',
  amount: 0.3,
};

const config = {
  theme: {
    extend: {
      colors: {
        // Brand
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0066CC',  // Primary blue
          600: '#0052A3',
          900: '#002952',
        },
        
        // Neutral
        neutral: {
          50: '#F9FAFB',   // Lightest background
          100: '#F3F4F6',  // Card background
          200: '#E5E7EB',  // Border
          300: '#D1D5DB',  // Disabled
          400: '#9CA3AF',  // Placeholder
          500: '#6B7280',  // Secondary text
          600: '#4B5563',  // Body text
          700: '#374151',
          800: '#1F2937',  // Heading text
          900: '#111827',  // Primary text
        },
        
        // Semantic
        success: {
          50: '#ECFDF5',
          500: '#10B981',
          700: '#047857',
        },
        error: {
          50: '#FEF2F2',
          500: '#EF4444',
          700: '#B91C1C',
        },
        warning: {
          50: '#FFFBEB',
          500: '#F59E0B',
          700: '#B45309',
        },
        info: {
          50: '#EFF6FF',
          500: '#3B82F6',
          700: '#1D4ED8',
        },
      },
      
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'ui-serif', 'Georgia', 'serif'],
        metrics: ['var(--font-metrics)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'Courier New', 'monospace'],
      },
      
      fontSize: {
        'display-lg': ['3rem', { lineHeight: '1.2', fontWeight: '700' }],      // 48px
        'display-md': ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }],   // 36px
        'heading-xl': ['1.875rem', { lineHeight: '1.3', fontWeight: '600' }],  // 30px
        'heading-lg': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],    // 24px
        'heading-md': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],   // 20px
        'heading-sm': ['1.125rem', { lineHeight: '1.4', fontWeight: '600' }],  // 18px
        'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],     // 18px
        'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],            // 16px
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],     // 14px
        'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],      // 12px
        'label': ['0.875rem', { lineHeight: '1.4', fontWeight: '500' }],       // 14px
      },
      
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      
      borderRadius: {
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
    },
  },
}

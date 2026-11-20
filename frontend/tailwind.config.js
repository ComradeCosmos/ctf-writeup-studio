/** @type {import('tailwindcss').Config} */

function withOpacity(variableName) {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `color-mix(in oklab, var(${variableName}) calc(${opacityValue} * 100%), transparent)`;
    }
    return `var(${variableName})`;
  };
}

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      borderColor: {
        DEFAULT: 'var(--border)',
      },
      colors: {
        background: withOpacity('--background'),
        foreground: withOpacity('--foreground'),
        card: {
          DEFAULT: withOpacity('--card'),
          foreground: withOpacity('--card-foreground'),
        },
        popover: {
          DEFAULT: withOpacity('--popover'),
          foreground: withOpacity('--popover-foreground'),
        },
        primary: {
          DEFAULT: withOpacity('--primary'),
          foreground: withOpacity('--primary-foreground'),
        },
        secondary: {
          DEFAULT: withOpacity('--secondary'),
          foreground: withOpacity('--secondary-foreground'),
        },
        muted: {
          DEFAULT: withOpacity('--muted'),
          foreground: withOpacity('--muted-foreground'),
        },
        accent: {
          DEFAULT: withOpacity('--accent'),
          foreground: withOpacity('--accent-foreground'),
        },
        destructive: {
          DEFAULT: withOpacity('--destructive'),
          foreground: withOpacity('--destructive-foreground'),
        },
        border: withOpacity('--border'),
        input: withOpacity('--input'),
        ring: withOpacity('--ring'),
        sidebar: {
          DEFAULT: withOpacity('--sidebar'),
          foreground: withOpacity('--sidebar-foreground'),
          primary: withOpacity('--sidebar-primary'),
          'primary-foreground': withOpacity('--sidebar-primary-foreground'),
          accent: withOpacity('--sidebar-accent'),
          'accent-foreground': withOpacity('--sidebar-accent-foreground'),
          border: withOpacity('--sidebar-border'),
          ring: withOpacity('--sidebar-ring'),
        },
        good: withOpacity('--good'),
        caution: withOpacity('--caution'),
        terminal: withOpacity('--terminal'),
        'surface-strong': withOpacity('--surface-strong'),
        'surface-raised': withOpacity('--surface-raised'),
        cyber: {
          bg: '#090B10',
          sidebar: '#0C0F16',
          card: '#111620',
          surface: '#171D29',
          border: '#252D3A',
          primary: '#A3E635',
          secondary: '#38BDF8',
          text: '#F1F5F9',
          textSecondary: '#94A3B8',
          muted: '#64748B',
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace']
      },
      boxShadow: {
        'glow-primary': '0 0 15px -3px rgba(163, 230, 53, 0.25)',
        'glow-cyan': '0 0 15px -3px rgba(56, 189, 248, 0.25)',
        'subtle': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
        'panel': '0 18px 50px -30px rgba(0, 0, 0, 0.7)'
      }
    },
  },
  plugins: [],
}

import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      spacing: {
        'safe-top': 'var(--min-safe-top)',
        'safe-bottom': 'var(--min-safe-bottom)',
        'safe-left': 'max(var(--safe-left), 1rem)',
        'safe-right': 'max(var(--safe-right), 1rem)',
      },
      fontSize: {
        'xs': 'calc(var(--font-size-xs) * var(--font-scale-multiplier, 1))',
        'sm': 'calc(var(--font-size-sm) * var(--font-scale-multiplier, 1))',
        'base': 'calc(var(--font-size-base) * var(--font-scale-multiplier, 1))',
        'lg': 'calc(var(--font-size-lg) * var(--font-scale-multiplier, 1))',
        'xl': 'calc(var(--font-size-xl) * var(--font-scale-multiplier, 1))',
        '2xl': 'calc(var(--font-size-2xl) * var(--font-scale-multiplier, 1))',
        '3xl': 'calc(var(--font-size-3xl) * var(--font-scale-multiplier, 1))',
        '4xl': 'calc(var(--font-size-4xl) * var(--font-scale-multiplier, 1))',
        '5xl': 'calc(var(--font-size-5xl) * var(--font-scale-multiplier, 1))',
        '6xl': 'calc(var(--font-size-6xl) * var(--font-scale-multiplier, 1))',
      },
      lineHeight: {
        'tight': 'var(--line-height-tight)',
        'normal': 'var(--line-height-normal)',
        'relaxed': 'var(--line-height-relaxed)',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        game: {
          grid: "hsl(var(--game-grid))",
          border: "hsl(var(--game-border))",
        },
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        glass: {
          bg: "var(--glass-bg)",
          border: "var(--glass-border)",
        },
      },
      backgroundImage: {
        "gradient-hero": "var(--gradient-hero)",
        "gradient-glass": "var(--gradient-glass)",
      },
      boxShadow: {
        glow: "var(--shadow-glow)",
        "glow-lg": "var(--shadow-glow-lg)",
        neon: "var(--shadow-neon)",
        premium: "var(--shadow-premium)",
      },
      backdropBlur: {
        glass: "16px",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

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
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
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
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-button': 'var(--gradient-button)',
        'gradient-card': 'var(--gradient-card)',
        'gradient-subtle': 'var(--gradient-subtle)',
        'gradient-hover': 'var(--gradient-hover)',
      },
      boxShadow: {
        'glow': 'var(--shadow-glow)',
        'card': 'var(--shadow-card)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(0 85% 50% / 0.3)" },
          "50%": { boxShadow: "0 0 40px hsl(0 85% 50% / 0.6)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        // VIP Section animations
        "vip-pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 15px rgba(59, 130, 246, 0.2)" },
          "50%": { boxShadow: "0 0 25px rgba(59, 130, 246, 0.4)" },
        },
        "vip-breathing": {
          "0%, 100%": { opacity: "0.8" },
          "50%": { opacity: "1" },
        },
        "vip-float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "vip-particle": {
          "0%": { transform: "translateX(0) translateY(0)", opacity: "0.3" },
          "50%": { opacity: "0.6" },
          "100%": { transform: "translateX(80px) translateY(-60px)", opacity: "0" },
        },
        "vip-neon-pulse": {
          "0%, 100%": { opacity: "0.3", filter: "drop-shadow(0 0 10px rgba(59, 130, 246, 0.3))" },
          "50%": { opacity: "0.6", filter: "drop-shadow(0 0 20px rgba(59, 130, 246, 0.6))" },
        },
        "vip-shine": {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        "vip-blink": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "0.8" },
        },
        "rainbow-text": {
          "0%": { backgroundPosition: "0% center" },
          "100%": { backgroundPosition: "200% center" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "fade-in-up": "fade-in-up 0.5s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.4s ease-out",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        // VIP Section animations
        "vip-pulse-glow": "vip-pulse-glow 4s ease-in-out infinite",
        "vip-breathing": "vip-breathing 3s ease-in-out infinite",
        "vip-float": "vip-float 8s ease-in-out infinite",
        "vip-particle": "vip-particle 15s linear infinite",
        "vip-neon-pulse": "vip-neon-pulse 3s ease-in-out infinite",
        "vip-shine": "vip-shine 3s linear infinite",
        "vip-blink": "vip-blink 3s ease-in-out infinite",
        "rainbow-text": "rainbow-text 3s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

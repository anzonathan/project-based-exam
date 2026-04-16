/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: "#d4a853",
          light: "#e8c874",
          dim: "#a07c3a",
          dark: "#7a5a2a",
        },
        accent: {
          DEFAULT: "#e04040",
          hover: "#f05050",
        },
        surface: {
          0: "#06060b",
          1: "#0c0c14",
          2: "#13131e",
          3: "#1a1a28",
          4: "#222233",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      keyframes: {
        slideUpFade: {
          "0%": { opacity: "0", transform: "translateY(40px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        progress: {
          "0%": { width: "0%" },
          "100%": { width: "100%" },
        },
      },
      animation: {
        slideUpFade: "slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        float: "float 4s ease-in-out infinite",
        progress: "progress 4s linear forwards",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#10212b",
        sand: "#f3ede4",
        coral: "#ef7d57",
        sky: "#79c7c5",
        pine: "#174c4f",
        cream: "#fffaf2",
      },
      boxShadow: {
        float: "0 24px 60px rgba(16, 33, 43, 0.14)",
      },
      fontFamily: {
        display: ["Poppins", "sans-serif"],
        body: ["Manrope", "sans-serif"],
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(16,33,43,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(16,33,43,0.06) 1px, transparent 1px)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        rise: "rise 0.7s ease-out forwards",
      },
    },
  },
  plugins: [],
};

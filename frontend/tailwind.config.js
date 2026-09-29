/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#C62828",
        "primary-dark": "#a82222",
        "bg-light": "#fcfcfc",
        "text-main": "#2d3436",
        "text-muted": "#7f8c8d",
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.tsx",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      width: {
        '72': '18rem',
        '80': '20rem',
        '96': '24rem',
      },
      height: {
        '72': '18rem',
        '80': '20rem',
        '96': '24rem',
      }
    },
  },
  plugins: [],
}
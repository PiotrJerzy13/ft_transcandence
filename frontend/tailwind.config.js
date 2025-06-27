/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Dynamic rank colors from getRankColor function
    "text-gray-400",
    "text-green-400", 
    "text-blue-400",
    "text-purple-400",
    "text-yellow-400",
    "text-red-400",
    
    // Conditional classes
    "rotate-180",
    
    // Custom animation delays (defined in index.css)
    "delay-2000",
    "delay-4000"
  ],
  theme: {
    extend: {
      animationDelay: {
        '2000': '2s',
        '4000': '4s',
      }
    },
  },
  plugins: [],
};



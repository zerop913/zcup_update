/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    screens: {
      lg: { max: "1199.99px" },
      md: { max: "1039.99px" },
      sm: { max: "767.99px" },
      xs: { max: "424.99px" },
    },
    extend: {
      fontFamily: {
        raleway: ["Raleway", "sans-serif"],
      },
      backgroundImage: {
        heroGradient:
          "linear-gradient(150.57deg, #1E0426 2.97%, #100C3A 25.62%, #130517 51.04%, #050130 72.12%, #0A0426 91.18%)",
        footerGradient:
          "linear-gradient(79.57deg, rgba(19, 5, 24, 0.07) 10.75%, rgba(119, 89, 243, 0.07) 53.13%, rgba(19, 5, 24, 0.07) 106.55%)",
      },
      colors: {
        white: "#FFFFFF",
        violet: "#7759F3",
        grey: "#706C83",
      },
    },
  },
  plugins: [],
};

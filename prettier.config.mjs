/** @type {import("prettier").Config} */
const config = {
  singleQuote: false,
  semi: true,
  trailingComma: "all",
  printWidth: 80,
  tabWidth: 2,
  plugins: ["prettier-plugin-tailwindcss"],
};

export default config;

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" makes the built site work at any address,
// including https://yourname.github.io/your-repo-name/
export default defineConfig({
  plugins: [react()],
  base: "./",
});

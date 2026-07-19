import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { auth } from "./src/lib/auth";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [tailwindcss(), tanstackStart(), viteReact()],
  ssr: {
    noExternal: ["@uiw/react-md-editor"],
  },
});

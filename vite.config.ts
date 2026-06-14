import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./src/lib/auth";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(), 
    tanstackStart(), 
    viteReact(),
    {
      name: "better-auth-dev",
      configureServer(server) {
        server.middlewares.use("/api/auth", toNodeHandler(auth));
      }
    }
  ],
});

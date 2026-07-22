import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { auth } from "./src/lib/auth";
import { toNodeHandler } from "better-auth/node";

const betterAuthPlugin = () => ({
  name: "better-auth-plugin",
  configureServer(server: any) {
    const handler = toNodeHandler(auth);
    server.middlewares.use((req: any, res: any, next: any) => {
      if (req.url?.startsWith("/api/auth/")) {
        return handler(req, res);
      }
      next();
    });
  },
});

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [betterAuthPlugin(), tailwindcss(), tanstackStart(), viteReact()],
  ssr: {
    noExternal: ["@uiw/react-md-editor"],
  },
});

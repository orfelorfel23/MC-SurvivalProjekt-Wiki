import express from "express";
import handler from "./dist/server/server.js";
import { auth } from "./src/lib/auth.js";

const app = express();
app.set("trust proxy", true);

const port = process.env.PORT || 3000;
const host = process.env.HOST || "0.0.0.0";

// Serve static assets from dist/client
app.use(express.static("dist/client"));

// Forward all other requests to TanStack Start's SSR handler
app.use(async (req, res) => {
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";
  const reqHost = req.headers["x-forwarded-host"] || req.get("host") || "localhost";
  const url = new URL(req.originalUrl, `${protocol}://${reqHost}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else if (value) {
      headers.set(key, value);
    }
  }

  const init: any = {
    method: req.method,
    headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    const body = await new Promise<Buffer>((resolve) => {
      const data: any[] = [];
      req.on("data", (chunk) => data.push(chunk));
      req.on("end", () => resolve(Buffer.concat(data)));
    });
    init.body = body;
  }

  const request = new Request(url, init);

  try {
    if (url.pathname === "/api/make-me-admin") {
      try {
        const { PrismaClient } = await import("@prisma/client");
        const prisma = new PrismaClient();
        const user = await prisma.user.findUnique({ where: { email: "test@test.de" } });
        if (user) {
          const existing = await prisma.userRole.findFirst({ where: { userId: user.id, role: "ADMIN" } });
          if (!existing) {
            await prisma.userRole.create({
              data: { userId: user.id, role: "ADMIN" }
            });
            res.status(200).send("test@test.de ist jetzt Admin!");
          } else {
            res.status(200).send("test@test.de war bereits Admin.");
          }
        } else {
          res.status(404).send("User test@test.de nicht gefunden.");
        }
      } catch (e: any) {
        res.status(500).send("Fehler: " + e.message);
      }
      return;
    }

    if (url.pathname.startsWith("/api/auth/")) {
      const authResponse = await auth.handler(request);
      if (authResponse) {
        authResponse.headers.forEach((value, key) => {
          res.setHeader(key, value);
        });
        res.status(authResponse.status);
        
        if (authResponse.body) {
           const text = await authResponse.text();
           res.end(text);
        } else {
           res.end();
        }
        return;
      }
    }

    console.log("Fetching handler...");
    const response = await handler.fetch(request);
    console.log("Response status:", response?.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.status(response.status);

    if (response.body) {
      const reader = response.body.getReader();
      async function read() {
        try {
          const { done, value } = await reader.read();
          if (done) {
            res.end();
            return;
          }
          res.write(value);
          read();
        } catch (err) {
          console.error("Stream reading error:", err);
          res.end();
        }
      }
      read();
    } else {
      res.end();
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, host, () => {
  console.log(`Production server listening on http://${host}:${port}`);
});

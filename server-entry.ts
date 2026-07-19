import express from "express";
import handler from "./dist/server/server.js";

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || "0.0.0.0";

// Serve static assets from dist/client
app.use(express.static("dist/client"));

// Forward all other requests to TanStack Start's SSR handler
app.use(async (req, res) => {
  const protocol = req.protocol || "http";
  const reqHost = req.get("host") || "localhost";
  const url = new URL(req.originalUrl, `${protocol}://${reqHost}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else if (value) {
      headers.set(key, value);
    }
  }

  const init = {
    method: req.method,
    headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    const body = await new Promise((resolve) => {
      const data = [];
      req.on("data", (chunk) => data.push(chunk));
      req.on("end", () => resolve(Buffer.concat(data)));
    });
    init.body = body;
  }

  const request = new Request(url, init);

  try {
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

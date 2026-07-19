// @ts-ignore
import { createAPIFileRoute } from "@tanstack/react-start/api";
import { auth } from "@/lib/auth";

export const APIRoute = createAPIFileRoute("/api/auth/$")({
  GET: ({ request }: any) => {
    return auth.handler(request);
  },
  POST: ({ request }: any) => {
    return auth.handler(request);
  },
});

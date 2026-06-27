import { NextRequest } from "next/server";
import { getAuthHeader, proxyToBackend } from "@/lib/server/backend";

export async function GET(req: NextRequest) {
  if (!getAuthHeader(req)) {
    return Response.json({ message: "No token provided" }, { status: 401 });
  }

  const query = req.nextUrl.search;
  return proxyToBackend(req, "/api/mood/history", { query });
}

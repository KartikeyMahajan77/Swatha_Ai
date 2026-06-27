import { NextRequest } from "next/server";
import { getAuthHeader, proxyToBackend } from "@/lib/server/backend";

export async function GET(req: NextRequest) {
  if (!getAuthHeader(req)) {
    return Response.json({ message: "No token provided" }, { status: 401 });
  }

  return proxyToBackend(req, "/api/activity/today");
}

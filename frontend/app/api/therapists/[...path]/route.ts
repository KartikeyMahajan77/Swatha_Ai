import { NextRequest, NextResponse } from "next/server";
import { parseBackendResponse, BACKEND_API_URL } from "@/lib/server/backend";

async function proxyRequest(
  req: NextRequest,
  path: string[],
  method: "GET" | "POST",
) {
  const body = method === "GET" ? undefined : await req.text();
  const res = await fetch(`${BACKEND_API_URL}/therapists/${path.join("/")}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: req.headers.get("authorization") || "",
    },
    body,
  });

  const data = await parseBackendResponse(res);
  return NextResponse.json(data, { status: res.status });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyRequest(req, path, "GET");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyRequest(req, path, "POST");
}

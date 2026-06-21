import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.BACKEND_API_URL ||
  "http://localhost:3001";

async function proxyRequest(
  req: NextRequest,
  path: string[],
  method: "GET" | "POST" | "PATCH",
) {
  const body = method === "GET" ? undefined : await req.text();
  const res = await fetch(`${API_URL}/therapist/${path.join("/")}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: req.headers.get("authorization") || "",
    },
    body,
  });

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json()
    : { message: await res.text() };
  return NextResponse.json(data, { status: res.status });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return proxyRequest(req, params.path, "GET");
}

export async function POST(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return proxyRequest(req, params.path, "POST");
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { path: string[] } },
) {
  return proxyRequest(req, params.path, "PATCH");
}

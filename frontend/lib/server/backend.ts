import { NextRequest, NextResponse } from "next/server";

export const BACKEND_API_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "http://localhost:3001";

export function getAuthHeader(req: NextRequest): string {
  return req.headers.get("authorization") || req.headers.get("Authorization") || "";
}

export async function parseBackendResponse(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }

  const text = await res.text();
  return text ? { message: text } : {};
}

export async function proxyToBackend(
  req: NextRequest,
  backendPath: string,
  options: {
    method?: string;
    body?: string;
    query?: string;
  } = {},
) {
  const method = options.method || req.method;
  const url = `${BACKEND_API_URL}${backendPath}${options.query || ""}`;
  const body =
    options.body !== undefined
      ? options.body
      : method === "GET" || method === "HEAD"
        ? undefined
        : await req.text();

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: getAuthHeader(req),
    },
    body,
  });

  const data = await parseBackendResponse(res);
  return NextResponse.json(data, { status: res.status });
}

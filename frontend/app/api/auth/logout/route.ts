import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.BACKEND_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "http://localhost:3001";

export async function POST(req: NextRequest) {
  const token = req.headers.get("Authorization");

  if (!token) {
    return NextResponse.json({ message: "No token provided" }, { status: 401 });
  }

  try {
    const res = await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: {
        Authorization: token,
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Error logging out:", error);
    return NextResponse.json(
      { message: "Server error", error },
      { status: 500 },
    );
  }
}

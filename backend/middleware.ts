import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// The list of all allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://www.akarwomengroup.com",
  "https://akarwomengroup.com",
  "https://akar-event-management-system.vercel.app",
  "https://admin.akarwomengroup.com",
];

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "";

  // Check if the origin is allowed (exact match or Vercel preview pattern)
  // Dynamic pattern for Vercel previews: https://project-name-*.vercel.app
  const isAllowed =
    allowedOrigins.includes(origin) ||
    /^https:\/\/akar-event-management-system.*\.vercel\.app$/.test(origin);

  // Handle preflighted requests
  if (request.method === "OPTIONS") {
    const preflightHeaders = {
      ...(isAllowed && { "Access-Control-Allow-Origin": origin }),
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version",
      "Access-Control-Max-Age": "86400",
      ...(isAllowed && { "Access-Control-Allow-Credentials": "true" }),
    };
    return NextResponse.json({}, { headers: preflightHeaders });
  }

  // Handle simple requests
  const response = NextResponse.next();

  if (isAllowed) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version",
    );
  }

  return response;
}

export const config = {
  matcher: "/api/:path*",
};

import { NextRequest, NextResponse } from "next/server";
import { upstreamApiUrl } from "@/lib/config";

const RESPONSE_DROP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "content-encoding",
  "content-length"
]);

const REQUEST_DROP_HEADERS = [
  "host",
  "connection",
  "content-length",
  "expect",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade"
];

async function proxy(request: NextRequest, context: { params: { path: string[] } }) {
  const path = context.params.path.join("/");
  const upstream = new URL(`/api/${path}${request.nextUrl.search}`, upstreamApiUrl());
  const headers = new Headers(request.headers);
  REQUEST_DROP_HEADERS.forEach((header) => headers.delete(header));

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: "no-store",
    redirect: "manual"
  };

  if (!/^(GET|HEAD)$/i.test(request.method)) {
    init.body = await request.arrayBuffer();
  }

  const response = await fetch(upstream, init);
  const responseHeaders = new Headers();
  response.headers.forEach((value, key) => {
    if (!RESPONSE_DROP_HEADERS.has(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  });

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders
  });
}

export const dynamic = "force-dynamic";
export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  }

  const urlParams = new URL(req.url).searchParams;
  const targetUrl = urlParams.get("url");

  if (!targetUrl) {
    return new Response("Missing ?url= parameter", { status: 400 });
  }

  let parsedBase;
  try {
    parsedBase = new URL(targetUrl);
  } catch {
    return new Response("Invalid URL", { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "de-CH,de;q=0.9,en;q=0.8",
      },
      redirect: "follow",
    });

    const contentType = response.headers.get("content-type") || "text/html";

    // For non-HTML resources — proxy them directly
    if (!contentType.includes("text/html")) {
      const body = await response.arrayBuffer();
      return new Response(body, {
        status: response.status,
        headers: {
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    let html = await response.text();
    const base = `${parsedBase.protocol}//${parsedBase.host}`;

    // Inject <base> tag so all relative links resolve correctly
    html = html.replace(/<head([^>]*)>/i, `<head$1><base href="${base}/">`);

    // Remove existing X-Frame-Options meta tags
    html = html.replace(/<meta[^>]*x-frame-options[^>]*>/gi, "");

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(`Proxy error: ${error.message}`, { status: 500 });
  }
});
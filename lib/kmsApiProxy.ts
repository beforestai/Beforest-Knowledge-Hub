const API_BASE_URL = process.env.KMS_API_BASE_URL || "http://127.0.0.1:8000";

type ProxyOptions = {
  path: string;
  request?: Request;
  method?: string;
};

export async function proxyToKmsApi({ path, request, method }: ProxyOptions) {
  const targetUrl = new URL(`/api/v1${path}`, API_BASE_URL);
  if (request) {
    const sourceUrl = new URL(request.url);
    sourceUrl.searchParams.forEach((value, key) => targetUrl.searchParams.set(key, value));
  }

  const headers = new Headers();
  headers.set("accept", "application/json");
  const body = request && method !== "GET" && method !== "HEAD" ? await request.arrayBuffer() : undefined;
  if (body) {
    headers.set("content-type", request?.headers.get("content-type") || "application/json");
  }

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      method: method || request?.method || "GET",
      headers,
      body: body ? Buffer.from(body) : undefined,
      cache: "no-store"
    });
  } catch {
    return Response.json({ detail: "KMS backend API is unavailable." }, { status: 503 });
  }

  if (response.status === 204) {
    return new Response(null, { status: 204 });
  }

  const responseBody = await response.text();
  return new Response(responseBody, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") || "application/json"
    }
  });
}

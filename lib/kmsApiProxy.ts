const API_BASE_URL = process.env.KMS_API_BASE_URL || "http://127.0.0.1:8000";

type ProxyOptions = {
  path: string;
  request?: Request;
  method?: string;
};

export async function proxyToKmsApi({ path, request, method }: ProxyOptions) {
  const targetUrl = new URL(`/api/v1${path}`, API_BASE_URL);
  const requestMethod = method || request?.method || "GET";
  const isDocumentCreate = path === "/documents" && requestMethod === "POST";
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
      method: requestMethod,
      headers,
      body: body ? Buffer.from(body) : undefined,
      cache: "no-store"
    });
  } catch (error) {
    if (isDocumentCreate) {
      console.error("[KMS attachment:proxy backend unavailable]", {
        id: null,
        title: null,
        file_name: null,
        file_storage_path: null,
        file_content_type: null,
        file_size_bytes: null,
        error: error instanceof Error ? error.message : String(error)
      });
    }
    return Response.json({ detail: "KMS backend API is unavailable." }, { status: 503 });
  }

  if (isDocumentCreate && process.env.NODE_ENV !== "production") {
    const responseText = await response.clone().text();
    console.debug("[KMS attachment:proxy backend response]", {
      status: response.status,
      body: responseText.slice(0, 1000)
    });
  }

  if (response.status === 204) {
    return new Response(null, { status: 204 });
  }

  const responseBody = await response.arrayBuffer();
  const responseHeaders = new Headers();
  responseHeaders.set("content-type", response.headers.get("content-type") || "application/json");
  const contentDisposition = response.headers.get("content-disposition");
  if (contentDisposition) {
    responseHeaders.set("content-disposition", contentDisposition);
  }

  return new Response(responseBody, {
    status: response.status,
    headers: responseHeaders
  });
}

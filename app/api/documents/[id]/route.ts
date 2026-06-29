import { proxyToKmsApi } from "@/lib/kmsApiProxy";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyToKmsApi({ path: `/documents/${id}`, request, method: "GET" });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyToKmsApi({ path: `/documents/${id}`, request, method: "PATCH" });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyToKmsApi({ path: `/documents/${id}`, request, method: "DELETE" });
}

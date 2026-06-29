import { proxyToKmsApi } from "@/lib/kmsApiProxy";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyToKmsApi({ path: `/chunks/documents/${id}`, request, method: "GET" });
}

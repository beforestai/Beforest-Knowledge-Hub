import { proxyToKmsApi } from "@/lib/kmsApiProxy";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyToKmsApi({ path: `/documents/${id}/file`, request, method: "POST" });
}

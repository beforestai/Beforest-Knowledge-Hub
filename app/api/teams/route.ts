import { proxyToKmsApi } from "@/lib/kmsApiProxy";

export async function GET(request: Request) {
  return proxyToKmsApi({ path: "/teams", request, method: "GET" });
}

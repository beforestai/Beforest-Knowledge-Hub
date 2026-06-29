import { proxyToKmsApi } from "@/lib/kmsApiProxy";

export async function POST(request: Request) {
  return proxyToKmsApi({ path: "/collective/overview", request, method: "POST" });
}

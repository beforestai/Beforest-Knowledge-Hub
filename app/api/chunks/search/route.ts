import { proxyToKmsApi } from "@/lib/kmsApiProxy";

export async function POST(request: Request) {
  return proxyToKmsApi({ path: "/chunks/search", request, method: "POST" });
}

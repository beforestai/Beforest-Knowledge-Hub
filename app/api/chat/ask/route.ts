import { proxyToKmsApi } from "@/lib/kmsApiProxy";

export async function POST(request: Request) {
  return proxyToKmsApi({ path: "/chat/ask", request, method: "POST" });
}

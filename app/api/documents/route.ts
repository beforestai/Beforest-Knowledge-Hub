import { proxyToKmsApi } from "@/lib/kmsApiProxy";

export async function GET(request: Request) {
  return proxyToKmsApi({ path: "/documents", request, method: "GET" });
}

export async function POST(request: Request) {
  return proxyToKmsApi({ path: "/documents", request, method: "POST" });
}

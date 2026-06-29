import { proxyToKmsApi } from "@/lib/kmsApiProxy";

export async function GET(request: Request) {
  return proxyToKmsApi({ path: "/pages", request, method: "GET" });
}

export async function POST(request: Request) {
  return proxyToKmsApi({ path: "/pages", request, method: "POST" });
}

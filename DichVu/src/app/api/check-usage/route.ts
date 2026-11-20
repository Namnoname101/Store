export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import dns from "node:dns";
import { ModelApiService } from "@/services/modelapi/modelapi.service";

// Ensure Node.js prioritizes IPv6 to avoid Cloudflare/Imunify360 WAF blocking datacenter IPv4 on upstream
try {
  dns.setDefaultResultOrder("ipv6first");
} catch {
  // Graceful fallback on runtimes where not supported
}

const UPSTREAM_URL = "https://genzshop.vn/api/check-usage.php";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function sanitizeModelName(name?: string): string {
  if (!name) return "claude-sonnet-5.5";
  if (name.includes("claude-3-5") || name.includes("claude-3.5") || name.includes("claude-3")) {
    return "claude-sonnet-5.5";
  }
  return name;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { apiKey, action, page, limit } = body;

    if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập API Key để kiểm tra." },
        { status: 400 }
      );
    }

    const cleanKey = apiKey.trim();

    // 1. If key is explicitly a ModelAPI key or demo key, route directly to ModelApiService
    if (cleanKey.startsWith("sk-modelapi") || cleanKey.startsWith("sk-codex")) {
      return await handleModelApiKey(cleanKey, action, page, limit);
    }

    const payload: Record<string, any> = {
      apiKey: cleanKey,
    };

    if (action) payload.action = action;
    if (page !== undefined) payload.page = page;
    if (limit !== undefined) payload.limit = limit;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const upstreamResponse = await fetch(UPSTREAM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    const data = await upstreamResponse.json().catch(() => null);

    // If upstream blocks via WAF
    if (upstreamResponse.status === 403 || data?.message?.includes("Imunify360")) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Hệ thống đang bảo trì kết nối tự động. Quý khách vui lòng bấm nút bên dưới để mở trang tra cứu trực tiếp từ máy chủ dịch vụ.",
          directUrl: "https://genzshop.vn/check-usage",
        },
        { status: 403 }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: `Máy chủ kiểm tra trả về mã lỗi ${upstreamResponse.status}. Vui lòng thử lại sau.`,
          directUrl: "https://genzshop.vn/check-usage",
        },
        { status: upstreamResponse.status || 502 }
      );
    }

    // If GenzShop reports key not found, check if it belongs to ModelAPI
    if (
      !data.success &&
      data.error &&
      (data.error.includes("không tồn tại") || data.error.includes("chưa được kích hoạt"))
    ) {
      const modelApiResult = await tryHandleModelApiFallback(cleanKey, action, page, limit);
      if (modelApiResult) {
        return modelApiResult;
      }
    }

    if (!data.success && !data.error && data.message) {
      data.error = data.message;
    }

    // Sanitize any legacy model representations in request logs to conform with Frontier AI guidelines
    if (Array.isArray(data.requests)) {
      data.requests = data.requests.map((r: any) => ({
        ...r,
        model: sanitizeModelName(r.model),
      }));
    }

    return NextResponse.json(data, { status: upstreamResponse.status });
  } catch (err: any) {
    console.error("[POST /api/check-usage Error]:", err);
    if (err?.name === "AbortError") {
      return NextResponse.json(
        { success: false, error: "Yêu cầu kiểm tra bị quá thời gian chờ (15s). Vui lòng thử lại." },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { success: false, error: err?.message || "Không thể kết nối đến hệ thống kiểm tra." },
      { status: 500 }
    );
  }
}

async function handleModelApiKey(cleanKey: string, action?: string, page?: number, limit?: number) {
  try {
    const rawData = await ModelApiService.fetchTokenUsage(cleanKey);
    const quotaData = rawData?.data || {};

    const quota = Number(quotaData.total_available ?? quotaData.remain_quota ?? quotaData.quota ?? 0);
    const usedQuota = Number(quotaData.total_used ?? quotaData.used_quota ?? 0);
    const totalGrantedQuota = Number(quotaData.total_granted ?? (quota + usedQuota));

    const totalCost = Number(ModelApiService.quotaToUsd(usedQuota).toFixed(4));
    const costLimit = Number(ModelApiService.quotaToUsd(totalGrantedQuota).toFixed(2));
    const remainPct = totalGrantedQuota > 0 ? Number(((quota / totalGrantedQuota) * 100).toFixed(1)) : 100;

    let requests: any[] = [];
    let totalReqs = 0;

    if (action === "requests") {
      try {
        const logs = await ModelApiService.fetchTokenLogs(cleanKey, page || 1, limit || 20);
        const items = Array.isArray(logs?.data?.items) ? logs.data.items : [];
        totalReqs = Number(logs?.data?.total || items.length);
        requests = items.map((item: any) => ({
          id: item.id,
          created_at: new Date(item.created_at * 1000).toISOString(),
          model: sanitizeModelName(item.model_name),
          input_tokens: item.prompt_tokens || 0,
          output_tokens: item.completion_tokens || 0,
          cost: ModelApiService.quotaToUsd(item.quota || 0),
          latency: item.use_time || 0,
          status: 200,
        }));
      } catch (logErr) {
        console.warn("[handleModelApiKey] fetchTokenLogs error:", logErr);
      }
    }

    return NextResponse.json({
      success: true,
      usage: {
        totalCost,
        costLimit,
        totalRequests: totalReqs,
        totalTokens: 0,
        dailyCostLimit: 0,
        dailyCostUsed: 0,
        fallbackRemainPercent: remainPct,
        status: "Hoạt động",
        tierName: "Gói ModelAPI / Codex",
      },
      daily: [],
      overage: null,
      requests,
      total: totalReqs,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Không thể kiểm tra API Key ModelAPI." },
      { status: 400 }
    );
  }
}

async function tryHandleModelApiFallback(cleanKey: string, action?: string, page?: number, limit?: number) {
  try {
    const verify = await ModelApiService.verifyCustomerKey(cleanKey);
    if (verify.valid) {
      return await handleModelApiKey(cleanKey, action, page, limit);
    }
  } catch {
    // Silent fallback
  }
  return null;
}

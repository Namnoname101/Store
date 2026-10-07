import { LocketAutoConfig, LocketAutoLog } from "@prisma/client";
import prisma from "@/lib/prisma";

export interface SaveConfigData {
  goldPassUrl?: string;
  passId?: string;
  linkVersion?: number;
  signature?: string;
  sessionCookie?: string;
  csrfToken?: string | null;
  targetUsername?: string | null;
  isActive?: boolean;
  intervalSeconds?: number;
  lastRunAt?: Date | null;
  lastStatus?: string | null;
  lastMessage?: string | null;
}

export interface RecordLogData {
  status: string;
  jobId?: string | null;
  message: string;
  rawPayload?: any;
  durationMs?: number | null;
}

export class LocketAutoService {
  /**
   * Lấy cấu hình tự động GoldPass hiện tại
   */
  static async getConfig(): Promise<LocketAutoConfig | null> {
    return prisma.locketAutoConfig.findUnique({
      where: { id: "default" },
    });
  }

  /**
   * Lưu hoặc cập nhật cấu hình tự động GoldPass
   */
  static async saveConfig(data: SaveConfigData): Promise<LocketAutoConfig> {
    const createData = {
      id: "default",
      goldPassUrl: data.goldPassUrl || "",
      passId: data.passId || "",
      linkVersion: data.linkVersion ?? 1,
      signature: data.signature || "",
      sessionCookie: data.sessionCookie || "",
      csrfToken: data.csrfToken ?? null,
      targetUsername: data.targetUsername ?? null,
      isActive: data.isActive ?? false,
      intervalSeconds: data.intervalSeconds ?? 60,
      lastRunAt: data.lastRunAt ?? null,
      lastStatus: data.lastStatus ?? null,
      lastMessage: data.lastMessage ?? null,
    };

    const updateData: Record<string, any> = {};
    if (data.goldPassUrl !== undefined) updateData.goldPassUrl = data.goldPassUrl;
    if (data.passId !== undefined) updateData.passId = data.passId;
    if (data.linkVersion !== undefined) updateData.linkVersion = data.linkVersion;
    if (data.signature !== undefined) updateData.signature = data.signature;
    if (data.sessionCookie !== undefined) updateData.sessionCookie = data.sessionCookie;
    if (data.csrfToken !== undefined) updateData.csrfToken = data.csrfToken;
    if (data.targetUsername !== undefined) updateData.targetUsername = data.targetUsername;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.intervalSeconds !== undefined) updateData.intervalSeconds = data.intervalSeconds;
    if (data.lastRunAt !== undefined) updateData.lastRunAt = data.lastRunAt;
    if (data.lastStatus !== undefined) updateData.lastStatus = data.lastStatus;
    if (data.lastMessage !== undefined) updateData.lastMessage = data.lastMessage;

    return prisma.locketAutoConfig.upsert({
      where: { id: "default" },
      create: createData,
      update: updateData,
    });
  }

  /**
   * Ghi log thực thi và tự động dọn dẹp các bản ghi cũ vượt quá giới hạn 100 dòng
   */
  static async recordLog(data: RecordLogData): Promise<LocketAutoLog> {
    let rawPayload: string | null = null;
    if (data.rawPayload !== undefined && data.rawPayload !== null) {
      rawPayload =
        typeof data.rawPayload === "object"
          ? JSON.stringify(data.rawPayload)
          : String(data.rawPayload);
    }

    const log = await prisma.locketAutoLog.create({
      data: {
        status: data.status,
        jobId: data.jobId ?? null,
        message: data.message,
        rawPayload,
        durationMs: data.durationMs ?? null,
      },
    });

    // Tự động tỉa bớt log nếu vượt quá 100 bản ghi mới nhất
    const oldLogs = await prisma.locketAutoLog.findMany({
      select: { id: true },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: 100,
    });

    if (oldLogs.length > 0) {
      await prisma.locketAutoLog.deleteMany({
        where: { id: { in: oldLogs.map((l) => l.id) } },
      });
    }

    return log;
  }

  /**
   * Lấy danh sách log gần nhất
   */
  static async getLogs(limit: number = 50): Promise<LocketAutoLog[]> {
    return prisma.locketAutoLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /**
   * Xóa toàn bộ nhật ký thực thi
   */
  static async clearLogs(): Promise<void> {
    await prisma.locketAutoLog.deleteMany();
  }
}

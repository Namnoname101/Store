export interface CodexPackage {
  id: string;
  title: string;
  creditUsd: number;
  quotaUnits: number;
  priceVnd: number;
  badge?: string;
  popular?: boolean;
  description: string;
}

export const CODEX_PACKAGES: CodexPackage[] = [
  {
    id: "codex-10",
    title: "Gói Codex 10$ Credit",
    creditUsd: 10,
    quotaUnits: 5000000,
    priceVnd: 12000,
    badge: "Tiết kiệm",
    popular: false,
    description: "5.000.000 Quota Points — Thích hợp dùng thử cá nhân hoặc test bot",
  },
  {
    id: "codex-50",
    title: "Gói Codex 50$ Credit",
    creditUsd: 50,
    quotaUnits: 25000000,
    priceVnd: 60000,
    badge: "Phổ biến nhất",
    popular: true,
    description: "25.000.000 Quota Points — Tối ưu cho lập trình viên, Cursor & Claude Code",
  },
  {
    id: "codex-100",
    title: "Gói Codex 100$ Credit",
    creditUsd: 100,
    quotaUnits: 50000000,
    priceVnd: 120000,
    badge: "Bán chạy",
    popular: false,
    description: "50.000.000 Quota Points — Dành cho lập trình viên thường xuyên và project",
  },
  {
    id: "codex-200",
    title: "Gói Codex 200$ Credit",
    creditUsd: 200,
    quotaUnits: 100000000,
    priceVnd: 240000,
    badge: "Chuyên nghiệp",
    popular: false,
    description: "100.000.000 Quota Points — Nạp số lượng lớn cho team nhỏ hoặc Agent tải liên tục",
  },
  {
    id: "codex-500",
    title: "Gói Codex 500$ Credit",
    creditUsd: 500,
    quotaUnits: 250000000,
    priceVnd: 540000,
    badge: "Ưu đãi lớn",
    popular: false,
    description: "250.000.000 Quota Points — Dành cho hệ thống Production tải cao, giá tốt nhất",
  },
];

export const GENZSHOP_CODEX_MAPPING: Record<number, string> = {
  10: "CDX-0055",
  50: "CDX-0056",
  100: "CDX-0057",
  200: "CDX-0058",
  500: "CDX-0060",
};

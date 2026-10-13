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
    id: "codex-5",
    title: "Gói Codex $5 Credit",
    creditUsd: 5,
    quotaUnits: 2500000,
    priceVnd: 125000,
    badge: "Thử nghiệm",
    popular: false,
    description: "2.500.000 Quota Points — Thích hợp dùng thử hoặc dự án cá nhân nhỏ",
  },
  {
    id: "codex-10",
    title: "Gói Codex $10 Credit",
    creditUsd: 10,
    quotaUnits: 5000000,
    priceVnd: 245000,
    badge: "Phổ biến nhất",
    popular: true,
    description: "5.000.000 Quota Points — Tối ưu cho lập trình viên và Cursor / Claude Code",
  },
  {
    id: "codex-20",
    title: "Gói Codex $20 Credit",
    creditUsd: 20,
    quotaUnits: 10000000,
    priceVnd: 485000,
    badge: "Tiết kiệm",
    popular: false,
    description: "10.000.000 Quota Points — Nạp số lượng lớn cho team nhỏ",
  },
  {
    id: "codex-50",
    title: "Gói Codex $50 Credit",
    creditUsd: 50,
    quotaUnits: 25000000,
    priceVnd: 1200000,
    badge: "Chuyên nghiệp",
    popular: false,
    description: "25.000.000 Quota Points — Tiết kiệm chi phí vận hành cho Agent & Bot",
  },
  {
    id: "codex-100",
    title: "Gói Codex $100 Credit",
    creditUsd: 100,
    quotaUnits: 50000000,
    priceVnd: 2350000,
    badge: "Doanh nghiệp",
    popular: false,
    description: "50.000.000 Quota Points — Dành cho hệ thống Production tải cao",
  },
];

import TopupClient from "@/components/TopupClient";

export const metadata = {
  title: "Nạp tiền vào tài khoản - KhoDEE",
  description: "Nạp tiền tự động qua VietQR vào tài khoản thành viên KhoDEE",
};

export default function TopupPage() {
  return <TopupClient />;
}

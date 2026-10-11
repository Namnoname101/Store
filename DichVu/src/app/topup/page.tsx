import TopupClient from "@/components/TopupClient";

export const metadata = {
  title: "Nạp tiền vào tài khoản - Daitruong Store",
  description: "Nạp tiền tự động qua VietQR vào tài khoản thành viên Daitruong Store",
};

export default function TopupPage() {
  return <TopupClient />;
}

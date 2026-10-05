import TopupClient from "@/components/TopupClient";

export const metadata = {
  title: "Nạp tiền vào ví - DigiStore",
  description: "Nạp tiền tự động qua VietQR vào tài khoản thành viên DigiStore",
};

export default function TopupPage() {
  return <TopupClient />;
}

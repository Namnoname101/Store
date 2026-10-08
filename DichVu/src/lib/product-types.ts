import { KeyRound, UserCheck, GraduationCap } from "lucide-react";

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
}

export function getProductTypeInfo(type: string) {
  switch (type) {
    case "LICENSE_KEY":
      return {
        label: "Key Bản Quyền",
        shortLabel: "Key",
        icon: KeyRound,
        badgeClass:
          "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
      };
    case "ACCOUNT":
      return {
        label: "Tài Khoản",
        shortLabel: "Tài khoản",
        icon: UserCheck,
        badgeClass:
          "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
      };
    case "COURSE_LINK":
      return {
        label: "Khóa Học",
        shortLabel: "Khóa học",
        icon: GraduationCap,
        badgeClass:
          "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20",
      };
    default:
      return {
        label: "Dịch vụ số",
        shortLabel: "Dịch vụ",
        icon: KeyRound,
        badgeClass:
          "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
      };
  }
}

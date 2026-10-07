# Commit Log
f965e9e feat(locket-auto): implement admin UI and sidebar navigation

# Stat Summary
 DichVu/src/app/admin/layout.tsx              |   7 +
 DichVu/src/app/admin/locket-auto/page.tsx    |  11 +
 DichVu/src/components/admin/LocketAutoClient.tsx | 451 ++++++++++++++++++++++
 DichVu/tests/ui/admin-locket-auto-ui.test.ts  |  13 +
 4 files changed, 682 insertions(+)

# Diff
diff --git a/DichVu/src/app/admin/layout.tsx b/DichVu/src/app/admin/layout.tsx
index 455e143..cf95c73 100644
--- a/DichVu/src/app/admin/layout.tsx
+++ b/DichVu/src/app/admin/layout.tsx
@@ -17,6 +17,7 @@ import {
   LogOut,
   Ticket,
   Users,
+  Zap,
 } from "lucide-react";
 
 interface AdminLayoutProps {
@@ -90,6 +91,12 @@ export default function AdminLayout({ children }: AdminLayoutProps) {
       icon: Users,
       current: pathname.startsWith("/admin/users"),
     },
+    {
+      name: "Auto Locket Gold",
+      href: "/admin/locket-auto",
+      icon: Zap,
+      current: pathname.startsWith("/admin/locket-auto"),
+    },
   ];
 
   return (
diff --git a/DichVu/src/app/admin/locket-auto/page.tsx b/DichVu/src/app/admin/locket-auto/page.tsx
new file mode 100644
index 0000000..c20c0c6
--- /dev/null
+++ b/DichVu/src/app/admin/locket-auto/page.tsx
@@ -0,0 +1,11 @@
+import { Metadata } from "next";
+import LocketAutoClient from "@/components/admin/LocketAutoClient";
+
+export const metadata: Metadata = {
+  title: "Tự Động Kích Hoạt Locket Gold 24/7 | DigiStore Admin",
+  description: "Trang quản trị tiến trình nền tự động duy trì gói Locket GoldPass",
+};
+
+export const dynamic = "force-dynamic";
+
+export default function LocketAutoPage() {
+  return <LocketAutoClient />;
+}

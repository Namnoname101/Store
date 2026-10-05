import React from "react";
import { listAdminUsers } from "@/services/admin-users.service";
import UsersManagerClient from "@/components/admin/UsersManagerClient";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const { users, stats } = await listAdminUsers();

  return <UsersManagerClient initialUsers={users} initialStats={stats} />;
}

import React from "react";
import { getPendingReconciliations } from "@/services/admin-reconciliation.service";
import ReconciliationManagerClient from "@/components/admin/ReconciliationManagerClient";

export const dynamic = "force-dynamic";

export default async function AdminReconciliationPage() {
  const { transactions, stats } = await getPendingReconciliations();

  // Serialize dates cleanly for client component
  const serializedTransactions = transactions.map((tx) => ({
    ...tx,
    createdAt: tx.createdAt.toISOString(),
    resolvedAt: tx.resolvedAt ? tx.resolvedAt.toISOString() : null,
    order: tx.order
      ? {
          ...tx.order,
          createdAt: tx.order.createdAt.toISOString(),
          paidAt: tx.order.paidAt ? tx.order.paidAt.toISOString() : null,
          expiresAt: tx.order.expiresAt.toISOString(),
        }
      : null,
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <ReconciliationManagerClient
        initialTransactions={serializedTransactions as any}
        initialStats={stats}
      />
    </div>
  );
}

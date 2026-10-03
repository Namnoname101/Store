# Task 4: Automated Upstream Fulfillment Pipeline

**Files:**
- Create: `src/services/upstream-fulfillment.service.ts`
- Modify: `src/services/order.service.ts` (skip local reservation for `API_DROPSHIP` products)
- Modify: `src/services/payment.service.ts` (trigger upstream fulfillment upon `PAID` for dropship products)
- Test: `tests/services/upstream-fulfillment.service.test.ts`

**Interfaces:**
- Consumes:
  - `prisma`, `OrderStatus`, `ItemStatus`, `FulfillmentType`, `UpstreamStatus` from `@/lib/prisma`
  - `getSupplierAdapter` from `@/services/suppliers/adapter.registry`
- Produces:
  - `fulfillOrderViaUpstream(orderId: string): Promise<UpstreamFulfillmentResult>`
  - `retryUpstreamFulfillment(orderId: string): Promise<UpstreamFulfillmentResult>`

## Requirements:
1. `fulfillOrderViaUpstream(orderId: string)`:
   - Queries `Order` with `orderItems.product.mapping.supplier`.
   - If order is not `PAID`, throws or returns error.
   - Finds all `orderItems` whose product has `fulfillmentType === FulfillmentType.API_DROPSHIP`.
   - If no items require dropship fulfillment, updates `order.upstreamStatus = UpstreamStatus.NOT_APPLICABLE` and returns `{ success: true, status: UpstreamStatus.NOT_APPLICABLE }`.
   - Sets `order.upstreamStatus = UpstreamStatus.PENDING_UPSTREAM`.
   - For each dropship item:
     - Obtains `product.mapping` and `supplier`. If mapping is missing or supplier is inactive, marks `order.upstreamStatus = UpstreamStatus.FAILED`, `order.upstreamError = "Supplier mapping missing or inactive"`, and returns failure.
     - Resolves adapter using `getSupplierAdapter(supplier.type)`.
     - Calls `adapter.buyProduct(supplier, mapping.supplierProductCode, item.quantity)`.
     - If purchase succeeds:
       - Creates `ProductItem` records in `prisma.productItem` with:
         - `productId: item.productId`
         - `secretContent: key`
         - `status: ItemStatus.SOLD`
         - `orderId: order.id`
       - Updates `order`:
         - `upstreamStatus: UpstreamStatus.COMPLETED`
         - `upstreamOrderId: purchaseResult.upstreamOrderId || null`
         - `upstreamError: null`
     - If purchase fails:
       - Updates `order`:
         - `upstreamStatus: UpstreamStatus.FAILED`
         - `upstreamError: purchaseResult.error || "Upstream purchase failed"`
       - Returns failure result.
2. `retryUpstreamFulfillment(orderId: string)`:
   - Re-runs `fulfillOrderViaUpstream(orderId)` if order is currently `FAILED` or `PENDING_UPSTREAM`.
3. Integration with `order.service.ts`:
   - During `createOrder`, check `product.fulfillmentType`. Only call `reserveItemsForOrder` for items with `LOCAL_STOCK`. Do not attempt to reserve unseeded local stock for `API_DROPSHIP` items.
   - Expose `upstreamStatus` in `OrderDetailsResponse` returned by `getOrderDetails`.
4. Integration with `payment.service.ts`:
   - When order transitions to `PAID`:
     - Checks if order contains any `API_DROPSHIP` items.
     - If yes, calls `await fulfillOrderViaUpstream(order.id)`.
     - Catches any unexpected errors so webhook payment recording and `PAID` state are never rolled back.
5. TDD:
   - Write tests in `tests/services/upstream-fulfillment.service.test.ts` using `MockSupplierAdapter`:
     - Successful purchase: generates `ProductItem` records with `SOLD`, attaches to order, sets `upstreamStatus = COMPLETED`.
     - Failed purchase (insufficient supplier balance or out of stock): sets `upstreamStatus = FAILED` and records `upstreamError`.
     - Missing supplier mapping: fails gracefully.
     - Integration test: simulates bank webhook triggering `handleIncomingTransaction` for dropship order, verifying automatic upstream fulfillment.
     - Retry logic test: re-executes after fixing mock supplier balance.
6. Commit: `feat: implement automated upstream order fulfillment pipeline`.

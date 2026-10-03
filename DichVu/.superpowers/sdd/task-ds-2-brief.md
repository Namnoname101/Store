# Task 2: Supplier Adapter Engine (Taphoammo, Trumthe & MockSupplierAdapter)

**Files:**
- Create: `src/services/suppliers/supplier-adapter.interface.ts`
- Create: `src/services/suppliers/adapters/mock.adapter.ts`
- Create: `src/services/suppliers/adapters/taphoammo.adapter.ts`
- Create: `src/services/suppliers/adapters/trumthe.adapter.ts`
- Create: `src/services/suppliers/adapter.registry.ts`
- Test: `tests/services/suppliers/supplier-adapter.test.ts`

**Interfaces:**
- Consumes: `src/lib/prisma.ts` (`SupplierType`)
- Produces:
  - Interface `ISupplierAdapter`
  - Types `SupplierProductInfo`, `SupplierOrderResult`, `SupplierCredentials`
  - Classes `MockSupplierAdapter`, `TaphoammoAdapter`, `TrumtheAdapter`
  - Function `getSupplierAdapter(type: string): ISupplierAdapter`
  - Function `registerSupplierAdapter(type: string, adapter: ISupplierAdapter): void`

## Requirements:
1. `src/services/suppliers/supplier-adapter.interface.ts`:
   ```typescript
   export interface SupplierCredentials {
     baseUrl: string;
     apiKey: string;
     apiSecret?: string | null;
   }
   export interface SupplierProductInfo {
     supplierProductCode: string;
     name?: string;
     price: number; // Cost in VND
     inStock: number;
   }
   export interface SupplierOrderResult {
     success: boolean;
     upstreamOrderId?: string;
     deliveredKeys: string[];
     rawResponse?: any;
     error?: string;
   }
   export interface ISupplierAdapter {
     checkBalance(creds: SupplierCredentials): Promise<number>;
     fetchProductInfo(creds: SupplierCredentials, supplierProductCode: string): Promise<SupplierProductInfo>;
     buyProduct(creds: SupplierCredentials, supplierProductCode: string, quantity: number, orderCode: string): Promise<SupplierOrderResult>;
   }
   ```
2. `MockSupplierAdapter`:
   - Configurable mock balance and product inventory.
   - Handles simulated purchase returning keys array, and handles error states (`INSUFFICIENT_BALANCE`, `OUT_OF_STOCK`, `NETWORK_ERROR`).
3. `TaphoammoAdapter`:
   - Implements `ISupplierAdapter` against Taphoammo REST API structure.
   - Extracts keys cleanly, sanitizing whitespace and newline formatting.
4. `TrumtheAdapter`:
   - Implements `ISupplierAdapter` for Trumthe/SMM/Clone platforms.
5. `adapter.registry.ts`:
   - Returns appropriate adapter instance based on `SupplierType` (`TAPHOAMMO`, `TRUMTHE`, `CUSTOM_REST`).
   - Allows mocking/registering test adapters.
6. TDD:
   - Tests in `tests/services/suppliers/supplier-adapter.test.ts` testing MockAdapter happy/error paths, Taphoammo response normalization, and registry resolution.
7. Commit: `feat: implement supplier adapter pattern and registry`.

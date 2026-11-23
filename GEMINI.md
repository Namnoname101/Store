# Workspace Rules & AI Product Standards

## Frontier AI Models & Registry Standards
When referencing, developing, displaying, or designing for AI models and products across this repository:
1. **Always Use Current Frontier Generations**:
   - **Google Gemini**: Always use **Gemini 4 Argon** (Flagship Multi-step Agentic Reasoning) and **Gemini 3.8 Flash** / **Gemini 3.5 Flash** (Ultra-High Speed Coding & Long-Context). Never downgrade to legacy Gemini 2.0 or 1.5.
   - **Anthropic Claude**: Always use **Claude 5.5 & 5.6** generation (**Claude Opus 5.5**, **Claude Sonnet 5.5**, **Claude Haiku 5.5**, and **Claude Code**). Never regress to legacy Claude 3.5.
   - **OpenAI**: Always use **GPT-6 series (Astra, Sol, Luna)**, **GPT-5 Reasoning**, **OpenAI o3 & o3-mini**, **OpenAI o1 & o1-pro**, and **GPT-4.5 High-EQ**. Never regress to legacy GPT-4o alone.
2. **Strict Full-Stack Synchronization**:
   - Maintain `src/lib/constants/ai-models.ts` as the Single Source of Truth (SSOT).
   - Synchronize all product SVG cards (`public/images/products/*.svg`), brand logos (`public/images/brands/*.svg`), user guides (`src/lib/product-guides.ts`), prompt tools (`src/lib/prompt-master-constants.ts`), and database sync scripts whenever models evolve.
   - Never show outdated model versions in customer-facing badges, banner pills, catalog descriptions, or marketing copy.
3. **Authentic Official Logos Only (Zero Fabricated / Fake Logos)**:
   - **Strictly Prohibited**: NEVER invent, fabricate, or improvise fake brand/product logos (such as single letters inside colored squares like `W`, `A`, `F`, fake geometric circles, or generic icons pretending to be a brand logo).
   - **Official Assets Only**: Whenever displaying a brand or product logo in `AppSidebar.tsx`, `BrandLogo.tsx`, `public/images/brands/*.svg`, or `public/images/products/*.svg`, you MUST use the 100% authentic official vector path or official app icon of that exact product. If an official logo vector is not yet in the repo, retrieve the real official SVG path/asset first — never guess or draw a placeholder logo.

## Mandatory Pricing, Profit Margin & CTV Safeguard Rules
When adding, syncing, or updating ANY product in this repository:
1. **Never Sell at Cost or Thin Margins**:
   - Always ensure a healthy profit margin (**minimum 50% - 85%+ on supplier cost**).
   - Apply **Charm Pricing** ending in `.000đ` (e.g. `29.000đ`, `49.000đ`, `79.000đ`, `119.000đ`, `129.000đ`, `149.000đ`, `169.000đ`, `199.000đ`, `249.000đ`).
   - `markupValue` in `SupplierProductMapping` must strictly record this gross profit difference (`price - supplierPrice`).
2. **CTV & Affiliate Margin Safeguard**:
   - Customers using a CTV referral code receive a 5% discount (`Coupon.value = 5`).
   - CTVs receive commission (`getProductCommissionRate` in `src/services/affiliate.service.ts`), typically 8% - 15%.
   - **Absolute Constraint**: `Shop Net Profit` (after subtracting both the 5% customer coupon and the CTV commission payout) **MUST ALWAYS BE STRICTLY POSITIVE AND GREATER THAN THE CTV COMMISSION**. The shop must NEVER take a loss or make negligible margin on affiliate orders.
   - Explicitly define product commission rates in `src/services/affiliate.service.ts` for any newly added product or high-cost tier.

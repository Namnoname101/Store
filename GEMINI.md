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

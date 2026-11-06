// Global test setup for Vitest
// Ensures tests NEVER send real Telegram notifications or call external supplier bots

process.env.NODE_ENV = "test";
process.env.VITEST = "true";

// Clear Telegram credentials from test environment to guarantee isolation
delete process.env.TELEGRAM_ADMIN_CHAT_ID;
delete process.env.TELEGRAM_CHAT_ID;
delete process.env.TELEGRAM_ASSISTANT_BOT_TOKEN;
delete process.env.TELEGRAM_BOT_TOKEN;
delete process.env.TELEGRAM_USER_SESSION;

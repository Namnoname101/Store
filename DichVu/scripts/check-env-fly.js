// Check env vars on Fly
console.log("CRON_SECRET:", process.env.CRON_SECRET ? `SET (len=${process.env.CRON_SECRET.length})` : "NOT SET");
console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL || "NOT SET");
console.log("APP_URL:", process.env.APP_URL || "NOT SET");
process.exit(0);

declare namespace Cloudflare {
  interface Env {
    TELEGRAM_BOT_TOKEN?: string;
    TELEGRAM_BOT_USERNAME?: string;
    TELEGRAM_WEBHOOK_SECRET?: string;
    TELEGRAM_ADMIN_CHAT_ID?: string;
    SUPPORT_AI_API_KEY?: string;
    SUPPORT_AI_MODEL?: string;
    DB?: D1Database;
    WEBHOOK_ENCRYPTION_KEY?: string;
    APP_URL?: string;
    BUCKET?: R2Bucket;
  }
}

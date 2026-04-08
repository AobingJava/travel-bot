import "server-only";

function readEnv(name: string) {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

export const appEnv = {
  appUrl: readEnv("APP_URL") ?? "http://localhost:3000",
  authSecret: readEnv("AUTH_SECRET") ?? "dev-only-auth-secret-change-me",
  cronSecret: readEnv("CRON_SECRET") ?? "dev-only-cron-secret",
  llmBaseUrl: readEnv("LLM_BASE_URL"),
  llmApiKey: readEnv("LLM_API_KEY"),
  llmModel: readEnv("LLM_MODEL") ?? "glm-4.5-air",
  smtpHost: readEnv("SMTP_HOST"),
  smtpPort: readEnv("SMTP_PORT"),
  smtpUser: readEnv("SMTP_USER"),
  smtpPass: readEnv("SMTP_PASS"),
  smtpFrom: readEnv("SMTP_FROM") ?? "Wander <no-reply@example.com>",
  d1AccountId: readEnv("CLOUDFLARE_ACCOUNT_ID"),
  d1DatabaseId: readEnv("CLOUDFLARE_D1_DATABASE_ID"),
  d1ApiToken: readEnv("CLOUDFLARE_D1_API_TOKEN"),
  d1ProxyUrl: readEnv("D1_PROXY_URL"),
  d1ProxyToken: readEnv("D1_PROXY_TOKEN"),
};

export function hasLlmConfig() {
  return Boolean(appEnv.llmBaseUrl && appEnv.llmApiKey && appEnv.llmModel);
}

export function hasDirectD1Config() {
  return Boolean(
    appEnv.d1AccountId && appEnv.d1DatabaseId && appEnv.d1ApiToken,
  );
}

export function hasD1ProxyConfig() {
  return Boolean(appEnv.d1ProxyUrl);
}

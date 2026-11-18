export function aiConfigured() {
  return !!(
    process.env.LLAMA_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim() || process.env.SUPPORT_AI_API_KEY?.trim()
  );
}

export function webAiConfigured() {
  return Boolean(process.env.FLOWKEY_WEB_META_API_KEY?.trim()) || aiConfigured();
}

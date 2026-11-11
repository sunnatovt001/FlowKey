export function aiConfigured() {
  return !!(
    process.env.GEMINI_API_KEY?.trim() || process.env.SUPPORT_AI_API_KEY?.trim()
  );
}

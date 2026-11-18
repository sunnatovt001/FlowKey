export function aiConfigured() {
  return !!(
    process.env.LLAMA_API_KEY?.trim() || process.env.GEMINI_API_KEY?.trim() || process.env.SUPPORT_AI_API_KEY?.trim()
  );
}

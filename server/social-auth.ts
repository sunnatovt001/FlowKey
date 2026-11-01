export function socialAuthConfiguration(
  env: Record<string, string | undefined> = process.env,
) {
  const googleId = env.GOOGLE_CLIENT_ID?.trim();
  const googleSecret = env.GOOGLE_CLIENT_SECRET?.trim();
  const githubId = env.GITHUB_CLIENT_ID?.trim();
  const githubSecret = env.GITHUB_CLIENT_SECRET?.trim();
  return {
    google:
      googleId && googleSecret
        ? {
            clientId: googleId,
            clientSecret: googleSecret,
            prompt: "select_account" as const,
          }
        : undefined,
    github:
      githubId && githubSecret
        ? { clientId: githubId, clientSecret: githubSecret }
        : undefined,
  };
}

export function socialAuthAvailability() {
  const providers = socialAuthConfiguration();
  return { google: !!providers.google, github: !!providers.github };
}

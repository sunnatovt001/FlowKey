export const roleAllows = (
  role: string,
  scope: "read" | "technical" | "finance" | "owner",
) =>
  role === "owner" ||
  (scope === "read" && ["developer", "accountant"].includes(role)) ||
  (scope === "technical" && role === "developer") ||
  (scope === "finance" && role === "accountant");

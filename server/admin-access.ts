export function isPlatformAdmin(
  userId: string,
  configured = process.env.FLOWKEY_ADMIN_USER_IDS,
): boolean {
  return (
    !!userId &&
    (configured || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .includes(userId)
  );
}
export const ticketStates = {
  open: "Yangi",
  in_progress: "Ko‘rib chiqilmoqda",
  resolved: "Hal qilindi",
} as const;
export type TicketState = keyof typeof ticketStates;

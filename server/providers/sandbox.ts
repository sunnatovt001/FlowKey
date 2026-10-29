export type PaymentStatus = "successful" | "failed" | "pending";
export interface PaymentProvider {
  readonly name: "sandbox";
  createPayment(input: {
    id: string;
    amountMinor: bigint;
    currency: "UZS";
    outcome: PaymentStatus;
  }): Promise<{ reference: string; status: PaymentStatus }>;
  retrievePayment(
    reference: string,
  ): Promise<{ reference: string; status: PaymentStatus }>;
}
export const sandboxProvider: PaymentProvider = {
  name: "sandbox",
  async createPayment(input) {
    return {
      reference: `sandbox_${input.outcome}_${input.id}`,
      status: input.outcome,
    };
  },
  async retrievePayment(reference) {
    const status = reference.split("_")[1];
    if (!["successful", "failed", "pending"].includes(status))
      throw new Error("Noma’lum sinov identifikatori");
    return { reference, status: status as PaymentStatus };
  },
};

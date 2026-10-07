import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LoanTerms } from "./loan";
import { uid } from "./utils";

export type LoanPayment = {
  id: string;
  date: string;
  amount: number;
  note?: string;
};

export type Loan = LoanTerms & {
  id: string;
  name: string;
  /** Ngân hàng / người cho vay. */
  lender?: string;
  payments: LoanPayment[];
  createdAt: string;
};

export type LoanInput = Omit<Loan, "id" | "payments" | "createdAt">;

type LoanState = {
  loans: Loan[];
  addLoan: (input: LoanInput, today: string) => string;
  updateLoan: (id: string, patch: Partial<LoanInput>) => void;
  removeLoan: (id: string) => void;
  addPayment: (loanId: string, p: Omit<LoanPayment, "id">) => void;
  removePayment: (loanId: string, paymentId: string) => void;
};

export const useLoans = create<LoanState>()(
  persist(
    (set) => ({
      loans: [],
      addLoan: (input, today) => {
        const id = uid();
        set((s) => ({ loans: [...s.loans, { ...input, id, payments: [], createdAt: today }] }));
        return id;
      },
      updateLoan: (id, patch) =>
        set((s) => ({ loans: s.loans.map((l) => (l.id === id ? { ...l, ...patch } : l)) })),
      removeLoan: (id) => set((s) => ({ loans: s.loans.filter((l) => l.id !== id) })),
      addPayment: (loanId, p) =>
        set((s) => ({
          loans: s.loans.map((l) =>
            l.id === loanId
              ? {
                  ...l,
                  payments: [...l.payments, { ...p, id: uid() }].sort((a, b) =>
                    a.date.localeCompare(b.date),
                  ),
                }
              : l,
          ),
        })),
      removePayment: (loanId, paymentId) =>
        set((s) => ({
          loans: s.loans.map((l) =>
            l.id === loanId ? { ...l, payments: l.payments.filter((p) => p.id !== paymentId) } : l,
          ),
        })),
    }),
    { name: "mon-avenir-loans-v1" },
  ),
);

export function totalPaidOf(loan: Loan): number {
  return loan.payments.reduce((s, p) => s + p.amount, 0);
}

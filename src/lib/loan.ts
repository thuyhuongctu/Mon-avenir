import { splitISO } from "./time";

/**
 * Cách tính lãi:
 * - annuity  — trả góp đều (niên kim): mỗi kỳ trả cùng một số tiền, lãi tính trên dư nợ giảm dần.
 * - declining — gốc chia đều, lãi tính trên dư nợ giảm dần (số tiền mỗi kỳ giảm dần).
 * - flat     — lãi phẳng: lãi tính trên số tiền vay ban đầu, gốc chia đều.
 */
export type LoanMethod = "annuity" | "declining" | "flat";

export const METHOD_LABEL: Record<LoanMethod, string> = {
  annuity: "Trả góp đều",
  declining: "Dư nợ giảm dần",
  flat: "Lãi phẳng",
};

export const METHOD_HINT: Record<LoanMethod, string> = {
  annuity: "Mỗi kỳ trả cùng một số tiền (gốc + lãi), lãi trên dư nợ còn lại.",
  declining: "Gốc chia đều mỗi kỳ, lãi trên dư nợ còn lại — kỳ đầu trả nhiều nhất.",
  flat: "Lãi tính trên số tiền vay ban đầu suốt kỳ hạn — tổng lãi cao hơn.",
};

export type LoanTerms = {
  principal: number;
  /** Lãi suất năm (%). */
  annualRate: number;
  /** Số kỳ (tháng). */
  months: number;
  method: LoanMethod;
  /** Số tháng ân hạn gốc (chỉ trả lãi). */
  graceMonths: number;
  /** Ngày giải ngân (YYYY-MM-DD); kỳ 1 đến hạn sau đó một tháng. */
  startDate: string;
};

export type Installment = {
  n: number;
  due: string;
  principal: number;
  interest: number;
  payment: number;
  /** Dư nợ gốc sau kỳ này. */
  balance: number;
};

export type Schedule = {
  rows: Installment[];
  totalInterest: number;
  totalPayment: number;
};

/** Cộng `n` tháng, giữ ngày trong tháng (31/1 + 1 tháng → 28 hoặc 29/2). */
export function addMonthsISO(iso: string, n: number): string {
  const { y, m, d } = splitISO(iso);
  const idx = m - 1 + n;
  const yy = y + Math.floor(idx / 12);
  const mm = ((idx % 12) + 12) % 12;
  const last = new Date(Date.UTC(yy, mm + 1, 0)).getUTCDate();
  return `${yy}-${String(mm + 1).padStart(2, "0")}-${String(Math.min(d, last)).padStart(2, "0")}`;
}

/** Số tiền trả mỗi kỳ theo niên kim. */
export function annuityPayment(principal: number, monthlyRate: number, n: number): number {
  if (n <= 0) return 0;
  if (monthlyRate === 0) return principal / n;
  return (principal * monthlyRate) / (1 - (1 + monthlyRate) ** -n);
}

/** Lịch trả nợ, làm tròn đến đồng; kỳ cuối điều chỉnh để dư nợ về 0. */
export function buildSchedule(t: LoanTerms): Schedule {
  const n = Math.max(0, Math.floor(t.months));
  const grace = Math.min(Math.max(0, Math.floor(t.graceMonths)), Math.max(0, n - 1));
  const r = Math.max(0, t.annualRate) / 100 / 12;
  const rows: Installment[] = [];
  let balance = Math.max(0, Math.round(t.principal));
  const amortN = n - grace;
  const level = Math.round(annuityPayment(balance, r, amortN));
  const evenPrincipal = amortN > 0 ? balance / amortN : 0;
  const flatInterest = Math.round(balance * r);

  for (let k = 1; k <= n; k++) {
    const interest = t.method === "flat" ? flatInterest : Math.round(balance * r);
    let principal = 0;
    if (k > grace) {
      if (k === n) principal = balance;
      else if (t.method === "annuity") principal = Math.min(balance, level - interest);
      else principal = Math.min(balance, Math.round(evenPrincipal));
    }
    balance -= principal;
    rows.push({
      n: k,
      due: addMonthsISO(t.startDate, k),
      principal,
      interest,
      payment: principal + interest,
      balance,
    });
  }

  const totalInterest = rows.reduce((s, x) => s + x.interest, 0);
  return { rows, totalInterest, totalPayment: totalInterest + Math.round(t.principal) };
}

export type RowStatus = "paid" | "partial" | "overdue" | "due" | "upcoming";

export type Progress = {
  totalPaid: number;
  /** Số kỳ đã trả đủ. */
  paidCount: number;
  /** Số tiền đã trả vào kỳ kế tiếp (chưa đủ). */
  carry: number;
  status: RowStatus[];
  /** Kỳ cần trả tiếp theo (chưa trả đủ), nếu còn. */
  next?: Installment;
  /** Số còn phải trả cho kỳ kế tiếp. */
  nextOwed: number;
  overdueCount: number;
  overdueAmount: number;
  /** Dư nợ gốc sau các kỳ đã trả đủ. */
  outstanding: number;
  /** Tổng còn phải trả theo lịch (gốc + lãi). */
  remaining: number;
};

/** Phân bổ tổng số đã trả lần lượt vào các kỳ theo lịch. */
export function progressOf(schedule: Schedule, principal: number, totalPaid: number, today: string): Progress {
  const status: RowStatus[] = [];
  let left = totalPaid;
  let paidCount = 0;
  let carry = 0;
  let overdueCount = 0;
  let overdueAmount = 0;
  const soon = addMonthsISO(today, 1);

  for (const row of schedule.rows) {
    if (left >= row.payment) {
      left -= row.payment;
      paidCount++;
      status.push("paid");
      continue;
    }
    const part = left;
    left = 0;
    if (part > 0) carry = part;
    if (row.due < today) {
      overdueCount++;
      overdueAmount += row.payment - part;
      status.push("overdue");
    } else if (part > 0) status.push("partial");
    else status.push(row.due <= soon && !status.includes("due") ? "due" : "upcoming");
  }

  const next = schedule.rows[paidCount];
  const outstanding = paidCount > 0 ? schedule.rows[paidCount - 1].balance : Math.round(principal);
  return {
    totalPaid,
    paidCount,
    carry,
    status,
    next,
    nextOwed: next ? next.payment - carry : 0,
    overdueCount,
    overdueAmount,
    outstanding,
    remaining: Math.max(0, schedule.totalPayment - totalPaid),
  };
}

export type PrepayResult = {
  /** Tổng phải trả để tất toán ngay (dư nợ + phí). */
  fee: number;
  newMonths: number;
  newPayment: number;
  oldInterest: number;
  newInterest: number;
  saved: number;
};

/**
 * Mô phỏng trả trước một phần gốc sau kỳ `afterPeriod`, áp dụng cho phần còn lại của lịch.
 * mode "term": giữ số tiền mỗi kỳ, rút ngắn kỳ hạn; "payment": giữ kỳ hạn, giảm tiền mỗi kỳ.
 */
export function simulatePrepay(
  t: LoanTerms,
  schedule: Schedule,
  afterPeriod: number,
  amount: number,
  feePct: number,
  mode: "term" | "payment",
): PrepayResult | null {
  const done = schedule.rows.slice(0, afterPeriod);
  const balance = afterPeriod > 0 ? schedule.rows[afterPeriod - 1].balance : Math.round(t.principal);
  const restMonths = t.months - afterPeriod;
  if (restMonths <= 0 || balance <= 0) return null;
  const pay = Math.min(Math.max(0, Math.round(amount)), balance);
  const fee = Math.round((pay * Math.max(0, feePct)) / 100);
  const oldInterest = schedule.rows.slice(afterPeriod).reduce((s, x) => s + x.interest, 0);
  const newBalance = balance - pay;
  const graceLeft = Math.max(0, t.graceMonths - afterPeriod);
  const startDate = done.length ? done[done.length - 1].due : t.startDate;

  if (newBalance <= 0) {
    return { fee, newMonths: 0, newPayment: 0, oldInterest, newInterest: 0, saved: oldInterest - fee };
  }

  let months = restMonths;
  if (mode === "term") {
    // Tìm số kỳ ngắn nhất sao cho kỳ trả đều không vượt mức cũ.
    const r = t.annualRate / 100 / 12;
    const oldRow = schedule.rows[afterPeriod];
    const target = oldRow ? oldRow.payment : 0;
    if (t.method === "annuity") {
      for (let m = graceLeft + 1; m <= restMonths; m++) {
        if (annuityPayment(newBalance, r, m - graceLeft) <= target + 0.5) {
          months = m;
          break;
        }
      }
    } else {
      const perPrincipal = (balance / Math.max(1, restMonths - graceLeft));
      months = Math.min(restMonths, graceLeft + Math.ceil(newBalance / perPrincipal - 1e-9));
    }
  }

  const sim = buildSchedule({
    ...t,
    principal: newBalance,
    months,
    graceMonths: graceLeft,
    startDate,
  });
  const firstAmort = sim.rows[graceLeft] ?? sim.rows[0];
  return {
    fee,
    newMonths: months,
    newPayment: firstAmort?.payment ?? 0,
    oldInterest,
    newInterest: sim.totalInterest,
    saved: oldInterest - sim.totalInterest - fee,
  };
}

const VND = new Intl.NumberFormat("vi-VN");

export function formatVND(n: number): string {
  return `${VND.format(Math.round(n))} đ`;
}

/** Rút gọn: 1,2 tỷ · 350 tr · 12,5 ng. */
export function shortVND(n: number): string {
  const a = Math.abs(n);
  const f = (x: number) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(x);
  if (a >= 1e9) return `${f(n / 1e9)} tỷ`;
  if (a >= 1e6) return `${f(n / 1e6)} tr`;
  if (a >= 1e3) return `${f(n / 1e3)} ng`;
  return VND.format(Math.round(n));
}

export function parseMoney(s: string): number {
  const digits = s.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

export function shortDate(iso: string): string {
  const { y, m, d } = splitISO(iso);
  return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
}

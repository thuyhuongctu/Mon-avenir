import { useMemo, useState, type ReactNode } from "react";
import {
  Banknote,
  Calculator,
  ChevronDown,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/mascot";
import {
  buildSchedule,
  formatVND,
  METHOD_HINT,
  METHOD_LABEL,
  parseMoney,
  progressOf,
  shortDate,
  shortVND,
  simulatePrepay,
  type LoanMethod,
  type Progress,
  type RowStatus,
  type Schedule,
} from "@/lib/loan";
import { totalPaidOf, useLoans, type Loan, type LoanInput } from "@/lib/loan-store";
import { dateKey } from "@/lib/time";
import { cn } from "@/lib/utils";

const field =
  "h-10 w-full min-w-0 rounded-clay-xs bg-clay-inset px-3 text-sm text-ink shadow-clay-inset outline-none";
const label = "text-[11px] font-medium uppercase tracking-wider text-subtle";

type Computed = { loan: Loan; schedule: Schedule; progress: Progress };

export function LoansPanel({ now }: { now: Date }) {
  const today = dateKey(now);
  const loans = useLoans((s) => s.loans);
  const [editing, setEditing] = useState<Loan | "new" | null>(null);

  const computed: Computed[] = useMemo(
    () =>
      loans.map((loan) => {
        const schedule = buildSchedule(loan);
        return { loan, schedule, progress: progressOf(schedule, loan.principal, totalPaidOf(loan), today) };
      }),
    [loans, today],
  );

  const outstanding = computed.reduce((s, c) => s + c.progress.outstanding, 0);
  const overdue = computed.reduce((s, c) => s + c.progress.overdueAmount, 0);
  const upcoming = computed
    .filter((c) => c.progress.next)
    .sort((a, b) => a.progress.next!.due.localeCompare(b.progress.next!.due))[0];
  const active = computed.filter((c) => c.progress.next).length;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 pb-28 pt-4 sm:px-6">
      <header className="relative overflow-hidden rounded-clay bg-clay-surface p-5 pr-28 shadow-clay sm:pr-36">
        <Mascot
          name="rong-suy-nghi"
          float={false}
          className="absolute right-3 top-3 w-24 sm:right-6 sm:w-28"
        />
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-subtle">Tài chính cá nhân</p>
        <h1 className="mt-1 font-display text-[1.75rem] leading-tight tracking-tight text-ink">Nợ vay</h1>
        <p className="mt-2 text-sm text-muted">
          {loans.length
            ? `${active} khoản đang trả · dư nợ gốc ${shortVND(outstanding)}`
            : "Tính lịch trả nợ và theo dõi các lần trả."}
        </p>
      </header>

      {loans.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Stat label="Dư nợ gốc" value={shortVND(outstanding)} />
          <Stat
            label="Kỳ tới"
            value={upcoming ? shortVND(upcoming.progress.nextOwed) : "—"}
            hint={upcoming ? `${shortDate(upcoming.progress.next!.due)} · ${upcoming.loan.name}` : "Đã trả hết"}
          />
          <Stat
            label="Quá hạn"
            value={overdue ? shortVND(overdue) : "0"}
            hint={overdue ? "Cần trả ngay" : "Không có"}
            alert={overdue > 0}
          />
        </div>
      )}

      {editing ? (
        <LoanForm
          initial={editing === "new" ? undefined : editing}
          today={today}
          onClose={() => setEditing(null)}
        />
      ) : (
        <Button onClick={() => setEditing("new")} className="self-start">
          <Plus className="size-4" />
          Thêm khoản vay / tính thử
        </Button>
      )}

      {!loans.length && !editing && (
        <div className="flex flex-col items-center gap-2 rounded-clay bg-clay-surface p-6 text-center shadow-clay-sm">
          <Mascot name="rong-hoc-gia" className="w-28" />
          <p className="text-sm text-muted">
            Chưa có khoản vay nào. Nhập số tiền, lãi suất và kỳ hạn để xem ngay lịch trả nợ —
            lưu lại nếu muốn theo dõi các lần trả.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {computed.map((c) => (
          <LoanCard key={c.loan.id} {...c} today={today} onEdit={() => setEditing(c.loan)} />
        ))}
      </div>

      <p className="px-1 text-[11px] leading-relaxed text-subtle">
        Lãi tính theo tháng (lãi suất năm ÷ 12), làm tròn đến đồng. Ngân hàng có thể tính theo số ngày thực tế
        hoặc thả nổi lãi suất sau thời gian ưu đãi nên số liệu có thể lệch đôi chút — dùng để tham khảo.
        Dữ liệu chỉ lưu trên máy này.
      </p>
    </div>
  );
}

function Stat({ label: l, value, hint, alert }: { label: string; value: string; hint?: string; alert?: boolean }) {
  return (
    <div className="rounded-clay bg-clay-surface px-3 py-3 shadow-clay-sm">
      <p className={label}>{l}</p>
      <p className={cn("mt-1 font-display text-2xl tabular-nums leading-none", alert ? "text-danger" : "text-ink")}>
        {value}
      </p>
      {hint && <p className="mt-1 truncate text-[11px] text-subtle">{hint}</p>}
    </div>
  );
}

function MoneyInput({
  value,
  onChange,
  id,
  placeholder,
}: {
  value: number;
  onChange: (n: number) => void;
  id?: string;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        inputMode="numeric"
        className={cn(field, "pr-8 tabular-nums")}
        value={value ? new Intl.NumberFormat("vi-VN").format(value) : ""}
        placeholder={placeholder ?? "0"}
        onChange={(e) => onChange(parseMoney(e.target.value))}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-subtle">đ</span>
    </div>
  );
}

const METHODS: LoanMethod[] = ["annuity", "declining", "flat"];

function LoanForm({ initial, today, onClose }: { initial?: Loan; today: string; onClose: () => void }) {
  const addLoan = useLoans((s) => s.addLoan);
  const updateLoan = useLoans((s) => s.updateLoan);
  const [f, setF] = useState<LoanInput>(
    initial
      ? {
          name: initial.name,
          lender: initial.lender,
          principal: initial.principal,
          annualRate: initial.annualRate,
          months: initial.months,
          method: initial.method,
          graceMonths: initial.graceMonths,
          startDate: initial.startDate,
        }
      : {
          name: "",
          lender: "",
          principal: 500_000_000,
          annualRate: 9,
          months: 120,
          method: "annuity",
          graceMonths: 0,
          startDate: today,
        },
  );
  const [rateText, setRateText] = useState(String(f.annualRate).replace(".", ","));
  const set = <K extends keyof LoanInput>(k: K, v: LoanInput[K]) => setF((x) => ({ ...x, [k]: v }));

  const valid = f.principal > 0 && f.months > 0 && f.annualRate >= 0 && !!f.startDate;
  const schedule = useMemo(() => (valid ? buildSchedule(f) : null), [f, valid]);
  const first = schedule?.rows[Math.min(f.graceMonths, f.months - 1)];
  const last = schedule?.rows[schedule.rows.length - 1];

  function save() {
    if (!valid) return;
    const data = { ...f, name: f.name.trim() || "Khoản vay", lender: f.lender?.trim() || undefined };
    if (initial) updateLoan(initial.id, data);
    else addLoan(data, today);
    onClose();
  }

  return (
    <section className="flex flex-col gap-4 rounded-clay bg-clay-surface p-4 shadow-clay sm:p-5">
      <div className="flex items-center gap-2">
        <Calculator className="size-4 text-accent" />
        <h2 className="font-display text-lg tracking-tight">{initial ? "Sửa khoản vay" : "Tính khoản vay"}</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tên khoản vay">
          <input
            className={field}
            value={f.name}
            placeholder="Vay mua nhà, vay mua xe…"
            onChange={(e) => set("name", e.target.value)}
          />
        </Field>
        <Field label="Ngân hàng / người cho vay">
          <input
            className={field}
            value={f.lender ?? ""}
            placeholder="Không bắt buộc"
            onChange={(e) => set("lender", e.target.value)}
          />
        </Field>
        <Field label="Số tiền vay">
          <MoneyInput value={f.principal} onChange={(v) => set("principal", v)} />
        </Field>
        <Field label="Lãi suất (%/năm)">
          <input
            inputMode="decimal"
            className={cn(field, "tabular-nums")}
            value={rateText}
            onChange={(e) => {
              setRateText(e.target.value);
              const n = Number(e.target.value.replace(",", "."));
              if (Number.isFinite(n)) set("annualRate", n);
            }}
          />
        </Field>
        <Field label="Kỳ hạn (tháng)" hint={f.months >= 12 ? `≈ ${+(f.months / 12).toFixed(1)} năm` : undefined}>
          <input
            type="number"
            min={1}
            max={600}
            className={cn(field, "tabular-nums")}
            value={f.months || ""}
            onChange={(e) => set("months", Math.min(600, Math.max(0, Math.floor(Number(e.target.value)))))}
          />
        </Field>
        <Field label="Ân hạn gốc (tháng)" hint="Chỉ trả lãi trong thời gian này">
          <input
            type="number"
            min={0}
            className={cn(field, "tabular-nums")}
            value={f.graceMonths || ""}
            placeholder="0"
            onChange={(e) => set("graceMonths", Math.max(0, Math.floor(Number(e.target.value))))}
          />
        </Field>
        <Field label="Ngày giải ngân" hint="Kỳ 1 đến hạn sau 1 tháng">
          <input type="date" className={field} value={f.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </Field>
      </div>

      <div className="flex flex-col gap-2">
        <span className={label}>Cách tính lãi</span>
        <div className="flex flex-wrap gap-2">
          {METHODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => set("method", m)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150",
                f.method === m ? "bg-ink text-paper shadow-clay-sm" : "bg-paper-2 text-muted hover:text-ink",
              )}
            >
              {METHOD_LABEL[m]}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted">{METHOD_HINT[f.method]}</p>
      </div>

      {schedule && first && last && (
        <div className="grid grid-cols-2 gap-2 rounded-clay-sm bg-clay-inset p-3 shadow-clay-inset sm:grid-cols-4">
          <Result
            label={f.method === "annuity" ? "Mỗi kỳ" : "Kỳ đầu (sau ân hạn)"}
            value={formatVND(first.payment)}
            sub={f.method !== "annuity" ? `kỳ cuối ${formatVND(last.payment)}` : undefined}
          />
          <Result label="Tổng lãi" value={formatVND(schedule.totalInterest)} />
          <Result label="Tổng phải trả" value={formatVND(schedule.totalPayment)} />
          <Result label="Kỳ cuối" value={shortDate(last.due)} />
        </div>
      )}

      {schedule && <ScheduleTable schedule={schedule} />}

      <div className="flex flex-wrap gap-2">
        <Button onClick={save} disabled={!valid}>
          {initial ? "Lưu thay đổi" : "Lưu để theo dõi"}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          {initial ? "Hủy" : "Đóng"}
        </Button>
      </div>
    </section>
  );
}

function Field({ label: l, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className={label}>{l}</span>
      {children}
      {hint && <span className="text-[11px] text-subtle">{hint}</span>}
    </label>
  );
}

function Result({ label: l, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0">
      <p className={label}>{l}</p>
      <p className="mt-0.5 truncate font-display text-base tabular-nums text-ink">{value}</p>
      {sub && <p className="truncate text-[11px] text-subtle">{sub}</p>}
    </div>
  );
}

const STATUS: Record<RowStatus, { text: string; tone: "done" | "warn" | "live" | "accent" | "muted" }> = {
  paid: { text: "Đã trả", tone: "done" },
  partial: { text: "Trả một phần", tone: "warn" },
  overdue: { text: "Quá hạn", tone: "live" },
  due: { text: "Sắp đến hạn", tone: "accent" },
  upcoming: { text: "", tone: "muted" },
};

function ScheduleTable({ schedule, progress }: { schedule: Schedule; progress?: Progress }) {
  const [open, setOpen] = useState(false);
  const [all, setAll] = useState(false);
  const rows = schedule.rows;
  const start = progress ? Math.max(0, progress.paidCount - 2) : 0;
  const shown = all ? rows : rows.slice(start, start + 12);

  return (
    <div className="rounded-clay-sm bg-paper-2/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-medium"
      >
        Lịch trả nợ ({rows.length} kỳ)
        <ChevronDown className={cn("size-4 text-subtle transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-2 pb-2">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-right text-xs tabular-nums">
              <thead className="text-[10px] uppercase tracking-wider text-subtle">
                <tr>
                  <th className="px-2 py-1.5 text-left font-medium">Kỳ</th>
                  <th className="px-2 py-1.5 text-left font-medium">Ngày</th>
                  <th className="px-2 py-1.5 font-medium">Gốc</th>
                  <th className="px-2 py-1.5 font-medium">Lãi</th>
                  <th className="px-2 py-1.5 font-medium">Phải trả</th>
                  <th className="px-2 py-1.5 font-medium">Dư nợ</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => {
                  const st = progress?.status[r.n - 1];
                  return (
                    <tr
                      key={r.n}
                      className={cn(
                        "border-t border-black/5",
                        st === "paid" && "text-subtle",
                        st === "overdue" && "text-live",
                      )}
                    >
                      <td className="px-2 py-1.5 text-left">{r.n}</td>
                      <td className="px-2 py-1.5 text-left">
                        {shortDate(r.due)}
                        {st && STATUS[st].text && (
                          <Badge tone={STATUS[st].tone} className="ml-1.5">
                            {STATUS[st].text}
                          </Badge>
                        )}
                      </td>
                      <td className="px-2 py-1.5">{shortVND(r.principal)}</td>
                      <td className="px-2 py-1.5">{shortVND(r.interest)}</td>
                      <td className="px-2 py-1.5 font-medium text-ink">{formatVND(r.payment)}</td>
                      <td className="px-2 py-1.5">{shortVND(r.balance)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {rows.length > 12 && (
            <button
              type="button"
              onClick={() => setAll((v) => !v)}
              className="mt-1 w-full rounded-clay-xs py-1.5 text-xs font-medium text-accent hover:bg-paper-2"
            >
              {all ? "Thu gọn" : `Xem cả ${rows.length} kỳ`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function LoanCard({
  loan,
  schedule,
  progress,
  today,
  onEdit,
}: Computed & { today: string; onEdit: () => void }) {
  const addPayment = useLoans((s) => s.addPayment);
  const removePayment = useLoans((s) => s.removePayment);
  const removeLoan = useLoans((s) => s.removeLoan);
  const [open, setOpen] = useState(false);
  const [payForm, setPayForm] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payDate, setPayDate] = useState(today);
  const [payNote, setPayNote] = useState("");

  const principalPaid = loan.principal - progress.outstanding;
  const pct = loan.principal > 0 ? Math.round((principalPaid / loan.principal) * 100) : 0;
  const done = !progress.next;
  const next = progress.next;

  function payNext() {
    if (!next) return;
    addPayment(loan.id, { date: today, amount: progress.nextOwed, note: `Kỳ ${next.n}` });
  }

  function savePayment() {
    if (payAmount <= 0) return;
    addPayment(loan.id, { date: payDate, amount: payAmount, note: payNote.trim() || undefined });
    setPayForm(false);
    setPayAmount(0);
    setPayNote("");
  }

  return (
    <article className="rounded-clay bg-clay-surface shadow-clay-sm">
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-start gap-3 p-4 text-left">
        <span
          className={cn(
            "mt-1 flex size-9 shrink-0 items-center justify-center rounded-clay-xs",
            progress.overdueCount ? "bg-live-soft text-live" : "bg-accent-soft text-accent",
          )}
        >
          <Banknote className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="muted">{METHOD_LABEL[loan.method]}</Badge>
            <Badge tone="muted">{String(loan.annualRate).replace(".", ",")}%/năm</Badge>
            {done && <Badge tone="done">Đã tất toán</Badge>}
            {progress.overdueCount > 0 && (
              <Badge tone="live">
                <TriangleAlert className="size-3" />
                {progress.overdueCount} kỳ quá hạn
              </Badge>
            )}
          </div>
          <h2 className="mt-0.5 font-display text-lg leading-snug tracking-tight">{loan.name}</h2>
          <p className="mt-0.5 text-xs text-subtle">
            {loan.lender ? `${loan.lender} · ` : ""}
            {formatVND(loan.principal)} · {loan.months} tháng
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper-2 shadow-clay-inset">
            <div className="h-full rounded-full bg-clay-accent" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-subtle">
            Đã trả gốc {pct}% · còn {shortVND(progress.outstanding)} · {progress.paidCount}/{schedule.rows.length} kỳ
          </p>
        </div>
        <ChevronDown className={cn("mt-2 size-4 shrink-0 text-subtle transition-transform", open && "rotate-180")} />
      </button>

      {next && (
        <div className="mx-4 mb-4 flex flex-wrap items-center justify-between gap-2 rounded-clay-sm bg-clay-inset px-3 py-2.5 shadow-clay-inset">
          <div className="min-w-0">
            <p className={label}>
              Kỳ {next.n} · {shortDate(next.due)}
              {next.due < today && <span className="text-live"> · quá hạn</span>}
            </p>
            <p className="font-display text-lg tabular-nums text-ink">{formatVND(progress.nextOwed)}</p>
            {progress.carry > 0 && (
              <p className="text-[11px] text-subtle">đã trả trước {formatVND(progress.carry)} cho kỳ này</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={payNext}>
              Đã trả kỳ này
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setPayForm((v) => !v)}>
              Số khác
            </Button>
          </div>
        </div>
      )}

      {payForm && (
        <div className="mx-4 mb-4 grid gap-2 rounded-clay-sm bg-paper-2/60 p-3 sm:grid-cols-[1fr_1fr_1.4fr_auto] sm:items-end">
          <Field label="Số tiền">
            <MoneyInput value={payAmount} onChange={setPayAmount} />
          </Field>
          <Field label="Ngày trả">
            <input type="date" className={field} value={payDate} onChange={(e) => setPayDate(e.target.value)} />
          </Field>
          <Field label="Ghi chú">
            <input
              className={field}
              value={payNote}
              placeholder="Không bắt buộc"
              onChange={(e) => setPayNote(e.target.value)}
            />
          </Field>
          <Button size="sm" className="h-10" onClick={savePayment} disabled={payAmount <= 0}>
            Ghi nhận
          </Button>
        </div>
      )}

      {open && (
        <div className="flex flex-col gap-3 border-t border-black/5 p-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Result label="Đã trả" value={formatVND(progress.totalPaid)} />
            <Result label="Còn phải trả" value={formatVND(progress.remaining)} />
            <Result label="Tổng lãi" value={formatVND(schedule.totalInterest)} />
            <Result label="Kỳ cuối" value={shortDate(schedule.rows[schedule.rows.length - 1]?.due ?? loan.startDate)} />
          </div>

          <ScheduleTable schedule={schedule} progress={progress} />

          <PaymentHistory loan={loan} onRemove={(id) => removePayment(loan.id, id)} />

          {!done && <PrepaySim loan={loan} schedule={schedule} progress={progress} />}

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={onEdit}>
              <Pencil className="size-3.5" />
              Sửa
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-danger"
              onClick={() => {
                if (confirm(`Xóa khoản vay “${loan.name}” và toàn bộ lịch sử trả?`)) removeLoan(loan.id);
              }}
            >
              <Trash2 className="size-3.5" />
              Xóa
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}

function PaymentHistory({ loan, onRemove }: { loan: Loan; onRemove: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-clay-sm bg-paper-2/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-medium"
      >
        Lịch sử trả ({loan.payments.length})
        <ChevronDown className={cn("size-4 text-subtle transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul className="px-3 pb-2">
          {!loan.payments.length && <li className="py-2 text-xs text-subtle">Chưa ghi nhận lần trả nào.</li>}
          {[...loan.payments].reverse().map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 border-t border-black/5 py-2 text-sm">
              <span className="min-w-0">
                <span className="font-medium tabular-nums text-ink">{formatVND(p.amount)}</span>
                <span className="block truncate text-xs text-muted">
                  {shortDate(p.date)}
                  {p.note ? ` · ${p.note}` : ""}
                </span>
              </span>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Xóa lần trả"
                onClick={() => {
                  if (confirm("Xóa lần trả này?")) onRemove(p.id);
                }}
              >
                <Trash2 className="size-3.5 text-subtle" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PrepaySim({ loan, schedule, progress }: { loan: Loan; schedule: Schedule; progress: Progress }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(0);
  const [feeText, setFeeText] = useState("2");
  const [mode, setMode] = useState<"term" | "payment">("term");
  const fee = Number(feeText.replace(",", ".")) || 0;
  const after = progress.paidCount;
  const payoff = progress.outstanding;

  const res = useMemo(
    () => (amount > 0 ? simulatePrepay(loan, schedule, after, amount, fee, mode) : null),
    [loan, schedule, after, amount, fee, mode],
  );
  const nextInterest = progress.next?.interest ?? 0;

  return (
    <div className="rounded-clay-sm bg-paper-2/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-medium"
      >
        Trả trước / tất toán
        <ChevronDown className={cn("size-4 text-subtle transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="flex flex-col gap-3 px-3 pb-3">
          <p className="text-xs text-muted">
            Tất toán ngay (ước tính): dư nợ gốc {formatVND(payoff)} + lãi kỳ này tối đa {formatVND(nextInterest)} + phí{" "}
            {fee}% ≈ <b className="text-ink">{formatVND(payoff + nextInterest + Math.round((payoff * fee) / 100))}</b>
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Số tiền trả trước">
              <MoneyInput value={amount} onChange={setAmount} />
            </Field>
            <Field label="Phí trả trước (%)">
              <input
                inputMode="decimal"
                className={cn(field, "tabular-nums")}
                value={feeText}
                onChange={(e) => setFeeText(e.target.value)}
              />
            </Field>
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["term", "Giữ tiền mỗi kỳ, rút ngắn kỳ hạn"],
                ["payment", "Giữ kỳ hạn, giảm tiền mỗi kỳ"],
              ] as const
            ).map(([m, t]) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-150",
                  mode === m ? "bg-ink text-paper shadow-clay-sm" : "bg-paper text-muted hover:text-ink",
                )}
              >
                {t}
              </button>
            ))}
          </div>
          {res && (
            <div className="grid grid-cols-2 gap-2 rounded-clay-xs bg-clay-inset p-3 shadow-clay-inset sm:grid-cols-4">
              <Result label="Phí" value={formatVND(res.fee)} />
              <Result
                label={mode === "term" ? "Kỳ còn lại" : "Mỗi kỳ mới"}
                value={
                  mode === "term"
                    ? `${res.newMonths} (bớt ${loan.months - after - res.newMonths})`
                    : formatVND(res.newPayment)
                }
              />
              <Result label="Lãi còn lại" value={formatVND(res.newInterest)} sub={`trước: ${shortVND(res.oldInterest)}`} />
              <Result
                label={res.saved >= 0 ? "Tiết kiệm (trừ phí)" : "Lỗ (phí > lãi giảm)"}
                value={formatVND(Math.abs(res.saved))}
              />
            </div>
          )}
          <p className="text-[11px] text-subtle">
            Mô phỏng tính từ sau kỳ {after}. Khi đã trả trước thật, ghi nhận khoản trả rồi sửa khoản vay (số tiền
            còn nợ, kỳ hạn) theo lịch mới ngân hàng cung cấp.
          </p>
        </div>
      )}
    </div>
  );
}

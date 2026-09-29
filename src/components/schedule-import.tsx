import { FileDown, FileUp, Trash2, TriangleAlert } from "lucide-react";
import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { Mascot } from "@/components/mascot";
import { Button } from "@/components/ui/button";
import { saveFile } from "@/lib/gcal";
import {
  academicStartYear,
  CSV_TEMPLATE,
  parseScheduleFile,
  type WeekMode,
} from "@/lib/import-schedule";
import { CAMPUSES, CTU_WEEK1, type CampusId, type Role } from "@/lib/schedule-data";
import { usePlanner } from "@/lib/store";
import { prettyDate } from "@/lib/time";
import { cn, uid } from "@/lib/utils";

const field =
  "h-10 w-full min-w-0 rounded-clay-xs bg-clay-inset px-3 text-sm text-ink shadow-clay-inset outline-none";

export function ScheduleImport({ today }: { today: string }) {
  const imports = usePlanner((s) => s.imports);
  const addImport = usePlanner((s) => s.addImport);
  const removeImport = usePlanner((s) => s.removeImport);
  const hideBuiltin = usePlanner((s) => s.hideBuiltin);
  const setHideBuiltin = usePlanner((s) => s.setHideBuiltin);

  const [file, setFile] = useState<{ name: string; text: string } | null>(null);
  const [campus, setCampus] = useState<CampusId>("ctu");
  const [role, setRole] = useState<Role>("tg");
  const [weekKind, setWeekKind] = useState<WeekMode["kind"]>("school");
  const [week1, setWeek1] = useState(CTU_WEEK1);
  const [importId, setImportId] = useState(uid);
  const inputRef = useRef<HTMLInputElement>(null);

  const weekMode: WeekMode =
    weekKind === "school"
      ? { kind: "school", week1 }
      : { kind: "iso", startYear: academicStartYear(today) };

  const result = useMemo(
    () =>
      file
        ? parseScheduleFile(file.name, file.text, importId, { campus, role, weekMode })
        : null,
    // weekMode được dựng từ weekKind/week1/today
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [file, importId, campus, role, weekKind, week1, today],
  );

  const sessionCount = result?.slots.reduce((n, s) => n + (s.dates?.length ?? 0), 0) ?? 0;
  const allDates = result?.slots.flatMap((s) => s.dates ?? []).sort() ?? [];

  function pickCampus(c: CampusId) {
    setCampus(c);
    setRole(c === "ctu" ? "tg" : "gv");
    setWeekKind(c === "ctu" ? "school" : "iso");
  }

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile({ name: f.name, text: await f.text() });
    setImportId(uid());
  }

  function reset() {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function confirm() {
    if (!result || !file || !result.slots.length) return;
    addImport({
      id: importId,
      name: file.name.replace(/\.(csv|ics|txt)$/i, ""),
      campus,
      importedAt: today,
      courses: result.courses,
      slots: result.slots,
    });
    reset();
  }

  return (
    <section className="rounded-clay bg-clay-surface p-4 shadow-clay-sm">
      <div className="flex items-start gap-3">
        <Mascot name="rong-suy-nghi" float={false} className="w-16 shrink-0" />
        <div className="min-w-0">
          <h2 className="font-display text-lg leading-tight tracking-tight">
            Nhập lịch từ file
          </h2>
          <p className="mt-1 text-sm text-muted">
            File <b>.csv</b> (Excel → Lưu thành CSV UTF-8) hoặc <b>.ics</b> (xuất từ
            Google Calendar, Outlook). Lịch nhập vào hiện cùng lịch có sẵn.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex min-w-0 flex-col gap-1 text-xs text-muted">
          Trường
          <select
            value={campus}
            onChange={(e) => pickCampus(e.target.value as CampusId)}
            className={field}
          >
            {Object.values(CAMPUSES).map((c) => (
              <option key={c.id} value={c.id}>
                {c.short} — {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-xs text-muted">
          Vai trò
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={field}>
            <option value="gv">Giảng viên</option>
            <option value="tg">Trợ giảng</option>
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-xs text-muted">
          Cột “Tuần” là
          <select
            value={weekKind}
            onChange={(e) => setWeekKind(e.target.value as WeekMode["kind"])}
            className={field}
          >
            <option value="school">Tuần học (tuần 1, 2, 3…)</option>
            <option value="iso">Tuần trong năm (38, 39… 52, 1)</option>
          </select>
        </label>
        {weekKind === "school" && (
          <label className="flex min-w-0 flex-col gap-1 text-xs text-muted">
            Thứ Hai của tuần 1
            <input
              type="date"
              value={week1}
              onChange={(e) => setWeek1(e.target.value || CTU_WEEK1)}
              className={field}
            />
          </label>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.ics,.txt,text/csv,text/calendar"
          onChange={onFile}
          className="hidden"
        />
        <Button type="button" onClick={() => inputRef.current?.click()}>
          <FileUp className="size-4" />
          Chọn file lịch
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => saveFile(CSV_TEMPLATE, "mau-lich-giang.csv", "text/csv")}
        >
          <FileDown className="size-4" />
          Tải file mẫu CSV
        </Button>
      </div>

      {result && file && (
        <div className="mt-4 rounded-clay-sm bg-clay-inset p-3 shadow-clay-inset">
          <p className="truncate text-xs text-subtle">{file.name}</p>
          {result.slots.length > 0 ? (
            <>
              <p className="mt-1 text-sm text-ink">
                <b>{result.courses.length}</b> học phần · <b>{sessionCount}</b> buổi
                {allDates.length > 0 &&
                  ` · ${prettyDate(allDates[0], { weekday: false })} – ${prettyDate(allDates[allDates.length - 1], { weekday: false })}`}
              </p>
              <ul className="mt-2 flex flex-col gap-1 text-xs text-ink-soft">
                {result.courses.map((c) => {
                  const n = result.slots
                    .filter((s) => s.courseId === c.id)
                    .reduce((k, s) => k + (s.dates?.length ?? 0), 0);
                  return (
                    <li key={c.id} className="truncate">
                      <span className="font-mono">{c.code}</span> · {c.name} — {n} buổi
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="mt-1 text-sm text-danger">Không đọc được buổi nào từ file.</p>
          )}
          {[...result.errors, ...result.warnings].length > 0 && (
            <ul className="mt-2 flex flex-col gap-1 text-xs">
              {result.errors.slice(0, 6).map((e) => (
                <li key={e} className="flex gap-1.5 text-danger">
                  <TriangleAlert className="mt-px size-3.5 shrink-0" />
                  {e}
                </li>
              ))}
              {result.errors.length > 6 && (
                <li className="text-danger">… và {result.errors.length - 6} lỗi khác</li>
              )}
              {result.warnings.slice(0, 4).map((w) => (
                <li key={w} className="flex gap-1.5 text-warn">
                  <TriangleAlert className="mt-px size-3.5 shrink-0" />
                  {w}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex gap-2">
            <Button type="button" size="sm" onClick={confirm} disabled={!result.slots.length}>
              Thêm vào lịch
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={reset}>
              Hủy
            </Button>
          </div>
        </div>
      )}

      {imports.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-medium uppercase tracking-wider text-subtle">
            Lịch đã nhập
          </h3>
          <ul className="mt-2 flex flex-col gap-1.5">
            {imports.map((imp) => {
              const n = imp.slots.reduce((k, s) => k + (s.dates?.length ?? 0), 0);
              return (
                <li
                  key={imp.id}
                  className="flex items-center gap-2 rounded-clay-xs bg-paper-2/60 py-1 pl-3 pr-1"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">{imp.name}</span>
                    <span className="text-xs text-subtle">
                      {CAMPUSES[imp.campus].short} · {imp.courses.length} học phần · {n} buổi
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Xóa lịch “${imp.name}”?`)) removeImport(imp.id);
                    }}
                    className="flex size-10 items-center justify-center rounded-clay-xs text-subtle hover:text-danger"
                    aria-label={`Xóa lịch ${imp.name}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <label
        className={cn(
          "mt-4 flex items-center gap-3 text-sm",
          imports.length ? "text-ink" : "text-subtle",
        )}
      >
        <input
          type="checkbox"
          checked={hideBuiltin}
          onChange={(e) => setHideBuiltin(e.target.checked)}
          disabled={!imports.length && !hideBuiltin}
          className="size-4 accent-[var(--color-accent)]"
        />
        Ẩn lịch có sẵn (HK1 2026–2027), chỉ dùng lịch đã nhập
      </label>
    </section>
  );
}

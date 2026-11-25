import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Download,
  LogIn,
  LogOut,
  MonitorCheck,
  QrCode,
  Search,
  ShieldAlert,
  Smartphone,
} from 'lucide-react';
import { useFitDesk } from '../store/useFitDeskStore';
import { AttendanceRecord } from '../types/fitdesk';
import { InteractiveBarChart, PeakHoursChart } from '../components/charts/AnalyticsCharts';
import { StatusBadge } from '../components/ui/StatusBadge';
import { addDaysIso, exportToCsv, formatDate, todayIso } from '../utils/csv';

const METHOD_META: Record<
  AttendanceRecord['method'],
  { label: string; icon: React.ComponentType<{ className?: string }>; helper: string; cta: string }
> = {
  'QR Pass': {
    label: 'QR Pass',
    icon: QrCode,
    helper: 'Member scans their digital QR pass at the turnstile or front-desk reader.',
    cta: 'Scan & Verify QR Pass',
  },
  'Front Desk': {
    label: 'Front Desk',
    icon: MonitorCheck,
    helper: 'Staff verifies member photo, plan validity, and checks them in manually.',
    cta: 'Staff Check-In',
  },
  'Mobile App': {
    label: 'Mobile App',
    icon: Smartphone,
    helper: 'Member taps NFC / Bluetooth self check-in from the FitDesk mobile app.',
    cta: 'Trigger Mobile App Check-In',
  },
};

export function AttendancePage() {
  const {
    branches,
    plans,
    members,
    attendance,
    branchId,
    getDateBounds,
    customFrom,
    customTo,
    setCustomFrom,
    setCustomTo,
    setDateRange,
    checkInMember,
    checkOutAttendance,
    pushToast,
  } = useFitDesk();

  const [passInput, setPassInput] = useState('FD-8841');
  const [method, setMethod] = useState<AttendanceRecord['method']>('QR Pass');
  const [methodFilter, setMethodFilter] = useState<'All' | AttendanceRecord['method']>('All');
  const [search, setSearch] = useState('');
  const [lastResult, setLastResult] = useState<{ ok: boolean; message: string } | null>(null);

  const today = todayIso();
  const { from: dateFrom, to: dateTo } = getDateBounds();

  const matchedPreviewMember = useMemo(() => {
    const q = passInput.trim().toLowerCase();
    if (!q) return null;
    return (
      members.find(
        (m) =>
          m.passCode.toLowerCase() === q ||
          m.name.toLowerCase() === q ||
          m.email.toLowerCase() === q
      ) ?? null
    );
  }, [members, passInput]);

  const scopedAttendance = useMemo(() => {
    const q = search.trim().toLowerCase();
    return attendance.filter((a) => {
      if (branchId !== 'all' && a.branchId !== branchId) return false;
      if (a.date < dateFrom || a.date > dateTo) return false;
      if (methodFilter !== 'All' && a.method !== methodFilter) return false;
      if (!q) return true;
      const mem = members.find((m) => m.id === a.memberId);
      return (
        mem?.name.toLowerCase().includes(q) ||
        mem?.passCode.toLowerCase().includes(q) ||
        a.method.toLowerCase().includes(q)
      );
    });
  }, [attendance, branchId, dateFrom, dateTo, methodFilter, search, members]);

  const inClubNow = useMemo(
    () =>
      attendance.filter(
        (a) =>
          (branchId === 'all' || a.branchId === branchId) &&
          a.date === today &&
          a.checkOutTime === null
      ),
    [attendance, branchId, today]
  );

  const dailySeries = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDaysIso(today, i - 6);
      const count = attendance.filter(
        (a) => (branchId === 'all' || a.branchId === branchId) && a.date === d
      ).length;
      return { label: d.slice(5), value: count };
    });
  }, [attendance, branchId, today]);

  const peakHours = useMemo(() => {
    const hours = ['06:00', '07:00', '08:00', '09:00', '10:00', '12:00', '17:00', '18:00', '19:00'];
    return hours.map((h) => ({
      hour: h,
      count: scopedAttendance.filter((a) => a.checkInTime.startsWith(h.slice(0, 2))).length,
    }));
  }, [scopedAttendance]);

  const frequencyTop = useMemo(() => {
    const counts: Record<string, number> = {};
    scopedAttendance.forEach((a) => {
      counts[a.memberId] = (counts[a.memberId] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([memberId, visits]) => ({
        member: members.find((m) => m.id === memberId),
        visits,
      }))
      .filter((x) => Boolean(x.member));
  }, [scopedAttendance, members]);

  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passInput.trim()) return;
    const res = checkInMember(passInput, method);
    setLastResult(res);
  };

  const handleExportCsv = () => {
    exportToCsv(
      `fitdesk-attendance-${dateFrom}-to-${dateTo}.csv`,
      ['Date', 'Member', 'Pass ID', 'Branch', 'Check-In', 'Check-Out', 'Method', 'Verified'],
      scopedAttendance.map((a) => {
        const mem = members.find((m) => m.id === a.memberId);
        return [
          a.date,
          mem?.name ?? a.memberId,
          mem?.passCode ?? '',
          branches.find((b) => b.id === a.branchId)?.name ?? a.branchId,
          a.checkInTime,
          a.checkOutTime ?? 'In Club',
          a.method,
          a.verified ? 'Yes' : 'No',
        ];
      })
    );
    pushToast({
      tone: 'success',
      title: `Exported ${scopedAttendance.length} attendance logs`,
      description: `Range: ${dateFrom} to ${dateTo}`,
    });
  };

  const activeMeta = METHOD_META[method];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wider text-[#FF642D] uppercase">Access &amp; Telemetry</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-[#F5F6FA] sm:text-3xl">
            Attendance &amp; Check-In
          </h1>
          <p className="mt-1 text-xs text-[#9299A8] tabular-nums">
            Showing logs from {formatDate(dateFrom)} to {formatDate(dateTo)}
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 rounded-xl border border-white/[0.12] bg-[#11151D] px-4 py-2 text-xs font-semibold text-[#F5F6FA] hover:bg-[#171D28] sm:text-sm"
        >
          <Download className="h-4 w-4" />
          Export Date-Wise CSV ({scopedAttendance.length})
        </button>
      </div>

      {/* Check-In Desk + Currently In Club */}
      <div className="grid gap-6 lg:grid-cols-12">
        <section className="rounded-2xl border border-white/[0.09] bg-[#171D28] p-5 sm:p-6 lg:col-span-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold text-[#F5F6FA]">Pass Verification Terminal</h2>
              <p className="text-xs text-[#9299A8]">{activeMeta.helper}</p>
            </div>
          </div>

          {/* Interactive Check-In Mode Switcher */}
          <div
            role="tablist"
            aria-label="Check-in method"
            className="mt-4 grid grid-cols-3 gap-1.5 rounded-xl border border-white/[0.08] bg-[#090B10] p-1"
          >
            {(['QR Pass', 'Front Desk', 'Mobile App'] as AttendanceRecord['method'][]).map((m) => {
              const Icon = METHOD_META[m].icon;
              const active = method === m;
              return (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setMethod(m)}
                  className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-[#FF642D] text-[#090B10]'
                      : 'text-[#9299A8] hover:text-[#F5F6FA]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{m}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleCheckIn} className="mt-4 space-y-3.5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#9299A8]">Pass Code or Member</label>
                <input
                  value={passInput}
                  onChange={(e) => setPassInput(e.target.value)}
                  placeholder="FD-8841 or Elena Rostova"
                  className="w-full rounded-xl border border-white/[0.12] bg-[#090B10] px-3 py-2 text-sm text-[#F5F6FA] placeholder:text-[#9299A8]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#9299A8]">Quick Select Member</label>
                <select
                  aria-label="Quick select member"
                  value={matchedPreviewMember?.passCode ?? ''}
                  onChange={(e) => {
                    if (e.target.value) setPassInput(e.target.value);
                  }}
                  className="w-full rounded-xl border border-white/[0.12] bg-[#090B10] px-3 py-2 text-xs text-[#F5F6FA]"
                >
                  <option value="">Choose member...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.passCode}>
                      {m.name} ({m.passCode} · {m.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Member / Mode Preview Card */}
            {matchedPreviewMember && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#11151D] p-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={matchedPreviewMember.avatarUrl}
                    alt={matchedPreviewMember.name}
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#F5F6FA]">{matchedPreviewMember.name}</p>
                    <p className="text-xs text-[#9299A8]">
                      {plans.find((p) => p.id === matchedPreviewMember.planId)?.name} · {matchedPreviewMember.passCode}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={matchedPreviewMember.status} />
                  <span className="text-[10px] text-[#9299A8]">
                    {method === 'QR Pass'
                      ? 'QR Token Ready'
                      : method === 'Mobile App'
                        ? 'NFC / App Verified'
                        : 'Desk ID Checked'}
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF642D] py-2.5 text-sm font-semibold text-[#090B10] hover:brightness-110"
            >
              <LogIn className="h-4 w-4" />
              {activeMeta.cta}
            </button>
          </form>

          {lastResult && (
            <div
              className={`mt-4 flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs ${
                lastResult.ok
                  ? 'border-[#C5F36B]/30 bg-[#C5F36B]/10 text-[#C5F36B]'
                  : 'border-[#FF642D]/30 bg-[#FF642D]/10 text-[#FF642D]'
              }`}
            >
              {lastResult.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <ShieldAlert className="h-4 w-4 shrink-0" />}
              <span>{lastResult.message}</span>
            </div>
          )}
        </section>

        {/* Currently In Club */}
        <section className="rounded-2xl border border-white/[0.09] bg-[#171D28] p-5 sm:p-6 lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-[#F5F6FA]">
                Currently In Club ({inClubNow.length})
              </h2>
              <p className="text-xs text-[#9299A8]">Active floor sessions awaiting check-out</p>
            </div>
            <span className="rounded-full bg-[#C5F36B]/15 px-2.5 py-1 text-xs font-medium text-[#C5F36B]">
              Live Today
            </span>
          </div>

          <div className="space-y-2.5">
            {inClubNow.map((rec) => {
              const mem = members.find((m) => m.id === rec.memberId);
              if (!mem) return null;
              const MethodIcon = METHOD_META[rec.method].icon;
              return (
                <div
                  key={rec.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#11151D] p-3"
                >
                  <div className="flex items-center gap-3">
                    <img src={mem.avatarUrl} alt={mem.name} className="h-9 w-9 rounded-lg object-cover" />
                    <div>
                      <p className="text-sm font-medium text-[#F5F6FA]">{mem.name}</p>
                      <p className="flex items-center gap-1.5 text-xs text-[#9299A8]">
                        <span>In at {rec.checkInTime}</span>
                        <span>·</span>
                        <MethodIcon className="h-3 w-3 text-[#C5F36B]" />
                        <span>{rec.method}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <StatusBadge status={mem.status} />
                    <button
                      type="button"
                      onClick={() => checkOutAttendance(rec.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.12] px-3 py-1.5 text-xs font-medium text-[#F5F6FA] hover:bg-white/[0.06]"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Check Out
                    </button>
                  </div>
                </div>
              );
            })}
            {inClubNow.length === 0 && (
              <p className="py-10 text-center text-sm text-[#9299A8]">No active floor check-ins right now.</p>
            )}
          </div>
        </section>
      </div>

      {/* Analytics Row */}
      <div className="grid gap-6 lg:grid-cols-12">
        <section className="rounded-2xl border border-white/[0.09] bg-[#171D28] p-5 sm:p-6 lg:col-span-4">
          <h2 className="font-display text-base font-semibold text-[#F5F6FA]">7-Day Daily Attendance</h2>
          <p className="mb-4 text-xs text-[#9299A8]">Verified visits per day</p>
          <InteractiveBarChart data={dailySeries} accentColor="#C5F36B" primaryLabel="Visits" />
        </section>

        <section className="rounded-2xl border border-white/[0.09] bg-[#171D28] p-5 sm:p-6 lg:col-span-4">
          <h2 className="font-display text-base font-semibold text-[#F5F6FA]">Peak Hours</h2>
          <p className="mb-4 text-xs text-[#9299A8]">Check-in volume by hour of day</p>
          <PeakHoursChart data={peakHours} />
        </section>

        <section className="rounded-2xl border border-white/[0.09] bg-[#171D28] p-5 sm:p-6 lg:col-span-4">
          <h2 className="font-display text-base font-semibold text-[#F5F6FA]">Top Attendance Frequency</h2>
          <p className="mb-4 text-xs text-[#9299A8]">Most consistent members in selected date range</p>
          <div className="space-y-2.5">
            {frequencyTop.map(({ member, visits }) => (
              <div
                key={member!.id}
                className="flex items-center justify-between rounded-xl bg-[#11151D] px-3.5 py-2.5 text-sm"
              >
                <span className="font-medium text-[#F5F6FA]">{member!.name}</span>
                <span className="font-mono text-xs font-semibold text-[#C5F36B] tabular-nums">
                  {visits} visits
                </span>
              </div>
            ))}
            {frequencyTop.length === 0 && (
              <p className="py-6 text-center text-xs text-[#9299A8]">No visits in selected date range.</p>
            )}
          </div>
        </section>
      </div>

      {/* Attendance History Table with Date & Method Filters */}
      <section className="rounded-2xl border border-white/[0.09] bg-[#171D28] p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold text-[#F5F6FA]">
              Attendance History ({scopedAttendance.length})
            </h2>
            <p className="text-xs text-[#9299A8]">Filter by custom dates, check-in method, or member</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-[#090B10] px-2.5 py-1.5">
              <input
                type="date"
                aria-label="Attendance from date"
                value={dateFrom}
                onChange={(e) => {
                  setDateRange('custom');
                  setCustomFrom(e.target.value);
                  if (customTo < e.target.value) setCustomTo(e.target.value);
                }}
                className="bg-transparent text-xs text-[#F5F6FA] focus:outline-none"
              />
              <span className="text-xs text-[#9299A8]">→</span>
              <input
                type="date"
                aria-label="Attendance to date"
                value={dateTo}
                onChange={(e) => {
                  setDateRange('custom');
                  setCustomTo(e.target.value);
                  if (customFrom > e.target.value) setCustomFrom(e.target.value);
                }}
                className="bg-transparent text-xs text-[#F5F6FA] focus:outline-none"
              />
            </div>

            <select
              aria-label="Filter by check-in method"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as 'All' | AttendanceRecord['method'])}
              className="rounded-xl border border-white/[0.1] bg-[#090B10] px-3 py-1.5 text-xs font-medium text-[#F5F6FA]"
            >
              <option value="All">All Methods</option>
              <option value="QR Pass">QR Pass</option>
              <option value="Front Desk">Front Desk</option>
              <option value="Mobile App">Mobile App</option>
            </select>

            <div className="relative w-full sm:w-52">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#9299A8]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search logs..."
                aria-label="Search attendance logs"
                className="w-full rounded-xl border border-white/[0.1] bg-[#090B10] py-1.5 pr-3 pl-9 text-xs text-[#F5F6FA]"
              />
            </div>
          </div>
        </div>

        <div tabIndex={0} role="region" aria-label="Attendance history table" className="fitdesk-table-wrapper">
          <table className="fitdesk-table fitdesk-table-responsive">
            <thead>
              <tr>
                <th>Date</th>
                <th>Member</th>
                <th>Branch</th>
                <th>Check-In</th>
                <th>Check-Out</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              {scopedAttendance.map((rec) => {
                const mem = members.find((m) => m.id === rec.memberId);
                const branch = branches.find((b) => b.id === rec.branchId);
                const MethodIcon = METHOD_META[rec.method].icon;
                return (
                  <tr key={rec.id}>
                    <td data-label="Date" className="tabular-nums text-[#9299A8]">
                      {formatDate(rec.date)}
                    </td>
                    <td data-label="Member" className="font-medium text-[#F5F6FA]">
                      {mem?.name ?? rec.memberId}
                    </td>
                    <td data-label="Branch" className="text-xs text-[#9299A8]">
                      {branch?.name ?? rec.branchId}
                    </td>
                    <td data-label="Check-In" className="font-mono text-xs text-[#C5F36B]">
                      {rec.checkInTime}
                    </td>
                    <td data-label="Check-Out" className="font-mono text-xs text-[#9299A8]">
                      {rec.checkOutTime ?? 'In Club'}
                    </td>
                    <td data-label="Method" className="text-xs">
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#11151D] px-2 py-0.5">
                        <MethodIcon className="h-3 w-3 text-[#FF642D]" />
                        {rec.method}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {scopedAttendance.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#9299A8]">
                    No attendance records found for {formatDate(dateFrom)} – {formatDate(dateTo)}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

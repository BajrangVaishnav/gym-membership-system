import { useMemo } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  CalendarClock,
  CreditCard,
  RefreshCw,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from 'lucide-react';
import { useFitDesk } from '../store/useFitDeskStore';
import { InteractiveBarChart, PeakHoursChart } from '../components/charts/AnalyticsCharts';
import { StatusBadge } from '../components/ui/StatusBadge';
import { addDaysIso, formatCurrency, formatDate, todayIso } from '../utils/csv';

interface DashboardOverviewProps {
  onNavigate: (route: string) => void;
}

export function DashboardOverview({ onNavigate }: DashboardOverviewProps) {
  const { branches, members, plans, attendance, payments, activities, branchId, dateRange, getDateBounds, renewMember } =
    useFitDesk();

  const metrics = useMemo(() => {
    const today = todayIso();
    const { from: cutoffDate, to: endDate } = getDateBounds();

    const scopedMembers = members.filter((m) => branchId === 'all' || m.branchId === branchId);
    const scopedPayments = payments.filter((p) => branchId === 'all' || p.branchId === branchId);
    const scopedAttendance = attendance.filter((a) => branchId === 'all' || a.branchId === branchId);

    const totalMembers = scopedMembers.length;
    const activeMembers = scopedMembers.filter((m) => m.status === 'Active' || m.status === 'Expiring Soon').length;
    const newMembers = scopedMembers.filter((m) => m.startDate >= cutoffDate && m.startDate <= endDate).length;
    const expiredMembers = scopedMembers.filter((m) => m.status === 'Expired').length;
    const todaysAttendance = scopedAttendance.filter((a) => a.date === today).length;

    const paidInWindow = scopedPayments.filter(
      (p) => p.status === 'Paid' && p.date >= cutoffDate && p.date <= endDate
    );
    const monthlyRevenue = paidInWindow.reduce((sum, p) => sum + p.netAmount, 0);
    const outstandingPayments = scopedPayments
      .filter((p) => p.status === 'Pending')
      .reduce((sum, p) => sum + p.netAmount, 0);

    const renewalRate = totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0;

    return {
      totalMembers,
      activeMembers,
      newMembers,
      expiredMembers,
      todaysAttendance,
      monthlyRevenue,
      outstandingPayments,
      renewalRate,
      scopedMembers,
      scopedPayments,
      scopedAttendance,
    };
  }, [members, payments, attendance, branchId, getDateBounds]);

  // Financial & Membership Growth series aggregated from actual payment & member dates
  const financialSeries = useMemo(() => {
    const buckets = [
      { label: 'W-5', start: -42, end: -36 },
      { label: 'W-4', start: -35, end: -29 },
      { label: 'W-3', start: -28, end: -22 },
      { label: 'W-2', start: -21, end: -15 },
      { label: 'W-1', start: -14, end: -8 },
      { label: 'This Wk', start: -7, end: 0 },
    ];
    const today = todayIso();
    return buckets.map((b) => {
      const from = addDaysIso(today, b.start);
      const to = addDaysIso(today, b.end);
      const paid = metrics.scopedPayments
        .filter((p) => p.status === 'Paid' && p.date >= from && p.date <= to)
        .reduce((s, p) => s + p.netAmount, 0);
      const pending = metrics.scopedPayments
        .filter((p) => p.status === 'Pending' && p.date >= from && p.date <= to)
        .reduce((s, p) => s + p.netAmount, 0);
      return { label: b.label, value: paid, secondary: pending };
    });
  }, [metrics.scopedPayments]);

  const growthSeries = useMemo(() => {
    const buckets = [
      { label: '60d+', min: -365, max: -61 },
      { label: '45d', min: -60, max: -31 },
      { label: '30d', min: -30, max: -15 },
      { label: '14d', min: -14, max: -8 },
      { label: '7d', min: -7, max: -1 },
      { label: 'Today', min: 0, max: 0 },
    ];
    const today = todayIso();
    return buckets.map((b) => {
      const from = addDaysIso(today, b.min);
      const to = addDaysIso(today, b.max);
      const joined = metrics.scopedMembers.filter((m) => m.startDate >= from && m.startDate <= to).length;
      const checkins = metrics.scopedAttendance.filter((a) => a.date >= from && a.date <= to).length;
      return { label: b.label, value: checkins, secondary: joined };
    });
  }, [metrics.scopedMembers, metrics.scopedAttendance]);

  const peakHours = useMemo(() => {
    const hours = ['06:00', '07:00', '08:00', '09:00', '10:00', '12:00', '17:00', '18:00', '19:00'];
    return hours.map((h) => {
      const prefix = h.slice(0, 2);
      const count = metrics.scopedAttendance.filter((a) => a.checkInTime.startsWith(prefix)).length;
      return { hour: h.slice(0, 5), count };
    });
  }, [metrics.scopedAttendance]);

  const upcomingExpirations = useMemo(() => {
    return metrics.scopedMembers
      .filter((m) => m.status === 'Expiring Soon' || m.status === 'Expired')
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))
      .slice(0, 5);
  }, [metrics.scopedMembers]);

  const scopedActivities = useMemo(
    () => activities.filter((a) => branchId === 'all' || a.branchId === branchId).slice(0, 5),
    [activities, branchId]
  );

  const branchLabel =
    branchId === 'all' ? 'All Branches' : branches.find((b) => b.id === branchId)?.name ?? 'Club';

  const kpiCards = [
    { label: 'Total Members', value: metrics.totalMembers.toString(), icon: Users, accent: 'text-[#F5F6FA]' },
    { label: 'Active Members', value: metrics.activeMembers.toString(), icon: UserCheck, accent: 'text-[#C5F36B]' },
    { label: `New Members (${dateRange})`, value: metrics.newMembers.toString(), icon: UserPlus, accent: 'text-[#F5F6FA]' },
    { label: 'Expired Memberships', value: metrics.expiredMembers.toString(), icon: UserX, accent: 'text-rose-400' },
    { label: "Today's Attendance", value: metrics.todaysAttendance.toString(), icon: Activity, accent: 'text-[#C5F36B]' },
    { label: `Revenue (${dateRange})`, value: formatCurrency(metrics.monthlyRevenue), icon: CreditCard, accent: 'text-[#FF642D]' },
    { label: 'Outstanding Payments', value: formatCurrency(metrics.outstandingPayments), icon: AlertCircle, accent: 'text-[#FF642D]' },
    { label: 'Renewal Rate', value: `${metrics.renewalRate}%`, icon: RefreshCw, accent: 'text-[#C5F36B]' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wider text-[#FF642D] uppercase">Operations Overview</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-[#F5F6FA] sm:text-3xl">
            {branchLabel} Command Center
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate('/dashboard/attendance')}
            className="rounded-xl border border-white/[0.12] bg-[#11151D] px-4 py-2 text-xs font-semibold text-[#F5F6FA] transition-colors hover:bg-[#171D28] sm:text-sm"
          >
            QR Check-In Desk
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/dashboard/members')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF642D] px-4 py-2 text-xs font-semibold text-[#090B10] transition-all hover:brightness-110 sm:text-sm"
          >
            Add Member
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 8 Core KPI Metrics */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {kpiCards.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl border border-white/[0.09] bg-[#171D28] p-4 sm:p-5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-[#9299A8]">{kpi.label}</span>
              <kpi.icon className="h-4 w-4 shrink-0 text-[#9299A8]" />
            </div>
            <p className={`mt-2.5 font-display text-2xl font-bold tabular-nums sm:text-3xl ${kpi.accent}`}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-12">
        <section className="rounded-2xl border border-white/[0.09] bg-[#171D28] p-5 sm:p-6 lg:col-span-7">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold text-[#F5F6FA]">Financial Performance</h2>
              <p className="text-xs text-[#9299A8]">Paid collections vs. pending invoices by week</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#9299A8]">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#FF642D]" /> Paid
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#C5F36B]" /> Pending
              </span>
            </div>
          </div>
          <InteractiveBarChart
            data={financialSeries}
            primaryLabel="Paid"
            secondaryLabel="Pending"
            valueFormatter={formatCurrency}
          />
        </section>

        <section className="rounded-2xl border border-white/[0.09] bg-[#171D28] p-5 sm:p-6 lg:col-span-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-[#F5F6FA]">Attendance &amp; New Joins</h2>
              <p className="text-xs text-[#9299A8]">Club check-ins vs. onboarded members</p>
            </div>
          </div>
          <InteractiveBarChart
            data={growthSeries}
            accentColor="#C5F36B"
            secondaryColor="#FF642D"
            primaryLabel="Check-ins"
            secondaryLabel="New Joins"
          />
        </section>
      </div>

      {/* Bottom Row: Peak Hours, Upcoming Expirations, Recent Activities */}
      <div className="grid gap-6 lg:grid-cols-12">
        <section className="rounded-2xl border border-white/[0.09] bg-[#171D28] p-5 sm:p-6 lg:col-span-4">
          <h2 className="font-display text-base font-semibold text-[#F5F6FA]">Peak Club Hours</h2>
          <p className="mb-5 text-xs text-[#9299A8]">Hourly check-in distribution across logged visits</p>
          <PeakHoursChart data={peakHours} />
        </section>

        <section className="rounded-2xl border border-white/[0.09] bg-[#171D28] p-5 sm:p-6 lg:col-span-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-[#F5F6FA]">Upcoming Expirations</h2>
              <p className="text-xs text-[#9299A8]">Members needing renewal follow-up</p>
            </div>
            <CalendarClock className="h-4 w-4 text-[#FF642D]" />
          </div>
          <div className="space-y-3">
            {upcomingExpirations.map((m) => {
              const plan = plans.find((p) => p.id === m.planId);
              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-[#11151D] p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#F5F6FA]">{m.name}</p>
                    <p className="text-xs text-[#9299A8]">
                      {plan?.name} · Exp {formatDate(m.expiryDate)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={m.status} />
                    <button
                      type="button"
                      onClick={() => renewMember(m.id, m.planId, 'Card')}
                      className="rounded-lg bg-[#FF642D]/15 px-2.5 py-1 text-xs font-semibold text-[#FF642D] hover:bg-[#FF642D]/25"
                    >
                      Renew
                    </button>
                  </div>
                </div>
              );
            })}
            {upcomingExpirations.length === 0 && (
              <p className="py-8 text-center text-xs text-[#9299A8]">No expiring memberships in this branch.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/[0.09] bg-[#171D28] p-5 sm:p-6 lg:col-span-4">
          <h2 className="font-display text-base font-semibold text-[#F5F6FA]">Recent Activity</h2>
          <p className="mb-4 text-xs text-[#9299A8]">Live check-ins, payments, and alerts</p>
          <div className="space-y-3">
            {scopedActivities.map((act) => (
              <div
                key={act.id}
                className="flex items-start justify-between gap-3 border-b border-white/[0.06] pb-3 last:border-none last:pb-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#F5F6FA]">{act.title}</p>
                  <p className="truncate text-xs text-[#9299A8]">{act.detail}</p>
                </div>
                <span className="shrink-0 text-[11px] text-[#9299A8] tabular-nums">{act.timestamp}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

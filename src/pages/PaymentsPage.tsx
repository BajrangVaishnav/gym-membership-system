import React, { useMemo, useState } from 'react';
import { Check, Download, Plus, Printer, Receipt, RotateCcw, Search } from 'lucide-react';
import { useFitDesk } from '../store/useFitDeskStore';
import { PaymentMethod, PaymentRecord, PaymentStatus } from '../types/fitdesk';
import { RevenueByPlanList } from '../components/charts/AnalyticsCharts';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/StatusBadge';
import { exportToCsv, formatCurrency, formatDate } from '../utils/csv';

export function PaymentsPage() {
  const {
    branches,
    payments,
    members,
    plans,
    branchId,
    getDateBounds,
    customFrom,
    customTo,
    setCustomFrom,
    setCustomTo,
    setDateRange,
    globalSearch,
    recordPayment,
    markPaymentPaid,
    refundPayment,
    pushToast,
  } = useFitDesk();

  const [statusFilter, setStatusFilter] = useState<'All' | PaymentStatus>('All');
  const [search, setSearch] = useState('');
  const [recordOpen, setRecordOpen] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<PaymentRecord | null>(null);

  // Record payment form state
  const [formMemberId, setFormMemberId] = useState(members[0]?.id ?? '');
  const [formPlanId, setFormPlanId] = useState(plans[0]?.id ?? '');
  const [formAmount, setFormAmount] = useState(String(plans[0]?.price ?? 95));
  const [formDiscount, setFormDiscount] = useState('0');
  const [formMethod, setFormMethod] = useState<PaymentMethod>('Card');
  const [formStatus, setFormStatus] = useState<PaymentStatus>('Paid');
  const [formCategory, setFormCategory] = useState<PaymentRecord['category']>('Renewal');

  const query = (search || globalSearch).trim().toLowerCase();
  const { from: dateFrom, to: dateTo } = getDateBounds();

  const scopedPayments = useMemo(() => {
    return payments.filter((p) => {
      if (branchId !== 'all' && p.branchId !== branchId) return false;
      if (p.date < dateFrom || p.date > dateTo) return false;
      if (statusFilter !== 'All' && p.status !== statusFilter) return false;
      if (!query) return true;
      const mem = members.find((m) => m.id === p.memberId);
      return (
        p.receiptNo.toLowerCase().includes(query) ||
        mem?.name.toLowerCase().includes(query) ||
        p.method.toLowerCase().includes(query)
      );
    });
  }, [payments, branchId, dateFrom, dateTo, statusFilter, query, members]);

  // All financial totals computed strictly from actual records in selected branch & date range
  const totals = useMemo(() => {
    const branchAndDateScoped = payments.filter(
      (p) => (branchId === 'all' || p.branchId === branchId) && p.date >= dateFrom && p.date <= dateTo
    );
    const paid = branchAndDateScoped.filter((p) => p.status === 'Paid');
    const totalRevenue = paid.reduce((s, p) => s + p.netAmount, 0);
    const renewalRevenue = paid
      .filter((p) => p.category === 'Renewal')
      .reduce((s, p) => s + p.netAmount, 0);
    const outstanding = branchAndDateScoped
      .filter((p) => p.status === 'Pending')
      .reduce((s, p) => s + p.netAmount, 0);
    const totalDiscounts = paid.reduce((s, p) => s + p.discount, 0);

    const byPlanMap: Record<string, number> = {};
    paid.forEach((p) => {
      const planName = plans.find((pl) => pl.id === p.planId)?.name ?? 'Other';
      byPlanMap[planName] = (byPlanMap[planName] ?? 0) + p.netAmount;
    });
    const byPlan = Object.entries(byPlanMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, revenue]) => ({
        name,
        revenue,
        share: totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0,
      }));

    return { totalRevenue, renewalRevenue, outstanding, totalDiscounts, byPlan };
  }, [payments, plans, branchId, dateFrom, dateTo]);

  const handlePlanChange = (planId: string) => {
    setFormPlanId(planId);
    const found = plans.find((p) => p.id === planId);
    if (found) setFormAmount(String(found.price));
  };

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMemberId) return;
    recordPayment({
      memberId: formMemberId,
      planId: formPlanId,
      amount: Number(formAmount) || 0,
      discount: Number(formDiscount) || 0,
      method: formMethod,
      status: formStatus,
      category: formCategory,
    });
    setRecordOpen(false);
  };

  const handleExportCsv = () => {
    exportToCsv(
      `fitdesk-payments-${dateFrom}-to-${dateTo}.csv`,
      ['Receipt', 'Date', 'Member', 'Plan', 'Category', 'Method', 'Gross', 'Discount', 'Net', 'Status'],
      scopedPayments.map((p) => [
        p.receiptNo,
        p.date,
        members.find((m) => m.id === p.memberId)?.name ?? p.memberId,
        plans.find((pl) => pl.id === p.planId)?.name ?? p.planId,
        p.category,
        p.method,
        p.amount,
        p.discount,
        p.netAmount,
        p.status,
      ])
    );
    pushToast({
      tone: 'success',
      title: `Exported ${scopedPayments.length} payment records`,
      description: `Range: ${dateFrom} to ${dateTo}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wider text-[#FF642D] uppercase">Financial Ledger</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-[#F5F6FA] sm:text-3xl">
            Payments &amp; Revenue
          </h1>
          <p className="mt-1 text-xs text-[#9299A8] tabular-nums">
            Showing transactions from {formatDate(dateFrom)} to {formatDate(dateTo)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.12] bg-[#11151D] px-3.5 py-2 text-xs font-semibold text-[#F5F6FA] hover:bg-[#171D28] sm:text-sm"
          >
            <Download className="h-4 w-4" />
            Export Date-Wise CSV ({scopedPayments.length})
          </button>
          <button
            type="button"
            onClick={() => setRecordOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FF642D] px-4 py-2 text-xs font-semibold text-[#090B10] hover:brightness-110 sm:text-sm"
          >
            <Plus className="h-4 w-4" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/[0.09] bg-[#171D28] p-5">
          <p className="text-xs text-[#9299A8]">Collected Revenue</p>
          <p className="mt-2 font-display text-2xl font-bold text-[#C5F36B] tabular-nums">
            {formatCurrency(totals.totalRevenue)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.09] bg-[#171D28] p-5">
          <p className="text-xs text-[#9299A8]">Renewal Revenue</p>
          <p className="mt-2 font-display text-2xl font-bold text-[#F5F6FA] tabular-nums">
            {formatCurrency(totals.renewalRevenue)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.09] bg-[#171D28] p-5">
          <p className="text-xs text-[#9299A8]">Outstanding Balances</p>
          <p className="mt-2 font-display text-2xl font-bold text-[#FF642D] tabular-nums">
            {formatCurrency(totals.outstanding)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.09] bg-[#171D28] p-5">
          <p className="text-xs text-[#9299A8]">Discounts Applied</p>
          <p className="mt-2 font-display text-2xl font-bold text-[#F5F6FA] tabular-nums">
            {formatCurrency(totals.totalDiscounts)}
          </p>
        </div>
      </div>

      {/* Revenue by Plan + Ledger */}
      <div className="grid gap-6 lg:grid-cols-12">
        <section className="rounded-2xl border border-white/[0.09] bg-[#171D28] p-5 sm:p-6 lg:col-span-4">
          <h2 className="font-display text-base font-semibold text-[#F5F6FA]">Revenue by Plan</h2>
          <p className="mb-5 text-xs text-[#9299A8]">Share of paid collections by tier</p>
          {totals.byPlan.length > 0 ? (
            <RevenueByPlanList items={totals.byPlan} />
          ) : (
            <p className="py-8 text-center text-xs text-[#9299A8]">No paid invoices in this scope.</p>
          )}
        </section>

        <section className="rounded-2xl border border-white/[0.09] bg-[#171D28] p-5 sm:p-6 lg:col-span-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#9299A8]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search receipt or member..."
                aria-label="Search payments"
                className="w-full rounded-xl border border-white/[0.1] bg-[#090B10] py-1.5 pr-3 pl-9 text-sm text-[#F5F6FA]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-[#090B10] px-2.5 py-1.5">
                <input
                  type="date"
                  aria-label="Payments from date"
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
                  aria-label="Payments to date"
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
                aria-label="Filter payment status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'All' | PaymentStatus)}
                className="rounded-xl border border-white/[0.1] bg-[#090B10] px-3 py-1.5 text-xs font-medium text-[#F5F6FA] sm:text-sm"
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>
          </div>

          <div tabIndex={0} role="region" aria-label="Payments ledger table" className="fitdesk-table-wrapper">
            <table className="fitdesk-table fitdesk-table-responsive">
              <thead>
                <tr>
                  <th>Receipt</th>
                  <th>Member</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Net</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {scopedPayments.map((p) => {
                  const mem = members.find((m) => m.id === p.memberId);
                  return (
                    <tr key={p.id}>
                      <td data-label="Receipt" className="font-mono text-xs text-[#F5F6FA]">
                        {p.receiptNo}
                      </td>
                      <td data-label="Member" className="font-medium text-[#F5F6FA]">
                        {mem?.name ?? p.memberId}
                      </td>
                      <td data-label="Date" className="text-xs text-[#9299A8] tabular-nums">
                        {formatDate(p.date)}
                      </td>
                      <td data-label="Method" className="text-xs text-[#9299A8]">
                        {p.method}
                      </td>
                      <td data-label="Net" className="font-semibold tabular-nums">
                        {formatCurrency(p.netAmount)}
                      </td>
                      <td data-label="Status">
                        <StatusBadge status={p.status} />
                      </td>
                      <td data-label="Actions" className="text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {p.status === 'Pending' && (
                            <button
                              type="button"
                              onClick={() => markPaymentPaid(p.id)}
                              title="Mark as Paid"
                              className="rounded-lg bg-[#C5F36B]/15 p-1.5 text-[#C5F36B] hover:bg-[#C5F36B]/25"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                          {p.status === 'Paid' && (
                            <button
                              type="button"
                              onClick={() => refundPayment(p.id)}
                              title="Issue Refund"
                              className="rounded-lg bg-white/[0.05] p-1.5 text-[#9299A8] hover:text-rose-300"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setReceiptPayment(p)}
                            title="View Receipt"
                            className="rounded-lg border border-white/[0.12] p-1.5 text-[#F5F6FA] hover:bg-white/[0.06]"
                          >
                            <Receipt className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Record Payment Modal */}
      <Modal open={recordOpen} onClose={() => setRecordOpen(false)} title="Record Payment">
        <form onSubmit={handleRecordSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9299A8]">Member</label>
              <select
                autoFocus
                value={formMemberId}
                onChange={(e) => setFormMemberId(e.target.value)}
                className="w-full rounded-xl border border-white/[0.12] bg-[#090B10] px-3 py-2 text-sm text-[#F5F6FA]"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.passCode})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9299A8]">Plan</label>
              <select
                value={formPlanId}
                onChange={(e) => handlePlanChange(e.target.value)}
                className="w-full rounded-xl border border-white/[0.12] bg-[#090B10] px-3 py-2 text-sm text-[#F5F6FA]"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9299A8]">Amount ($)</label>
              <input
                type="number"
                min="0"
                required
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="w-full rounded-xl border border-white/[0.12] bg-[#090B10] px-3 py-2 text-sm text-[#F5F6FA]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9299A8]">Discount ($)</label>
              <input
                type="number"
                min="0"
                value={formDiscount}
                onChange={(e) => setFormDiscount(e.target.value)}
                className="w-full rounded-xl border border-white/[0.12] bg-[#090B10] px-3 py-2 text-sm text-[#F5F6FA]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9299A8]">Method</label>
              <select
                value={formMethod}
                onChange={(e) => setFormMethod(e.target.value as PaymentMethod)}
                className="w-full rounded-xl border border-white/[0.12] bg-[#090B10] px-3 py-2 text-sm text-[#F5F6FA]"
              >
                <option value="Card">Card</option>
                <option value="Apple Pay">Apple Pay</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9299A8]">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as PaymentStatus)}
                className="w-full rounded-xl border border-white/[0.12] bg-[#090B10] px-3 py-2 text-sm text-[#F5F6FA]"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#9299A8]">Category</label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value as PaymentRecord['category'])}
              className="w-full rounded-xl border border-white/[0.12] bg-[#090B10] px-3 py-2 text-sm text-[#F5F6FA]"
            >
              <option value="Renewal">Renewal</option>
              <option value="New Membership">New Membership</option>
              <option value="Personal Training">Personal Training</option>
              <option value="Corporate">Corporate</option>
            </select>
          </div>
          <div className="flex justify-end gap-2.5 border-t border-white/[0.08] pt-4">
            <button
              type="button"
              onClick={() => setRecordOpen(false)}
              className="rounded-xl border border-white/[0.12] px-4 py-2 text-sm text-[#F5F6FA]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#FF642D] px-5 py-2 text-sm font-semibold text-[#090B10]"
            >
              Save Record
            </button>
          </div>
        </form>
      </Modal>

      {/* Receipt Preview Modal */}
      <Modal
        open={Boolean(receiptPayment)}
        onClose={() => setReceiptPayment(null)}
        title={`Receipt ${receiptPayment?.receiptNo ?? ''}`}
      >
        {receiptPayment && (
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border border-white/[0.09] bg-[#171D28] p-5">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div>
                  <p className="font-display text-base font-bold text-[#F5F6FA]">FITDESK CLUB OS</p>
                  <p className="text-xs text-[#9299A8]">
                    {branches.find((b) => b.id === receiptPayment.branchId)?.name ?? receiptPayment.branchId}
                  </p>
                </div>
                <StatusBadge status={receiptPayment.status} />
              </div>

              <dl className="mt-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <dt className="text-[#9299A8]">Member</dt>
                  <dd className="font-medium text-[#F5F6FA]">
                    {members.find((m) => m.id === receiptPayment.memberId)?.name}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#9299A8]">Plan</dt>
                  <dd className="font-medium text-[#F5F6FA]">
                    {plans.find((pl) => pl.id === receiptPayment.planId)?.name}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#9299A8]">Date</dt>
                  <dd className="tabular-nums text-[#F5F6FA]">{formatDate(receiptPayment.date)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#9299A8]">Payment Method</dt>
                  <dd className="text-[#F5F6FA]">{receiptPayment.method}</dd>
                </div>
                <div className="flex justify-between border-t border-white/[0.08] pt-2.5">
                  <dt className="text-[#9299A8]">Gross Amount</dt>
                  <dd className="tabular-nums">{formatCurrency(receiptPayment.amount)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#9299A8]">Discount</dt>
                  <dd className="tabular-nums text-[#C5F36B]">-{formatCurrency(receiptPayment.discount)}</dd>
                </div>
                <div className="flex justify-between border-t border-white/[0.08] pt-2.5 text-sm font-bold">
                  <dt className="text-[#F5F6FA]">Net Total</dt>
                  <dd className="tabular-nums text-[#F5F6FA]">{formatCurrency(receiptPayment.netAmount)}</dd>
                </div>
              </dl>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.12] px-4 py-2 text-xs font-semibold text-[#F5F6FA]"
              >
                <Printer className="h-4 w-4" />
                Print Receipt
              </button>
              <button
                type="button"
                onClick={() => setReceiptPayment(null)}
                className="rounded-xl bg-[#FF642D] px-4 py-2 text-xs font-semibold text-[#090B10]"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

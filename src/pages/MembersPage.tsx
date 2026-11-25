import React, { useMemo, useState } from 'react';
import {
  BellRing,
  Download,
  LayoutGrid,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Table as TableIcon,
  Trash2,
} from 'lucide-react';
import { useFitDesk } from '../store/useFitDeskStore';
import { Member, MemberStatus, PaymentMethod } from '../types/fitdesk';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/StatusBadge';
import { exportToCsv, formatCurrency, formatDate } from '../utils/csv';

export function MembersPage() {
  const {
    branches,
    members,
    plans,
    payments,
    branchId,
    getDateBounds,
    globalSearch,
    addMember,
    updateMember,
    renewMember,
    deleteMember,
    pushToast,
  } = useFitDesk();

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | MemberStatus>('All');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [dateScope, setDateScope] = useState<'all' | 'range'>('all');

  const [addOpen, setAddOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Add member form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formBranch, setFormBranch] = useState<string>(branches[0]?.id ?? 'downtown');
  const [formPlan, setFormPlan] = useState(plans[0]?.id ?? 'plan-monthly');
  const [formMethod, setFormMethod] = useState<PaymentMethod>('Card');
  const [formDiscount, setFormDiscount] = useState('0');
  const [formEmergency, setFormEmergency] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const query = (search || globalSearch).trim().toLowerCase();
  const { from: dateFrom, to: dateTo } = getDateBounds();

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (branchId !== 'all' && m.branchId !== branchId) return false;
      if (statusFilter !== 'All' && m.status !== statusFilter) return false;
      if (planFilter !== 'all' && m.planId !== planFilter) return false;
      if (dateScope === 'range' && (m.startDate < dateFrom || m.startDate > dateTo)) return false;
      if (!query) return true;
      return (
        m.name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query) ||
        m.passCode.toLowerCase().includes(query) ||
        m.phone.toLowerCase().includes(query)
      );
    });
  }, [members, branchId, statusFilter, planFilter, dateScope, dateFrom, dateTo, query]);

  const selectedMember: Member | null = useMemo(
    () => members.find((m) => m.id === selectedMemberId) ?? null,
    [members, selectedMemberId]
  );

  const selectedMemberPayments = useMemo(
    () => (selectedMember ? payments.filter((p) => p.memberId === selectedMember.id) : []),
    [payments, selectedMember]
  );

  const handleExportCsv = () => {
    const filename =
      dateScope === 'range'
        ? `fitdesk-members-${dateFrom}-to-${dateTo}.csv`
        : 'fitdesk-members-all.csv';
    exportToCsv(
      filename,
      ['Pass ID', 'Name', 'Email', 'Phone', 'Branch', 'Plan', 'Status', 'Start Date', 'Expiry Date'],
      filteredMembers.map((m) => [
        m.passCode,
        m.name,
        m.email,
        m.phone,
        branches.find((b) => b.id === m.branchId)?.name ?? m.branchId,
        plans.find((p) => p.id === m.planId)?.name ?? m.planId,
        m.status,
        m.startDate,
        m.expiryDate,
      ])
    );
    pushToast({ tone: 'success', title: `Exported ${filteredMembers.length} members to CSV` });
  };

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) return;
    addMember({
      name: formName,
      email: formEmail,
      phone: formPhone || '+1 (415) 555-0100',
      branchId: formBranch,
      planId: formPlan,
      paymentMethod: formMethod,
      discount: Number(formDiscount) || 0,
      emergencyContact: formEmergency,
      notes: formNotes,
    });
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormDiscount('0');
    setFormEmergency('');
    setFormNotes('');
    setAddOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wider text-[#FF642D] uppercase">Member Directory</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-[#F5F6FA] sm:text-3xl">
            Memberships ({filteredMembers.length})
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.12] bg-[#11151D] px-3.5 py-2 text-xs font-semibold text-[#F5F6FA] hover:bg-[#171D28] sm:text-sm"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#FF642D] px-4 py-2 text-xs font-semibold text-[#090B10] hover:brightness-110 sm:text-sm"
          >
            <Plus className="h-4 w-4" />
            Add Member
          </button>
        </div>
      </div>

      {/* Filters & View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.09] bg-[#11151D] p-3.5">
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#9299A8]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by name, email, pass ID..."
              aria-label="Filter members"
              className="w-full rounded-xl border border-white/[0.1] bg-[#090B10] py-2 pr-3 pl-9 text-sm text-[#F5F6FA] placeholder:text-[#9299A8] focus:border-[#FF642D] focus:outline-none"
            />
          </div>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'All' | MemberStatus)}
            className="rounded-xl border border-white/[0.1] bg-[#090B10] px-3 py-2 text-xs font-medium text-[#F5F6FA] sm:text-sm"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Expiring Soon">Expiring Soon</option>
            <option value="Expired">Expired</option>
            <option value="Suspended">Suspended</option>
          </select>

          <select
            aria-label="Filter by plan"
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="rounded-xl border border-white/[0.1] bg-[#090B10] px-3 py-2 text-xs font-medium text-[#F5F6FA] sm:text-sm"
          >
            <option value="all">All Plans</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by join date"
            value={dateScope}
            onChange={(e) => setDateScope(e.target.value as 'all' | 'range')}
            className="rounded-xl border border-white/[0.1] bg-[#090B10] px-3 py-2 text-xs font-medium text-[#F5F6FA] sm:text-sm"
          >
            <option value="all">All Join Dates</option>
            <option value="range">Joined in Date Range</option>
          </select>
        </div>

        <div className="flex items-center rounded-xl border border-white/[0.1] bg-[#090B10] p-1">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            aria-label="Card view"
            className={`rounded-lg p-1.5 ${viewMode === 'cards' ? 'bg-[#171D28] text-[#F5F6FA]' : 'text-[#9299A8]'}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            aria-label="Table view"
            className={`rounded-lg p-1.5 ${viewMode === 'table' ? 'bg-[#171D28] text-[#F5F6FA]' : 'text-[#9299A8]'}`}
          >
            <TableIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filteredMembers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.14] bg-[#11151D] p-12 text-center">
          <p className="font-display text-lg font-semibold text-[#F5F6FA]">No members match your filters</p>
          <p className="mt-1 text-sm text-[#9299A8]">Try clearing the search query or switching branch filters.</p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredMembers.map((member) => {
            const plan = plans.find((p) => p.id === member.planId);
            const branch = branches.find((b) => b.id === member.branchId);
            return (
              <article
                key={member.id}
                className="flex flex-col justify-between rounded-2xl border border-white/[0.09] bg-[#171D28] p-5 transition-colors hover:border-white/[0.18]"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="h-12 w-12 rounded-xl object-cover ring-1 ring-white/[0.12]"
                        loading="lazy"
                      />
                      <div>
                        <h2 className="font-display text-base font-semibold text-[#F5F6FA]">{member.name}</h2>
                        <p className="font-mono text-xs text-[#9299A8]">{member.passCode}</p>
                      </div>
                    </div>
                    <StatusBadge status={member.status} />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[#11151D] p-3 text-xs">
                    <div>
                      <p className="text-[#9299A8]">Plan</p>
                      <p className="mt-0.5 font-medium text-[#F5F6FA]">{plan?.name ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[#9299A8]">Branch</p>
                      <p className="mt-0.5 truncate font-medium text-[#F5F6FA]">{branch?.name ?? '—'}</p>
                    </div>
                    <div>
                      <p className="text-[#9299A8]">Start</p>
                      <p className="mt-0.5 text-[#F5F6FA] tabular-nums">{formatDate(member.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-[#9299A8]">Expires</p>
                      <p className="mt-0.5 text-[#F5F6FA] tabular-nums">{formatDate(member.expiryDate)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-white/[0.08] pt-3.5">
                  <button
                    type="button"
                    onClick={() => setSelectedMemberId(member.id)}
                    className="rounded-lg border border-white/[0.12] px-3 py-1.5 text-xs font-semibold text-[#F5F6FA] hover:bg-white/[0.06]"
                  >
                    View Profile
                  </button>
                  <div className="flex items-center gap-1.5">
                    {(member.status === 'Expiring Soon' || member.status === 'Expired') && (
                      <button
                        type="button"
                        onClick={() =>
                          pushToast({
                            tone: 'info',
                            title: 'Renewal reminder sent',
                            description: `Email & SMS reminder dispatched to ${member.email}.`,
                          })
                        }
                        title="Send renewal reminder"
                        className="rounded-lg bg-white/[0.05] p-1.5 text-[#9299A8] hover:text-[#F5F6FA]"
                      >
                        <BellRing className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => renewMember(member.id, member.planId, 'Card')}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#FF642D]/15 px-2.5 py-1.5 text-xs font-semibold text-[#FF642D] hover:bg-[#FF642D]/25"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Renew
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div
          tabIndex={0}
          role="region"
          aria-label="Members directory table"
          className="fitdesk-table-wrapper rounded-2xl border border-white/[0.09] bg-[#171D28]"
        >
          <table className="fitdesk-table fitdesk-table-responsive">
            <thead>
              <tr>
                <th>Member</th>
                <th>Pass ID</th>
                <th>Plan</th>
                <th>Branch</th>
                <th>Status</th>
                <th>Expiry</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((member) => {
                const plan = plans.find((p) => p.id === member.planId);
                const branch = branches.find((b) => b.id === member.branchId);
                return (
                  <tr key={member.id} className="hover:bg-white/[0.02]">
                    <td data-label="Member">
                      <div className="flex items-center gap-3">
                        <img
                          src={member.avatarUrl}
                          alt={member.name}
                          className="h-8 w-8 rounded-lg object-cover"
                          loading="lazy"
                        />
                        <div>
                          <p className="font-medium text-[#F5F6FA]">{member.name}</p>
                          <p className="text-xs text-[#9299A8]">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td data-label="Pass ID" className="font-mono text-xs text-[#9299A8]">
                      {member.passCode}
                    </td>
                    <td data-label="Plan">{plan?.name}</td>
                    <td data-label="Branch" className="text-[#9299A8]">
                      {branch?.name}
                    </td>
                    <td data-label="Status">
                      <StatusBadge status={member.status} />
                    </td>
                    <td data-label="Expiry" className="tabular-nums text-[#9299A8]">
                      {formatDate(member.expiryDate)}
                    </td>
                    <td data-label="Actions" className="text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedMemberId(member.id)}
                        className="rounded-lg border border-white/[0.12] px-2.5 py-1 text-xs font-medium text-[#F5F6FA] hover:bg-white/[0.06]"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Member Modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Onboard New Member"
        subtitle="Assign a membership plan, branch access, and record initial payment."
      >
        <form onSubmit={handleCreateMember} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9299A8]">Full Name *</label>
              <input
                required
                autoFocus
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Jordan Vance"
                className="w-full rounded-xl border border-white/[0.12] bg-[#090B10] px-3 py-2 text-sm text-[#F5F6FA]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9299A8]">Email *</label>
              <input
                required
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="jordan@example.com"
                className="w-full rounded-xl border border-white/[0.12] bg-[#090B10] px-3 py-2 text-sm text-[#F5F6FA]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9299A8]">Phone</label>
              <input
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+1 (415) 555-0192"
                className="w-full rounded-xl border border-white/[0.12] bg-[#090B10] px-3 py-2 text-sm text-[#F5F6FA]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9299A8]">Home Branch</label>
              <select
                value={formBranch}
                onChange={(e) => setFormBranch(e.target.value)}
                className="w-full rounded-xl border border-white/[0.12] bg-[#090B10] px-3 py-2 text-sm text-[#F5F6FA]"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9299A8]">Membership Plan</label>
              <select
                value={formPlan}
                onChange={(e) => setFormPlan(e.target.value)}
                className="w-full rounded-xl border border-white/[0.12] bg-[#090B10] px-3 py-2 text-sm text-[#F5F6FA]"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatCurrency(p.price)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9299A8]">Payment Method</label>
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
              <label className="mb-1.5 block text-xs font-medium text-[#9299A8]">Emergency Contact</label>
              <input
                value={formEmergency}
                onChange={(e) => setFormEmergency(e.target.value)}
                placeholder="Name · Phone"
                className="w-full rounded-xl border border-white/[0.12] bg-[#090B10] px-3 py-2 text-sm text-[#F5F6FA]"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#9299A8]">Training Notes</label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Goals, preferences, or medical notes..."
              className="w-full rounded-xl border border-white/[0.12] bg-[#090B10] px-3 py-2 text-sm text-[#F5F6FA]"
            />
          </div>
          <div className="flex justify-end gap-2.5 border-t border-white/[0.08] pt-4">
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="rounded-xl border border-white/[0.12] px-4 py-2 text-sm font-medium text-[#F5F6FA]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#FF642D] px-5 py-2 text-sm font-semibold text-[#090B10] hover:brightness-110"
            >
              Create Member
            </button>
          </div>
        </form>
      </Modal>

      {/* Member Detail Modal */}
      <Modal
        open={Boolean(selectedMember)}
        onClose={() => setSelectedMemberId(null)}
        title={selectedMember?.name ?? 'Member Profile'}
        subtitle={selectedMember ? `Pass ID ${selectedMember.passCode} · ${selectedMember.email}` : undefined}
        size="lg"
      >
        {selectedMember && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#171D28] p-4">
              <div className="flex items-center gap-4">
                <img
                  src={selectedMember.avatarUrl}
                  alt={selectedMember.name}
                  className="h-16 w-16 rounded-2xl object-cover"
                />
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-display text-lg font-bold text-[#F5F6FA]">{selectedMember.name}</h2>
                    <StatusBadge status={selectedMember.status} />
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-4 text-xs text-[#9299A8]">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" /> {selectedMember.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" /> {selectedMember.phone}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <select
                  aria-label="Update member status"
                  value={selectedMember.status}
                  onChange={(e) =>
                    updateMember(selectedMember.id, { status: e.target.value as MemberStatus })
                  }
                  className="rounded-xl border border-white/[0.12] bg-[#090B10] px-3 py-1.5 text-xs font-medium text-[#F5F6FA]"
                >
                  <option value="Active">Active</option>
                  <option value="Expiring Soon">Expiring Soon</option>
                  <option value="Expired">Expired</option>
                  <option value="Suspended">Suspended</option>
                </select>
                <button
                  type="button"
                  onClick={() => renewMember(selectedMember.id, selectedMember.planId, 'Card')}
                  className="rounded-xl bg-[#FF642D] px-3.5 py-1.5 text-xs font-semibold text-[#090B10]"
                >
                  Renew Now
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/[0.08] bg-[#11151D] p-3.5 text-xs">
                <p className="text-[#9299A8]">Current Plan</p>
                <p className="mt-1 font-display text-sm font-semibold text-[#F5F6FA]">
                  {plans.find((p) => p.id === selectedMember.planId)?.name}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-[#11151D] p-3.5 text-xs">
                <p className="text-[#9299A8]">Membership Window</p>
                <p className="mt-1 font-medium text-[#F5F6FA] tabular-nums">
                  {formatDate(selectedMember.startDate)} → {formatDate(selectedMember.expiryDate)}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-[#11151D] p-3.5 text-xs">
                <p className="text-[#9299A8]">Emergency Contact</p>
                <p className="mt-1 font-medium text-[#F5F6FA]">{selectedMember.emergencyContact}</p>
              </div>
            </div>

            {/* Membership History */}
            <div>
              <h3 className="mb-2.5 font-display text-sm font-semibold text-[#F5F6FA]">Membership History</h3>
              <div className="overflow-hidden rounded-xl border border-white/[0.08]">
                <table className="fitdesk-table">
                  <thead>
                    <tr>
                      <th>Plan</th>
                      <th>Period</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMember.history.map((h) => (
                      <tr key={h.id}>
                        <td className="font-medium text-[#F5F6FA]">{h.planName}</td>
                        <td className="text-xs text-[#9299A8] tabular-nums">
                          {formatDate(h.startDate)} – {formatDate(h.endDate)}
                        </td>
                        <td className="tabular-nums">{formatCurrency(h.amountPaid)}</td>
                        <td className="text-xs text-[#C5F36B]">{h.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Ledger */}
            <div>
              <h3 className="mb-2.5 font-display text-sm font-semibold text-[#F5F6FA]">Payment History</h3>
              <div className="overflow-hidden rounded-xl border border-white/[0.08]">
                <table className="fitdesk-table">
                  <thead>
                    <tr>
                      <th>Receipt</th>
                      <th>Date</th>
                      <th>Method</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMemberPayments.map((p) => (
                      <tr key={p.id}>
                        <td className="font-mono text-xs">{p.receiptNo}</td>
                        <td className="text-xs text-[#9299A8] tabular-nums">{formatDate(p.date)}</td>
                        <td className="text-xs">{p.method}</td>
                        <td className="tabular-nums">{formatCurrency(p.netAmount)}</td>
                        <td>
                          <StatusBadge status={p.status} />
                        </td>
                      </tr>
                    ))}
                    {selectedMemberPayments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center text-xs text-[#9299A8]">
                          No payments recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
              <button
                type="button"
                onClick={() => {
                  deleteMember(selectedMember.id);
                  setSelectedMemberId(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove Member
              </button>
              <button
                type="button"
                onClick={() => setSelectedMemberId(null)}
                className="rounded-xl border border-white/[0.12] px-4 py-1.5 text-xs font-medium text-[#F5F6FA]"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

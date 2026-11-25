import React, { useMemo, useState } from 'react';
import { Check, Edit3, Plus, Users } from 'lucide-react';
import { useFitDesk } from '../store/useFitDeskStore';
import { MembershipPlan } from '../types/fitdesk';
import { Modal } from '../components/ui/Modal';
import { formatCurrency } from '../utils/csv';

export function PlansPage() {
  const { plans, members, branchId, savePlan } = useFitDesk();
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [isNew, setIsNew] = useState(false);

  const subscriberCountByPlan = useMemo(() => {
    const map: Record<string, number> = {};
    members
      .filter((m) => (branchId === 'all' || m.branchId === branchId) && (m.status === 'Active' || m.status === 'Expiring Soon'))
      .forEach((m) => {
        map[m.planId] = (map[m.planId] ?? 0) + 1;
      });
    return map;
  }, [members, branchId]);

  const openNewPlan = () => {
    setIsNew(true);
    setEditingPlan({
      id: `plan-${Date.now()}`,
      name: '',
      tier: 'Performance',
      price: 199,
      durationDays: 30,
      durationLabel: '30 Days',
      description: '',
      features: ['Full club access', 'Recovery suite'],
      benefits: ['Flexible freeze policy'],
      renewalConditions: 'Auto-renews at end of cycle.',
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan || !editingPlan.name.trim()) return;
    savePlan(editingPlan);
    setEditingPlan(null);
    setIsNew(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wider text-[#FF642D] uppercase">Plans &amp; Pricing</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-[#F5F6FA] sm:text-3xl">
            Membership Plans ({plans.length})
          </h1>
        </div>
        <button
          type="button"
          onClick={openNewPlan}
          className="inline-flex items-center gap-2 rounded-xl bg-[#FF642D] px-4 py-2 text-xs font-semibold text-[#090B10] hover:brightness-110 sm:text-sm"
        >
          <Plus className="h-4 w-4" />
          Create Plan
        </button>
      </div>

      {/* Plan Cards */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {plans.map((plan) => {
          const activeSubs = subscriberCountByPlan[plan.id] ?? 0;
          return (
            <article
              key={plan.id}
              className={`flex flex-col justify-between rounded-2xl border p-6 ${
                plan.highlighted
                  ? 'border-[#FF642D]/50 bg-[#171D28]'
                  : 'border-white/[0.09] bg-[#171D28]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md border border-white/[0.1] bg-[#11151D] px-2.5 py-0.5 text-xs font-medium text-[#C5F36B]">
                    {plan.tier}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-[#9299A8] tabular-nums">
                    <Users className="h-3.5 w-3.5" />
                    {activeSubs} active
                  </span>
                </div>

                <div className="mt-4 flex items-baseline justify-between gap-2">
                  <h2 className="font-display text-xl font-bold text-[#F5F6FA]">{plan.name}</h2>
                  <div className="text-right">
                    <span className="font-display text-2xl font-extrabold text-[#F5F6FA] tabular-nums">
                      {formatCurrency(plan.price)}
                    </span>
                    <span className="ml-1 text-xs text-[#9299A8]">/ {plan.durationLabel}</span>
                  </div>
                </div>

                <p className="mt-2.5 text-sm text-[#9299A8]">{plan.description}</p>

                <div className="mt-5 space-y-2 border-t border-white/[0.08] pt-4">
                  <p className="text-xs font-semibold text-[#F5F6FA]">Included Features</p>
                  {plan.features.map((feat) => (
                    <div key={feat} className="flex items-center gap-2 text-xs text-[#9299A8]">
                      <Check className="h-3.5 w-3.5 shrink-0 text-[#C5F36B]" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-1.5">
                  <p className="text-xs font-semibold text-[#F5F6FA]">Member Benefits</p>
                  <div className="flex flex-wrap gap-1.5">
                    {plan.benefits.map((b) => (
                      <span
                        key={b}
                        className="rounded-lg border border-white/[0.08] bg-[#11151D] px-2 py-1 text-[11px] text-[#9299A8]"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="mt-4 rounded-xl bg-[#11151D] p-3 text-[11px] leading-relaxed text-[#9299A8]">
                  <span className="font-semibold text-[#F5F6FA]">Renewal: </span>
                  {plan.renewalConditions}
                </p>
              </div>

              <div className="mt-5 border-t border-white/[0.08] pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsNew(false);
                    setEditingPlan(plan);
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-[#11151D] py-2 text-xs font-semibold text-[#F5F6FA] hover:bg-white/[0.06]"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit Plan Details
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Comparison Matrix */}
      <section className="rounded-2xl border border-white/[0.09] bg-[#171D28] p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-[#F5F6FA]">Plan Comparison Matrix</h2>
        <p className="mb-4 text-xs text-[#9299A8]">Side-by-side breakdown of duration, pricing, and active adoption</p>

        <div tabIndex={0} role="region" aria-label="Plan comparison table" className="fitdesk-table-wrapper">
          <table className="fitdesk-table fitdesk-table-responsive">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Tier</th>
                <th>Duration</th>
                <th>Price</th>
                <th>Active Subscribers</th>
                <th>Renewal Terms</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id}>
                  <td data-label="Plan" className="font-semibold text-[#F5F6FA]">
                    {p.name}
                  </td>
                  <td data-label="Tier" className="text-xs text-[#C5F36B]">
                    {p.tier}
                  </td>
                  <td data-label="Duration" className="text-xs text-[#9299A8]">
                    {p.durationLabel}
                  </td>
                  <td data-label="Price" className="font-semibold tabular-nums">
                    {formatCurrency(p.price)}
                  </td>
                  <td data-label="Subscribers" className="tabular-nums">
                    {subscriberCountByPlan[p.id] ?? 0}
                  </td>
                  <td data-label="Renewal" className="max-w-xs text-xs text-[#9299A8]">
                    {p.renewalConditions}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Edit/Create Plan Modal */}
      <Modal
        open={Boolean(editingPlan)}
        onClose={() => setEditingPlan(null)}
        title={isNew ? 'Create Membership Plan' : `Edit ${editingPlan?.name ?? 'Plan'}`}
      >
        {editingPlan && (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#9299A8]">Plan Name *</label>
                <input
                  required
                  autoFocus
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full rounded-xl border border-white/[0.12] bg-[#090B10] px-3 py-2 text-sm text-[#F5F6FA]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#9299A8]">Price ($)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editingPlan.price}
                  onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/[0.12] bg-[#090B10] px-3 py-2 text-sm text-[#F5F6FA]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#9299A8]">Duration (Days)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editingPlan.durationDays}
                  onChange={(e) =>
                    setEditingPlan({
                      ...editingPlan,
                      durationDays: Number(e.target.value),
                      durationLabel: `${e.target.value} Days`,
                    })
                  }
                  className="w-full rounded-xl border border-white/[0.12] bg-[#090B10] px-3 py-2 text-sm text-[#F5F6FA]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#9299A8]">Tier</label>
                <select
                  value={editingPlan.tier}
                  onChange={(e) =>
                    setEditingPlan({ ...editingPlan, tier: e.target.value as MembershipPlan['tier'] })
                  }
                  className="w-full rounded-xl border border-white/[0.12] bg-[#090B10] px-3 py-2 text-sm text-[#F5F6FA]"
                >
                  <option value="Standard">Standard</option>
                  <option value="Performance">Performance</option>
                  <option value="Executive">Executive</option>
                  <option value="Coaching">Coaching</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9299A8]">Description</label>
              <textarea
                rows={2}
                value={editingPlan.description}
                onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                className="w-full rounded-xl border border-white/[0.12] bg-[#090B10] px-3 py-2 text-sm text-[#F5F6FA]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#9299A8]">Renewal Conditions</label>
              <input
                value={editingPlan.renewalConditions}
                onChange={(e) => setEditingPlan({ ...editingPlan, renewalConditions: e.target.value })}
                className="w-full rounded-xl border border-white/[0.12] bg-[#090B10] px-3 py-2 text-sm text-[#F5F6FA]"
              />
            </div>
            <div className="flex justify-end gap-2.5 border-t border-white/[0.08] pt-4">
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="rounded-xl border border-white/[0.12] px-4 py-2 text-sm text-[#F5F6FA]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#FF642D] px-5 py-2 text-sm font-semibold text-[#090B10]"
              >
                Save Plan
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

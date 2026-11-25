import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  ActivityItem,
  AttendanceRecord,
  Branch,
  BranchId,
  DateRangeOption,
  Member,
  MemberStatus,
  MembershipPlan,
  PaymentMethod,
  PaymentRecord,
  ToastMessage,
} from '../types/fitdesk';
import {
  BRANCHES as INITIAL_BRANCHES,
  INITIAL_ACTIVITIES,
  INITIAL_ATTENDANCE,
  INITIAL_MEMBERS,
  INITIAL_PLANS,
  INITIAL_PAYMENTS,
} from '../data/seedData';
import { addDaysIso, todayIso } from '../utils/csv';

const STORAGE_KEY = 'fitdesk_state_v2';

interface PersistedState {
  branches: Branch[];
  members: Member[];
  plans: MembershipPlan[];
  attendance: AttendanceRecord[];
  payments: PaymentRecord[];
  activities: ActivityItem[];
}

interface FitDeskContextValue extends PersistedState {
  branchId: BranchId;
  setBranchId: (b: BranchId) => void;
  dateRange: DateRangeOption;
  setDateRange: (d: DateRangeOption) => void;
  customFrom: string;
  setCustomFrom: (d: string) => void;
  customTo: string;
  setCustomTo: (d: string) => void;
  getDateBounds: () => { from: string; to: string };
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
  toasts: ToastMessage[];
  pushToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  addBranch: (input: { name: string; city: string; capacity: number }) => Branch;
  deleteBranch: (id: string) => void;
  addMember: (input: {
    name: string;
    email: string;
    phone: string;
    branchId: string;
    planId: string;
    emergencyContact: string;
    paymentMethod: PaymentMethod;
    discount?: number;
    notes?: string;
  }) => Member;
  updateMember: (id: string, patch: Partial<Member>) => void;
  renewMember: (memberId: string, planId: string, method: PaymentMethod, discount?: number) => void;
  deleteMember: (id: string) => void;
  savePlan: (plan: MembershipPlan) => void;
  checkInMember: (memberIdOrCode: string, method: AttendanceRecord['method']) => { ok: boolean; message: string };
  checkOutAttendance: (attendanceId: string) => void;
  recordPayment: (input: {
    memberId: string;
    planId: string;
    amount: number;
    discount: number;
    method: PaymentMethod;
    status: PaymentRecord['status'];
    category: PaymentRecord['category'];
  }) => void;
  markPaymentPaid: (paymentId: string) => void;
  refundPayment: (paymentId: string) => void;
  resetDemoData: () => void;
}

const FitDeskContext = createContext<FitDeskContextValue | null>(null);

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (
        Array.isArray(parsed.members) &&
        Array.isArray(parsed.plans) &&
        Array.isArray(parsed.attendance) &&
        Array.isArray(parsed.payments)
      ) {
        return {
          branches: Array.isArray(parsed.branches) && parsed.branches.length > 0 ? parsed.branches : INITIAL_BRANCHES,
          members: parsed.members,
          plans: parsed.plans,
          attendance: parsed.attendance,
          payments: parsed.payments,
          activities: Array.isArray(parsed.activities) ? parsed.activities : INITIAL_ACTIVITIES,
        };
      }
    }
  } catch {
    // Ignore malformed storage and fall back to seed data
  }
  return {
    branches: INITIAL_BRANCHES,
    members: INITIAL_MEMBERS,
    plans: INITIAL_PLANS,
    attendance: INITIAL_ATTENDANCE,
    payments: INITIAL_PAYMENTS,
    activities: INITIAL_ACTIVITIES,
  };
}

const FALLBACK_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=240&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=240&q=80',
];

export function FitDeskProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(loadInitialState);
  const [branchId, setBranchId] = useState<BranchId>('all');
  const [dateRange, setDateRange] = useState<DateRangeOption>('30d');
  const [customFrom, setCustomFrom] = useState<string>(() => addDaysIso(todayIso(), -30));
  const [customTo, setCustomTo] = useState<string>(() => todayIso());
  const [globalSearch, setGlobalSearch] = useState('');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const getDateBounds = useCallback(() => {
    const today = todayIso();
    if (dateRange === 'custom') {
      return {
        from: customFrom <= customTo ? customFrom : customTo,
        to: customTo >= customFrom ? customTo : customFrom,
      };
    }
    const daysMap: Record<string, number> = {
      today: 0,
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '12m': 365,
    };
    const days = daysMap[dateRange] ?? 30;
    return {
      from: addDaysIso(today, -days),
      to: today,
    };
  }, [dateRange, customFrom, customTo]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const addMember: FitDeskContextValue['addMember'] = useCallback(
    (input) => {
      const plan = state.plans.find((p) => p.id === input.planId) ?? state.plans[0];
      const start = todayIso();
      const expiry = addDaysIso(start, plan.durationDays);
      const id = `mem-${Date.now().toString().slice(-4)}`;
      const passCode = `FD-${Math.floor(1000 + Math.random() * 9000)}`;
      const discount = Math.max(0, input.discount ?? 0);
      const netAmount = Math.max(0, plan.price - discount);

      const newMember: Member = {
        id,
        passCode,
        name: input.name.trim(),
        email: input.email.trim(),
        phone: input.phone.trim(),
        avatarUrl: FALLBACK_AVATARS[state.members.length % FALLBACK_AVATARS.length],
        branchId: input.branchId,
        planId: plan.id,
        status: 'Active',
        startDate: start,
        expiryDate: expiry,
        emergencyContact: input.emergencyContact.trim() || 'Not provided',
        notes: input.notes?.trim(),
        history: [
          {
            id: `h-${Date.now()}`,
            planId: plan.id,
            planName: plan.name,
            startDate: start,
            endDate: expiry,
            amountPaid: netAmount,
            status: 'Current',
          },
        ],
      };

      const newPayment: PaymentRecord = {
        id: `pay-${Date.now()}`,
        receiptNo: `INV-${new Date().getFullYear()}-${Math.floor(200 + Math.random() * 799)}`,
        memberId: id,
        planId: plan.id,
        branchId: input.branchId,
        date: start,
        amount: plan.price,
        discount,
        netAmount,
        status: 'Paid',
        method: input.paymentMethod,
        category: plan.id === 'plan-pt' ? 'Personal Training' : plan.id === 'plan-corporate' ? 'Corporate' : 'New Membership',
      };

      const activity: ActivityItem = {
        id: `act-${Date.now()}`,
        type: 'member',
        title: `${newMember.name} joined ${plan.name}`,
        detail: `Pass ${passCode} · $${netAmount} (${input.paymentMethod})`,
        timestamp: 'Just now',
        branchId: input.branchId,
      };

      setState((prev) => ({
        ...prev,
        members: [newMember, ...prev.members],
        payments: [newPayment, ...prev.payments],
        activities: [activity, ...prev.activities.slice(0, 14)],
      }));

      pushToast({
        tone: 'success',
        title: 'Member onboarded',
        description: `${newMember.name} assigned pass ${passCode} on ${plan.name}.`,
      });

      return newMember;
    },
    [state.plans, state.members.length, pushToast]
  );

  const updateMember: FitDeskContextValue['updateMember'] = useCallback(
    (id, patch) => {
      setState((prev) => ({
        ...prev,
        members: prev.members.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      }));
      pushToast({ tone: 'info', title: 'Member profile updated' });
    },
    [pushToast]
  );

  const renewMember: FitDeskContextValue['renewMember'] = useCallback(
    (memberId, planId, method, discount = 0) => {
      const member = state.members.find((m) => m.id === memberId);
      const plan = state.plans.find((p) => p.id === planId);
      if (!member || !plan) return;

      const today = todayIso();
      const baseStart = member.expiryDate > today ? member.expiryDate : today;
      const newExpiry = addDaysIso(baseStart, plan.durationDays);
      const netAmount = Math.max(0, plan.price - discount);

      const newHistoryEntry = {
        id: `h-${Date.now()}`,
        planId: plan.id,
        planName: plan.name,
        startDate: today,
        endDate: newExpiry,
        amountPaid: netAmount,
        status: 'Current' as const,
      };

      const newPayment: PaymentRecord = {
        id: `pay-${Date.now()}`,
        receiptNo: `INV-${new Date().getFullYear()}-${Math.floor(200 + Math.random() * 799)}`,
        memberId: member.id,
        planId: plan.id,
        branchId: member.branchId,
        date: today,
        amount: plan.price,
        discount,
        netAmount,
        status: 'Paid',
        method,
        category: 'Renewal',
      };

      const activity: ActivityItem = {
        id: `act-${Date.now()}`,
        type: 'renewal',
        title: `${member.name} renewed ${plan.name}`,
        detail: `Extended through ${newExpiry} · $${netAmount}`,
        timestamp: 'Just now',
        branchId: member.branchId,
      };

      setState((prev) => ({
        ...prev,
        members: prev.members.map((m) =>
          m.id === memberId
            ? {
                ...m,
                planId: plan.id,
                status: 'Active' as MemberStatus,
                expiryDate: newExpiry,
                history: [
                  ...m.history.map((h) => (h.status === 'Current' ? { ...h, status: 'Completed' as const } : h)),
                  newHistoryEntry,
                ],
              }
            : m
        ),
        payments: [newPayment, ...prev.payments],
        activities: [activity, ...prev.activities.slice(0, 14)],
      }));

      pushToast({
        tone: 'success',
        title: 'Membership renewed',
        description: `${member.name} is active until ${newExpiry}.`,
      });
    },
    [state.members, state.plans, pushToast]
  );

  const deleteMember: FitDeskContextValue['deleteMember'] = useCallback(
    (id) => {
      setState((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.id !== id),
      }));
      pushToast({ tone: 'info', title: 'Member removed from directory' });
    },
    [pushToast]
  );

  const savePlan: FitDeskContextValue['savePlan'] = useCallback(
    (plan) => {
      setState((prev) => {
        const exists = prev.plans.some((p) => p.id === plan.id);
        return {
          ...prev,
          plans: exists ? prev.plans.map((p) => (p.id === plan.id ? plan : p)) : [...prev.plans, plan],
        };
      });
      pushToast({ tone: 'success', title: `Plan "${plan.name}" saved` });
    },
    [pushToast]
  );

  const checkInMember: FitDeskContextValue['checkInMember'] = useCallback(
    (memberIdOrCode, method) => {
      const q = memberIdOrCode.trim().toLowerCase();
      const member = state.members.find(
        (m) => m.id.toLowerCase() === q || m.passCode.toLowerCase() === q || m.name.toLowerCase() === q
      );
      if (!member) {
        pushToast({ tone: 'error', title: 'Pass not recognized', description: `No member matched "${memberIdOrCode}".` });
        return { ok: false, message: 'Member or pass code not found.' };
      }

      if (member.status === 'Expired' || member.status === 'Suspended') {
        pushToast({
          tone: 'warning',
          title: `Access denied · ${member.status}`,
          description: `${member.name} (${member.passCode}) requires membership renewal or account clearance.`,
        });
        return { ok: false, message: `${member.name}'s membership is ${member.status}.` };
      }

      const today = todayIso();
      const openSession = state.attendance.find(
        (a) => a.memberId === member.id && a.date === today && a.checkOutTime === null
      );
      if (openSession) {
        pushToast({
          tone: 'info',
          title: 'Already checked in',
          description: `${member.name} checked in at ${openSession.checkInTime}.`,
        });
        return { ok: false, message: `${member.name} is already checked in today.` };
      }

      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const record: AttendanceRecord = {
        id: `att-${Date.now()}`,
        memberId: member.id,
        branchId: member.branchId,
        date: today,
        checkInTime: hhmm,
        checkOutTime: null,
        method,
        verified: true,
      };

      const activity: ActivityItem = {
        id: `act-${Date.now()}`,
        type: 'checkin',
        title: `${member.name} checked in`,
        detail: `${method} · Pass ${member.passCode}`,
        timestamp: hhmm,
        branchId: member.branchId,
      };

      setState((prev) => ({
        ...prev,
        attendance: [record, ...prev.attendance],
        activities: [activity, ...prev.activities.slice(0, 14)],
      }));

      pushToast({
        tone: 'success',
        title: 'Check-in verified',
        description: `${member.name} (${member.status}) · ${hhmm}`,
      });
      return { ok: true, message: `${member.name} checked in at ${hhmm}.` };
    },
    [state.members, state.attendance, pushToast]
  );

  const checkOutAttendance: FitDeskContextValue['checkOutAttendance'] = useCallback(
    (attendanceId) => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      setState((prev) => ({
        ...prev,
        attendance: prev.attendance.map((a) => (a.id === attendanceId ? { ...a, checkOutTime: hhmm } : a)),
      }));
      pushToast({ tone: 'info', title: 'Member checked out', description: `Recorded exit at ${hhmm}.` });
    },
    [pushToast]
  );

  const recordPayment: FitDeskContextValue['recordPayment'] = useCallback(
    (input) => {
      const member = state.members.find((m) => m.id === input.memberId);
      if (!member) return;
      const netAmount = Math.max(0, input.amount - input.discount);
      const payment: PaymentRecord = {
        id: `pay-${Date.now()}`,
        receiptNo: `INV-${new Date().getFullYear()}-${Math.floor(200 + Math.random() * 799)}`,
        memberId: member.id,
        planId: input.planId,
        branchId: member.branchId,
        date: todayIso(),
        amount: input.amount,
        discount: input.discount,
        netAmount,
        status: input.status,
        method: input.method,
        category: input.category,
      };
      const activity: ActivityItem = {
        id: `act-${Date.now()}`,
        type: 'payment',
        title: `${input.status === 'Paid' ? 'Payment received' : 'Invoice created'} · ${member.name}`,
        detail: `$${netAmount} (${input.method})`,
        timestamp: 'Just now',
        branchId: member.branchId,
      };
      setState((prev) => ({
        ...prev,
        payments: [payment, ...prev.payments],
        activities: [activity, ...prev.activities.slice(0, 14)],
      }));
      pushToast({
        tone: 'success',
        title: `Receipt ${payment.receiptNo} recorded`,
        description: `$${netAmount} · ${input.status}`,
      });
    },
    [state.members, pushToast]
  );

  const markPaymentPaid: FitDeskContextValue['markPaymentPaid'] = useCallback(
    (paymentId) => {
      setState((prev) => ({
        ...prev,
        payments: prev.payments.map((p) => (p.id === paymentId ? { ...p, status: 'Paid' } : p)),
      }));
      pushToast({ tone: 'success', title: 'Payment settled' });
    },
    [pushToast]
  );

  const refundPayment: FitDeskContextValue['refundPayment'] = useCallback(
    (paymentId) => {
      setState((prev) => ({
        ...prev,
        payments: prev.payments.map((p) => (p.id === paymentId ? { ...p, status: 'Refunded' } : p)),
      }));
      pushToast({ tone: 'warning', title: 'Payment refunded' });
    },
    [pushToast]
  );

  const addBranch: FitDeskContextValue['addBranch'] = useCallback(
    (input) => {
      const slug = input.name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const newBranch: Branch = {
        id: `${slug || 'branch'}-${Date.now().toString().slice(-4)}`,
        name: input.name.trim(),
        city: input.city.trim() || 'Local Club',
        capacity: Math.max(20, input.capacity || 150),
      };
      setState((prev) => ({
        ...prev,
        branches: [...prev.branches, newBranch],
      }));
      pushToast({
        tone: 'success',
        title: `Branch "${newBranch.name}" created`,
        description: `${newBranch.city} · Capacity ${newBranch.capacity}`,
      });
      return newBranch;
    },
    [pushToast]
  );

  const deleteBranch: FitDeskContextValue['deleteBranch'] = useCallback(
    (id) => {
      if (state.branches.length <= 1) {
        pushToast({ tone: 'warning', title: 'At least one branch must remain active' });
        return;
      }
      setState((prev) => ({
        ...prev,
        branches: prev.branches.filter((b) => b.id !== id),
      }));
      if (branchId === id) setBranchId('all');
      pushToast({ tone: 'info', title: 'Branch removed' });
    },
    [state.branches.length, branchId, pushToast]
  );

  const resetDemoData = useCallback(() => {
    const fresh: PersistedState = {
      branches: INITIAL_BRANCHES,
      members: INITIAL_MEMBERS,
      plans: INITIAL_PLANS,
      attendance: INITIAL_ATTENDANCE,
      payments: INITIAL_PAYMENTS,
      activities: INITIAL_ACTIVITIES,
    };
    setState(fresh);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    pushToast({ tone: 'info', title: 'Demo data restored' });
  }, [pushToast]);

  return (
    <FitDeskContext.Provider
      value={{
        ...state,
        branchId,
        setBranchId,
        dateRange,
        setDateRange,
        customFrom,
        setCustomFrom,
        customTo,
        setCustomTo,
        getDateBounds,
        globalSearch,
        setGlobalSearch,
        toasts,
        pushToast,
        dismissToast,
        addBranch,
        deleteBranch,
        addMember,
        updateMember,
        renewMember,
        deleteMember,
        savePlan,
        checkInMember,
        checkOutAttendance,
        recordPayment,
        markPaymentPaid,
        refundPayment,
        resetDemoData,
      }}
    >
      {children}
    </FitDeskContext.Provider>
  );
}

export function useFitDesk() {
  const ctx = useContext(FitDeskContext);
  if (!ctx) {
    throw new Error('useFitDesk must be used inside FitDeskProvider');
  }
  return ctx;
}

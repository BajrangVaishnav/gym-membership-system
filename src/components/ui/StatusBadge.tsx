import { MemberStatus, PaymentStatus } from '../../types/fitdesk';

const MEMBER_STYLES: Record<MemberStatus, { dot: string; bg: string; text: string; border: string }> = {
  Active: {
    dot: 'bg-[#C5F36B]',
    bg: 'bg-[#C5F36B]/10',
    text: 'text-[#C5F36B]',
    border: 'border-[#C5F36B]/25',
  },
  'Expiring Soon': {
    dot: 'bg-[#FF642D]',
    bg: 'bg-[#FF642D]/10',
    text: 'text-[#FF642D]',
    border: 'border-[#FF642D]/25',
  },
  Expired: {
    dot: 'bg-rose-400',
    bg: 'bg-rose-500/10',
    text: 'text-rose-300',
    border: 'border-rose-500/25',
  },
  Suspended: {
    dot: 'bg-[#9299A8]',
    bg: 'bg-white/[0.05]',
    text: 'text-[#9299A8]',
    border: 'border-white/[0.12]',
  },
};

const PAYMENT_STYLES: Record<PaymentStatus, { dot: string; bg: string; text: string; border: string }> = {
  Paid: MEMBER_STYLES.Active,
  Pending: MEMBER_STYLES['Expiring Soon'],
  Refunded: MEMBER_STYLES.Expired,
};

export function StatusBadge({ status }: { status: MemberStatus | PaymentStatus }) {
  const style =
    (MEMBER_STYLES as Record<string, typeof MEMBER_STYLES.Active>)[status] ??
    (PAYMENT_STYLES as Record<string, typeof MEMBER_STYLES.Active>)[status] ??
    MEMBER_STYLES.Suspended;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text} ${style.border}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}

export type BranchId = string;

export interface Branch {
  id: string;
  name: string;
  city: string;
  capacity: number;
}

export type MemberStatus = 'Active' | 'Expiring Soon' | 'Expired' | 'Suspended';

export interface MembershipHistoryEntry {
  id: string;
  planId: string;
  planName: string;
  startDate: string;
  endDate: string;
  amountPaid: number;
  status: 'Completed' | 'Current' | 'Cancelled';
}

export interface Member {
  id: string;
  passCode: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  branchId: Exclude<BranchId, 'all'>;
  planId: string;
  status: MemberStatus;
  startDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  emergencyContact: string;
  notes?: string;
  history: MembershipHistoryEntry[];
}

export interface MembershipPlan {
  id: string;
  name: string;
  tier: 'Standard' | 'Performance' | 'Executive' | 'Coaching' | 'Enterprise';
  price: number;
  durationDays: number;
  durationLabel: string;
  description: string;
  features: string[];
  benefits: string[];
  renewalConditions: string;
  highlighted?: boolean;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  branchId: Exclude<BranchId, 'all'>;
  date: string; // YYYY-MM-DD
  checkInTime: string; // HH:mm
  checkOutTime: string | null; // HH:mm or null if currently in club
  method: 'QR Pass' | 'Front Desk' | 'Mobile App';
  verified: boolean;
}

export type PaymentStatus = 'Paid' | 'Pending' | 'Refunded';
export type PaymentMethod = 'Card' | 'Apple Pay' | 'Bank Transfer' | 'Cash';

export interface PaymentRecord {
  id: string;
  receiptNo: string;
  memberId: string;
  planId: string;
  branchId: Exclude<BranchId, 'all'>;
  date: string; // YYYY-MM-DD
  amount: number;
  discount: number;
  netAmount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  category: 'New Membership' | 'Renewal' | 'Personal Training' | 'Corporate';
}

export interface ActivityItem {
  id: string;
  type: 'checkin' | 'payment' | 'member' | 'renewal' | 'alert';
  title: string;
  detail: string;
  timestamp: string;
  branchId: Exclude<BranchId, 'all'>;
}

export type DateRangeOption = 'today' | '7d' | '30d' | '90d' | '12m' | 'custom';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  tone: 'success' | 'warning' | 'error' | 'info';
}

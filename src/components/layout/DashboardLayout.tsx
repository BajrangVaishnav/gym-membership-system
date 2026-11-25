import React, { useEffect, useState } from 'react';
import {
  Activity,
  Bell,
  Building2,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ExternalLink,
  Layers,
  LayoutDashboard,
  MapPin,
  Menu,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useFitDesk } from '../../store/useFitDeskStore';
import { BranchId, DateRangeOption } from '../../types/fitdesk';
import { Modal } from '../ui/Modal';
import { formatCurrency } from '../../utils/csv';

interface DashboardLayoutProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { route: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { route: '/dashboard/members', label: 'Members', icon: Users },
  { route: '/dashboard/plans', label: 'Membership Plans', icon: Layers },
  { route: '/dashboard/attendance', label: 'Attendance', icon: Activity },
  { route: '/dashboard/payments', label: 'Payments & Finance', icon: CreditCard },
];

export function DashboardLayout({ currentRoute, onNavigate, children }: DashboardLayoutProps) {
  const {
    branches,
    addBranch,
    deleteBranch,
    branchId,
    setBranchId,
    dateRange,
    setDateRange,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    globalSearch,
    setGlobalSearch,
    members,
    payments,
    resetDemoData,
  } = useFitDesk();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [branchesModalOpen, setBranchesModalOpen] = useState(false);

  // New branch form
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCity, setNewBranchCity] = useState('');
  const [newBranchCapacity, setNewBranchCapacity] = useState('200');

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setNotifOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const expiringMembers = members.filter(
    (m) => (branchId === 'all' || m.branchId === branchId) && (m.status === 'Expiring Soon' || m.status === 'Expired')
  );
  const pendingPayments = payments.filter(
    (p) => (branchId === 'all' || p.branchId === branchId) && p.status === 'Pending'
  );
  const alertCount = expiringMembers.length + pendingPayments.length;

  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentRoute !== '/dashboard/members' && currentRoute !== '/dashboard/payments') {
      onNavigate('/dashboard/members');
    }
  };

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;
    const created = addBranch({
      name: newBranchName,
      city: newBranchCity || 'Metropolitan Area',
      capacity: Number(newBranchCapacity) || 200,
    });
    setNewBranchName('');
    setNewBranchCity('');
    setNewBranchCapacity('200');
    setBranchId(created.id);
  };

  const renderNavLinks = (isMobile = false) => (
    <nav aria-label="Dashboard navigation" className="flex-1 space-y-1 px-3 py-4">
      {NAV_ITEMS.map((item) => {
        const active = currentRoute === item.route;
        const isCollapsedDesktop = collapsed && !isMobile;
        return (
          <button
            key={item.route}
            type="button"
            onClick={() => {
              onNavigate(item.route);
              if (isMobile) setMobileOpen(false);
            }}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              isCollapsedDesktop ? 'justify-center px-0' : ''
            } ${
              active
                ? 'border border-[#FF642D]/30 bg-[#FF642D]/15 text-[#FF642D]'
                : 'border border-transparent text-[#9299A8] hover:bg-white/[0.05] hover:text-[#F5F6FA]'
            }`}
            title={isCollapsedDesktop ? item.label : undefined}
            aria-label={isCollapsedDesktop ? item.label : undefined}
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" />
            {!isCollapsedDesktop && <span className="truncate">{item.label}</span>}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-[#090B10] text-[#F5F6FA]">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden shrink-0 flex-col border-r border-white/[0.09] bg-[#11151D] transition-all duration-300 lg:flex ${
          collapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        {/* Sidebar Header: stacks cleanly when collapsed so logo & toggle never overlap */}
        <div
          className={`flex border-b border-white/[0.09] ${
            collapsed
              ? 'flex-col items-center justify-center gap-2 py-3 px-2'
              : 'h-16 flex-row items-center justify-between px-4'
          }`}
        >
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2.5 overflow-hidden text-left"
            title="FITDESK Home"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FF642D] font-display text-xs font-extrabold text-[#090B10]">
              FD
            </span>
            {!collapsed && (
              <span className="font-display text-base font-bold tracking-tight text-[#F5F6FA]">FITDESK</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-[#171D28] text-[#9299A8] transition-colors hover:border-white/[0.2] hover:text-[#F5F6FA]"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {renderNavLinks(false)}

        <div className="space-y-1 border-t border-white/[0.09] p-3">
          <button
            type="button"
            onClick={() => setBranchesModalOpen(true)}
            title={collapsed ? 'Manage Branches' : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-[#9299A8] transition-colors hover:bg-white/[0.05] hover:text-[#F5F6FA] ${
              collapsed ? 'justify-center px-0' : ''
            }`}
          >
            <Building2 className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Manage Branches</span>}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('/')}
            title={collapsed ? 'View Landing Page' : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-[#9299A8] transition-colors hover:bg-white/[0.05] hover:text-[#F5F6FA] ${
              collapsed ? 'justify-center px-0' : ''
            }`}
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            {!collapsed && <span>View Landing Page</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-white/[0.12] bg-[#11151D] shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-white/[0.09] px-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF642D] font-display text-xs font-extrabold text-[#090B10]">
                  FD
                </span>
                <span className="font-display text-base font-bold text-[#F5F6FA]">FITDESK</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
                className="rounded-lg p-1.5 text-[#9299A8] hover:bg-white/[0.06] hover:text-[#F5F6FA]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderNavLinks(true)}
            <div className="space-y-2 border-t border-white/[0.09] p-4">
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  setBranchesModalOpen(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl border border-white/[0.1] px-3 py-2.5 text-sm text-[#F5F6FA]"
              >
                <Building2 className="h-4 w-4" />
                Manage Branches
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onNavigate('/');
                }}
                className="flex w-full items-center gap-2.5 rounded-xl border border-white/[0.1] px-3 py-2.5 text-sm text-[#F5F6FA]"
              >
                <ExternalLink className="h-4 w-4" />
                Back to Landing Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.09] bg-[#090B10]/90 px-4 py-3 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="rounded-xl border border-white/[0.1] bg-[#11151D] p-2 text-[#F5F6FA] lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <form onSubmit={handleGlobalSearchSubmit} className="relative hidden sm:block">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#9299A8]" />
              <input
                type="search"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search members, pass ID, receipts..."
                aria-label="Global search"
                className="w-60 rounded-xl border border-white/[0.1] bg-[#11151D] py-2 pr-3 pl-9 text-sm text-[#F5F6FA] placeholder:text-[#9299A8] focus:border-[#FF642D] focus:outline-none md:w-72"
              />
            </form>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Branch Selector + Quick Create Branch */}
            <div className="flex items-center gap-1">
              <div className="relative flex items-center">
                <Building2 className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[#9299A8]" />
                <select
                  aria-label="Select branch"
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value as BranchId)}
                  className="appearance-none rounded-xl border border-white/[0.1] bg-[#11151D] py-2 pr-8 pl-8 text-xs font-medium text-[#F5F6FA] focus:border-[#FF642D] focus:outline-none sm:text-sm"
                >
                  <option value="all">All Branches ({branches.length})</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-[#9299A8]" />
              </div>
              <button
                type="button"
                onClick={() => setBranchesModalOpen(true)}
                title="Create or manage branches"
                aria-label="Create or manage branches"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.1] bg-[#11151D] text-[#9299A8] transition-colors hover:border-[#FF642D]/50 hover:text-[#FF642D]"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Date Range / Duration Selector */}
            <div className="relative flex items-center">
              <Calendar className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[#9299A8]" />
              <select
                aria-label="Select date range"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRangeOption)}
                className="appearance-none rounded-xl border border-white/[0.1] bg-[#11151D] py-2 pr-7 pl-8 text-xs font-medium text-[#F5F6FA] focus:border-[#FF642D] focus:outline-none sm:text-sm"
              >
                <option value="today">Today</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="12m">Last 12 months</option>
                <option value="custom">Custom Dates</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-[#9299A8]" />
            </div>

            {dateRange === 'custom' && (
              <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.1] bg-[#11151D] px-2.5 py-1">
                <input
                  type="date"
                  aria-label="From date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="bg-transparent text-xs text-[#F5F6FA] focus:outline-none"
                />
                <span className="text-xs text-[#9299A8]">→</span>
                <input
                  type="date"
                  aria-label="To date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="bg-transparent text-xs text-[#F5F6FA] focus:outline-none"
                />
              </div>
            )}

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((o) => !o);
                  setProfileOpen(false);
                }}
                aria-label="Notifications"
                className="relative rounded-xl border border-white/[0.1] bg-[#11151D] p-2 text-[#9299A8] transition-colors hover:text-[#F5F6FA]"
              >
                <Bell className="h-4.5 w-4.5" />
                {alertCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF642D] px-1 text-[10px] font-bold text-[#090B10]">
                    {alertCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-white/[0.12] bg-[#171D28] p-3 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                    <span className="font-display text-sm font-semibold text-[#F5F6FA]">Club Alerts</span>
                    <span className="text-xs text-[#9299A8]">{alertCount} actionable</span>
                  </div>
                  <div className="mt-2 max-h-72 space-y-2 overflow-y-auto">
                    {expiringMembers.slice(0, 3).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setNotifOpen(false);
                          onNavigate('/dashboard/members');
                        }}
                        className="w-full rounded-xl bg-[#11151D] p-2.5 text-left transition-colors hover:bg-white/[0.05]"
                      >
                        <p className="text-xs font-medium text-[#F5F6FA]">
                          {m.name} · <span className="text-[#FF642D]">{m.status}</span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#9299A8]">Expiry: {m.expiryDate}</p>
                      </button>
                    ))}
                    {pendingPayments.slice(0, 3).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setNotifOpen(false);
                          onNavigate('/dashboard/payments');
                        }}
                        className="w-full rounded-xl bg-[#11151D] p-2.5 text-left transition-colors hover:bg-white/[0.05]"
                      >
                        <p className="text-xs font-medium text-[#F5F6FA]">
                          Pending invoice {p.receiptNo}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#9299A8]">
                          Amount due: {formatCurrency(p.netAmount)}
                        </p>
                      </button>
                    ))}
                    {alertCount === 0 && (
                      <p className="py-4 text-center text-xs text-[#9299A8]">All clubs operating smoothly.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((o) => !o);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-[#11151D] py-1.5 pr-2.5 pl-2 text-left transition-colors hover:border-white/[0.2]"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#C5F36B] text-[11px] font-bold text-[#090B10]">
                  BV
                </span>
                <span className="hidden text-xs font-medium text-[#F5F6FA] md:inline">Club Admin</span>
                <ChevronDown className="h-3.5 w-3.5 text-[#9299A8]" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/[0.12] bg-[#171D28] p-2 shadow-2xl">
                  <div className="border-b border-white/[0.08] px-3 py-2">
                    <p className="text-xs font-semibold text-[#F5F6FA]">FitDesk Operations</p>
                    <p className="text-[11px] text-[#9299A8]">admin@fitdesk.club</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      setBranchesModalOpen(true);
                    }}
                    className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-[#F5F6FA] hover:bg-white/[0.06]"
                  >
                    <Building2 className="h-3.5 w-3.5 text-[#9299A8]" />
                    Manage Branches
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      onNavigate('/');
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-[#F5F6FA] hover:bg-white/[0.06]"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-[#9299A8]" />
                    Open Landing Page
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      resetDemoData();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-[#FF642D] hover:bg-white/[0.06]"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset Demo Data
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {/* Branches Management Modal */}
      <Modal
        open={branchesModalOpen}
        onClose={() => setBranchesModalOpen(false)}
        title="Club Branches"
        subtitle="Create new gym locations or manage existing branches."
        size="lg"
      >
        <div className="space-y-6">
          <div className="space-y-2.5">
            {branches.map((branch) => {
              const memberCount = members.filter((m) => m.branchId === branch.id).length;
              return (
                <div
                  key={branch.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-[#171D28] p-3.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF642D]/15 text-[#FF642D]">
                      <Building2 className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="font-display text-sm font-semibold text-[#F5F6FA]">{branch.name}</p>
                      <p className="flex items-center gap-1.5 text-xs text-[#9299A8]">
                        <MapPin className="h-3 w-3" />
                        {branch.city} · Capacity {branch.capacity}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-[#11151D] px-2.5 py-1 text-xs text-[#C5F36B] tabular-nums">
                      {memberCount} members
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setBranchId(branch.id);
                        setBranchesModalOpen(false);
                      }}
                      className="rounded-lg border border-white/[0.12] px-2.5 py-1 text-xs font-medium text-[#F5F6FA] hover:bg-white/[0.06]"
                    >
                      Select
                    </button>
                    {branches.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteBranch(branch.id)}
                        aria-label={`Delete ${branch.name}`}
                        className="rounded-lg p-1.5 text-[#9299A8] hover:bg-rose-500/10 hover:text-rose-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleCreateBranch} className="space-y-4 border-t border-white/[0.08] pt-5">
            <h2 className="font-display text-sm font-semibold text-[#F5F6FA]">Add New Branch</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs text-[#9299A8]">Branch Name *</label>
                <input
                  required
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="SoHo Performance Club"
                  className="w-full rounded-xl border border-white/[0.12] bg-[#090B10] px-3 py-2 text-sm text-[#F5F6FA]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#9299A8]">City / Location</label>
                <input
                  value={newBranchCity}
                  onChange={(e) => setNewBranchCity(e.target.value)}
                  placeholder="New York, NY"
                  className="w-full rounded-xl border border-white/[0.12] bg-[#090B10] px-3 py-2 text-sm text-[#F5F6FA]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#9299A8]">Max Capacity</label>
                <input
                  type="number"
                  min="20"
                  value={newBranchCapacity}
                  onChange={(e) => setNewBranchCapacity(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.12] bg-[#090B10] px-3 py-2 text-sm text-[#F5F6FA]"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF642D] px-4 py-2 text-xs font-semibold text-[#090B10] hover:brightness-110 sm:text-sm"
              >
                <Plus className="h-4 w-4" />
                Create Branch
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}

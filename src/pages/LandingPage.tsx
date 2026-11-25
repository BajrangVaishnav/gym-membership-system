import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Check,
  CreditCard,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useFitDesk } from '../store/useFitDeskStore';
import { AnimatedCounter } from '../components/ui/AnimatedCounter';
import { MembershipCard3D } from '../components/three/MembershipCard3D';
import { formatCurrency, todayIso } from '../utils/csv';

const DumbbellScene = React.lazy(() =>
  import('../components/three/DumbbellScene').then((m) => ({ default: m.DumbbellScene }))
);

gsap.registerPlugin(ScrollTrigger);

interface LandingPageProps {
  onNavigate: (route: string) => void;
}

const HORIZONTAL_MODULES = [
  {
    tag: '01 / Intelligence',
    title: 'Real-Time Club Telemetry',
    desc: 'Track active headcount, branch capacity, renewal velocity, and daily check-in peaks across every location from one command surface.',
    metric: '99.4% Uptime',
    icon: BarChart3,
  },
  {
    tag: '02 / Access Control',
    title: 'Instant QR & Pass Verification',
    desc: 'Sub-second check-in validation automatically blocks expired or suspended passes while logging entry and exit timestamps.',
    metric: '< 0.4s Scan',
    icon: QrCode,
  },
  {
    tag: '03 / Retention',
    title: 'Automated Renewal Radar',
    desc: 'Surface expiring memberships 14 days ahead with one-click plan upgrades, freeze controls, and instant receipt generation.',
    metric: '94% Retention',
    icon: ShieldCheck,
  },
  {
    tag: '04 / Finance',
    title: 'Transparent Revenue Ledger',
    desc: 'Reconcile card, Apple Pay, and corporate bank transfers with discount tracking, refunds, and exportable CSV statements.',
    metric: 'Zero Leakage',
    icon: CreditCard,
  },
];

export function LandingPage({ onNavigate }: LandingPageProps) {
  const { members, plans, attendance, payments } = useFitDesk();
  const rootRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const stats = useMemo(() => {
    const activeCount = members.filter((m) => m.status === 'Active' || m.status === 'Expiring Soon').length;
    const todayCount = attendance.filter((a) => a.date === todayIso()).length;
    const paidRevenue = payments
      .filter((p) => p.status === 'Paid')
      .reduce((sum, p) => sum + p.netAmount, 0);
    const renewalRate = members.length ? Math.round((activeCount / members.length) * 100) : 0;
    return { activeCount, todayCount, paidRevenue, renewalRate };
  }, [members, attendance, payments]);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      // Hero entrance
      gsap.from('.hero-stagger', {
        y: 28,
        opacity: 0,
        duration: 0.85,
        stagger: 0.1,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      });

      // Scroll-driven 3D rotation progress across hero + intro
      ScrollTrigger.create({
        trigger: '#hero-section',
        start: 'top top',
        end: 'bottom top',
        scrub: 0.6,
        onUpdate: (self) => setScrollProgress(self.progress),
      });

      // Parallax background image
      gsap.to('.hero-parallax-bg', {
        yPercent: 18,
        ease: 'none',
        scrollTrigger: {
          trigger: '#hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });

      // Staggered section reveals
      gsap.utils.toArray<HTMLElement>('.reveal-group').forEach((group) => {
        const items = group.querySelectorAll('.reveal-item');
        if (items.length === 0) return;
        gsap.from(items, {
          y: 26,
          opacity: 0,
          duration: 0.7,
          stagger: 0.1,
          ease: 'power2.out',
          clearProps: 'transform,opacity',
          scrollTrigger: {
            trigger: group,
            start: 'top 82%',
            once: true,
          },
        });
      });
    }, rootRef);

    return () => {
      ctx.revert();
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return (
    <div ref={rootRef} className="min-h-screen bg-[#090B10] text-[#F5F6FA]">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#090B10]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a href="#hero-section" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF642D] font-display text-sm font-extrabold text-[#090B10]">
              FD
            </span>
            <div>
              <span className="font-display text-base font-bold tracking-tight text-[#F5F6FA]">FITDESK</span>
              <span className="ml-2 hidden rounded-md border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-[#9299A8] sm:inline-block">
                CLUB OS
              </span>
            </div>
          </a>

          <nav aria-label="Primary navigation" className="hidden items-center gap-7 text-sm text-[#9299A8] md:flex">
            <a href="#platform-showcase" className="transition-colors hover:text-[#F5F6FA]">
              Platform
            </a>
            <a href="#architecture-track" className="transition-colors hover:text-[#F5F6FA]">
              Capabilities
            </a>
            <a href="#plans-preview" className="transition-colors hover:text-[#F5F6FA]">
              Plans
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/dashboard/members')}
              className="hidden rounded-xl border border-white/[0.12] px-4 py-2 text-sm font-medium text-[#F5F6FA] transition-colors hover:bg-white/[0.06] sm:inline-flex"
            >
              Members
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/dashboard')}
              className="inline-flex items-center gap-2 rounded-xl bg-[#FF642D] px-4 py-2 text-sm font-semibold text-[#090B10] transition-transform hover:brightness-110 active:scale-[0.98]"
            >
              Open Dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero-section" className="relative overflow-hidden border-b border-white/[0.08]">
        {/* Architectural dark gym photography with subtle parallax */}
        <div
          aria-hidden="true"
          className="hero-parallax-bg pointer-events-none absolute inset-0 -top-12 bg-cover bg-center opacity-25"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1800&q=80')",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#090B10]/70 via-[#090B10]/85 to-[#090B10]"
        />
        {/* Subtle directional studio rim glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 right-1/4 h-96 w-96 rounded-full bg-[#FF642D]/12 blur-[120px]"
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-24">
          <div className="lg:col-span-6">
            <div className="hero-stagger inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-[#11151D]/90 px-3.5 py-1.5 text-xs font-medium text-[#C5F36B]">
              <Sparkles className="h-3.5 w-3.5" />
              Precision Club Operations · Multi-Branch Ready
            </div>

            <h1 className="hero-stagger mt-6 font-display text-4xl font-extrabold tracking-tight text-[#F5F6FA] sm:text-5xl lg:text-6xl lg:leading-[1.05]">
              TRAIN HARDER.
              <span className="block text-[#FF642D]">MANAGE SMARTER.</span>
            </h1>

            <p className="hero-stagger mt-5 max-w-xl text-base leading-relaxed text-[#9299A8] sm:text-lg">
              One intelligent platform to manage memberships, attendance, payments and your entire fitness business.
            </p>

            <div className="hero-stagger mt-8 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={() => onNavigate('/dashboard')}
                className="inline-flex items-center gap-2 rounded-xl bg-[#FF642D] px-6 py-3.5 text-sm font-semibold text-[#090B10] shadow-[0_12px_32px_rgba(255,100,45,0.28)] transition-all hover:brightness-110"
              >
                Explore Dashboard
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('/dashboard/members')}
                className="inline-flex items-center gap-2 rounded-xl border border-white/[0.14] bg-[#11151D]/90 px-6 py-3.5 text-sm font-semibold text-[#F5F6FA] transition-colors hover:bg-[#171D28]"
              >
                Manage Memberships
              </button>
            </div>

            {/* Live KPI Strip */}
            <div className="hero-stagger mt-12 grid grid-cols-3 gap-4 border-t border-white/[0.09] pt-8">
              <div>
                <p className="text-xs text-[#9299A8]">Active Members</p>
                <p className="mt-1 font-display text-2xl font-bold text-[#F5F6FA] sm:text-3xl">
                  <AnimatedCounter value={stats.activeCount} />
                </p>
              </div>
              <div>
                <p className="text-xs text-[#9299A8]">Today&apos;s Check-ins</p>
                <p className="mt-1 font-display text-2xl font-bold text-[#C5F36B] sm:text-3xl">
                  <AnimatedCounter value={stats.todayCount} />
                </p>
              </div>
              <div>
                <p className="text-xs text-[#9299A8]">Retention Rate</p>
                <p className="mt-1 font-display text-2xl font-bold text-[#F5F6FA] sm:text-3xl">
                  <AnimatedCounter value={stats.renewalRate} suffix="%" />
                </p>
              </div>
            </div>
          </div>

          {/* 3D Equipment Stage */}
          <div className="relative lg:col-span-6">
            <div className="relative h-[380px] w-full overflow-hidden rounded-3xl border border-white/[0.09] bg-[#11151D]/65 backdrop-blur-sm sm:h-[460px]">
              <Suspense
                fallback={
                  <div className="flex h-full items-center justify-center text-sm text-[#9299A8]">
                    Loading 3D studio scene...
                  </div>
                }
              >
                <DumbbellScene scrollProgress={scrollProgress} />
              </Suspense>

              {/* Floating Membership Telemetry Overlay */}
              <div className="pointer-events-none absolute top-4 left-4 rounded-xl border border-white/[0.1] bg-[#090B10]/80 px-3.5 py-2.5 backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs text-[#9299A8]">
                  <span className="h-2 w-2 rounded-full bg-[#C5F36B]" />
                  Live Club Revenue
                </div>
                <p className="mt-0.5 font-display text-lg font-bold text-[#F5F6FA] tabular-nums">
                  {formatCurrency(stats.paidRevenue)}
                </p>
              </div>

              <div className="pointer-events-none absolute right-4 bottom-4 rounded-xl border border-white/[0.1] bg-[#090B10]/80 px-3.5 py-2.5 backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs text-[#9299A8]">
                  <Activity className="h-3.5 w-3.5 text-[#FF642D]" />
                  Interactive 3D Equipment
                </div>
                <p className="mt-0.5 text-xs text-[#F5F6FA]">Move pointer or scroll to inspect</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Visual Section: Digital Member Pass & Operational Flow */}
      <section id="platform-showcase" className="reveal-group border-b border-white/[0.08] py-20 lg:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <p className="text-xs font-semibold tracking-wider text-[#FF642D] uppercase">
                Member Experience
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold text-[#F5F6FA] sm:text-4xl">
                Built for flagship clubs and high-volume studios.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#9299A8] sm:text-base">
                Every member receives a verifiable pass ID linked directly to their plan tier, branch access, and payment status.
              </p>
              <div className="mt-8 flex justify-center lg:justify-start">
                <MembershipCard3D />
              </div>
            </div>
          </div>

          <div className="space-y-5 lg:col-span-7">
            {[
              {
                icon: Users,
                title: 'Unified Member Directory',
                body: 'Filter across Downtown Flagship, Westside Studio, and Marina Athletic in milliseconds. Inspect full membership history, emergency contacts, and payment ledgers in one drawer.',
              },
              {
                icon: QrCode,
                title: 'Verified Check-In & Peak-Hour Analytics',
                body: 'Validate pass codes at the front desk or turnstile. Expired or suspended accounts are flagged immediately before floor entry, while hourly utilization charts reveal peak demand.',
              },
              {
                icon: CreditCard,
                title: 'Audit-Ready Financial Operations',
                body: 'Track monthly revenue, pending invoices, discounts, and refunds with zero spreadsheet guesswork. Generate printable receipts and export clean CSV reports anytime.',
              },
            ].map((item) => (
              <article
                key={item.title}
                className="reveal-item rounded-2xl border border-white/[0.09] bg-[#11151D] p-7 transition-colors hover:border-white/[0.18]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.1] bg-[#171D28] text-[#FF642D]">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold text-[#F5F6FA]">{item.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#9299A8]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Responsive Four Pillars Feature Showcase */}
      <section
        id="architecture-track"
        className="reveal-group border-b border-white/[0.08] bg-[#11151D]/50 py-20"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-wider text-[#C5F36B] uppercase">
                Operational Architecture
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-[#F5F6FA] sm:text-4xl">
                Four pillars. Zero friction.
              </h2>
            </div>
            <p className="text-sm text-[#9299A8]">Built for multi-branch scale</p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {HORIZONTAL_MODULES.map((mod) => (
              <div
                key={mod.title}
                className="reveal-item flex flex-col rounded-2xl border border-white/[0.09] bg-[#171D28] p-6 transition-colors hover:border-white/[0.18]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-[#9299A8]">{mod.tag}</span>
                  <span className="shrink-0 rounded-full border border-[#C5F36B]/25 bg-[#C5F36B]/10 px-2.5 py-0.5 text-xs font-medium text-[#C5F36B]">
                    {mod.metric}
                  </span>
                </div>
                <div className="mt-6 flex h-11 w-11 items-center justify-center rounded-xl bg-[#090B10] text-[#FF642D]">
                  <mod.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-[#F5F6FA]">{mod.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-[#9299A8]">{mod.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Membership Plans Preview */}
      <section id="plans-preview" className="reveal-group py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-wider text-[#FF642D] uppercase">
                Membership Tiers
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-[#F5F6FA] sm:text-4xl">
                Structured plans that scale retention
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/dashboard/plans')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#C5F36B] hover:underline"
            >
              Compare all {plans.length} plans
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.slice(0, 3).map((plan) => (
              <div
                key={plan.id}
                className={`reveal-item flex flex-col rounded-2xl border p-7 ${
                  plan.highlighted
                    ? 'border-[#FF642D]/50 bg-[#171D28]'
                    : 'border-white/[0.09] bg-[#11151D]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#9299A8]">{plan.tier}</span>
                  <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-xs text-[#F5F6FA]">
                    {plan.durationLabel}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-2xl font-bold text-[#F5F6FA]">{plan.name}</h3>
                <p className="mt-2 text-sm text-[#9299A8]">{plan.description}</p>
                <p className="mt-6 font-display text-3xl font-extrabold text-[#F5F6FA] tabular-nums">
                  {formatCurrency(plan.price)}
                </p>
                <ul className="mt-6 flex-1 space-y-2.5 border-t border-white/[0.09] pt-5 text-sm text-[#9299A8]">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 shrink-0 text-[#C5F36B]" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => onNavigate('/dashboard/plans')}
                  className="mt-7 w-full rounded-xl border border-white/[0.12] bg-[#090B10] py-2.5 text-sm font-semibold text-[#F5F6FA] transition-colors hover:bg-white/[0.06]"
                >
                  Configure Plan
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-[#11151D]/60 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF642D] font-display text-xs font-extrabold text-[#090B10]">
              FD
            </span>
            <span className="font-display text-sm font-bold text-[#F5F6FA]">FITDESK</span>
            <span className="text-xs text-[#9299A8]">· Personal-Use-Only License</span>
          </div>
          <div className="flex flex-wrap gap-6 text-xs text-[#9299A8]">
            <button type="button" onClick={() => onNavigate('/dashboard')} className="hover:text-[#F5F6FA]">
              Dashboard
            </button>
            <button type="button" onClick={() => onNavigate('/dashboard/members')} className="hover:text-[#F5F6FA]">
              Members
            </button>
            <button type="button" onClick={() => onNavigate('/dashboard/attendance')} className="hover:text-[#F5F6FA]">
              Attendance
            </button>
            <button type="button" onClick={() => onNavigate('/dashboard/payments')} className="hover:text-[#F5F6FA]">
              Payments
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

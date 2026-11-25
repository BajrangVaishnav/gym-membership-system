import React, { useRef, useState } from 'react';
import { QrCode, ShieldCheck } from 'lucide-react';

interface MembershipCard3DProps {
  memberName?: string;
  tier?: string;
  passCode?: string;
  branch?: string;
  validThru?: string;
}

export function MembershipCard3D({
  memberName = 'Elena Rostova',
  tier = 'Executive Annual',
  passCode = 'FD-8841',
  branch = 'Downtown Flagship',
  validThru = '12 / 27',
}: MembershipCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 4, ry: -8, gx: 50, gy: 35 });

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTilt({
      rx: (0.5 - y) * 18,
      ry: (x - 0.5) * 22,
      gx: x * 100,
      gy: y * 100,
    });
  };

  const handleLeave = () => {
    setTilt({ rx: 4, ry: -8, gx: 50, gy: 35 });
  };

  return (
    <div className="perspective-1200 w-full max-w-[380px]">
      <div
        ref={cardRef}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
          backgroundImage: `radial-gradient(circle at ${tilt.gx}% ${tilt.gy}%, rgba(255, 100, 45, 0.16), transparent 55%), linear-gradient(135deg, #1A2130 0%, #0D1118 65%, #161C28 100%)`,
        }}
        className="preserve-3d relative aspect-[1.586/1] w-full rounded-2xl border border-white/[0.15] p-6 shadow-[0_30px_70px_rgba(0,0,0,0.65)] transition-transform duration-200 ease-out"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#FF642D]" />
              <span className="font-display text-sm font-bold tracking-wider text-[#F5F6FA]">FITDESK</span>
            </div>
            <p className="mt-1 text-[11px] font-medium text-[#C5F36B]">{tier}</p>
          </div>
          <div className="rounded-lg border border-white/[0.1] bg-white/[0.04] p-2 text-[#F5F6FA]">
            <QrCode className="h-6 w-6" />
          </div>
        </div>

        <div className="mt-8 flex items-end justify-between">
          <div>
            <p className="text-[11px] text-[#9299A8]">Member</p>
            <p className="font-display text-base font-semibold text-[#F5F6FA]">{memberName}</p>
            <p className="mt-0.5 text-xs text-[#9299A8]">{branch}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-[#9299A8]">Pass ID</p>
            <p className="font-mono text-sm font-semibold text-[#F5F6FA] tabular-nums">{passCode}</p>
            <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-[#C5F36B]">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="tabular-nums">Thru {validThru}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

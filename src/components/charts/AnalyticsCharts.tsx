import { useState } from 'react';
import { formatCurrency } from '../../utils/csv';

export interface SeriesPoint {
  label: string;
  value: number;
  secondary?: number;
}

export function InteractiveBarChart({
  data,
  height = 210,
  accentColor = '#FF642D',
  secondaryColor = '#C5F36B',
  valueFormatter = (v: number) => String(v),
  primaryLabel = 'Primary',
  secondaryLabel = 'Secondary',
}: {
  data: SeriesPoint[];
  height?: number;
  accentColor?: string;
  secondaryColor?: string;
  valueFormatter?: (v: number) => string;
  primaryLabel?: string;
  secondaryLabel?: string;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxVal = Math.max(
    1,
    ...data.map((d) => Math.max(d.value, d.secondary ?? 0))
  );

  return (
    <div className="relative w-full select-none">
      <div
        className="flex items-end gap-2 sm:gap-3"
        style={{ height }}
        role="img"
        aria-label={`${primaryLabel} chart`}
      >
        {data.map((point, idx) => {
          const primaryPct = Math.max(4, Math.round((point.value / maxVal) * 100));
          const secondaryPct =
            point.secondary !== undefined
              ? Math.max(4, Math.round((point.secondary / maxVal) * 100))
              : null;
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={point.label}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="group relative flex h-full flex-1 flex-col items-center justify-end"
            >
              {isHovered && (
                <div className="pointer-events-none absolute -top-2 z-10 -translate-y-full whitespace-nowrap rounded-lg border border-white/[0.14] bg-[#090B10] px-2.5 py-1.5 text-xs shadow-xl">
                  <p className="font-medium text-[#F5F6FA]">{point.label}</p>
                  <p className="text-[#9299A8] tabular-nums">
                    {primaryLabel}: <span className="font-semibold text-[#F5F6FA]">{valueFormatter(point.value)}</span>
                  </p>
                  {point.secondary !== undefined && (
                    <p className="text-[#9299A8] tabular-nums">
                      {secondaryLabel}:{' '}
                      <span className="font-semibold text-[#C5F36B]">{valueFormatter(point.secondary)}</span>
                    </p>
                  )}
                </div>
              )}

              <div className="flex h-full w-full items-end justify-center gap-1 pt-6">
                <div
                  className="w-full max-w-[26px] rounded-t-md transition-all duration-300"
                  style={{
                    height: `${primaryPct}%`,
                    backgroundColor: accentColor,
                    opacity: hoveredIdx === null || isHovered ? 0.92 : 0.45,
                  }}
                />
                {secondaryPct !== null && (
                  <div
                    className="w-full max-w-[16px] rounded-t-md transition-all duration-300"
                    style={{
                      height: `${secondaryPct}%`,
                      backgroundColor: secondaryColor,
                      opacity: hoveredIdx === null || isHovered ? 0.85 : 0.4,
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-white/[0.08] pt-2.5">
        {data.map((point) => (
          <span key={point.label} className="flex-1 truncate text-center text-[11px] text-[#9299A8]">
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function PeakHoursChart({ data }: { data: { hour: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="w-full">
      <div className="flex h-40 items-end gap-1.5 sm:gap-2">
        {data.map((item, idx) => {
          const pct = Math.max(6, Math.round((item.count / max) * 100));
          const isPeak = item.count === max && item.count > 0;
          return (
            <div
              key={item.hour}
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
              className="relative flex h-full flex-1 flex-col items-center justify-end"
            >
              {hovered === idx && (
                <div className="pointer-events-none absolute -top-1 z-10 -translate-y-full whitespace-nowrap rounded-md border border-white/[0.14] bg-[#090B10] px-2 py-1 text-[11px] text-[#F5F6FA] shadow-lg tabular-nums">
                  {item.hour} · {item.count} check-ins
                </div>
              )}
              <div
                className="w-full rounded-t transition-all duration-200"
                style={{
                  height: `${pct}%`,
                  backgroundColor: isPeak ? '#C5F36B' : '#263042',
                  opacity: hovered === null || hovered === idx ? 1 : 0.5,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between gap-1 text-[10px] text-[#9299A8]">
        {data.map((item, i) => (
          <span key={item.hour} className="flex-1 text-center tabular-nums">
            {i % 2 === 0 ? item.hour : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

export function RevenueByPlanList({
  items,
}: {
  items: { name: string; revenue: number; share: number }[];
}) {
  return (
    <div className="space-y-3.5">
      {items.map((item, idx) => (
        <div key={item.name}>
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#F5F6FA]">{item.name}</span>
            <span className="text-[#9299A8] tabular-nums">
              {formatCurrency(item.revenue)} · {item.share}%
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#090B10]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${item.share}%`,
                backgroundColor: idx === 0 ? '#FF642D' : idx === 1 ? '#C5F36B' : '#4E5B73',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useFitDesk } from '../../store/useFitDeskStore';

const TONE_ICON = {
  success: <CheckCircle2 className="h-4 w-4 text-[#C5F36B]" />,
  warning: <AlertTriangle className="h-4 w-4 text-[#FF642D]" />,
  error: <XCircle className="h-4 w-4 text-rose-400" />,
  info: <Info className="h-4 w-4 text-sky-400" />,
};

export function ToastContainer() {
  const { toasts, dismissToast } = useFitDesk();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-2.5"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 rounded-xl border border-white/[0.12] bg-[#171D28]/95 p-3.5 shadow-2xl backdrop-blur-md"
        >
          <div className="mt-0.5 shrink-0">{TONE_ICON[toast.tone]}</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#F5F6FA]">{toast.title}</p>
            {toast.description && <p className="mt-0.5 text-xs text-[#9299A8]">{toast.description}</p>}
          </div>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
            className="rounded p-1 text-[#9299A8] hover:bg-white/[0.06] hover:text-[#F5F6FA]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

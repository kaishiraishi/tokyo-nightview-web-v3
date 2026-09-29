import type { ReactNode } from 'react';

type PrototypeCardProps = {
    title: string;
    subtitle: string;
    isUpdating?: boolean;
    children: ReactNode;
};

export function PrototypeCard({ title, subtitle, isUpdating = false, children }: PrototypeCardProps) {
    return (
        <div className="relative rounded-2xl border border-white/10 bg-zinc-950/90 p-3 shadow-2xl backdrop-blur-xl">
            <div className="px-1">
                <div className="text-xs font-bold tracking-wider text-white/80">{title}</div>
                <p className="mt-0.5 text-[11px] text-white/40">{subtitle}</p>
            </div>
            <div className={`mt-2 overflow-hidden rounded-xl transition-opacity ${isUpdating ? 'opacity-45' : ''}`}>{children}</div>
            {isUpdating && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center text-xs font-semibold text-white/80">更新中…</div>
            )}
        </div>
    );
}

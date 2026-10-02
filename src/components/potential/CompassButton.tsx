import { useEffect, useRef, useState } from 'react';
import type { DeviceHeadingStatus } from '../../hooks/useDeviceHeading';
import { glassPanel } from '../../styles/ui';

type CompassButtonProps = {
    status: DeviceHeadingStatus;
    heading: number | null;
    lowAccuracy: boolean;
    error: string | null;
    isSupported: boolean;
    onStart: () => void;
    onStop: () => void;
    className?: string;
};

function unavailableReason(status: DeviceHeadingStatus, error: string | null, isSupported: boolean): string | null {
    if (error) return error;
    if (!isSupported || status === 'unsupported') return 'この端末ではコンパスを利用できません';
    if (status === 'denied') return 'コンパスの利用が許可されていません';
    if (status === 'error') return 'コンパスを開始できませんでした';
    return null;
}

export function CompassButton({
    status,
    heading,
    lowAccuracy,
    error,
    isSupported,
    onStart,
    onStop,
    className,
}: CompassButtonProps) {
    const [notice, setNotice] = useState<string | null>(null);
    const noticeTimerRef = useRef<number | null>(null);
    const isActive = status === 'active';
    const isRequesting = status === 'requesting';
    const isEngaged = isActive || isRequesting;
    const reason = unavailableReason(status, error, isSupported);
    const isUnavailable = reason !== null;
    const rotation = heading ?? 0;

    useEffect(() => {
        return () => {
            if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current);
        };
    }, []);

    const showNotice = (message: string) => {
        if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current);
        setNotice(message);
        noticeTimerRef.current = window.setTimeout(() => {
            noticeTimerRef.current = null;
            setNotice(null);
        }, 3200);
    };

    const handleClick = () => {
        if (isEngaged) {
            onStop();
            return;
        }
        if (isUnavailable) {
            showNotice(reason);
            // Open the full-screen status view as well, so denied/unsupported states are explained in context.
            onStart();
            return;
        }
        onStart();
    };

    const tone = isActive
        ? 'border-violet-300/45 bg-violet-700/80 text-violet-50'
        : isRequesting
            ? 'border-violet-300/35 bg-violet-900/75 text-violet-100'
            : isUnavailable
                ? 'border-white/10 bg-black/60 text-white/35'
                : 'border-white/10 bg-black/60 text-white/85 hover:border-white/20 hover:bg-white/10';

    return (
        <div className={`relative ${className ?? ''}`}>
            {notice && (
                <div
                    role="status"
                    aria-live="polite"
                    className="pointer-events-none absolute bottom-[calc(100%+0.5rem)] right-0 z-[7000] w-max max-w-[240px] rounded-lg border border-white/15 bg-black/85 px-3 py-2 text-right text-[11px] leading-relaxed text-white/85 shadow-lg backdrop-blur-md"
                >
                    {notice}
                </div>
            )}
            <button
                type="button"
                onClick={handleClick}
                aria-label={isEngaged ? 'コンパスを停止' : 'コンパスを開始'}
                aria-pressed={isEngaged}
                aria-disabled={isUnavailable}
                aria-busy={isRequesting}
                title={isUnavailable ? reason ?? undefined : undefined}
                className={`${glassPanel} group relative grid h-[var(--btn-h)] w-[var(--btn-h)] place-items-center rounded-full shadow-lg transition-all duration-200 active:scale-95 ${tone}`}
            >
                <svg
                    viewBox="0 0 32 32"
                    className={`h-6 w-6 transition-opacity ${isRequesting ? 'animate-pulse' : ''}`}
                    aria-hidden="true"
                >
                    <circle
                        cx="16"
                        cy="16"
                        r="11.5"
                        fill={isActive ? 'rgba(196, 181, 253, 0.16)' : 'none'}
                        stroke="currentColor"
                        strokeWidth="1.5"
                    />
                    <path
                        d="M16 4.5v3M27.5 16h-3M16 27.5v-3M4.5 16h3"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeWidth="1.25"
                        opacity={isUnavailable ? 0.6 : 0.9}
                    />
                    <g transform={`rotate(${-rotation} 16 16)`}>
                        <path
                            d="M20.75 8.75 16 16 8.75 20.75 13.5 13.5Z"
                            fill={isActive ? '#ddd6fe' : 'none'}
                            stroke="currentColor"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                        />
                        <path
                            d="M20.75 8.75 16 16 13.5 13.5Z"
                            fill={isActive ? '#7c3aed' : 'none'}
                            stroke="currentColor"
                            strokeLinejoin="round"
                            strokeWidth="1.25"
                        />
                    </g>
                    {isRequesting && (
                        <circle
                            cx="16"
                            cy="16"
                            r="14"
                            fill="none"
                            stroke="currentColor"
                            strokeDasharray="10 78"
                            strokeLinecap="round"
                            strokeWidth="1.5"
                            className="origin-center animate-spin"
                        />
                    )}
                </svg>
                {lowAccuracy && isActive && (
                    <span
                        className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.8)]"
                        title="方位の精度が低い状態です"
                        aria-hidden="true"
                    />
                )}
            </button>
        </div>
    );
}

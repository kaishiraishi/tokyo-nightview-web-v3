import { Compass } from '../ui/icons';
import type { DeviceHeadingStatus } from '../../hooks/useDeviceHeading';
import { glassPanel } from '../../styles/ui';

export type CompassControlProps = {
    enabled: boolean;
    onToggle: () => void;
    status: DeviceHeadingStatus;
    heading: number | null;
    lowAccuracy: boolean;
    error: string | null;
    isSupported: boolean;
};

function statusLabel(status: DeviceHeadingStatus, error: string | null, isSupported: boolean): string {
    if (!isSupported || status === 'unsupported') return error ?? 'この端末ではコンパスを利用できません';
    switch (status) {
        case 'requesting':
            return '許可を確認中…';
        case 'active':
            return '端末の向きに連動中';
        case 'denied':
            return error ?? 'コンパスの利用が許可されていません';
        case 'error':
            return error ?? 'コンパスを開始できませんでした';
        case 'off':
            return '北上表示';
    }
}

export function CompassControl({ enabled, onToggle, status, heading, lowAccuracy, error, isSupported }: CompassControlProps) {
    const disabled = !isSupported || status === 'unsupported';
    const displayHeading = heading === null ? '—' : `${Math.round(heading)}°`;

    return (
        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <div className="flex items-center justify-between gap-2">
                <button
                    type="button"
                    onClick={onToggle}
                    disabled={disabled}
                    aria-pressed={enabled}
                    aria-label={enabled ? 'コンパスを停止' : 'コンパスを開始'}
                    className={`${glassPanel} inline-flex min-h-9 items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                        enabled ? 'border-violet-300/40 bg-violet-700/75 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                    } ${disabled ? 'cursor-not-allowed opacity-45' : ''}`}
                >
                    <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>コンパス</span>
                    <span className="text-[10px] text-white/55">{enabled ? 'ON' : 'OFF'}</span>
                </button>
                <span className="tabular-nums text-[11px] text-white/55" aria-live="polite">
                    {displayHeading}
                </span>
            </div>
            <p className="mt-1.5 text-[10px] leading-relaxed text-white/45">{statusLabel(status, error, isSupported)}</p>
            {lowAccuracy && status === 'active' && (
                <p className="mt-1 text-[10px] leading-relaxed text-amber-200/80">精度が低い場合は、端末を8の字に振って補正してください</p>
            )}
            <p className="mt-1 text-[10px] leading-relaxed text-white/35">端末の向きは画面の回転にだけ使い、保存・送信しません</p>
        </div>
    );
}

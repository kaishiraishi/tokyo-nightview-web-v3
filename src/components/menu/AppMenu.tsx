import {
  X,
  ChevronRight,
  MapPin,
  Heart,
  Image,
  Settings,
  BookOpen,
  History,
  Mail,
  User,
  ChevronLeft,
} from '../ui/icons';
import { type ReactNode, useState } from 'react';
import type { FanConfig } from '../map/types';
import { PanelViewSelector, type PanelView } from '../potential/PanelViewSelector';
import { glassPanel, textMuted, textPrimary } from '../../styles/ui';

type AppMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  displayName: string;
  memberId: string;
  foundCount: number;
  favoriteCount: number;
  postCount: number;
  onViewPosts?: () => void;
  fanConfig?: FanConfig;
  onFanConfigChange?: (config: FanConfig) => void;
  panelView?: PanelView;
  onPanelViewChange?: (panelView: PanelView) => void;
  debugMode?: boolean;
  onDebugModeChange?: (enabled: boolean) => void;
};

export function AppMenu({
  isOpen,
  onClose,
  displayName,
  memberId,
  foundCount,
  favoriteCount,
  postCount,
  onViewPosts,
  fanConfig,
  onFanConfigChange,
  panelView,
  onPanelViewChange,
  debugMode,
  onDebugModeChange,
}: AppMenuProps) {
  const [activeView, setActiveView] = useState<'main' | 'settings'>('main');

  if (!isOpen) return null;

  const hasPanelViewSetting = panelView !== undefined && onPanelViewChange !== undefined;
  const hasFanConfigSetting = fanConfig !== undefined && onFanConfigChange !== undefined;
  const hasDebugModeSetting = debugMode !== undefined && onDebugModeChange !== undefined;

  const handleClose = () => {
    setActiveView('main');
    onClose();
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-[6000] flex items-center justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={(event) => {
          event.stopPropagation();
          handleClose();
        }}
      />

      <div className={`${glassPanel} relative w-full max-w-md overflow-hidden rounded-[2.5rem] text-white shadow-2xl animate-in fade-in zoom-in duration-200`}>
        <div className="flex max-h-[90vh] flex-col">
          <div className="relative flex items-center justify-center border-b border-white/10 px-6 py-5">
            {activeView === 'settings' && (
              <button
                type="button"
                onClick={() => setActiveView('main')}
                className="absolute left-6 flex h-11 w-11 min-h-11 min-w-11 items-center justify-center rounded-full bg-white/5 transition-all hover:bg-white/10"
                aria-label="メニューに戻る"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <h2 className={`text-lg font-bold tracking-tight ${textPrimary}`}>
              {activeView === 'main' ? 'メニュー' : '設定'}
            </h2>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleClose();
              }}
              className="absolute right-6 flex h-11 w-11 min-h-11 min-w-11 items-center justify-center rounded-full bg-white/10 transition-all hover:bg-white/20 hover:scale-110 active:scale-90"
              aria-label="メニューを閉じる"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
            {activeView === 'main' ? (
              <>
                <div className="mb-6 flex items-center gap-4 px-2">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-xl font-bold ${textPrimary}`}>
                    {displayName?.charAt(0) || <User size={24} />}
                  </div>
                  <div>
                    <div className={`text-base font-semibold ${textPrimary}`}>{displayName}</div>
                    <div className={`text-xs ${textMuted}`}>Member ID: {memberId}</div>
                  </div>
                </div>

                <div className="mb-8 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-xl">
                  <div className="flex justify-around text-center">
                    <div className="flex flex-col items-center">
                      <div className={`text-3xl font-black tabular-nums tracking-tighter ${textPrimary}`}>{foundCount}</div>
                      <div className={`text-[10px] font-extrabold uppercase tracking-[0.2em] ${textMuted}`}>発見</div>
                    </div>
                    <div className="h-12 w-px self-center bg-white/10" />
                    <div className="flex flex-col items-center">
                      <div className={`text-3xl font-black tabular-nums tracking-tighter ${textPrimary}`}>{favoriteCount}</div>
                      <div className={`text-[10px] font-extrabold uppercase tracking-[0.2em] ${textMuted}`}>お気に入り</div>
                    </div>
                    <div className="h-12 w-px self-center bg-white/10" />
                    <div className="flex flex-col items-center">
                      <div className={`text-3xl font-black tabular-nums tracking-tighter ${textPrimary}`}>{postCount}</div>
                      <div className={`text-[10px] font-extrabold uppercase tracking-[0.2em] ${textMuted}`}>投稿</div>
                    </div>
                  </div>
                </div>

                <div className="mb-6 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.03] shadow-inner">
                  <MenuRow icon={<MapPin size={20} className={textMuted} />} label="最近見つけた夜景" value={foundCount} />
                  <MenuRow icon={<Heart size={20} className={textMuted} />} label="お気に入り" value={favoriteCount} />
                  <MenuRow
                    icon={<Image size={20} className={textMuted} />}
                    label="投稿"
                    value={postCount}
                    onClick={() => {
                      onViewPosts?.();
                      onClose();
                    }}
                    isLast
                  />
                </div>

                <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.03] shadow-inner">
                  <MenuRow icon={<Settings size={20} className={textMuted} />} label="設定" onClick={() => setActiveView('settings')} />
                  <MenuRow icon={<BookOpen size={20} className={textMuted} />} label="はじめてガイド" />
                  <MenuRow icon={<History size={20} className={textMuted} />} label="利用履歴" status="未完了" />
                  <MenuRow icon={<Mail size={20} className={textMuted} />} label="お問い合わせ" status="未完了" isLast />
                </div>
              </>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                {hasPanelViewSetting && (
                  <section>
                    <h3 className={`mb-3 px-2 text-sm font-semibold ${textPrimary}`}>方向・距離の表示</h3>
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 shadow-inner">
                      <p className={`mb-4 px-1 text-xs leading-relaxed ${textMuted}`}>
                        地図上で表示する方向・距離パネルを選択できます。
                      </p>
                      <PanelViewSelector value={panelView} onChange={onPanelViewChange} />
                    </div>
                  </section>
                )}

                {hasFanConfigSetting && (
                  <section>
                    <h3 className={`mb-3 px-2 text-sm font-semibold ${textPrimary}`}>スキャン設定</h3>
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 shadow-inner">
                      <div className={`mb-2 text-xs ${textMuted}`}>Ray Count</div>
                      <div className={`flex items-center justify-between text-base font-semibold ${textPrimary}`}>
                        <span>{fanConfig.rayCount}</span>
                        <span className={`text-xs ${textMuted}`}>rays</span>
                      </div>

                      <div className={`mb-3 mt-6 text-xs ${textMuted}`}>解析密度（Ray Spacing）</div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: '詳細', value: 10 },
                          { label: 'ノーマル', value: 30 },
                          { label: 'あらめ', value: 60 },
                        ].map((preset) => (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() => {
                              onFanConfigChange({
                                ...fanConfig,
                                deltaTheta: preset.value,
                              });
                            }}
                            className={`flex min-h-11 flex-col items-center justify-center rounded-2xl border px-2 py-3 transition-all ${
                              fanConfig.deltaTheta === preset.value
                                ? 'border-violet-700 bg-violet-700 text-white shadow-lg shadow-violet-700/20'
                                : 'border-white/10 bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/90'
                            }`}
                          >
                            <span className="text-xs font-bold">{preset.label}</span>
                            <span className={`mt-0.5 text-[10px] ${fanConfig.deltaTheta === preset.value ? 'text-white/60' : textMuted}`}>
                              {preset.value}°
                            </span>
                          </button>
                        ))}
                      </div>
                      <p className={`mt-4 px-1 text-[11px] leading-relaxed ${textMuted}`}>
                        Ray Spacingを小さくすると解析が精細になりますが、読み込みに時間がかかる場合があります。
                      </p>
                    </div>
                  </section>
                )}

                {hasDebugModeSetting && (
                  <section>
                    <h3 className={`mb-3 px-2 text-sm font-semibold ${textPrimary}`}>デバッグモード</h3>
                    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 shadow-inner">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={debugMode}
                        onClick={() => onDebugModeChange(!debugMode)}
                        className="flex min-h-11 w-full items-center justify-between gap-4 px-1 text-left"
                      >
                        <span className={`text-xs leading-relaxed ${textMuted}`}>
                          選択地点の Google ストリートビューへのリンクなど、開発用の表示を出します。
                        </span>
                        <span
                          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${debugMode ? 'bg-violet-700' : 'bg-white/15'}`}
                          aria-hidden="true"
                        >
                          <span
                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${debugMode ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
                          />
                        </span>
                      </button>
                    </div>
                  </section>
                )}

                {!hasPanelViewSetting && !hasFanConfigSetting && !hasDebugModeSetting && (
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
                    <div className={`text-sm font-semibold ${textPrimary}`}>夜景ポテンシャルマップ</div>
                    <p className={`mt-2 text-xs leading-relaxed ${textMuted}`}>
                      地図の色の濃淡から、夜景を見つけやすいエリアを確認できます。レイヤー設定は地図上の表示レイヤー設定から変更できます。
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className={`mt-8 text-center text-[10px] uppercase tracking-[0.2em] ${textMuted}`}>
              Tokyo Nightview Web v2
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuRow({
  icon,
  label,
  value,
  status,
  isLast,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value?: number;
  status?: string;
  isLast?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-11 w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/5 ${!isLast ? 'border-b border-white/10' : ''}`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">{icon}</div>
      <span className={`flex-1 text-sm font-medium ${textPrimary}`}>{label}</span>
      <div className="flex items-center gap-2">
        {value !== undefined && <span className={`text-sm font-semibold ${textMuted}`}>{value}</span>}
        {status && <span className={`rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold ${textMuted}`}>{status}</span>}
        <ChevronRight size={16} className={textMuted} />
      </div>
    </button>
  );
}

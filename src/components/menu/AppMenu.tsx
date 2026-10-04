import {
  X,
  ChevronRight,
  Heart,
  Image,
  Settings,
  BookOpen,
  ChevronLeft,
  User,
} from '../ui/icons';
import { type ReactNode, useState } from 'react';
import type { FanConfig } from '../map/types';
import { PanelViewSelector, type PanelView } from '../potential/PanelViewSelector';
import type { FavoritePlace } from '../../lib/favorites';
import { FavoritesView } from './FavoritesView';
import { PostsView } from './PostsView';
import type { Post } from '../../lib/postsApi';
import { GuideView } from './GuideView';
import { AccountView } from './AccountView';
import { DataAndAboutSettings } from './DataAndAboutSettings';
import { readDemoAccount } from '../../lib/demoAccount';
import { closeButton, glassSurface, textMuted, textPrimary } from '../../styles/ui';
import buildings3dExample from '../../assets/settings/buildings-3d.webp';

type MenuView = 'main' | 'settings' | 'favorites' | 'posts' | 'guide' | 'account';

const VIEW_TITLES: Record<MenuView, string> = {
  main: 'メニュー',
  settings: '設定',
  favorites: 'お気に入り',
  posts: '夜景の投稿',
  guide: 'はじめてガイド',
  account: 'アカウント',
};

type AppMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  // 投稿の件数。投稿モードに入るまで投稿は読み込まないので、まだ分からないときは undefined（件数を出さない）
  postCount?: number;
  // お気に入り（端末内保存）。渡されないとき（旧 TopBar）はお気に入りの行を出さない
  favorites?: FavoritePlace[];
  onSelectFavorite?: (favorite: FavoritePlace) => void;
  onRemoveFavorite?: (id: string) => void;
  onAddCurrentLocationFavorite?: () => void;
  isLocatingFavorite?: boolean;
  favoriteLocateError?: string | null;
  // 「投稿を見る」: 投稿モードに切り替える（投稿の読み込みが始まる）。一覧（posts と onSelectPost）があればメニューの中に一覧を開く
  onViewPosts?: () => void;
  posts?: Post[];
  isPostUnlocked?: (post: Post) => boolean;
  onSelectPost?: (post: Post) => void;
  fanConfig?: FanConfig;
  onFanConfigChange?: (config: FanConfig) => void;
  panelView?: PanelView;
  onPanelViewChange?: (panelView: PanelView) => void;
  debugMode?: boolean;
  onDebugModeChange?: (enabled: boolean) => void;
  // 確認用: 着いていない投稿も全部見る（デバッグモードのときだけ出す）
  revealAllPosts?: boolean;
  onRevealAllPostsChange?: (enabled: boolean) => void;
  buildingsEnabled?: boolean;
  onBuildingsEnabledChange?: (enabled: boolean) => void;
  headingSensorOn?: boolean;
  onHeadingSensorChange?: (enabled: boolean) => void;
  // 許可が拒否された・センサーがない、などで開始できなかった理由
  headingSensorNote?: string | null;
};

export function AppMenu({
  isOpen,
  onClose,
  postCount,
  favorites,
  onSelectFavorite,
  onRemoveFavorite,
  onAddCurrentLocationFavorite,
  isLocatingFavorite = false,
  favoriteLocateError = null,
  onViewPosts,
  posts,
  isPostUnlocked,
  onSelectPost,
  fanConfig,
  onFanConfigChange,
  panelView,
  onPanelViewChange,
  debugMode,
  onDebugModeChange,
  revealAllPosts,
  onRevealAllPostsChange,
  buildingsEnabled,
  onBuildingsEnabledChange,
  headingSensorOn,
  onHeadingSensorChange,
  headingSensorNote,
}: AppMenuProps) {
  const [activeView, setActiveView] = useState<MenuView>('main');

  if (!isOpen) return null;

  const hasPanelViewSetting = panelView !== undefined && onPanelViewChange !== undefined;
  const hasFanConfigSetting = fanConfig !== undefined && onFanConfigChange !== undefined;
  const hasDebugModeSetting = debugMode !== undefined && onDebugModeChange !== undefined;
  const hasBuildingsSetting = buildingsEnabled !== undefined && onBuildingsEnabledChange !== undefined;
  const hasHeadingSensorSetting = headingSensorOn !== undefined && onHeadingSensorChange !== undefined;
  const hasPostList = posts !== undefined && isPostUnlocked !== undefined && onSelectPost !== undefined;
  const hasFavorites = favorites !== undefined && onSelectFavorite !== undefined && onRemoveFavorite !== undefined && onAddCurrentLocationFavorite !== undefined;

  const handleClose = () => {
    setActiveView('main');
    onClose();
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-[6000] flex items-center justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-ui-fade"
        onClick={(event) => {
          event.stopPropagation();
          handleClose();
        }}
      />

      <div className={`${glassSurface} relative w-full max-w-md overflow-hidden rounded-[28px] text-white animate-ui-pop`}>
        <div className="flex max-h-[90vh] flex-col">
          <div className="relative flex items-center justify-center border-b border-white/10 px-6 py-5">
            {activeView !== 'main' && (
              <button
                type="button"
                onClick={() => setActiveView('main')}
                className={`absolute left-6 ${closeButton}`}
                aria-label="メニューに戻る"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <h2 className={`text-lg font-bold tracking-tight ${textPrimary}`}>
              {VIEW_TITLES[activeView]}
            </h2>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleClose();
              }}
              className={`absolute right-6 ${closeButton}`}
              aria-label="メニューを閉じる"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
            {activeView === 'main' && (
              // アカウントがないので、プロフィールや架空の数字は出さない。数字は実際の件数だけ
              <div className="space-y-6 animate-ui-view">
                <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.03] shadow-inner">
                  {/* アカウント（デモ）。開くたびに読み直す（アカウントのページで変えた表示名を反映する） */}
                  <MenuRow
                    icon={<User size={20} className={textMuted} />}
                    label={readDemoAccount()?.displayName ?? 'ログイン（デモ）'}
                    onClick={() => setActiveView('account')}
                    isLast
                  />
                </div>

                <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.03] shadow-inner">
                  {hasFavorites && (
                    <MenuRow
                      icon={<Heart size={20} className={textMuted} />}
                      label="お気に入り"
                      value={favorites.length}
                      onClick={() => setActiveView('favorites')}
                    />
                  )}
                  <MenuRow
                    icon={<Image size={20} className={textMuted} />}
                    label="投稿を見る"
                    value={postCount}
                    onClick={() => {
                      onViewPosts?.();
                      if (hasPostList) setActiveView('posts');
                      else handleClose();
                    }}
                    isLast
                  />
                </div>

                <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.03] shadow-inner">
                  <MenuRow icon={<BookOpen size={20} className={textMuted} />} label="はじめてガイド" onClick={() => setActiveView('guide')} />
                  <MenuRow icon={<Settings size={20} className={textMuted} />} label="設定" onClick={() => setActiveView('settings')} isLast />
                </div>
              </div>
            )}

            {activeView === 'favorites' && hasFavorites && (
              <div className="animate-ui-view">
              <FavoritesView
                favorites={favorites}
                onSelect={(favorite) => {
                  onSelectFavorite(favorite);
                  handleClose();
                }}
                onRemove={onRemoveFavorite}
                onAddCurrentLocation={onAddCurrentLocationFavorite}
                isLocating={isLocatingFavorite}
                locateError={favoriteLocateError}
              />
              </div>
            )}

            {activeView === 'posts' && hasPostList && (
              <div className="animate-ui-view">
                <PostsView
                  posts={posts}
                  isUnlocked={isPostUnlocked}
                  onSelect={(post) => {
                    onSelectPost(post);
                    handleClose();
                  }}
                />
              </div>
            )}

            {activeView === 'account' && (
              <div className="animate-ui-view">
                <AccountView />
              </div>
            )}

            {activeView === 'guide' && (
              <div className="animate-ui-view">
                <GuideView />
              </div>
            )}

            {activeView === 'settings' && (
              <div className="space-y-6 animate-ui-view">
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

                {hasHeadingSensorSetting && (
                  <SettingSwitch
                    title="向きセンサー"
                    description="端末の向きに合わせて、左上のコンパスを回し、向いている方向を扇形で表示します。端末の向きは画面の表示にだけ使い、保存・送信しません。"
                    note={headingSensorNote}
                    checked={headingSensorOn}
                    onChange={onHeadingSensorChange}
                  />
                )}

                {hasBuildingsSetting && (
                  <SettingSwitch
                    title="3D 建物"
                    description="拡大したときに PLATEAU の建物を立体で表示します。オフにすると地図が軽くなります。"
                    // 見本はこのアプリの地図を撮影したもの（東京駅・丸の内付近、z16・傾き 62°）。建物の見た目を変えたら撮り直す
                    image={{ src: buildings3dExample, alt: '3D 建物の表示例。東京駅・丸の内付近の高層ビルが立体で並んでいる' }}
                    checked={buildingsEnabled}
                    onChange={onBuildingsEnabledChange}
                  />
                )}

                {hasDebugModeSetting && (
                  <SettingSwitch
                    title="デバッグモード"
                    description="地図をタップしてピンを立て、その地点を調べられます（ストリートビューへのリンクも出ます）。オフでは現在地が中心です。"
                    checked={debugMode}
                    onChange={onDebugModeChange}
                  />
                )}

                {debugMode && revealAllPosts !== undefined && onRevealAllPostsChange !== undefined && (
                  <SettingSwitch
                    title="すべての投稿を見る（確認用）"
                    description="投稿は、その場所の 100m 以内に着くまで写真と正確な場所が隠れます。オンにすると、着いていない投稿もすべて見られます。"
                    checked={revealAllPosts}
                    onChange={onRevealAllPostsChange}
                  />
                )}

                {/* 検証用の表示切り替えなので、デバッグモードのときだけ出す（今は表示に影響しない。STATE.md の Next 2） */}
                {debugMode && hasPanelViewSetting && (
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

                {favorites !== undefined && <DataAndAboutSettings favorites={favorites} />}

                {!hasPanelViewSetting && !hasFanConfigSetting && !hasDebugModeSetting && !hasBuildingsSetting && !hasHeadingSensorSetting && (
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
              Tokyo Nightview
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingSwitch({
  title,
  description,
  note,
  checked,
  onChange,
  image,
}: {
  title: string;
  description: string;
  note?: string | null;
  checked: boolean;
  onChange: (checked: boolean) => void;
  // 説明の下に出す見本の画像（16:9）
  image?: { src: string; alt: string };
}) {
  return (
    <section>
      <h3 className={`mb-3 px-2 text-sm font-semibold ${textPrimary}`}>{title}</h3>
      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 shadow-inner">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={title}
          onClick={() => onChange(!checked)}
          className="flex min-h-11 w-full items-center justify-between gap-4 px-1 text-left"
        >
          <span className={`text-xs leading-relaxed ${textMuted}`}>{description}</span>
          <span
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-violet-700' : 'bg-white/15'}`}
            aria-hidden="true"
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
            />
          </span>
        </button>
        {image && (
          <img src={image.src} alt={image.alt} loading="lazy" className="mt-3 block aspect-video w-full rounded-2xl border border-white/10 object-cover" />
        )}
        {note && <p role="status" className="mt-2 px-1 text-[11px] leading-relaxed text-red-300/90">{note}</p>}
      </div>
    </section>
  );
}

function MenuRow({
  icon,
  label,
  value,
  isLast,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value?: number;
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
        <ChevronRight size={16} className={textMuted} />
      </div>
    </button>
  );
}

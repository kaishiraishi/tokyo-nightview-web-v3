import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import type maplibregl from 'maplibre-gl';
import { closeButton } from '../../styles/ui';
import { Image as ImageIcon, Pin, Plus, Send, X } from '../ui/icons';
import { createPost, uploadPhoto } from '../../lib/postsApi';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { PostLocationField, type LocationMode } from './PostLocationField';
import { createMapPin } from './mapPin';

type PostComposerProps = {
    map: maplibregl.Map | null;
    currentLocation: { lat: number; lng: number } | null;
    onRequestLocation: () => void;
    onPosted: () => Promise<void>;
    style?: CSSProperties;
};

const MESSAGE_MAX = 280;

// 投稿フォームの面。スマホは下から持ち上がるシート（上の帯と地図の上半分を隠さない）、
// PC は右下のボタン列の左に浮かべるパネル。どちらも見出し・本文（スクロール）・送信ボタン（固定）の 3 段
const PANEL_CLASS = [
    'absolute inset-x-0 bottom-0 z-[4520] flex max-h-[min(85dvh,720px)] flex-col overflow-hidden',
    'rounded-t-[28px] border border-b-0 border-white/15 bg-[#05070b]/90 text-white shadow-[0_-12px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl animate-ui-rise',
    'md:inset-x-auto md:bottom-8 md:right-[calc(max(2rem,env(safe-area-inset-right))+var(--btn-h)+22px)] md:w-[380px] md:max-h-[calc(100dvh-128px)]',
    'md:rounded-[28px] md:border-b md:shadow-[0_16px_48px_rgba(0,0,0,0.6)]',
].join(' ');
const INPUT_CLASS = 'w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 text-base text-white placeholder-white/35 outline-none transition-colors focus:border-violet-300/60 md:text-sm';

// 投稿モードの「＋」ボタンと投稿フォーム。ボタンは右下のボタン列が空けた一番上の場所（reserveTopSlot）に重ねる。
// 写真 → ひとこと → 場所の順に並べ、送信ボタンは下に固定する。閉じても書きかけは残す（投稿できたら消す）
export function PostComposer({ map, currentLocation, onRequestLocation, onPosted, style }: PostComposerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isPosting, setIsPosting] = useState(false);
    const [locationMode, setLocationMode] = useState<LocationMode>('current');
    const [pinLocation, setPinLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isPinSelecting, setIsPinSelecting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        if (!photoFile) {
            setPhotoPreview(null);
            return;
        }
        const url = URL.createObjectURL(photoFile);
        setPhotoPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [photoFile]);

    // 地図に触れても閉じない（場所を確かめながら書けるように）。閉じるのは ×・Esc・＋ボタン
    useEffect(() => {
        if (!isOpen && !isPinSelecting) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            if (isPinSelecting) {
                setIsPinSelecting(false);
                setIsOpen(true);
            } else {
                setIsOpen(false);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isPinSelecting]);

    useEffect(() => {
        if (!map || !isPinSelecting) return;
        const handleClick = (event: maplibregl.MapMouseEvent) => {
            setPinLocation({ lat: event.lngLat.lat, lng: event.lngLat.lng });
            setIsPinSelecting(false);
            setIsOpen(true);
        };
        map.on('click', handleClick);
        map.getCanvas().style.cursor = 'crosshair';
        return () => {
            map.off('click', handleClick);
            map.getCanvas().style.cursor = '';
        };
    }, [map, isPinSelecting]);

    // 地図で選んだ投稿の場所に、選択地点と同じ紫のピンを立てる（どこに投稿されるかを地図で確かめられるように）
    const pinLng = locationMode === 'pin' ? pinLocation?.lng : undefined;
    const pinLat = locationMode === 'pin' ? pinLocation?.lat : undefined;
    useEffect(() => {
        if (!map || pinLng === undefined || pinLat === undefined) return;
        const marker = createMapPin('violet').setLngLat([pinLng, pinLat]).addTo(map);
        marker.getElement().setAttribute('aria-label', '投稿する場所');
        return () => {
            marker.remove();
        };
    }, [map, pinLng, pinLat]);

    const resetForm = useCallback(() => {
        setMessage('');
        setPhotoUrl('');
        setShowUrlInput(false);
        setPhotoFile(null);
        setLocationMode('current');
        setPinLocation(null);
        setSubmitError(null);
    }, []);

    const handleToggle = () => {
        if (!isOpen && !currentLocation) onRequestLocation();
        setIsPinSelecting(false);
        setIsOpen((open) => !open);
    };

    const startPinSelecting = () => {
        setLocationMode('pin');
        setIsPinSelecting(true);
        setIsOpen(false);
    };

    // 投稿する地点。現在地がまだ取れていないときに地図の中心で代用すると、違う場所に投稿されてしまうので、送信できなくする
    const point = locationMode === 'pin' ? pinLocation : currentLocation;
    const canSubmit = isSupabaseConfigured && message.trim().length > 0 && point !== null && !isPosting;

    const handleSubmit = async () => {
        if (!canSubmit || !point) return;
        setIsPosting(true);
        setSubmitError(null);
        try {
            const finalPhotoUrl = photoFile ? await uploadPhoto(photoFile) : photoUrl.trim();
            await createPost({
                message: message.trim(),
                photoUrl: finalPhotoUrl || undefined,
                lat: point.lat,
                lng: point.lng,
            });
            await onPosted();
            resetForm();
            setIsOpen(false);
        } catch (err) {
            console.error('[PostComposer] 投稿に失敗しました:', err);
            setSubmitError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
        } finally {
            setIsPosting(false);
        }
    };

    const preview = photoPreview || photoUrl.trim();

    return (
        <>
            {/* 右端は MapControlStack の枠 1px + 内側の余白 4px の内側、高さの位置は呼び出し側の style で合わせる */}
            <div className="absolute right-[calc(max(1rem,env(safe-area-inset-right))+5px)] z-[4510] animate-ui-pop md:right-[calc(max(2rem,env(safe-area-inset-right))+5px)]" style={style}>
                <button
                    type="button"
                    onClick={handleToggle}
                    className={`grid h-[var(--btn-h)] w-[var(--btn-h)] place-items-center rounded-full border transition-colors active:scale-95 ${isOpen ? 'border-violet-300/60 bg-violet-700/80 text-white' : 'border-violet-300/50 text-violet-300 hover:bg-white/10'}`}
                    aria-label="夜景を投稿する"
                    aria-expanded={isOpen}
                    title="夜景を投稿する"
                >
                    <Plus className="h-6 w-6" aria-hidden="true" />
                </button>
            </div>

            {isOpen && (
                <section role="dialog" aria-labelledby="post-composer-title" className={PANEL_CLASS}>
                    {/* スマホのシートだと分かる取っ手（飾り） */}
                    <div className="flex shrink-0 justify-center pt-2 md:hidden" aria-hidden="true">
                        <span className="h-1.5 w-10 rounded-full bg-white/20" />
                    </div>
                    <header className="flex shrink-0 items-start justify-between gap-3 px-5 pb-3 pt-2 md:pt-5">
                        <h2 id="post-composer-title" className="min-w-0 pt-2.5 text-base font-semibold text-white/90">見つけた夜景を投稿する</h2>
                        <button type="button" onClick={() => setIsOpen(false)} className={closeButton} aria-label="投稿フォームを閉じる">
                            <X className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </header>

                    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 pb-5">
                        {!isSupabaseConfigured && (
                            <p className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3 text-[11px] leading-relaxed text-amber-100/85">
                                デモ表示です。投稿の送信先が未設定のため、実際には投稿できません。
                            </p>
                        )}

                        <div>
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-semibold text-white/80">写真 <span className="ml-1 font-normal text-white/40">任意</span></span>
                                {!photoFile && !showUrlInput && !photoUrl && (
                                    // 押せる範囲は 44px（見た目は文字だけ）
                                    <button type="button" onClick={() => setShowUrlInput(true)} className="-my-3 min-h-11 text-[11px] font-semibold text-violet-200 hover:text-violet-100">
                                        URL で指定
                                    </button>
                                )}
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                id="post-photo-upload"
                                className="sr-only"
                                onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    if (file) setPhotoFile(file);
                                    event.target.value = '';
                                }}
                            />
                            {preview ? (
                                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                                    <img src={preview} alt="選んだ写真" className="block aspect-video w-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPhotoFile(null);
                                            setPhotoUrl('');
                                        }}
                                        className="absolute right-1 top-1 grid h-11 w-11 place-items-center"
                                        aria-label="写真を外す"
                                    >
                                        <span className="grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-black/60 backdrop-blur-sm">
                                            <X className="h-4 w-4" aria-hidden="true" />
                                        </span>
                                    </button>
                                </div>
                            ) : (
                                // 選ぶ前は低い横長の枠にして、ひとことと場所まで 1 画面で見えるようにする（選んだ後は 16:9 で見せる）
                                <label
                                    htmlFor="post-photo-upload"
                                    className="flex min-h-20 w-full cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-white/20 bg-white/[0.03] px-4 py-3 transition-colors hover:border-violet-300/50 hover:bg-white/[0.05]"
                                >
                                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/[0.06]">
                                        <ImageIcon className="h-6 w-6 text-white/45" aria-hidden="true" />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-sm font-semibold text-white/85">写真を選ぶ</span>
                                        <span className="mt-0.5 block text-[11px] leading-relaxed text-white/45">写真があると夜景が伝わりやすくなります</span>
                                    </span>
                                </label>
                            )}
                            {!photoFile && (showUrlInput || photoUrl) && (
                                <input
                                    type="url"
                                    value={photoUrl}
                                    onChange={(event) => setPhotoUrl(event.target.value)}
                                    placeholder="https://… の画像の URL"
                                    aria-label="画像の URL"
                                    className={`${INPUT_CLASS} mt-2 min-h-11`}
                                />
                            )}
                        </div>

                        <div>
                            <div className="mb-2 flex items-baseline justify-between">
                                <label htmlFor="post-message" className="text-xs font-semibold text-white/80">ひとこと</label>
                                <span className="text-[11px] tabular-nums text-white/40">{message.length}/{MESSAGE_MAX}</span>
                            </div>
                            <textarea
                                id="post-message"
                                value={message}
                                onChange={(event) => setMessage(event.target.value)}
                                placeholder="どんな夜景でしたか？"
                                maxLength={MESSAGE_MAX}
                                rows={3}
                                className={`${INPUT_CLASS} resize-none py-3 leading-relaxed`}
                            />
                        </div>

                        <PostLocationField
                            mode={locationMode}
                            onModeChange={(mode) => (mode === 'pin' ? startPinSelecting() : setLocationMode('current'))}
                            currentLocation={currentLocation}
                            pinLocation={pinLocation}
                            onReselectPin={startPinSelecting}
                        />

                        {submitError && <p role="alert" className="text-xs leading-relaxed text-red-300/90">{submitError}</p>}
                    </div>

                    <footer className="shrink-0 border-t border-white/10 px-5 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 md:pb-5">
                        <button
                            type="button"
                            onClick={() => void handleSubmit()}
                            disabled={!canSubmit}
                            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-violet-700 text-sm font-semibold text-white transition-colors hover:bg-violet-600 disabled:cursor-not-allowed disabled:bg-violet-700/40 disabled:text-white/50"
                        >
                            <Send className="h-4 w-4" aria-hidden="true" />
                            {isPosting ? '投稿しています…' : '投稿する'}
                        </button>
                    </footer>
                </section>
            )}

            {isPinSelecting && (
                // 上の帯（y 16〜80）の下に出す。地図をタップすると場所が決まり、フォームに戻る
                <div className="absolute left-1/2 top-[calc(88px+env(safe-area-inset-top))] z-[4520] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-violet-300/40 bg-black/70 py-1 pl-4 pr-1 text-xs font-semibold text-white shadow-lg backdrop-blur-md animate-ui-drop" role="status">
                    <Pin className="h-4 w-4 shrink-0 text-violet-300" aria-hidden="true" />
                    <span>地図をタップして、投稿する場所を選ぶ</span>
                    <button
                        type="button"
                        onClick={() => {
                            setIsPinSelecting(false);
                            setIsOpen(true);
                        }}
                        className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-white/75 transition-colors hover:bg-white/10 hover:text-white"
                        aria-label="場所を選ぶのをやめる"
                        title="やめる"
                    >
                        <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>
            )}
        </>
    );
}


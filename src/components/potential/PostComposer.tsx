import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type maplibregl from 'maplibre-gl';
import { glassSurface } from '../../styles/ui';
import { AlertCircle, Camera, Image as ImageIcon, MapPin, Pin, Send } from '../ui/icons';
import { createPost, uploadPhoto } from '../../lib/postsApi';
import { isSupabaseConfigured } from '../../lib/supabaseClient';

type PostComposerProps = {
    map: maplibregl.Map | null;
    currentLocation: { lat: number; lng: number } | null;
    onRequestLocation: () => void;
    onPosted: () => Promise<void>;
    style?: CSSProperties;
};

type LocationMode = 'current' | 'pin';

export function PostComposer({ map, currentLocation, onRequestLocation, onPosted, style }: PostComposerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [photoUrl, setPhotoUrl] = useState('');
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isPosting, setIsPosting] = useState(false);
    const [locationMode, setLocationMode] = useState<LocationMode>('current');
    const [pinLocation, setPinLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isPinSelecting, setIsPinSelecting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const modalRef = useRef<HTMLDivElement | null>(null);
    const buttonRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (!photoFile) {
            setPhotoPreview(null);
            return;
        }
        const url = URL.createObjectURL(photoFile);
        setPhotoPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [photoFile]);

    useEffect(() => {
        if (!isOpen) return;
        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as Node;
            if (modalRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
            setIsOpen(false);
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

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

    const resetForm = useCallback(() => {
        setMessage('');
        setPhotoUrl('');
        setPhotoFile(null);
        setLocationMode('current');
        setPinLocation(null);
        setSubmitError(null);
    }, []);

    const handleToggle = () => {
        if (!isOpen && !currentLocation) onRequestLocation();
        setIsOpen((open) => !open);
    };

    const handleSubmit = async () => {
        if (!message.trim() || !map) return;
        setIsPosting(true);
        setSubmitError(null);
        try {
            const point = locationMode === 'pin' && pinLocation
                ? pinLocation
                : locationMode === 'current' && currentLocation
                    ? currentLocation
                    : (() => {
                        const center = map.getCenter();
                        return { lat: center.lat, lng: center.lng };
                    })();
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

    return (
        <>
            {/* 右下の MapControlStack（枠 1px + 内側の余白 4px）の現在地ボタンと中心を揃える。右端の値は MapControlStack と同じ */}
            <div className="absolute right-[calc(max(1rem,env(safe-area-inset-right))+5px)] z-[4500] flex flex-col items-end animate-ui-rise md:bottom-24 md:right-[calc(max(2rem,env(safe-area-inset-right))+5px)]" style={style}>
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={handleToggle}
                    className="group flex h-[var(--btn-h)] w-[var(--btn-h)] items-center justify-center rounded-full border border-violet-700/60 bg-black/60 text-white shadow-lg backdrop-blur-md transition-all duration-200 hover:border-violet-600 hover:bg-violet-700/20 active:scale-95"
                    aria-label="投稿する"
                    aria-pressed={isOpen}
                    title="投稿する"
                >
                    <Camera className="h-5 w-5 text-violet-300 transition-transform group-hover:scale-110" aria-hidden="true" />
                </button>
                {isOpen && (
                    <div ref={modalRef} className={`absolute bottom-14 right-0 max-h-[70dvh] w-72 overflow-y-auto rounded-2xl ${glassSurface} p-4`}>
                        <div className="mb-3 text-sm font-medium text-white/90">夜景を投稿</div>
                        {!isSupabaseConfigured && (
                            <div className="mb-3 flex items-start gap-2 rounded border border-amber-500/20 bg-amber-500/10 p-2 text-[10px] text-amber-200">
                                <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                                <span>Supabaseが設定されていないため、実際の投稿はできません。</span>
                            </div>
                        )}
                        <div className="space-y-3">
                            <div>
                                <label htmlFor="post-message" className="mb-1 block text-xs text-white/60">メッセージ <span className="text-red-400">*</span></label>
                                <textarea
                                    id="post-message"
                                    value={message}
                                    onChange={(event) => setMessage(event.target.value)}
                                    placeholder="夜景の感想を書いてください"
                                    maxLength={280}
                                    rows={3}
                                    className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-base text-white placeholder-white/40 focus:border-violet-700/50 md:text-sm focus:outline-none"
                                />
                                <div className="mt-1 text-right text-[10px] text-white/40">{message.length}/280</div>
                            </div>
                            <div>
                                <span className="mb-1 block text-xs text-white/60">写真をアップロード または URL（任意）</span>
                                <div className="space-y-2">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="post-photo-upload"
                                        className="hidden"
                                        onChange={(event) => {
                                            const file = event.target.files?.[0];
                                            if (file) setPhotoFile(file);
                                        }}
                                    />
                                    <label
                                        htmlFor="post-photo-upload"
                                        className="flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-white/20 bg-white/5 py-4 text-xs text-white/60 transition-all hover:border-violet-700/50 hover:bg-white/10"
                                    >
                                        {photoPreview || photoUrl ? (
                                            <div className="relative aspect-video w-full overflow-hidden rounded-md bg-black/40">
                                                <img src={photoPreview || photoUrl} alt="プレビュー" className="h-full w-full object-cover" />
                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.preventDefault();
                                                        setPhotoFile(null);
                                                        setPhotoUrl('');
                                                    }}
                                                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                                                    aria-label="画像を削除"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <ImageIcon className="h-6 w-6 opacity-30" aria-hidden="true" />
                                                <span>画像を選択してください</span>
                                            </div>
                                        )}
                                    </label>
                                    <input
                                        type="url"
                                        value={photoUrl}
                                        onChange={(event) => setPhotoUrl(event.target.value)}
                                        placeholder="または画像のURLを入力"
                                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-base text-white placeholder-white/40 focus:border-violet-700/50 md:text-sm focus:outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <span className="mb-2 block text-xs text-white/60"><MapPin className="mr-1 inline h-3 w-3" aria-hidden="true" /> 投稿場所</span>
                                <div className="flex flex-col gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setLocationMode('current')}
                                        disabled={!currentLocation}
                                        className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs transition-all ${locationMode === 'current' ? 'border-violet-700 bg-violet-700/20 text-violet-300' : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40'}`}
                                    >
                                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> 現在位置
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setLocationMode('pin');
                                            setIsPinSelecting(true);
                                            setIsOpen(false);
                                        }}
                                        className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs transition-all ${locationMode === 'pin' && pinLocation ? 'border-violet-700 bg-violet-700/20 text-violet-300' : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'}`}
                                    >
                                        <Pin className="h-3.5 w-3.5" aria-hidden="true" />
                                        {locationMode === 'pin' && pinLocation
                                            ? `ピン設定済み (${pinLocation.lat.toFixed(4)}, ${pinLocation.lng.toFixed(4)})`
                                            : '地図をタップしてピンを刺す'}
                                    </button>
                                </div>
                                {!currentLocation && (
                                    <div className="mt-1 text-[10px] text-white/30">現在位置は位置情報を許可すると使用できます</div>
                                )}
                            </div>
                            {submitError && <p role="alert" className="text-xs text-red-300">{submitError}</p>}
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsOpen(false);
                                        resetForm();
                                    }}
                                    className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 text-sm text-white/70 hover:bg-white/10"
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void handleSubmit()}
                                    disabled={!message.trim() || isPosting || !isSupabaseConfigured}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-violet-700 py-2 text-sm font-medium text-white hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isPosting ? '投稿中...' : <><Send className="h-4 w-4" aria-hidden="true" /> 投稿する</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {isPinSelecting && (
                <div className="absolute left-1/2 top-20 z-50 -translate-x-1/2">
                    <div className="flex items-center gap-3 rounded-xl bg-violet-700 px-4 py-2 text-sm font-medium text-white shadow-lg">
                        <Pin className="h-4 w-4" aria-hidden="true" />
                        <span>地図をタップして投稿場所を選択</span>
                        <button
                            type="button"
                            onClick={() => {
                                setIsPinSelecting(false);
                                setIsOpen(true);
                            }}
                            className="rounded bg-white/20 px-2 py-1 text-xs hover:bg-white/30"
                        >
                            キャンセル
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

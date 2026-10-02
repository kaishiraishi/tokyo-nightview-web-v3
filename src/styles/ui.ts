export const unifiedBtn =
    "inline-flex items-center justify-center " +
    "h-[var(--btn-h)] px-[var(--btn-px)] " +
    "text-[var(--btn-fs)] leading-none " +
    "gap-[var(--btn-gap)] " +
    "rounded-full whitespace-nowrap shrink-0 select-none " +
    "font-bold transition-all duration-200 active:scale-95 shadow-2xl border-2 border-black/10";

// 地図に浮かべる小さな操作部品（ボタン列・モード切替・ミニコンパス）。角丸は full
export const glassControl = "border border-white/10 bg-black/60 shadow-lg backdrop-blur-md";
// 大きな面（コンパスカード・表示モード・メニュー・シート・サイドパネル）。角丸は 28px（ポップオーバーは rounded-2xl）
export const glassSurface = "border border-white/15 bg-[#05070b]/80 shadow-[0_16px_48px_rgba(0,0,0,0.6)] backdrop-blur-xl";
// 面の上の「閉じる」ボタン。タッチ領域は 44px
export const closeButton = "grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-white/70 transition-colors hover:bg-white/15 hover:text-white";

export const glassPanel = "bg-black/60 backdrop-blur-md border border-white/10";
export const textPrimary = "text-white/90";
export const textMuted = "text-white/50";

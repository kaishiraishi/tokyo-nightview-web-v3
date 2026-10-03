import type { ComponentProps, CSSProperties } from 'react';
import { User } from '../ui/icons';
import { glassControl } from '../../styles/ui';
import { SearchField } from './SearchField';

type FloatingSearchBarProps = Omit<ComponentProps<typeof SearchField>, 'variant'> & {
    onOpenMenu: () => void;
    className?: string;
    style?: CSSProperties;
};

// 探索モードの検索バー。シートやパネルの面を持たず、メニューボタンと検索欄を 1 本のピルにして地図に浮かべる
// （右上のモード切替・右下のボタン列と同じ glassControl）。高さは --btn-h + 余白 8px + 枠 2px で、モード切替と同じ。
// 入力中は枠を淡い紫にする（欄自体は透明で outline も消しているため、フォーカスの位置がここでしか分からない）
export function FloatingSearchBar({ onOpenMenu, className = '', style, ...searchProps }: FloatingSearchBarProps) {
    return (
        <div style={style} className={`flex items-center gap-1 rounded-full ${glassControl} p-1 transition-colors focus-within:border-violet-300/60 ${className}`}>
            <button
                type="button"
                onClick={onOpenMenu}
                aria-label="メニューを開く"
                title="メニュー"
                className="grid h-[var(--btn-h)] w-[var(--btn-h)] shrink-0 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white active:scale-95"
            >
                <User className="h-5 w-5" aria-hidden="true" />
            </button>
            <SearchField {...searchProps} variant="floating" />
        </div>
    );
}

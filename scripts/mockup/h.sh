# 撮影の補助関数。shoot-all.sh から source する。SP（このフォルダ）と OUT（保存先）を使う
SP=${SP:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}
OUT=${OUT:-$SP/../../docs/screenshots/iphone16-hig}
URL=${URL:-http://localhost:5288/tokyo-nightview-web-v3/}
mkdir -p "$OUT"
w(){ agent-browser wait $1 >/dev/null; }
tap(){ agent-browser mouse move $1 $2 >/dev/null; agent-browser mouse down >/dev/null; agent-browser mouse up >/dev/null; w ${3:-1200}; }
shot(){ agent-browser screenshot "$OUT/$1.png" >/dev/null && echo "saved $1"; }
ev(){ echo "$1" | agent-browser eval --stdin; }
# ボタン・行を aria-label か文字で探して JS でクリックする（座標クリックはアニメーション中に背景を押して閉じることがあるため）
jc(){ r=$(ev "(()=>{const t=$(printf '%s' "$1" | python3 -c 'import json,sys;print(json.dumps(sys.stdin.read()))');const els=[...document.querySelectorAll('button,summary,label,a,[role=button]')].filter(e=>(e.getAttribute('aria-label')||'').includes(t)||e.textContent.includes(t));const e=els.sort((a,b)=>a.textContent.length-b.textContent.length)[0];if(!e)return 'MISS';e.click();return 'ok'})()"); [ "$r" = '"ok"' ] || echo "MISS jc $1"; w ${2:-700}; }
# iPhone 16 の safe area を CDP で入れる（縦: 上 59 / 下 34。横: 下 21・左右 59）
safe(){ node "$SP/safe.mjs" "$(agent-browser get cdp-url | tr -d '"')" ${1:-59} ${2:-34} ${3:-0} ${4:-0} >/dev/null; }
# 端末の保存データを消し、擬似の位置・センサー設定（fake.js が読む __fake）を入れて開き直す
fresh(){ local c="$1"; [ -z "$c" ] && c='{}'; agent-browser set device "iPhone 16" >/dev/null; ev "localStorage.clear(); localStorage.setItem('__fake', JSON.stringify($c)); 1" >/dev/null; agent-browser open $URL >/dev/null; agent-browser set device "iPhone 16" >/dev/null; safe; w 4500; }
# 投稿の件数の丸（一番左）を画像から探して押す
cltap(){ agent-browser screenshot "$SP/.tmp.png" >/dev/null; local p=$(python3 "$SP/cl.py" "$SP/.tmp.png"); [ "$p" = none ] && { echo "no cluster"; return; }; tap $p ${1:-2000}; }

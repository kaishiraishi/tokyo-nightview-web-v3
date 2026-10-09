#!/usr/bin/env bash
# 全 44 画面を iPhone 16（393×852・3 倍）で撮る。使い方は docs/screenshots/README.md
set -u
SP=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
source "$SP/h.sh"
G='{geo:{lat:35.6710,lng:139.3460,acc:15}}'
fresh "$G"; shot 01_探索_初期表示
jc "現在地へ移動" 3500; shot 02_探索_現在地へ移動
fresh "$G"
agent-browser fill 'input[type=search]' "高尾山" >/dev/null; w 300; shot 03_探索_検索を入力中
agent-browser press Enter >/dev/null; w 2500; shot 04_探索_検索結果の一覧
ev "(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.startsWith('高尾山')&&b.textContent.includes('八王子'));b.click();return 1})()" >/dev/null; w 3000; shot 05_探索_検索結果を選択_ピンとポップアップ
ev "(()=>{document.querySelector('.search-popup-favorite').click();return 1})()" >/dev/null; w 600; shot 06_探索_お気に入りに追加した
fresh "$G"; jc "コンパスモードを開く" 4500; shot 07_コンパス_センサー動作中
ev "(()=>{const c=document.querySelector('main canvas');const r=c.getBoundingClientRect();return 1})()" >/dev/null
P=$(ev "(()=>{const r=document.querySelector('main canvas').getBoundingClientRect();const cx=r.x+r.width/2,cy=r.y+r.height/2,k=r.width/300,rad=(14+0.6*108)*k,a=(15-42)*Math.PI/180;return Math.round(cx+rad*Math.sin(a))+' '+Math.round(cy-rad*Math.cos(a))})()" | tr -d '"')
tap $P 1500; shot 08_コンパス_文字盤をタップした地点を地図に表示
jc "範囲を広げる（広域）" 2500; jc "範囲を広げる（広域）" 3500; shot 09_コンパス_範囲10km
for i in 1 2 3 4 5 6; do jc "範囲を狭める（詳細）" 1200; done; w 2000; shot 10_コンパス_範囲50m
fresh '{geo:{lat:35.6710,lng:139.3460,acc:15},lowAcc:true}'; jc "コンパスモードを開く" 4000; shot 11_コンパス_方位の精度が低いとき
fresh '{geo:{lat:35.6710,lng:139.3460,acc:15},noSensor:true}'; jc "コンパスモードを開く" 4000; shot 12_コンパス_方位センサーが使えない端末
fresh "$G"; jc "現在地へ移動" 3000; jc "コンパスモードを開く" 2500; jc "コンパスモードを閉じる" 1500; shot 13_探索_ミニコンパスが端末の向きで回る_前方の扇形
fresh "$G"; jc "現在地へ移動" 3000
jc "表示モードを開く" 800; shot 15_表示モード画面
jc "スコアの内訳を見る" 600; shot 16_表示モード_スコアの内訳
jc "スコアの内訳を見る" 400; jc "夜景ポテンシャルとは" 600; shot 17_表示モード_夜景ポテンシャルとは
jc "航空写真" 500; agent-browser press Escape >/dev/null; w 3000; shot 18_地図_航空写真モード
jc "表示モードを開く" 600; jc "標準" 500; agent-browser press Escape >/dev/null; w 2000; shot 19_地図_標準モード
jc "表示モードを開く" 600; jc "ポテンシャル" 400; jc "高・中・低" 400; agent-browser press Escape >/dev/null; w 3000; shot 20_地図_ポテンシャル_高中低すべて
fresh "$G"; jc "現在地へ移動" 3500; shot 21_地図_ポテンシャル_高のみ  # 既定が「高のみ」。表示モード画面で切り替えると前の状態が残ることがあるので開き直す
fresh "$G"
jc "メニューを開く" 800; shot 22_メニュー
jc "ログイン（デモ）"; shot 23_メニュー_アカウント_未ログイン
jc "デモアカウントでログイン"; shot 24_メニュー_アカウント_ログイン中
jc "メニューに戻る" 500; jc "お気に入り"; shot 25_メニュー_お気に入り_まだない
jc "現在地をお気に入りに追加" 2000; shot 26_メニュー_お気に入り_一覧
jc "メニューに戻る" 500; jc "はじめてガイド"; shot 27_メニュー_はじめてガイド
jc "メニューに戻る" 500; jc "設定"; shot 28_メニュー_設定
ev "(()=>{const s=[...document.querySelectorAll('.overflow-y-auto')].sort((a,b)=>b.scrollHeight-a.scrollHeight)[0];s.scrollTop=99999;return 1})()" >/dev/null; w 400; shot 29_メニュー_設定_データとプライバシー
jc "メニューに戻る" 500; jc "投稿を見る" 1800; shot 30_メニュー_投稿の一覧
fresh "$G"; jc "投稿モード" 1500; shot 31_投稿_引き_件数の丸
cltap; cltap; cltap; shot 32_投稿_1件の点にコメント
ev "(()=>{const b=[...document.querySelectorAll('.night-popup-bubble')];const t=b.find(e=>e.textContent.includes('住宅街'))||b[0];if(!t)return 'none';t.click();return 1})()" >/dev/null; w 3000; shot 33_投稿_着く前のカード
jc "現在地へ移動" 3500; shot 34_投稿_現在地と着く前の円
fresh '{geo:{lat:35.67428,lng:139.34805,acc:10}}'; jc "現在地へ移動" 2500; jc "投稿モード" 1300; shot 35_投稿_場所に着いた_お知らせと写真カード
w 4500; ev "(()=>{const f=document.querySelector('.night-popup-fav');if(!f)return 0;f.click();return 1})()" >/dev/null; w 600; shot 36_投稿_着いた投稿をお気に入りに追加
fresh "$G"; jc "投稿モード" 1500; jc "現在地へ移動" 3000
jc "夜景を投稿する" 1000; shot 37_投稿フォーム
agent-browser fill '#post-message' "高台から八王子の街明かりが一望できました。" >/dev/null; jc "URL で指定" 400; agent-browser fill 'input[type=url]' "http://localhost:5288/tokyo-nightview-web-v3/src/data/resized/sample_image3.jpg" >/dev/null; w 1500; shot 38_投稿フォーム_入力済み
jc "地図で選ぶ" 800; shot 39_投稿_地図で場所を選ぶ
tap 120 560 1200; shot 40_投稿フォーム_地図で選んだ場所にピン
jc "投稿フォームを閉じる" 800; shot 41_投稿_選んだ場所のピン
fresh '{geo:{lat:35.6710,lng:139.3460,acc:15},geoDenied:true}'; jc "現在地へ移動" 800; shot 42_エラー_位置情報が許可されていない
fresh "$G"; jc "現在地へ移動" 3000; tap 250 300 1500; shot 43_デバッグ_地図をタップして地点を選ぶ
jc "コンパスモードを開く" 4000; shot 44_デバッグ_選んだ地点を中心にコンパス

fresh "$G"; agent-browser set viewport 852 393 3 >/dev/null; safe 0 21 59 59; w 5000; shot 14_横向き_コンパスが自動で開く
agent-browser set device "iPhone 16" >/dev/null

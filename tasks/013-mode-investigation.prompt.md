# 013 モード切替の調査（編集禁止）
PROJECT.md STATE.md tasks/README.md を読む。ユーザー要望: https://github.com/kaishiraishi/tokyo-nightview-web-v2 を参考に既存UIの投稿モードと探索モードの切り替えだけ実装。主担当は設計のみ、あなたLuna reasoning maxが調査を担当する。
ネットワークで参考repoのsrc/App.tsxとTopBar、関連箇所を取得して比較。ローカルのApp、PotentialMapView、MapViewExplore、MapViewAnalyze、TopBar、AppMenuを調べる。既存の未コミット差分は全て保護。
報告: 1. v2のモード構成と投稿画面がどれか 2. v3で再利用すべき既存UIと必要props 3. 最小変更で探索=PotentialMapView、投稿=既存投稿UIを接続する具体案 4. 古い探索DSM処理を起動しない方法 5. モバイル/PC双方の切替入口 6. リスク。アプリコードもドキュメントも編集せず報告だけ。

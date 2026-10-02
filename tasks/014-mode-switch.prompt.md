# 014 投稿・探索モード切替の実装
あなた自身が scripts/luna.sh から起動された Luna (gpt-5.6-luna reasoning max) です。再委任は禁止。ユーザーは主担当に設計判断のみを依頼しており、実装はあなたが行ってください。

## 読むもの
PROJECT.md STATE.md PLAN.md、013結果（存在すれば）、src/App.tsx、TopBar、PotentialMapView、MapViewExplore、AppMenu。v2参照は /private/tmp/tokyo-nightview-v2.I71O7Y/src に取得済み。

## 決まった設計
- Appに mode: 'explore' | 'analyze' の単一状態。初期explore。
- exploreは現行PotentialMapView、analyzeは既存MapViewExploreをmode='analyze'の投稿画面として使う。既存UIのみ、再設計やフォーム作成禁止。
- PotentialMapViewにonModeChange propsを渡し、TopBarの固定mode/onModeChangeダミーを接続。onViewPostsもanalyzeへの接続。
- TopBarの現在の非操作カプセルをv2参考の二つのbuttonへ戻す。「投稿モード」「探索モード」のaria-label/title、aria-pressed、button type。既存デザインを使用。hideSearchでもモバイルで切替は必ず表示。
- AppからMapViewExploreに必要なpropsは投稿専用adapter（小ファイルでもよい）で固定null/idle、stable noop等を与える。不要な旧探索状態をAppに大量導入しない。onModeChangeで探索へ戻る。旧探索/DSM APIが起動しないことを確認。
- 条件レンダーで非active画面はunmount。再入場時に地図/探索選択/フォームがリセットすることは許容する。非表示で2つの地図やwatchを保持しない。
- PROJECT.mdのNon-goals/Current UI/Architectureにユーザーが明示許可した「投稿UIのモード切替接続のみ」の例外を正確に反映。探索や認証を拡張しない。
- PLAN.mdを最終結果に合わせ更新/完了にする。STATE.mdに完了、検証、次アクション、実ブラウザ未確認など実際の制限を記録。日付2026-10-01。

## 制約
既存未コミット差分は全てユーザーの作業なので保護。git reset/checkout/commit禁止。タイル・API・投稿フォーム・旧探索アルゴリズム・依存・lint除外ルールの変更禁止。不要なテスト追加禁止。no any。あなたの担当は実装およびチェック。主担当が後で差分をレビューしverifyを再実行する。

## 検証
./scripts/verify.sh。可能なら既存環境によるPC/モバイル切替確認。ブラウザできなければ正直に報告。失敗は正確にSTATEへ。

## 報告
変更ファイルと理由、切替動線、旧DSMが起動しない根拠、verify結果、未確認。 tasks/014-mode-switch.result.md へ最終出力。

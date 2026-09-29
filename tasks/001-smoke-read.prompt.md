# 001 smoke test (read only)

## 目的
Luna 起動経路の動作確認。ファイルは変更しない。

## 前提
PROJECT.md と STATE.md を読む。

## 禁止事項
ファイルの作成・変更・削除、ネットワーク利用。

## 検証コマンド
なし

## 報告の形式
- `src/lib/potentialSampler.ts` が export している関数名を列挙する
- `PotentialMapView.tsx` がその中で使っている関数名を列挙する
- 3 行以内

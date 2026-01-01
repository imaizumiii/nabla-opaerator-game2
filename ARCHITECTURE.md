# プロジェクト構成とアーキテクチャ解説

このドキュメントは、**ナブラ演算子ゲーム (Nabla Operator Game)** の開発者向けガイドです。
開発期間が空いた後でも、プロジェクトの全体像と各ファイルの役割を素早く把握し、スムーズに開発に復帰できるようにすることを目的としています。

## 1. 全体アーキテクチャ概要

本プロジェクトは、**モダンなフロントエンド**と**強力な計算バックエンド**を組み合わせたWebアプリケーションです。

*   **Frontend**: Next.js (React/TypeScript)
    *   UI描画、ゲーム状態管理、ユーザーインタラクションを担当。
*   **Backend**: Python (FastAPI + SymPy)
    *   微分・積分・極限などの数式処理を担当。
*   **通信**: REST API
    *   Next.jsのAPI Routes (`/api/py/*`) を経由してPythonサーバー (`localhost:8000`) にリクエストを転送（Rewrite設定）。

## 2. フォルダ構成

```
web_project/
├── app/                        # Next.js フロントエンドのソースコード
│   ├── components/             # Reactコンポーネント
│   │   ├── Card.tsx            # カード1枚を表示するコンポーネント
│   │   └── GameBoard.tsx       # ゲーム盤面全体（手札、フィールド）を管理するメインUI
│   ├── hooks/
│   │   └── useGameState.ts     # 【重要】ゲームの進行、ルール、状態更新ロジックが集約されたカスタムフック
│   ├── lib/
│   │   └── math-engine.ts      # バックエンドAPIを呼び出すためのラッパークラス
│   ├── types/
│   │   └── game.ts             # カード、プレイヤー、ゲーム状態のTypeScript型定義
│   ├── layout.tsx              # アプリ全体のレイアウト
│   └── page.tsx                # メインページ（Home）
│
├── backend/                    # Python バックエンドのソースコード
│   ├── main.py                 # 【重要】FastAPIサーバーのエントリーポイント。計算ロジックの実装。
│   ├── test_api.py             # バックエンドAPI単体テスト用のスクリプト
│   └── requirements.txt        # Python依存パッケージリスト
│
├── public/                     # 静的ファイル (画像など)
├── next.config.ts              # Next.js設定 (API Rewrite設定を含む)
├── rule.md                     # ゲームのルール仕様書
├── ARCHITECTURE.md             # (本書) アーキテクチャ解説
└── README.md                   # セットアップと起動手順
```

## 3. 主要ファイルの役割詳細

### A. フロントエンド (`app/`)

#### 1. `app/hooks/useGameState.ts` (Core Logic)
このファイルがフロントエンドの**心臓部**です。
*   **役割**: ゲームの全状態 (`GameState`) を保持し、アクション（カード使用、ドロー、ターン終了）に対する状態更新を行います。
*   **主要メソッド**:
    *   `applyOperator`: 演算子カードを使用した際の処理フロー（API呼び出し→結果反映→手札消費）。
    *   `deployFunction`: 関数カードをフィールドに出す処理。
    *   `checkLinearDependence`: 線形従属（同じ関数が場に出ること）をチェックするルールロジック。

#### 2. `app/components/GameBoard.tsx` (UI Logic)
*   **役割**: ユーザーのクリックイベントをハンドリングし、適切なアクションを `useGameState` に伝えます。
*   **特徴**:
    *   **複数選択ロジック**: `selectedHandCardIds` ステートにより、微分カードのスタック（複数枚選択）や、乗算カードのコンボ選択（演算子+関数）を制御しています。
    *   **インジケータ**: 現在選択中のカードから、次に何が起こるか（例: "Differentiation x2 applying to..."）を表示します。

#### 3. `app/lib/math-engine.ts` (API Client)
*   **役割**: バックエンドAPIとの通信層です。
*   **機能**: `differentiate`, `integrate`, `multiply` などのメソッドを持ち、内部で `fetch('/api/py/calculate')` を実行して結果を整形して返します。

#### 4. `app/types/game.ts` (Type Definitions)
*   **役割**: プロジェクト全体で使うデータ型を定義しています。
*   **重要型**:
    *   `FunctionCard`: 数式情報 (`expression`, `latex`) を持つカード。
    *   `OperatorCard`: 演算タイプ (`operatorType`) を持つカード。
    *   `GameState`: 盤面全体の直列化可能な状態オブジェクト。

### B. バックエンド (`backend/`)

#### 1. `backend/main.py` (Calculation Server)
*   **役割**: 数式処理エンジンです。
*   **処理フロー**:
    1.  リクエストから数式文字列 (`expression`) と操作 (`operation`) を受け取る。
    2.  `SymPy` を使って数式をパース (`sympify`)。
    3.  指定された演算（`diff`, `integrate`, `limit` 等）を実行。
    4.  結果を簡約化 (`simplify`) し、LaTeX形式と共に返す。
    5.  結果が `0` や `∞` になった場合は `is_zero: true` フラグを立てる（消滅判定用）。

## 4. データフローと処理の流れ

ユーザーが「微分カード」を使って相手の「$x^2$」を攻撃する場合の流れ：

1.  **UI**: `GameBoard.tsx` で微分カードを選択し、フィールドの $x^2$ をクリック。
2.  **Action**: `useGameState.ts` の `applyOperator` が呼ばれる。
3.  **API Request**: `MathEngine.differentiate("x**2")` が呼ばれる。
4.  **Backend**: `main.py` が `diff(x**2, x)` を実行 -> 結果 `2*x` を返す。
5.  **State Update**: `useGameState` が結果を受け取り、フィールドのカード情報を更新（IDをリフレッシュして再レンダリングを強制）。
6.  **UI**: `Card.tsx` が新しい数式（$2x$）を表示。

## 5. 開発の手引き

### Q. 新しい演算子を追加するには？
以下の4ステップが必要です。

1.  **Backend**: `backend/main.py` に演算ロジックを追加（例: `elif req.operation == 'new_op': ...`）。
2.  **API Client**: `app/lib/math-engine.ts` にメソッドを追加。
3.  **Hooks**: `app/hooks/useGameState.ts` の `applyOperator` 内の `switch` 文にケースを追加。
4.  **Types & UI**: `app/types/game.ts` の `OperatorType` に追加し、必要なら `INITIAL_DECK` にカードを追加。

### Q. テストはどうする？
*   **Backend**: `python backend/test_api.py` を実行すると、APIの主要な計算パターンを網羅的にテストできます。
*   **Frontend**: 現状は手動確認が主ですが、`console.log` が `[Math]` や `[Update]` などのプレフィックス付きで出力されるように実装されているため、ブラウザコンソールで詳細な挙動を追跡できます。

### Q. 状態が更新されない時は？
*   Reactの再レンダリングが走っていない可能性があります。`useGameState.ts` で、カード更新時に `id` を意図的に変更（リフレッシュ）している箇所を確認してください。


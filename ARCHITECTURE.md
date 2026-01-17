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
│   │   ├── GameBoard.tsx       # ゲーム盤面全体を管理するメインUIコンポーネント
│   │   ├── FieldArea.tsx       # フィールド（盤面）表示コンポーネント
│   │   └── HandArea.tsx        # 手札表示コンポーネント
│   ├── hooks/                  # カスタムフック
│   │   ├── useGameState.ts     # 【重要】ゲーム状態管理のメインフック
│   │   ├── useCardSelection.ts # 手札カードの選択状態管理フック
│   │   └── useLinearDependence.ts # 線形従属性チェック処理
│   ├── logic/                  # ビジネスロジック（ゲームルール）
│   │   ├── operatorLogic.ts    # 演算子適用ロジック（AoE/単体ターゲット）
│   │   ├── deployLogic.ts      # 関数カードデプロイロジック
│   │   └── turnLogic.ts        # ターン管理・勝利判定ロジック
│   ├── constants/              # 定数定義
│   │   └── initialData.ts      # 初期デッキ・フィールド定義
│   ├── utils/                  # ユーティリティ関数
│   │   └── gameBoardHelpers.ts # UI用ヘルパー関数（アクションメッセージ生成など）
│   ├── lib/                    # ライブラリ・APIクライアント
│   │   └── math-engine.ts      # バックエンドAPIを呼び出すためのラッパークラス
│   ├── types/                  # TypeScript型定義
│   │   └── game.ts             # カード、プレイヤー、ゲーム状態の型定義
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

#### 1. 状態管理層 (`hooks/`)

##### `app/hooks/useGameState.ts` (Core State Management)
このファイルがフロントエンドの**心臓部**です。
*   **役割**: ゲームの全状態 (`GameState`) を保持し、アクション（カード使用、ドロー、ターン終了）に対する状態更新をオーケストレートします。
*   **主要メソッド**:
    *   `applyOperator`: 演算子カードを使用した際の処理フローを管理。AoE/単体ターゲットの判定を行い、適切なロジックに委譲。
    *   `deployFunction`: 関数カードをフィールドに出す処理を管理。
    *   `drawCard`: 手札をドローする処理。
    *   `endTurn`: ターン終了処理。
*   **注意**: 非同期処理が多いため、`stateRef` を使用して最新の状態を参照できるようにしています。

##### `app/hooks/useCardSelection.ts` (Card Selection Logic)
*   **役割**: 手札カードの選択状態（複数選択、スタック、ホバー）を管理するカスタムフック。
*   **機能**:
    *   微分・積分カードのスタック選択ロジック
    *   乗算・除算時のオペランド選択ロジック
    *   選択解除・クリア機能

##### `app/hooks/useLinearDependence.ts` (Linear Dependence Check)
*   **役割**: フィールド上の関数カードの線形従属性をチェックする非同期関数。
*   **機能**: APIを呼び出して重複する関数を検出し、削除インデックスを返します。

#### 2. ビジネスロジック層 (`logic/`)

##### `app/logic/operatorLogic.ts` (Operator Application Logic)
*   **役割**: 演算子カードの適用ロジックを実装。
*   **主要関数**:
    *   `applyAoEOperator`: ナブラ・ラプラシアンなど全体攻撃演算子の処理
    *   `applySingleTargetOperator`: 単体ターゲット演算子の処理（微分、積分、極限、乗算、除算など）
*   **特徴**: 演算子のスタック（複数回の微分・積分）に対応。

##### `app/logic/deployLogic.ts` (Function Deployment Logic)
*   **役割**: 関数カードをフィールドに配置する処理を実装。
*   **機能**:
    *   フィールド上限チェック（3枚まで）
    *   線形従属性チェック（重複関数の検出）

##### `app/logic/turnLogic.ts` (Turn Management Logic)
*   **役割**: ターン進行、手札ドロー、勝利判定を管理。
*   **主要関数**:
    *   `advanceTurn`: ターンを進め、次のプレイヤーにドローを行う
    *   `checkWinner`: 勝利条件（フィールドが0枚）をチェック
    *   `drawCardsForNextPlayer`: 手札を指定枚数までドロー

#### 3. UIコンポーネント層 (`components/`)

##### `app/components/GameBoard.tsx` (Main UI Component)
*   **役割**: ゲーム盤面全体のレイアウトとイベントハンドリングのオーケストレーション。
*   **特徴**:
    *   `useCardSelection` フックを使用して選択状態を管理
    *   `FieldArea` と `HandArea` コンポーネントを配置
    *   アクションメッセージの表示
    *   関数カードデプロイと演算子適用の処理を実行

##### `app/components/FieldArea.tsx` (Field Display Component)
*   **役割**: プレイヤーまたは相手のフィールド（盤面）を表示。
*   **機能**:
    *   フィールド上の関数カードの表示
    *   カードクリック時のターゲット指定
    *   フィールドエリアクリック時のデプロイ処理
    *   ターン中のプレイヤーのハイライト表示

##### `app/components/HandArea.tsx` (Hand Display Component)
*   **役割**: 現在のターンプレイヤーの手札を表示。
*   **機能**:
    *   手札カードの扇状（現在は直線）配置
    *   カードのホバー・選択状態の視覚的フィードバック
    *   カードクリック時の選択処理

##### `app/components/Card.tsx` (Card Display Component)
*   **役割**: 1枚のカード（関数または演算子）を表示する汎用コンポーネント。
*   **機能**: LaTeX形式の数式表示、カードタイプによるスタイル変更。

#### 4. 定数・ユーティリティ層

##### `app/constants/initialData.ts` (Initial Game Data)
*   **役割**: ゲーム開始時のデッキ構成と初期フィールドを定義。
*   **内容**:
    *   `INITIAL_DECK`: 全カードタイプの定義（演算子・関数）
    *   `INITIAL_FIELD`: 初期フィールド（1, x, x²）
    *   `shuffleDeck`: デッキシャッフル関数

##### `app/utils/gameBoardHelpers.ts` (UI Helper Functions)
*   **役割**: UI表示用のヘルパー関数。
*   **機能**:
    *   `getActionMessage`: 選択中のカードに基づいてアクションメッセージを生成

##### `app/lib/math-engine.ts` (API Client)
*   **役割**: バックエンドAPIとの通信層。
*   **機能**: `differentiate`, `integrate`, `multiply` などのメソッドを持ち、内部で `fetch('/api/py/calculate')` を実行して結果を整形して返します。
*   **主要メソッド**:
    *   `checkLinearDependence`: 線形従属性チェックAPI呼び出し
    *   `callApi`: 計算APIの統一的な呼び出しインターフェース

##### `app/types/game.ts` (Type Definitions)
*   **役割**: プロジェクト全体で使うデータ型を定義。
*   **重要型**:
    *   `FunctionCard`: 数式情報 (`expression`, `latex`) を持つカード。
    *   `OperatorCard`: 演算タイプ (`operatorType`) を持つカード。
    *   `GameState`: 盤面全体の直列化可能な状態オブジェクト。
    *   `PlayerState`: プレイヤーの状態（フィールド、手札、デッキ）。

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

### 例: ユーザーが「微分カード」を使って相手の「$x^2$」を攻撃する場合

1.  **UI**: `GameBoard.tsx` で微分カードを選択（`useCardSelection` フックが選択状態を管理）。
2.  **UI**: フィールドの $x^2$ をクリック（`FieldArea` コンポーネントから `handleFieldCardClick` が呼ばれる）。
3.  **Action**: `GameBoard.tsx` の `executeFieldAction` が `useGameState.applyOperator` を呼ぶ。
4.  **State Management**: `useGameState.ts` が単体ターゲットとして `applySingleTargetOperator` を呼ぶ。
5.  **Logic**: `operatorLogic.ts` の `applySingleTargetOperator` が `MathEngine.differentiate("x**2")` を呼ぶ。
6.  **API Request**: `math-engine.ts` が `/api/py/calculate` にリクエストを送信。
7.  **Backend**: `main.py` が `diff(x**2, x)` を実行 -> 結果 `2*x` を返す。
8.  **Logic**: `operatorLogic.ts` が結果を受け取り、フィールドのカード情報を更新（IDをリフレッシュして再レンダリングを強制）。
9.  **Turn Management**: `turnLogic.ts` の `advanceTurn` が呼ばれ、ターンが進行。
10. **UI**: `Card.tsx` が新しい数式（$2x$）を表示。

### 例: AoE（全体攻撃）演算子の使用

1.  **UI**: ナブラまたはラプラシアンカードを選択。
2.  **UI**: フィールドエリアをクリック（ターゲットカードなし）。
3.  **Action**: `GameBoard.tsx` が AoE モードを検出し、`applyAoEOperator` を呼ぶ。
4.  **Logic**: `operatorLogic.ts` がフィールド上の全カードに対して順次演算を実行。
5.  **State Update**: 全カードが更新され、線形従属性チェックが実行される。

## 5. コード構造の設計思想

### 責務の分離 (Separation of Concerns)

このプロジェクトは以下の層に分離されています：

1.  **UI層** (`components/`): 表示とユーザーインタラクションのみを担当
2.  **状態管理層** (`hooks/`): Reactの状態管理とライフサイクル管理
3.  **ビジネスロジック層** (`logic/`): ゲームルールと計算処理（純粋関数として実装）
4.  **データ層** (`constants/`, `types/`): 定数と型定義
5.  **インフラ層** (`lib/`): 外部API通信

### テスト容易性

*   `logic/` ディレクトリの関数は純粋関数として実装されており、単体テストが容易です。
*   UIコンポーネントは小さく分割されているため、コンポーネントテストが容易です。

### 保守性

*   各ファイルが単一の責任を持ち、変更の影響範囲が明確です。
*   ロジックの再利用が容易です。

## 6. 開発の手引き

### Q. 新しい演算子を追加するには？

以下の5ステップが必要です。

1.  **Types**: `app/types/game.ts` の `OperatorType` に新しい演算子タイプを追加。
2.  **Backend**: `backend/main.py` に演算ロジックを追加（例: `elif req.operation == 'new_op': ...`）。
3.  **API Client**: `app/lib/math-engine.ts` にメソッドを追加。
4.  **Logic**: `app/logic/operatorLogic.ts` の `applySingleTargetOperator` 内の `switch` 文にケースを追加。
5.  **Initial Data**: `app/constants/initialData.ts` の `INITIAL_DECK` にカードを追加。

### Q. UIコンポーネントのスタイルを変更するには？

*   `components/FieldArea.tsx`: フィールドエリアのスタイル
*   `components/HandArea.tsx`: 手札の配置とアニメーション
*   `components/Card.tsx`: カードの見た目
*   `globals.css`: グローバルスタイル（数式フォントなど）

### Q. ゲームルールを変更するには？

*   **ターン管理**: `app/logic/turnLogic.ts`
*   **デプロイルール**: `app/logic/deployLogic.ts`
*   **演算子ルール**: `app/logic/operatorLogic.ts`
*   **初期状態**: `app/constants/initialData.ts`

### Q. テストはどうする？

*   **Backend**: `python backend/test_api.py` を実行すると、APIの主要な計算パターンを網羅的にテストできます。
*   **Frontend**: 現状は手動確認が主ですが、`console.log` が `[Math]` や `[Update]` などのプレフィックス付きで出力されるように実装されているため、ブラウザコンソールで詳細な挙動を追跡できます。
*   **Logic層**: `logic/` ディレクトリの関数は純粋関数として実装されているため、Jest などのテストフレームワークで容易にテストできます。

### Q. 状態が更新されない時は？

*   Reactの再レンダリングが走っていない可能性があります。`useGameState.ts` や `logic/operatorLogic.ts` で、カード更新時に `id` を意図的に変更（リフレッシュ）している箇所を確認してください。
*   `stateRef` を使用している箇所で、最新の状態を参照できているか確認してください。

### Q. パフォーマンス最適化

*   `useCallback` を使用して関数の再生成を防いでいます。
*   状態更新は必要な部分のみを更新するように設計されています。
*   線形従属性チェックは非同期処理のため、UIブロッキングを避けています。

## 7. 今後の拡張可能性

*   **AIプレイヤー**: `logic/` 層を活用してCPUプレイヤーのロジックを実装可能
*   **リプレイ機能**: `GameState` の履歴を保存することで実装可能
*   **マルチプレイヤー**: 状態管理層を拡張して実装可能
*   **カードエフェクト**: `logic/` 層にエフェクト処理を追加可能

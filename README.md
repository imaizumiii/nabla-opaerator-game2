# Nabla Operator Game (Web & Python Backend)

ナブラ演算子ゲームのWeb実装版です。
フロントエンドにNext.js、バックエンド（計算エンジン）にPython (FastAPI + SymPy) を使用しています。

## 必須要件

*   Node.js (v18以上推奨)
*   Python (3.8以上推奨)

## セットアップ手順

### 1. 依存関係のインストール

**フロントエンド (Node.js)**
```bash
npm install
```

**バックエンド (Python)**
仮想環境を作成してインストールすることをお勧めします。

Windows (PowerShell):
```powershell
python -m venv venv
venv\Scripts\pip install -r backend/requirements.txt
```

Mac/Linux:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
```

## 実行方法

ゲームをプレイするには、フロントエンドとバックエンドの両方を起動する必要があります。

### 1. Pythonバックエンドの起動 (計算サーバー)
別のターミナルを開いて実行してください。ポート8000で起動します。

Windows:
```powershell
venv\Scripts\uvicorn backend.main:app --reload --port 8000
```

Mac/Linux:
```bash
source venv/bin/activate
uvicorn backend.main:app --reload --port 8000
```

### 2. Next.jsフロントエンドの起動
別のターミナルで実行してください。

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスするとゲームが開始します。

## デプロイ

本番環境へのデプロイ手順については、[DEPLOY.md](./DEPLOY.md) を参照してください。

## 開発ノート

*   **API連携**: フロントエンドからの計算リクエストは `/api/py/*` に送られ、`next.config.ts` のRewrite設定により `http://localhost:8000/*` (Pythonサーバー) に転送されます。
*   **数式処理**: `SymPy` ライブラリを使用して、微分・積分・極限計算を行っています。

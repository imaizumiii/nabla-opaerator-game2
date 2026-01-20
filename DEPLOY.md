# デプロイ手順

このプロジェクトはNext.jsフロントエンドとPython FastAPIバックエンドで構成されています。

## デプロイ方法

### 方法1: Vercel（フロントエンド）+ Railway/Render（バックエンド）【推奨】

#### 1. バックエンドのデプロイ（Railwayを使用する場合）

1. [Railway](https://railway.app/)にアカウントを作成（GitHubアカウントでログイン可能）
2. 「New Project」をクリック
3. 「Deploy from GitHub repo」を選択し、このリポジトリを選択
4. サービスが作成されたら、設定を開く：
   - **Settings** → **Root Directory**: `backend` に設定
   - **Settings** → **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`（既に`railway.json`に設定済みの場合は自動適用）
5. 「Deploy」をクリックしてデプロイ開始
6. デプロイ完了後、**Settings** → **Networking** → **Generate Domain** でドメインを生成
7. 生成されたURL（例: `https://your-app.railway.app`）をメモ

#### 2. フロントエンドのデプロイ（Vercel）

1. [Vercel](https://vercel.com/)にアカウントを作成
2. GitHubリポジトリをインポート
3. プロジェクト設定：
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`（ルートディレクトリ）
4. 環境変数の設定：
   - **Name**: `BACKEND_URL`
   - **Value**: Railwayで取得したバックエンドURL（例: `https://your-app.railway.app`）
5. 「Deploy」をクリック

#### 3. Renderを使用する場合（バックエンド）

1. [Render](https://render.com/)にアカウントを作成
2. 新しい「Web Service」を作成
3. GitHubリポジトリを接続
4. 設定：
   - **Name**: 任意の名前
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. デプロイ後、Renderが提供するURLをメモ
6. Vercelの環境変数`BACKEND_URL`にこのURLを設定

### 方法2: Vercelのみ（Serverless Functions）

VercelのServerless FunctionsとしてPythonバックエンドをデプロイする場合：

1. `api/python/`ディレクトリを作成
2. FastAPIアプリをServerless Functions用にラップ
3. 詳細は[Vercel Python Functions](https://vercel.com/docs/functions/serverless-functions/runtimes/python)を参照

**注意**: FastAPIをそのままServerless Functionsとして動かすのは複雑なため、方法1を推奨します。

## ローカル開発時の設定

ローカル開発時は、環境変数を設定する必要はありません。`next.config.ts`がデフォルトで`http://127.0.0.1:8000`を使用します。

## 環境変数の確認

デプロイ後、以下のコマンドで環境変数が正しく設定されているか確認できます：

```bash
# Vercel CLIを使用する場合
vercel env ls
```

## トラブルシューティング

### バックエンドに接続できない

1. `BACKEND_URL`環境変数が正しく設定されているか確認
2. バックエンドのCORS設定を確認（必要に応じて`backend/main.py`にCORS設定を追加）
3. バックエンドのログを確認

### CORSエラーが発生する場合

`backend/main.py`に以下を追加：

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では特定のドメインを指定
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## クイックデプロイ（Vercel CLIを使用）

Vercel CLIを使用してコマンドラインからデプロイすることもできます：

```bash
# Vercel CLIをインストール（初回のみ）
npm i -g vercel

# プロジェクトルートで実行
vercel

# 環境変数を設定
vercel env add BACKEND_URL

# 本番環境にデプロイ
vercel --prod
```

## デプロイ後の確認

1. フロントエンドURLにアクセス
2. ブラウザの開発者ツール（F12）でネットワークタブを開く
3. `/api/py/calculate`などのAPIリクエストが成功しているか確認
4. エラーが発生する場合は、コンソールタブでエラーメッセージを確認

## 注意事項

- バックエンドのURLは環境変数`BACKEND_URL`で設定します
- ローカル開発時は環境変数の設定は不要です（デフォルトで`http://127.0.0.1:8000`を使用）
- CORS設定は`backend/main.py`に追加済みです
- 本番環境では、CORSの`allow_origins`を特定のドメインに制限することを推奨します

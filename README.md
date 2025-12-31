# Document Creation System

医療機関向け文書作成システムのサンプル実装です。SvelteKit 2 + Svelte 5 で構築され、Keycloakによる認証、PostgreSQLによるデータ永続化、HAPI FHIRによる医療情報連携を提供します。

## 目次

- [システム構成](#システム構成)
- [技術スタック](#技術スタック)
- [開発環境構築](#開発環境構築)
- [Dockerコンテナ](#dockerコンテナ)
- [認証・認可](#認証認可)
- [外部API連携](#外部api連携)
- [アカウント構造](#アカウント構造)
- [ディレクトリ構成](#ディレクトリ構成)
- [データベーススキーマ](#データベーススキーマ)
- [ドキュメント](#ドキュメント)

---

## システム構成

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                   クライアント                                    │
│  ┌──────────────┐         ┌──────────────────┐                                   │
│  │   ブラウザ    │         │ 外部医療システム  │                                   │
│  │  (SSR/CSR)   │         │  (電子カルテ等)   │                                   │
│  └──────┬───────┘         └────────┬─────────┘                                   │
└─────────┼──────────────────────────┼────────────────────────────────────────────┘
          │ HTTP/HTTPS               │ OAuth2 + REST API / FHIR
          ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Docker Compose                                      │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                         SvelteKit Application                               │ │
│  │                            (Port: 5173)                                     │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │ │
│  │  │ フロントエンド │  │ バックエンド  │  │ Drizzle ORM │  │ Arctic OIDC │        │ │
│  │  │  (SSR/CSR)  │  │  (Server)   │  │             │  │             │        │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │ │
│  └────────────────────────────────────────────────────────────────────────────┘ │
│         │                    │                     │                             │
│         │ OIDC               │ SQL                 │ FHIR R4                     │
│         ▼                    ▼                     ▼                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                       │
│  │   Keycloak   │    │  PostgreSQL  │    │  HAPI FHIR   │                       │
│  │  (Port:8080) │    │  (Port:5432) │    │  (Port:8090) │                       │
│  │              │    │              │    │              │                       │
│  │  - 認証/認可  │    │ - users      │    │ - HL7 FHIR   │                       │
│  │  - ユーザー管理│    │ - hospitals  │    │   R4準拠     │                       │
│  │  - OAuth2    │    │ - sessions   │    │ - JP Core    │                       │
│  │  - OIDC      │    │ - api_clients│    │   対応可能    │                       │
│  └──────────────┘    └──────────────┘    └──────────────┘                       │
│                             │                                                    │
│                             ▼                                                    │
│                      ┌──────────────┐                                           │
│                      │   Databases  │                                           │
│                      │              │                                           │
│                      │ - document_  │                                           │
│                      │   creation   │                                           │
│                      │ - keycloak   │                                           │
│                      │ - hapi       │                                           │
│                      └──────────────┘                                           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

詳細なシステム構成図: `docs/system-architecture.drawio`

---

## 技術スタック

| カテゴリ | 技術 | バージョン |
|---------|------|-----------|
| フレームワーク | SvelteKit | 2.x |
| UIライブラリ | Svelte | 5.x |
| ORM | Drizzle ORM | - |
| データベース | PostgreSQL | 16 |
| 認証 | Keycloak (OIDC) | 26.0 |
| OIDCライブラリ | Arctic | - |
| FHIRサーバー | HAPI FHIR | latest |
| ビルドツール | Vite | 7.x |
| 言語 | TypeScript | strict mode |
| パッケージマネージャ | pnpm | - |

---

## 開発環境構築

### 前提条件

- **Node.js**: v20以上
- **pnpm**: v8以上
- **Docker / Docker Compose**: 最新版

### セットアップ手順

#### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd document-creation
```

#### 2. 依存パッケージのインストール

```bash
pnpm install
```

#### 3. 環境変数の設定

```bash
cp .env.example .env
```

#### 4. Dockerコンテナの起動

```bash
# PostgreSQL, Keycloak, HAPI FHIRを起動
pnpm docker:up
# または
docker-compose up -d
```

#### 5. Keycloakの設定（初回のみ）

1. **Keycloak管理コンソールにアクセス**
   - URL: http://localhost:8080
   - ユーザー名: `admin`
   - パスワード: `admin`

2. **Realmの作成**
   - 左上のドロップダウン → "Create Realm"
   - Realm name: `document-creation`
   - "Create" をクリック

3. **Clientの作成**
   - 左メニュー "Clients" → "Create client"
   - Client ID: `sveltekit-app`
   - "Next" → Client authentication: **ON**
   - "Next" → Valid redirect URIs: `http://localhost:5173/*`
   - "Save"

4. **Client Secretの取得**
   - Clients → sveltekit-app → Credentials タブ
   - Client secret をコピー

5. **環境変数の更新**
   ```bash
   # .env ファイルを編集
   KEYCLOAK_CLIENT_SECRET=<コピーしたClient Secret>
   ```

6. **テストユーザーの作成（任意）**
   - Users → Add user
   - Username, Email, First name, Last nameを入力
   - "Create"
   - Credentials タブ → Set password

#### 6. データベースのセットアップ

```bash
# スキーマをデータベースに反映
pnpm db:push
```

#### 7. 開発サーバーの起動

```bash
pnpm dev
```

アプリケーションは http://localhost:5173 でアクセス可能になります。

```bash
pnpm db:studio
```

https://local.drizzle.studio
こちらにアクセスした後に、初期開発時は上記で作成したユーザーの権限をadmin=TRUEに変更すると
ログイン後に管理者画面にアクセスできるようになります。

### 開発用コマンド一覧

```bash
# 開発サーバー起動
pnpm dev

# 本番ビルド
pnpm build

# 型チェック
pnpm check

# Dockerコンテナ起動
pnpm docker:up

# Dockerコンテナ停止
pnpm docker:down

# DBマイグレーション生成
pnpm db:generate

# DBマイグレーション適用
pnpm db:migrate

# DBスキーマ直接反映（開発用）
pnpm db:push

# Drizzle Studio（DB GUI）
pnpm db:studio
```

---

## Dockerコンテナ

### コンテナ一覧

| サービス | イメージ | ポート | 用途 |
|---------|---------|--------|------|
| postgres | postgres:16-alpine | 5432 | データベース |
| keycloak | quay.io/keycloak/keycloak:26.0 | 8080 | 認証・認可 |
| hapi-fhir | hapiproject/hapi:latest | 8090 | FHIRサーバー |

### データベース

PostgreSQL内に3つのデータベースが作成されます：

| データベース | 用途 |
|-------------|------|
| document_creation | アプリケーションデータ |
| keycloak | Keycloak設定・ユーザーデータ |
| hapi | FHIRリソースデータ |

### アクセス情報

| サービス | URL | 認証情報 |
|---------|-----|---------|
| SvelteKit | http://localhost:5173 | Keycloakログイン |
| Keycloak管理コンソール | http://localhost:8080 | admin / admin |
| HAPI FHIR | http://localhost:8090/fhir | なし（開発環境） |
| Drizzle Studio | http://localhost:4983 | なし |

### コンテナ管理

```bash
# 起動
docker-compose up -d

# 停止
docker-compose down

# ログ確認
docker-compose logs -f [service-name]

# 完全リセット（データ削除）
docker-compose down -v
```

---

## 認証・認可

### 認証フロー（ブラウザ）

```
1. ユーザー: /login にアクセス
            ↓
2. SvelteKit: Keycloak認証画面にリダイレクト
            ↓
3. Keycloak: ユーザー認証（ID/PW入力）
            ↓
4. Keycloak: /auth/callback にリダイレクト（認可コード付与）
            ↓
5. SvelteKit: 認可コード → アクセストークン交換
            ↓
6. SvelteKit: ユーザー情報取得・DB同期
            ↓
7. SvelteKit: セッション作成・Cookie設定
            ↓
8. SvelteKit: ロールに応じてリダイレクト
   - サービス管理者 → /admin
   - 病院ユーザー → /{hospitalSlug}
```

### 認証方式の使い分け

| 用途 | 認証方式 | 実装箇所 |
|------|---------|---------|
| Webアプリ（ブラウザ） | Cookie + セッション | hooks.server.ts |
| 外部API（M2M） | Bearer Token (OAuth2) | hooks.server.ts |

### セッション管理

- セッションIDはCookieに保存（`httpOnly`, `secure`）
- セッション有効期限: 24時間
- アクセストークンはDBに保存し、必要に応じてリフレッシュ

### 権限レベル

| 権限 | 説明 | アクセス可能エリア |
|------|------|------------------|
| サービス管理者 | システム全体を管理 | /admin/*, 全病院 |
| 病院管理者 | 所属病院を管理 | /{slug}/*, メンバー招待 |
| 病院ユーザー | 所属病院を利用 | /{slug}/* |

---

## 外部API連携

### OAuth2 Client Credentials Flow

外部システムからAPIにアクセスするための認証フロー。

```
外部システム                Keycloak                 Document Creation
    │                         │                           │
    │ 1. Client Credentials   │                           │
    ├────────────────────────>│                           │
    │ 2. Access Token         │                           │
    │<────────────────────────┤                           │
    │                         │                           │
    │ 3. API Request + Bearer Token                       │
    ├────────────────────────────────────────────────────>│
    │                         │  4. Token Introspection   │
    │                         │<──────────────────────────┤
    │                         │  5. Token Valid           │
    │                         │──────────────────────────>│
    │ 6. API Response                                     │
    │<────────────────────────────────────────────────────┤
```

### APIクライアント管理

管理画面からAPIクライアントを作成・管理できます：
- サービス管理者: `/admin/api-clients` （システム全体 or 病院単位）
- 病院管理者: `/{slug}/settings/api-clients` （自病院のみ）

### APIエンドポイント

#### 独自REST API (`/api/v1/*`)

```bash
# トークン取得
curl -X POST "http://localhost:8080/realms/document-creation/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"

# API呼び出し
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:5173/api/v1/hospitals
```

| エンドポイント | メソッド | 説明 |
|---------------|---------|------|
| /api/v1/ | GET | API情報・クライアント情報 |
| /api/v1/hospitals | GET | 病院一覧（スコープ内） |
| /api/v1/hospitals/:id | GET | 病院詳細 |

#### FHIR API (`/fhir/*` - HAPI FHIR経由)

```bash
# CapabilityStatement取得
curl http://localhost:8090/fhir/metadata

# Organization（病院）一覧
curl http://localhost:8090/fhir/Organization
```

詳細: `docs/api-authentication.md`

---

## アカウント構造

```
サービス管理者 (isServiceAdmin: true)
    │
    │ 管理・招待
    ▼
病院アカウント (hospitals)
    │
    ├── 病院管理者 (hospital_admin) ← サービス管理者が招待
    │       │
    │       │ 招待
    │       ▼
    └── 病院ユーザー (hospital_user)
```

- ユーザーは複数の病院に所属可能
- 病院グループによる複数病院の一括管理に対応予定

---

## ディレクトリ構成

```
src/
├── routes/
│   ├── (auth)/                 # 認証関連（未認証でもアクセス可）
│   │   ├── login/              # Keycloakログイン
│   │   ├── invite/[token]/     # 招待受諾
│   │   └── no-hospital/        # 病院未所属時の表示
│   ├── (admin)/                # サービス管理者専用
│   │   └── admin/
│   │       ├── hospitals/      # 病院CRUD・招待
│   │       └── api-clients/    # APIクライアント管理
│   ├── (hospital)/             # 病院コンテキスト
│   │   └── [hospitalSlug]/
│   │       ├── +page           # ダッシュボード
│   │       ├── members/        # メンバー管理・招待
│   │       └── settings/       # 設定（APIクライアント等）
│   ├── api/v1/                 # 外部API
│   │   ├── +server             # APIバージョン情報
│   │   └── hospitals/          # 病院API
│   └── auth/
│       ├── callback/           # OAuthコールバック
│       └── logout/             # ログアウト
├── lib/
│   ├── server/
│   │   ├── auth/
│   │   │   ├── keycloak.ts     # OIDC クライアント
│   │   │   ├── keycloak-admin.ts # Admin API
│   │   │   ├── api-auth.ts     # Bearer Token認証
│   │   │   ├── session.ts      # セッション管理
│   │   │   ├── user-sync.ts    # ユーザー同期
│   │   │   └── invitation.ts   # 招待管理
│   │   ├── db/
│   │   │   ├── index.ts        # DB接続
│   │   │   └── schema/         # Drizzleスキーマ
│   │   └── repositories/       # データアクセス層
│   └── assets/
├── hooks.server.ts             # リクエストフック
└── app.d.ts                    # 型定義
```

---

## データベーススキーマ

| テーブル | 主なカラム | 説明 |
|---------|-----------|------|
| users | keycloakId, email, name, isServiceAdmin | ユーザー |
| sessions | userId, accessToken, refreshToken | セッション |
| hospitals | name, slug, hospitalGroupId | 病院 |
| hospital_groups | name | 病院グループ |
| hospital_memberships | userId, hospitalId, role | ユーザー×病院 |
| invitations | email, hospitalId, role, token | 招待 |
| api_clients | hospitalId, keycloakClientId, name, isEnabled | APIクライアント |

詳細: `docs/database.dbml`

---

## ドキュメント

| ファイル | 内容 |
|---------|------|
| `docs/system-architecture.drawio` | システム構成図（draw.io形式） |
| `docs/database.dbml` | DBスキーマ（DBML形式） |
| `docs/api-authentication.md` | 外部API認証ガイド |
| `docs/fhir-integration-plan.md` | FHIR統合計画 |
| `docs/fhir-resource-mapping.md` | FHIRリソースマッピング設計 |
| `CLAUDE.md` | Claude Code用プロジェクト情報 |

---

## トラブルシューティング

### Keycloakに接続できない

```bash
# コンテナの状態確認
docker-compose ps

# ログ確認
docker-compose logs keycloak
```

### DBマイグレーションエラー

```bash
# DBをリセット
docker-compose down -v
docker-compose up -d
pnpm db:push
```

### HAPI FHIRが起動しない

```bash
# 起動に時間がかかる場合があります（60秒程度）
docker-compose logs -f hapi-fhir

# ヘルスチェック
curl http://localhost:8090/fhir/metadata
```

---

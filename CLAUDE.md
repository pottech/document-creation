# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Type checking
pnpm check
```

## Database Commands

```bash
# Start PostgreSQL and Keycloak (Docker)
pnpm docker:up

# Stop containers
pnpm docker:down

# Generate migrations from schema changes
pnpm db:generate

# Apply migrations
pnpm db:migrate

# Push schema directly (development only)
pnpm db:push

# Open Drizzle Studio (DB GUI)
pnpm db:studio
```

## Tech Stack

- **Framework**: SvelteKit 2 with Svelte 5
- **ORM**: Drizzle ORM with PostgreSQL
- **Auth**: Keycloak (OIDC) with Arctic library
- **Build Tool**: Vite 7
- **Language**: TypeScript (strict mode)
- **Package Manager**: pnpm

## Architecture

### Account Structure

```
サービス管理者 (isServiceAdmin: true)
    └── 病院アカウント (hospitals)
            ├── 病院管理者 (hospital_admin) ← サービス管理者が招待
            └── 病院ユーザー (hospital_user) ← 病院管理者が招待
```

- ユーザーは複数の病院に所属可能
- hospital_groups テーブルで将来の病院グループ管理に対応

### Route Groups

```
src/routes/
├── (auth)/                 # 認証関連（未認証でもアクセス可）
│   ├── login/              # Keycloakログイン
│   ├── invite/[token]/     # 招待受諾
│   └── no-hospital/        # 病院未所属時の表示
├── (admin)/                # サービス管理者専用
│   └── admin/
│       ├── hospitals/      # 病院CRUD・招待
│       └── api-clients/    # APIクライアント管理
├── (hospital)/             # 病院コンテキスト
│   └── [hospitalSlug]/     # 動的ルート（病院スラッグ）
│       ├── +page           # ダッシュボード
│       ├── members/        # メンバー管理・招待
│       └── settings/       # 設定（APIクライアント等）
├── api/v1/                 # 外部API（Bearer認証）
│   ├── +server             # APIバージョン情報
│   └── hospitals/          # 病院API
└── auth/
    ├── callback/           # OAuthコールバック
    └── logout/             # ログアウト
```

### Server-Side Structure

```
src/lib/server/
├── auth/
│   ├── keycloak.ts         # Keycloak OIDCクライアント
│   ├── keycloak-admin.ts   # Keycloak Admin API
│   ├── api-auth.ts         # 外部API認証（Bearer Token）
│   ├── session.ts          # セッション管理
│   ├── user-sync.ts        # ユーザー同期
│   └── invitation.ts       # 招待トークン管理
├── db/
│   ├── index.ts            # DB接続
│   └── schema/
│       ├── users.ts        # ユーザー
│       ├── sessions.ts     # セッション
│       ├── hospitals.ts    # 病院
│       ├── hospital-groups.ts    # 病院グループ（将来用）
│       ├── hospital-memberships.ts  # ユーザー×病院
│       ├── invitations.ts  # 招待
│       └── api-clients.ts  # APIクライアント
└── repositories/           # データアクセス層
```

### Database Schema

- **users**: keycloakId, email, name, isServiceAdmin
- **hospitals**: name, slug, hospitalGroupId
- **hospital_memberships**: userId, hospitalId, role (hospital_admin | hospital_user)
- **invitations**: email, hospitalId, role, token, expiresAt
- **sessions**: userId, currentHospitalId, accessToken, refreshToken
- **api_clients**: hospitalId, keycloakClientId, name, isEnabled, createdBy

## Authentication Flow

1. `/login` → Keycloak認証画面
2. Keycloak認証成功 → `/auth/callback`
3. ユーザー作成/更新 → セッション作成
4. 招待があれば自動的にmembership作成
5. ロールに応じてリダイレクト

## Keycloak Setup

1. `pnpm docker:up` でKeycloak起動
2. http://localhost:8080 にアクセス (user: admin/pass: admin)
3. Realm作成: `document-creation`
4. Client作成: `sveltekit-app` (Client authentication: ON)
5. Redirect URI: `http://localhost:5173/*`
6. Client Secretを`.env`のKEYCLOAK_CLIENT_SECRETに設定

## Svelte 5 Runes

- `$props()` - コンポーネントprops
- `$state()` - リアクティブ状態
- `$derived()` - 派生値
- `{@render children()}` - スロットコンテンツ

## External API Authentication

外部システム連携用のOAuth2 Client Credentials Flow認証を実装。

### 概要

- Keycloakで動的にクライアントを作成・管理
- Bearer Token認証で`/api/v1/*`にアクセス
- 病院単位またはシステム全体のスコープ設定

### トークン取得方法

```bash
# Keycloakからアクセストークンを取得
curl -X POST "http://localhost:8080/realms/document-creation/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"
```

### APIアクセス

```bash
# Bearer Token を使用してAPIにアクセス
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:5173/api/v1/hospitals
```

### エンドポイント

- `GET /api/v1/` - API情報・クライアント情報
- `GET /api/v1/hospitals` - 病院一覧（スコープ内）
- `GET /api/v1/hospitals/:id` - 病院詳細

詳細は `docs/api-authentication.md` を参照。

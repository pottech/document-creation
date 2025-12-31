# Document Creation System - システム仕様書

## 概要

医療機関向け文書作成システム。生活習慣病療養計画書（様式9・9の2）の作成・管理・PDF出力を行う。

---

## 1. システム要件

### 1.1 対象ユーザー

| ロール | 説明 | 主な機能 |
|--------|------|----------|
| サービス管理者 | システム全体を管理 | 病院作成、病院管理者招待、APIクライアント管理、監査ログ閲覧 |
| 病院管理者 | 所属病院を管理 | メンバー招待、患者管理、療養計画書作成、設定管理 |
| 病院ユーザー | 所属病院を利用 | 患者管理、療養計画書作成・閲覧・PDF出力 |

### 1.2 技術要件

| カテゴリ | 要件 |
|---------|------|
| 認証 | Keycloak (OIDC/OAuth2) |
| データベース | PostgreSQL 16 |
| FHIRサーバー | HAPI FHIR R4 (オプション) |
| PDF生成 | pdfme (日本語フォント対応) |
| コンテナ | Docker / Docker Compose |

---

## 2. アカウント構造

```
サービス管理者 (isServiceAdmin: true)
    │
    │ 作成・管理
    ▼
病院グループ（将来用）
    │
    │ 所属
    ▼
病院 (hospitals)
    │
    ├── 病院管理者 (hospital_admin) ← サービス管理者が招待
    │       │
    │       │ 招待
    │       ▼
    └── 病院ユーザー (hospital_user)
```

### 2.1 マルチテナント設計

- 1ユーザーは複数の病院に所属可能
- 各病院のデータは完全に分離
- URLパスで病院を識別 (`/{hospitalSlug}/...`)

---

## 3. 認証・認可

### 3.1 Webアプリケーション認証（ブラウザ）

```
1. /login → Keycloak認証画面にリダイレクト
2. Keycloakでユーザー認証（ID/PW）
3. /auth/callback に認可コード付きでリダイレクト
4. 認可コード → アクセストークン交換
5. ユーザー情報取得・DB同期
6. セッション作成・Cookie設定
7. ロールに応じてリダイレクト
   - サービス管理者 → /admin
   - 病院ユーザー → /{hospitalSlug}
```

### 3.2 外部API認証（OAuth2 Client Credentials）

```
1. 外部システム → Keycloakにクライアント認証
2. Keycloak → アクセストークン発行
3. 外部システム → API呼び出し（Bearer Token）
4. アプリケーション → Keycloakにトークン検証（Introspection）
5. 検証成功 → APIレスポンス
```

### 3.3 セッション管理

| 項目 | 値 |
|------|-----|
| セッションID | ランダム64文字 |
| 保存先 | PostgreSQL (sessions テーブル) |
| Cookie名 | `session` |
| Cookie設定 | httpOnly, secure, sameSite=lax |
| 有効期限 | 24時間 |

### 3.4 招待フロー

1. 管理者が招待作成（メールアドレス、ロール指定）
2. 招待トークン生成（64文字ランダム）
3. 招待リンクをメール送信
4. ユーザーがリンクをクリック → `/invite/{token}`
5. Keycloakで認証（新規登録または既存ログイン）
6. 自動的に病院メンバーシップ作成

---

## 4. 機能仕様

### 4.1 病院管理（サービス管理者向け）

#### 4.1.1 病院一覧 (`/admin`)

- 全病院の一覧表示
- 病院名、スラッグ、メンバー数表示
- 新規病院作成リンク

#### 4.1.2 病院作成 (`/admin/hospitals/new`)

| フィールド | 必須 | 説明 |
|-----------|------|------|
| 病院名 | ○ | 表示名 |
| スラッグ | ○ | URL用識別子（英数字、ハイフン） |

#### 4.1.3 病院詳細 (`/admin/hospitals/{id}`)

- 病院情報表示・編集
- 病院管理者招待
- 病院削除

### 4.2 APIクライアント管理

#### 4.2.1 サービス管理者向け (`/admin/api-clients`)

- 全APIクライアント一覧
- システム全体スコープまたは病院スコープで作成可能

#### 4.2.2 病院管理者向け (`/{slug}/settings/api-clients`)

- 自病院のAPIクライアントのみ管理

#### 4.2.3 APIクライアント作成フロー

1. 管理画面で作成リクエスト
2. Keycloak Admin APIでクライアント作成
3. Client ID / Client Secret 発行
4. **Client Secretは作成時のみ表示**（再発行可能）

### 4.3 監査ログ (`/admin/audit-logs`)

#### 4.3.1 記録対象

| 操作種別 | 説明 |
|---------|------|
| care_plan.create | 療養計画書作成 |
| care_plan.update | 療養計画書編集 |
| care_plan.view | 療養計画書閲覧 |
| care_plan.delete | 療養計画書削除 |
| care_plan.pdf | PDF出力 |
| care_plan.sign | 署名 |
| patient.create | 患者登録 |
| patient.update | 患者情報編集 |
| patient.view | 患者情報閲覧 |
| patient.delete | 患者削除 |
| auth.login | ログイン |
| auth.logout | ログアウト |
| user.create | ユーザー作成 |
| user.update | ユーザー編集 |
| hospital.create | 病院作成 |
| hospital.update | 病院編集 |

#### 4.3.2 記録内容

- 操作者（ユーザーID、名前）
- 病院コンテキスト
- 操作対象（種別、ID、名前）
- 変更内容（before/after）
- メタデータ
- クライアント情報（IPアドレス、User-Agent）
- 成功/失敗
- タイムスタンプ

#### 4.3.3 フィルタリング

- 病院
- ユーザー
- 操作種別
- 対象種別
- 期間（開始日〜終了日）

### 4.4 患者管理

#### 4.4.1 患者一覧 (`/{slug}/patients`)

- 患者番号、氏名、生年月日、性別表示
- 検索機能（患者番号、氏名）
- 新規患者登録モーダル

#### 4.4.2 患者登録

| フィールド | 必須 | 型 | 説明 |
|-----------|------|-----|------|
| 患者番号 | ○ | string | 院内ID（病院内一意） |
| 氏名 | ○ | string | 漢字氏名 |
| 氏名カナ | - | string | カタカナ氏名 |
| 生年月日 | ○ | date | YYYY-MM-DD |
| 性別 | ○ | enum | male / female |

#### 4.4.3 患者詳細 (`/{slug}/patients/{patientId}`)

- 患者基本情報表示
- 療養計画書一覧（診療日順）
- 新規計画書作成リンク

### 4.5 療養計画書管理

#### 4.5.1 計画書種別

| 種別 | 様式 | 説明 |
|------|------|------|
| initial | 様式9 | 初回用 |
| continuous | 様式9の2 | 継続用（2回目以降） |

#### 4.5.2 計画書作成 (`/{slug}/patients/{patientId}/care-plans/new`)

**基本情報**
- 計画書種別（初回/継続）
- 回数（継続の場合: 2以上）
- 記入日
- 診療日

**主病（1つ以上必須）**
- 糖尿病
- 高血圧症
- 高脂血症

**検査項目**
- 身長、体重（現在/目標）、BMI（自動計算）
- 腹囲（現在/目標）
- 栄養状態
- 血圧（収縮期/拡張期）
- 運動負荷心電図

**血液検査**
- 採血日
- 血糖（測定条件: 空腹時/随時/食後）
- HbA1c（現在/目標）
- 総コレステロール
- 中性脂肪
- HDL/LDLコレステロール

**問診**
- 食事の状況
- 運動の状況
- たばこ
- その他の生活

**目標**
- 達成目標
- 行動目標
- 目標達成状況（継続のみ）
- 次の目標（継続のみ）

**重点指導項目**

*食事指導*
- 適正な摂取
- 塩分控えめ
- 食物繊維の摂取
- 外食時の注意
- 油を使った料理控えめ
- 飲酒控える（種類・量、週何日）
- 間食控える（種類・量、週何日）
- 食べ方（ゆっくり食べる等）
- 規則正しい食事
- その他
- 指導不要

*運動指導*
- 運動処方（種類、時間、頻度、強度、心拍数）
- 日常活動量増加
- 運動時の注意
- 指導不要

*たばこ指導*
- 非喫煙者である
- 禁煙の効果
- 禁煙の方法

*その他*
- 仕事
- 余暇
- 睡眠の質
- 減量
- 自己計測
- その他

**服薬指導**
- 処方なし
- 服薬についての説明

**問題点**
- 療養上の問題点
- 他の施設利用状況

**署名**
- 患者署名
- 主治医（上段）
- 医師（下段）

**担当者（領域別）**
- 食事
- 運動
- たばこ
- その他
- 服薬

**ステータス**
- draft: 下書き
- completed: 作成完了
- signed: 署名済み

#### 4.5.3 計画書詳細 (`/{slug}/patients/{patientId}/care-plans/{planId}`)

- 全項目の閲覧
- PDF出力ボタン

#### 4.5.4 PDF出力 (`/{slug}/patients/{patientId}/care-plans/{planId}/pdf`)

- pdfmeを使用してPDF生成
- 日本語フォント対応（Noto Sans CJK JP）
- ファイル名: `療養計画書_{患者番号}_{診療日}.pdf`

### 4.6 診療日別一覧 (`/{slug}/care-plans`)

- 診療日でグループ化された計画書一覧
- 月ナビゲーション
- 患者名、計画書種別表示

### 4.7 メンバー管理 (`/{slug}/members`)

- 病院メンバー一覧
- ロール表示（管理者/ユーザー）
- 新規メンバー招待

---

## 5. 外部API仕様

### 5.1 認証

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

### 5.2 エンドポイント

| パス | メソッド | 説明 |
|------|---------|------|
| /api/v1/ | GET | API情報・クライアント情報 |
| /api/v1/hospitals | GET | 病院一覧（スコープ内） |
| /api/v1/hospitals/{id} | GET | 病院詳細 |

### 5.3 スコープ

- システム全体スコープ: 全病院にアクセス可能
- 病院スコープ: 紐づく病院のみアクセス可能

---

## 6. Keycloak設定

### 6.1 Realm設定

- Realm名: `document-creation`

### 6.2 Webアプリクライアント

| 設定 | 値 |
|------|-----|
| Client ID | sveltekit-app (または nextjs-app) |
| Client Authentication | ON |
| Valid Redirect URIs | http://localhost:5173/*, http://localhost:3000/* |
| Web Origins | http://localhost:5173, http://localhost:3000 |

### 6.3 APIクライアント（動的作成）

| 設定 | 値 |
|------|-----|
| Client Authentication | ON |
| Service accounts roles | ON |
| Direct access grants | OFF |

### 6.4 Admin API用権限（APIクライアント動的作成に必要）

- realm-management: manage-clients
- realm-management: view-clients

---

## 7. 環境変数

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/document_creation

# Keycloak
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=document-creation
KEYCLOAK_CLIENT_ID=sveltekit-app
KEYCLOAK_CLIENT_SECRET=your-client-secret

# Keycloak Admin API (APIクライアント動的作成用)
KEYCLOAK_ADMIN_CLIENT_ID=admin-cli
KEYCLOAK_ADMIN_CLIENT_SECRET=your-admin-secret

# App
PUBLIC_APP_URL=http://localhost:5173
SESSION_SECRET=your-session-secret
```

---

## 8. ルート構成

```
/
├── /login                          # ログイン
├── /auth/callback                  # OAuthコールバック
├── /auth/logout                    # ログアウト
├── /invite/{token}                 # 招待受諾
├── /no-hospital                    # 病院未所属
│
├── /admin                          # 管理者ダッシュボード
│   ├── /hospitals                  # 病院一覧
│   │   ├── /new                    # 病院作成
│   │   └── /{id}                   # 病院詳細
│   ├── /api-clients                # APIクライアント一覧
│   │   ├── /new                    # APIクライアント作成
│   │   └── /{id}                   # APIクライアント詳細
│   └── /audit-logs                 # 監査ログ
│
├── /{hospitalSlug}                 # 病院ダッシュボード
│   ├── /patients                   # 患者一覧
│   │   └── /{patientId}            # 患者詳細
│   │       └── /care-plans
│   │           ├── /new            # 計画書作成
│   │           └── /{planId}       # 計画書詳細
│   │               └── /pdf        # PDF出力
│   ├── /care-plans                 # 診療日別一覧
│   ├── /members                    # メンバー一覧
│   └── /settings
│       └── /api-clients            # 病院APIクライアント
│           ├── /new
│           └── /{id}
│
└── /api/v1                         # 外部API
    ├── /                           # API情報
    └── /hospitals
        └── /{id}
```

---

## 9. Next.js移行時の注意点

### 9.1 対応関係

| SvelteKit | Next.js (App Router) |
|-----------|---------------------|
| +page.svelte | page.tsx |
| +page.server.ts (load) | page.tsx (async component) または generateMetadata |
| +page.server.ts (actions) | Server Actions または Route Handlers |
| +layout.svelte | layout.tsx |
| +layout.server.ts | layout.tsx (async) |
| hooks.server.ts | middleware.ts |
| $lib/server | @/lib (with 'use server') |
| locals | cookies(), headers() |

### 9.2 認証ライブラリ

- Arctic → NextAuth.js または Auth.js
- Keycloak連携は同様に可能

### 9.3 ORM

- Drizzle ORM → そのまま利用可能
- Prisma も選択肢

### 9.4 PDF生成

- pdfme → そのまま利用可能（Server Side）
- react-pdf, @react-pdf/renderer も選択肢

### 9.5 状態管理

- Svelte 5 runes → React hooks (useState, useReducer)
- サーバーコンポーネントでは不要

### 9.6 フォーム

- SvelteKit actions → Server Actions
- react-hook-form, Zod との組み合わせ推奨

# 外部API認証ガイド

Document Creation Systemの外部API認証について説明します。

## 概要

外部システムからDocument Creation SystemのAPIにアクセスするには、OAuth2 Client Credentials Flowを使用します。Keycloakをアイデンティティプロバイダーとして使用し、アクセストークンを取得してAPIにアクセスします。

## 認証フロー

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
    │                         │  5. Token Valid + Claims  │
    │                         │──────────────────────────>│
    │ 6. API Response                                     │
    │<────────────────────────────────────────────────────┤
```

## APIクライアントの作成

### サービス管理者による作成

1. 管理画面にログイン
2. サイドバーの「APIクライアント」をクリック
3. 「新規作成」ボタンをクリック
4. 以下の情報を入力:
   - クライアント名: 識別しやすい名前
   - 説明: クライアントの用途（任意）
   - スコープ: 「病院単位」または「システム全体」
   - 病院（病院単位の場合）: 対象の病院を選択
5. 「作成」をクリック
6. 表示された Client ID と Client Secret を安全な場所に保存

**重要**: Client Secret は作成時のみ表示されます。紛失した場合は再生成が必要です。

### 病院管理者による作成

1. 病院管理画面にログイン
2. サイドバーの「設定」→「APIクライアント管理」をクリック
3. 「新規作成」ボタンをクリック
4. 以下の情報を入力:
   - クライアント名: 識別しやすい名前
   - 説明: クライアントの用途（任意）
5. 「作成」をクリック
6. 表示された Client ID と Client Secret を安全な場所に保存

## アクセストークンの取得

### リクエスト

```bash
curl -X POST "http://localhost:8080/realms/document-creation/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"
```

### レスポンス

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI...",
  "expires_in": 300,
  "refresh_expires_in": 0,
  "token_type": "Bearer",
  "not-before-policy": 0,
  "scope": "profile email"
}
```

## APIへのアクセス

取得したアクセストークンを `Authorization` ヘッダーに設定してAPIにアクセスします。

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:5173/api/v1/hospitals
```

## APIエンドポイント

### GET /api/v1/

API情報とクライアント情報を取得します。

**レスポンス例:**

```json
{
  "version": "1.0.0",
  "name": "Document Creation API",
  "client": {
    "id": "your-client-id",
    "name": "電子カルテ連携",
    "scope": "hospital"
  },
  "endpoints": {
    "hospitals": "/api/v1/hospitals"
  }
}
```

### GET /api/v1/hospitals

病院一覧を取得します。クライアントのスコープに応じて取得できる病院が制限されます。

- **病院スコープ**: 紐づいた病院のみ
- **システムスコープ**: すべての病院

**レスポンス例:**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "東京病院",
      "slug": "tokyo-hospital",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "scope": "hospital"
  }
}
```

### GET /api/v1/hospitals/:id

指定した病院の詳細を取得します。クライアントのスコープ外の病院にはアクセスできません。

**レスポンス例:**

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "東京病院",
    "slug": "tokyo-hospital",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## エラーレスポンス

### 401 Unauthorized

認証に失敗した場合に返されます。

```json
{
  "error": "unauthorized",
  "message": "Invalid or expired access token",
  "statusCode": 401
}
```

### 403 Forbidden

認証は成功したが、リソースへのアクセス権がない場合に返されます。

```json
{
  "error": "forbidden",
  "message": "Access to this hospital is not allowed",
  "statusCode": 403
}
```

### 404 Not Found

リソースが見つからない場合に返されます。

```json
{
  "error": "not_found",
  "message": "Hospital not found",
  "statusCode": 404
}
```

## セキュリティに関する注意事項

1. **Client Secretの保護**: Client Secretは機密情報です。ソースコードにハードコードせず、環境変数や秘密管理システムで管理してください。

2. **トークンの有効期限**: アクセストークンには有効期限があります。期限切れの場合は新しいトークンを取得してください。

3. **最小権限の原則**: 必要最小限のスコープでAPIクライアントを作成してください。

4. **定期的なSecret再生成**: セキュリティ上の理由から、Client Secretは定期的に再生成することを推奨します。

## トラブルシューティング

### トークン取得に失敗する

- Client IDとClient Secretが正しいか確認
- クライアントが有効化されているか確認
- Keycloakが起動しているか確認

### APIアクセスが403エラーになる

- APIクライアントが有効化されているか確認
- アクセスしようとしているリソースがクライアントのスコープ内か確認

### トークンがすぐに期限切れになる

- Keycloakのクライアント設定でアクセストークンの有効期限を確認
- 必要に応じて有効期限を延長

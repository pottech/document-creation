# 監査ログ機能 実装計画

## 概要

医療情報システムの真正性を担保するため、療養計画書の作成・編集・発行に関する全ての操作を記録する監査ログ機能を実装する。

### 準拠すべきガイドライン
- 厚生労働省「医療情報システムの安全管理に関するガイドライン」
- 3省2ガイドライン（真正性・見読性・保存性）

---

## 記録すべき情報

### 基本項目（5W1H）
| 項目 | 説明 | フィールド |
|------|------|-----------|
| Who | 誰が | userId, userName |
| When | いつ | timestamp |
| What | 何を | targetType, targetId |
| Action | どのような操作 | action |
| Where | どこから | ipAddress, userAgent |
| Result | 結果 | success, errorMessage |

### 操作種別（Action）
```
care_plan.create    - 療養計画書作成
care_plan.update    - 療養計画書編集
care_plan.view      - 療養計画書閲覧
care_plan.delete    - 療養計画書削除
care_plan.pdf       - PDF出力
care_plan.sign      - 署名
patient.create      - 患者登録
patient.update      - 患者情報編集
patient.view        - 患者情報閲覧
patient.delete      - 患者削除
auth.login          - ログイン
auth.logout         - ログアウト
```

### 対象リソース（TargetType）
```
care_plan  - 療養計画書
patient    - 患者
user       - ユーザー
hospital   - 病院
```

---

## データベース設計

### audit_logs テーブル

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 操作者
  user_id UUID NOT NULL REFERENCES users(id),
  user_name VARCHAR(100) NOT NULL,           -- 非正規化（後から追跡可能に）

  -- 病院コンテキスト
  hospital_id UUID REFERENCES hospitals(id),
  hospital_name VARCHAR(200),

  -- 操作内容
  action VARCHAR(50) NOT NULL,               -- 'care_plan.create' など
  target_type VARCHAR(50) NOT NULL,          -- 'care_plan', 'patient' など
  target_id UUID,                            -- 対象のID
  target_name VARCHAR(200),                  -- 対象の名前（患者名など）

  -- 変更内容
  changes JSONB,                             -- 変更前後の値
  metadata JSONB,                            -- 追加情報

  -- クライアント情報
  ip_address VARCHAR(45),
  user_agent TEXT,

  -- 結果
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,

  -- タイムスタンプ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX audit_logs_hospital_id_idx ON audit_logs(hospital_id);
CREATE INDEX audit_logs_target_idx ON audit_logs(target_type, target_id);
CREATE INDEX audit_logs_action_idx ON audit_logs(action);
CREATE INDEX audit_logs_created_at_idx ON audit_logs(created_at);
```

---

## アーキテクチャ

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   SvelteKit     │────>│  Audit Service   │────>│   audit_logs    │
│   (Actions)     │     │                  │     │   (PostgreSQL)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │
         │                       ▼
         │              ┌──────────────────┐
         └─────────────>│   hooks.server   │  ← IPアドレス取得
                        └──────────────────┘
```

---

## 実装フェーズ

### Phase 1: 基盤実装

#### 1.1 スキーマ定義
**ファイル**: `src/lib/server/db/schema/audit-logs.ts`

```typescript
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  userName: varchar('user_name', { length: 100 }).notNull(),
  hospitalId: uuid('hospital_id').references(() => hospitals.id),
  hospitalName: varchar('hospital_name', { length: 200 }),
  action: varchar('action', { length: 50 }).notNull(),
  targetType: varchar('target_type', { length: 50 }).notNull(),
  targetId: uuid('target_id'),
  targetName: varchar('target_name', { length: 200 }),
  changes: jsonb('changes'),
  metadata: jsonb('metadata'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  success: boolean('success').notNull().default(true),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (table) => [
  index('audit_logs_user_id_idx').on(table.userId),
  index('audit_logs_hospital_id_idx').on(table.hospitalId),
  index('audit_logs_target_idx').on(table.targetType, table.targetId),
  index('audit_logs_action_idx').on(table.action),
  index('audit_logs_created_at_idx').on(table.createdAt)
]);
```

#### 1.2 監査サービス
**ファイル**: `src/lib/server/services/audit-service.ts`

```typescript
export interface AuditLogParams {
  userId: string;
  userName: string;
  hospitalId?: string;
  hospitalName?: string;
  action: AuditAction;
  targetType: TargetType;
  targetId?: string;
  targetName?: string;
  changes?: Record<string, { before: unknown; after: unknown }>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
}

export async function logAudit(params: AuditLogParams): Promise<void>;
export async function getAuditLogs(filters: AuditLogFilters): Promise<AuditLog[]>;
```

#### 1.3 Hooksでクライアント情報取得
**ファイル**: `src/hooks.server.ts`（更新）

```typescript
// リクエストごとにIPアドレスとUserAgentをlocalsに保存
event.locals.clientInfo = {
  ipAddress: event.getClientAddress(),
  userAgent: event.request.headers.get('user-agent')
};
```

---

### Phase 2: 療養計画書の監査ログ

#### 2.1 作成時のログ
**場所**: `care-plans/new/+page.server.ts`

```typescript
await logAudit({
  userId: locals.user.id,
  userName: locals.user.name,
  hospitalId: hospital.id,
  hospitalName: hospital.name,
  action: 'care_plan.create',
  targetType: 'care_plan',
  targetId: carePlan.id,
  targetName: `${patient.name} - ${carePlan.consultationDate}`,
  metadata: {
    patientId: patient.id,
    planType: carePlan.planType,
    sequenceNumber: carePlan.sequenceNumber
  },
  ipAddress: locals.clientInfo?.ipAddress,
  userAgent: locals.clientInfo?.userAgent
});
```

#### 2.2 編集時のログ（変更差分記録）
```typescript
const changes = {
  achievementGoal: {
    before: oldPlan.achievementGoal,
    after: newPlan.achievementGoal
  },
  // ... 変更があったフィールドのみ
};

await logAudit({
  action: 'care_plan.update',
  changes,
  // ...
});
```

#### 2.3 PDF出力時のログ
```typescript
await logAudit({
  action: 'care_plan.pdf',
  // ...
});
```

---

### Phase 3: 管理画面

#### 3.1 監査ログ一覧ページ（サービス管理者向け）
**ファイル**: `src/routes/(admin)/admin/audit-logs/+page.svelte`

- 全病院の操作ログ一覧
- フィルター: 日付範囲、操作種別、ユーザー、病院
- CSVエクスポート機能

#### 3.2 監査ログ一覧ページ（病院管理者向け）
**ファイル**: `src/routes/(hospital)/[hospitalSlug]/audit-logs/+page.svelte`

- 自病院の操作ログのみ
- フィルター: 日付範囲、操作種別、ユーザー

---

### Phase 4: 療養計画書への履歴統合

#### 4.1 計画書詳細ページに履歴タブ追加
- 作成者、作成日時
- 編集履歴（誰がいつ何を変更したか）
- PDF出力履歴
- 署名履歴

---

## 実装順序

1. **Phase 1**: 基盤実装（スキーマ、サービス、Hooks）
2. **Phase 2**: 療養計画書の監査ログ実装
3. **Phase 3**: 管理画面
4. **Phase 4**: 計画書詳細への統合

---

## 作成・更新ファイル一覧

### 新規作成
- `src/lib/server/db/schema/audit-logs.ts`
- `src/lib/server/services/audit-service.ts`
- `src/routes/(admin)/admin/audit-logs/+page.server.ts`
- `src/routes/(admin)/admin/audit-logs/+page.svelte`
- `src/routes/(hospital)/[hospitalSlug]/audit-logs/+page.server.ts`
- `src/routes/(hospital)/[hospitalSlug]/audit-logs/+page.svelte`

### 更新
- `src/lib/server/db/schema/index.ts`
- `src/hooks.server.ts`
- `src/app.d.ts`（locals型定義）
- `src/routes/(hospital)/[hospitalSlug]/patients/[patientId]/care-plans/new/+page.server.ts`
- `src/routes/(hospital)/[hospitalSlug]/patients/[patientId]/care-plans/[planId]/+page.server.ts`
- `src/routes/(hospital)/[hospitalSlug]/patients/[patientId]/care-plans/[planId]/pdf/+server.ts`

---

## セキュリティ考慮事項

1. **改ざん防止**: 監査ログは削除・更新不可（INSERTのみ）
2. **アクセス制御**: 監査ログ閲覧は管理者のみ
3. **保存期間**: 法令に基づき最低5年間保存
4. **バックアップ**: 定期的なバックアップ必須

---

## 将来の拡張

1. **電子署名**: タイムスタンプ局との連携
2. **ブロックチェーン**: 改ざん検知の強化
3. **リアルタイム監視**: 異常操作のアラート
4. **レポート機能**: 月次監査レポート自動生成

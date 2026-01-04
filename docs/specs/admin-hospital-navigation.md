# 機能仕様書: Admin画面から所属病院への導線追加

## 1. 概要

サービス管理者（isServiceAdmin: true）が病院アカウントにも所属している場合、Admin画面から直接その病院の画面に遷移できる導線を追加する。現在は直接URLを入力するしか方法がないため、ユーザビリティを向上させる。

## 2. ユーザーストーリー

- As a サービス管理者, I want Admin画面から所属病院に素早く切り替えたい, so that URLを手入力せずに病院管理作業ができる

## 3. 機能要件

### 必須要件
- [ ] Admin画面のサイドナビに「所属病院」セクションを追加
- [ ] ユーザーが所属する病院の一覧を表示
- [ ] 各病院名をクリックすると、その病院のダッシュボード（`/{hospitalSlug}`）に遷移
- [ ] 所属病院がない場合はセクションを非表示

### オプション要件
- [ ] 病院でのロール（管理者/ユーザー）を表示

## 4. 技術設計

### 4.1 データモデル

既存スキーマを使用（変更なし）:
- `hospital_memberships` - ユーザーと病院の紐付け
- `hospitals` - 病院情報（slug含む）

### 4.2 API設計

新規エンドポイントは不要。`+layout.server.ts`でデータを取得。

### 4.3 データ取得クエリ

```typescript
// ユーザーの所属病院を取得
const userHospitals = await db
  .select({
    hospitalId: hospitals.id,
    hospitalName: hospitals.name,
    hospitalSlug: hospitals.slug,
    role: hospitalMemberships.role
  })
  .from(hospitalMemberships)
  .innerJoin(hospitals, eq(hospitals.id, hospitalMemberships.hospitalId))
  .where(eq(hospitalMemberships.userId, user.id))
  .orderBy(hospitals.name);
```

### 4.4 UI設計

**変更ファイル**: `src/routes/(admin)/+layout.svelte`

**追加するUI要素**:
```
サイドナビ
├── ダッシュボード
├── 病院管理
├── APIクライアント
├── ─────────────── (区切り線)
├── 🏥 所属病院      ← 新規追加
│   ├── A病院 (管理者)
│   ├── B病院 (ユーザー)
│   └── C病院 (管理者)
└── ログアウト
```

**データ受け渡し**:
- `+layout.server.ts` → `+layout.svelte` へ `userHospitals` を渡す

## 5. 影響範囲

### 変更ファイル
- `src/routes/(admin)/+layout.server.ts` - 所属病院データ取得追加
- `src/routes/(admin)/+layout.svelte` - 所属病院セクションUI追加

### 新規ファイル
なし

## 6. テスト計画

### ユニットテスト
- `tests/unit/admin-layout.test.ts`
  - 所属病院がある場合のデータ取得
  - 所属病院がない場合の動作

### E2Eテスト
- `tests/e2e/admin-hospital-navigation.spec.ts`
  - 所属病院セクションが表示される
  - 病院リンクをクリックして遷移できる
  - 所属病院がないユーザーにはセクションが表示されない

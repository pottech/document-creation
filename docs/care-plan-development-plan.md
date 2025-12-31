# 生活習慣病療養計画書機能 開発計画書

## 概要

本ドキュメントは、生活習慣病療養計画書（別紙様式9・9の2）の作成・管理機能の開発計画を定義する。

### 目的
- 生活習慣病管理料の算定に必要な療養計画書の作成・管理を効率化
- 患者単位での計画書管理と履歴追跡
- 診療日毎の作成状況の可視化

### 対象帳票
- **別紙様式9**: 生活習慣病療養計画書（初回用）
- **別紙様式9の2**: 生活習慣病療養計画書（継続用）

### 対象疾患
- 糖尿病
- 高血圧症
- 高脂血症（脂質異常症）

---

## システムアーキテクチャ

### データモデル設計

```
┌─────────────────┐     ┌─────────────────┐
│    hospitals    │     │     users       │
│  (病院マスタ)    │     │  (ユーザー)      │
└────────┬────────┘     └────────┬────────┘
         │                        │
         │  1:N                   │ 1:N (担当者)
         ▼                        │
┌─────────────────┐               │
│    patients     │               │
│  (患者マスタ)    │               │
└────────┬────────┘               │
         │                        │
         │  1:N                   │
         ▼                        │
┌─────────────────┐               │
│   care_plans    │◄──────────────┘
│  (療養計画書)    │
└────────┬────────┘
         │
         │  1:N
         ▼
┌─────────────────┐
│care_plan_staffs │
│ (担当者紐付け)   │
└─────────────────┘
```

---

## Phase 1: データベース設計

### 1.1 患者テーブル（patients）

```typescript
// src/lib/server/db/schema/patients.ts
{
  id: uuid (PK),
  hospitalId: uuid (FK -> hospitals),
  patientNumber: varchar(50),        // 患者番号（院内ID）
  name: varchar(100),                // 氏名
  nameKana: varchar(100),            // 氏名カナ（オプション）
  birthDate: date,                   // 生年月日
  gender: varchar(10),               // 性別: 'male' | 'female'
  createdAt: timestamp,
  updatedAt: timestamp,

  // UNIQUE制約: (hospitalId, patientNumber)
}
```

### 1.2 療養計画書テーブル（care_plans）

```typescript
// src/lib/server/db/schema/care-plans.ts
{
  id: uuid (PK),
  hospitalId: uuid (FK -> hospitals),
  patientId: uuid (FK -> patients),

  // 計画書種別
  planType: varchar(20),             // 'initial' | 'continuous'
  sequenceNumber: int,               // 回数（継続用: 2以上）

  // 基本情報
  recordDate: date,                  // 記入日
  consultationDate: date,            // 診療日

  // 主病（複数選択可）
  hasDiabetes: boolean,              // 糖尿病
  hasHypertension: boolean,          // 高血圧症
  hasHyperlipidemia: boolean,        // 高脂血症

  // 検査項目
  height: decimal(5,1),              // 身長 cm
  weightCurrent: decimal(5,1),       // 体重（現在）kg
  weightTarget: decimal(5,1),        // 体重（目標）kg
  bmi: decimal(4,1),                 // BMI（自動計算）
  waistCurrent: decimal(5,1),        // 腹囲（現在）cm
  waistTarget: decimal(5,1),         // 腹囲（目標）cm
  nutritionStatus: varchar(20),      // 栄養状態
  bloodPressureSystolic: int,        // 収縮期血圧 mmHg
  bloodPressureDiastolic: int,       // 拡張期血圧 mmHg
  hasExerciseEcg: boolean,           // 運動負荷心電図

  // 血液検査項目
  bloodTestDate: date,               // 採血日
  bloodGlucoseCondition: varchar(20),// 血糖測定条件
  bloodGlucosePostMealHours: int,    // 食後時間
  bloodGlucose: int,                 // 血糖値 mg/dl
  hba1cCurrent: decimal(3,1),        // HbA1c（現在）%
  hba1cTarget: decimal(3,1),         // HbA1c（目標）%
  totalCholesterol: int,             // 総コレステロール mg/dl
  triglycerides: int,                // 中性脂肪 mg/dl
  hdlCholesterol: int,               // HDLコレステロール mg/dl
  ldlCholesterol: int,               // LDLコレステロール mg/dl

  // 問診
  dietarySituation: text,            // 食事の状況
  exerciseSituation: text,           // 運動の状況
  smokingSituation: text,            // たばこ
  otherLifestyle: text,              // その他の生活

  // 達成目標・行動目標
  achievementGoal: text,             // ①達成目標
  behaviorGoal: text,                // ②行動目標

  // 継続用固有項目
  goalAchievementStatus: text,       // 目標の達成状況（継続用）
  nextGoal: text,                    // 次の目標（継続用）

  // 重点指導項目（食事）- JSONB
  dietGuidance: jsonb,

  // 重点指導項目（運動）- JSONB
  exerciseGuidance: jsonb,

  // 重点指導項目（たばこ）- JSONB
  smokingGuidance: jsonb,

  // 重点指導項目（その他）- JSONB
  otherGuidance: jsonb,

  // 服薬指導
  hasNoPrescription: boolean,        // 処方なし
  hasMedicationExplanation: boolean, // 薬の説明

  // 療養上の問題点
  treatmentIssues: text,             // 療養を行うにあたっての問題点
  otherFacilityUsage: text,          // 他の施設の利用状況

  // 署名・承認
  patientSignature: varchar(100),    // 患者署名
  primaryDoctorId: uuid (FK -> users), // 主治医
  secondaryDoctorId: uuid (FK -> users), // 下段医師

  // ステータス
  status: varchar(20),               // 'draft' | 'completed' | 'signed'
  pdfPath: varchar(500),             // 生成したPDFのパス

  // 監査
  createdBy: uuid (FK -> users),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 1.3 療養計画書担当者テーブル（care_plan_staffs）

```typescript
// src/lib/server/db/schema/care-plan-staffs.ts
{
  id: uuid (PK),
  carePlanId: uuid (FK -> care_plans),
  userId: uuid (FK -> users),
  role: varchar(50),                 // 担当領域: 'diet' | 'exercise' | 'smoking' | 'other' | 'medication'
  displayOrder: int,                 // 表示順
  createdAt: timestamp
}
```

### 1.4 重点指導項目のJSON構造

```typescript
// 食事指導（dietGuidance）
{
  properIntake: boolean,             // 食事摂取量を適正にする
  reduceSalt: boolean,               // 食塩・調味料を控える
  increaseFiber: boolean,            // 食物繊維の摂取を増やす
  eatingOutNotes: string,            // 外食の際の注意事項
  reduceOil: boolean,                // 油を使った料理の摂取を減らす
  other: string,                     // その他
  reduceAlcohol: {
    enabled: boolean,
    typeAndAmount: string,           // 種類・量
    weeklyFrequency: number          // 週回数
  },
  reduceSnacks: {
    enabled: boolean,
    typeAndAmount: string,
    weeklyFrequency: number
  },
  eatingStyle: {
    slowEating: boolean,
    other: string
  },
  regularMeals: boolean,             // 食事時間規則正しくとる
  noGuidanceNeeded: boolean          // 今回は指導の必要なし（継続用）
}

// 運動指導（exerciseGuidance）
{
  prescription: {
    type: string,                    // 種類
    duration: string,                // 時間
    frequency: string,               // 頻度
    weeklyDays: number,              // 週日数
    intensity: string,               // 強度
    heartRate: number                // 脈拍
  },
  dailyActivityIncrease: string,     // 日常生活活動量増加
  exerciseNotes: string,             // 運動時の注意事項
  noGuidanceNeeded: boolean
}

// たばこ指導（smokingGuidance）
{
  isNonSmoker: boolean,              // 非喫煙者である
  quitSmokingEffectiveness: boolean, // 禁煙・節煙の有効性指導
  quitSmokingMethod: boolean         // 禁煙の実施方法等指導
}

// その他指導（otherGuidance）
{
  work: boolean,                     // 仕事
  leisure: boolean,                  // 余暇
  sleepQuality: boolean,             // 睡眠の確保
  weightLoss: boolean,               // 減量
  homeMeasurement: boolean,          // 家庭での計測
  other: string                      // その他
}
```

---

## Phase 2: リポジトリ層

### 2.1 患者リポジトリ
**ファイル**: `src/lib/server/repositories/patients.ts`

```typescript
// 機能:
- getPatients(hospitalId, options): 患者一覧取得（検索・ページネーション対応）
- getPatientById(id): 患者詳細取得
- getPatientByNumber(hospitalId, patientNumber): 患者番号で取得
- createPatient(data): 患者登録
- updatePatient(id, data): 患者更新
- deletePatient(id): 患者削除
```

### 2.2 療養計画書リポジトリ
**ファイル**: `src/lib/server/repositories/care-plans.ts`

```typescript
// 機能:
- getCarePlans(hospitalId, options): 計画書一覧取得
- getCarePlansByPatient(patientId): 患者別計画書履歴取得
- getCarePlansByDate(hospitalId, date): 診療日別計画書一覧
- getCarePlanById(id): 計画書詳細取得
- getLatestCarePlan(patientId): 患者の最新計画書取得
- createCarePlan(data): 計画書作成
- updateCarePlan(id, data): 計画書更新
- deleteCarePlan(id): 計画書削除
- getCarePlanStats(hospitalId, dateRange): 統計情報取得
```

---

## Phase 3: 病院側画面（患者管理）

### 3.1 ルート構造

```
src/routes/(hospital)/[hospitalSlug]/
├── patients/                        # 患者管理
│   ├── +page.server.ts             # 患者一覧
│   ├── +page.svelte
│   ├── new/                        # 新規患者登録
│   │   ├── +page.server.ts
│   │   └── +page.svelte
│   └── [patientId]/                # 患者詳細
│       ├── +page.server.ts
│       ├── +page.svelte
│       └── care-plans/             # 患者の療養計画書履歴
│           ├── +page.server.ts
│           ├── +page.svelte
│           ├── new/                # 新規計画書作成
│           │   ├── +page.server.ts
│           │   └── +page.svelte
│           └── [planId]/           # 計画書詳細・編集
│               ├── +page.server.ts
│               ├── +page.svelte
│               └── pdf/            # PDF出力
│                   └── +server.ts
└── care-plans/                     # 療養計画書（診療日別ビュー）
    ├── +page.server.ts             # 診療日別一覧
    ├── +page.svelte
    └── calendar/                   # カレンダービュー
        ├── +page.server.ts
        └── +page.svelte
```

### 3.2 患者一覧ページ
**ファイル**: `src/routes/(hospital)/[hospitalSlug]/patients/+page.svelte`

機能:
- 患者一覧表示（テーブル形式）
- 検索（患者番号、氏名）
- ページネーション
- 新規登録ボタン
- 各患者の最新計画書ステータス表示

### 3.3 患者詳細ページ
**ファイル**: `src/routes/(hospital)/[hospitalSlug]/patients/[patientId]/+page.svelte`

機能:
- 患者基本情報表示・編集
- 療養計画書履歴一覧（タイムライン表示）
- 検査値推移グラフ（HbA1c、体重、血圧など）
- 新規計画書作成ボタン

### 3.4 療養計画書作成ページ
**ファイル**: `src/routes/(hospital)/[hospitalSlug]/patients/[patientId]/care-plans/new/+page.svelte`

機能:
- 計画書種別選択（初回/継続）
- 継続の場合、前回データ自動転記
- タブ形式の入力フォーム:
  1. 基本情報・検査項目
  2. 問診・目標設定
  3. 重点指導項目（食事）
  4. 重点指導項目（運動）
  5. 重点指導項目（たばこ・その他）
  6. 服薬指導・問題点
  7. 担当者・署名
- リアルタイムバリデーション
- 下書き保存機能
- プレビュー機能
- PDF生成・出力

---

## Phase 4: 診療日別ビュー

### 4.1 診療日別計画書一覧
**ファイル**: `src/routes/(hospital)/[hospitalSlug]/care-plans/+page.svelte`

機能:
- 日付選択（デフォルト: 今日）
- 選択日に作成された計画書一覧
- 作成件数サマリー
- フィルター（疾患別、ステータス別）
- カレンダービューへの切り替え

### 4.2 カレンダービュー
**ファイル**: `src/routes/(hospital)/[hospitalSlug]/care-plans/calendar/+page.svelte`

機能:
- 月間カレンダー表示
- 日付ごとの作成件数表示
- 日付クリックで詳細一覧表示
- 月間統計サマリー

---

## Phase 5: PDF生成

### 5.1 PDF生成サービス
**ファイル**: `src/lib/server/services/pdf-generator.ts`

技術選定:
- **puppeteer** または **pdf-lib** を使用
- HTMLテンプレートからPDF生成

機能:
- 様式9（初回用）PDF生成
- 様式9の2（継続用）PDF生成
- 患者控え・カルテ控え対応

### 5.2 PDFテンプレート
**ファイル**: `src/lib/server/templates/care-plan-initial.html`
**ファイル**: `src/lib/server/templates/care-plan-continuous.html`

---

## Phase 6: テンプレート機能

### 6.1 テンプレートテーブル
```typescript
// src/lib/server/db/schema/care-plan-templates.ts
{
  id: uuid (PK),
  hospitalId: uuid (FK -> hospitals),
  name: varchar(100),                // テンプレート名
  description: text,                 // 説明
  targetDisease: varchar(50),        // 対象疾患
  templateData: jsonb,               // テンプレートデータ
  isDefault: boolean,                // デフォルトテンプレート
  createdBy: uuid (FK -> users),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 6.2 標準テンプレート
- 糖尿病用テンプレート
- 高血圧症用テンプレート
- 高脂血症用テンプレート

---

## Phase 7: FHIR連携（将来拡張）

### 7.1 FHIRリソースマッピング

| 内部データ | FHIRリソース |
|-----------|-------------|
| patients | Patient |
| care_plans | CarePlan + QuestionnaireResponse |
| care_plan_staffs | CareTeam |

### 7.2 FHIRコンバーター
**ファイル**: `src/lib/server/fhir/converters/patient.ts`
**ファイル**: `src/lib/server/fhir/converters/care-plan.ts`

---

## 実装フェーズ

### Phase 1: DBスキーマ・基盤
1. patients テーブル作成
2. care_plans テーブル作成
3. care_plan_staffs テーブル作成
4. care_plan_templates テーブル作成
5. マイグレーション実行
6. リポジトリ層実装

### Phase 2: 患者管理画面
1. 患者一覧ページ
2. 患者新規登録ページ
3. 患者詳細ページ
4. 患者編集機能

### Phase 3: 療養計画書作成
1. 計画書作成フォーム（初回用）
2. 計画書作成フォーム（継続用）
3. 前回データ自動転記機能
4. バリデーション実装
5. 下書き保存機能

### Phase 4: 計画書管理・表示
1. 患者別履歴一覧
2. 診療日別一覧
3. カレンダービュー
4. 検査値推移グラフ

### Phase 5: PDF生成
1. PDFテンプレート作成
2. PDF生成サービス実装
3. PDF出力エンドポイント

### Phase 6: テンプレート機能
1. テンプレート管理画面
2. 標準テンプレート登録
3. テンプレート適用機能

### Phase 7: ナビゲーション更新
1. 病院側レイアウト更新
2. サイドメニュー追加

---

## 作成・更新ファイル一覧

### 新規作成

#### スキーマ
- `src/lib/server/db/schema/patients.ts`
- `src/lib/server/db/schema/care-plans.ts`
- `src/lib/server/db/schema/care-plan-staffs.ts`
- `src/lib/server/db/schema/care-plan-templates.ts`

#### リポジトリ
- `src/lib/server/repositories/patients.ts`
- `src/lib/server/repositories/care-plans.ts`
- `src/lib/server/repositories/care-plan-templates.ts`

#### サービス
- `src/lib/server/services/pdf-generator.ts`

#### テンプレート
- `src/lib/server/templates/care-plan-initial.html`
- `src/lib/server/templates/care-plan-continuous.html`

#### ルート（患者管理）
- `src/routes/(hospital)/[hospitalSlug]/patients/+page.server.ts`
- `src/routes/(hospital)/[hospitalSlug]/patients/+page.svelte`
- `src/routes/(hospital)/[hospitalSlug]/patients/new/+page.server.ts`
- `src/routes/(hospital)/[hospitalSlug]/patients/new/+page.svelte`
- `src/routes/(hospital)/[hospitalSlug]/patients/[patientId]/+page.server.ts`
- `src/routes/(hospital)/[hospitalSlug]/patients/[patientId]/+page.svelte`
- `src/routes/(hospital)/[hospitalSlug]/patients/[patientId]/care-plans/+page.server.ts`
- `src/routes/(hospital)/[hospitalSlug]/patients/[patientId]/care-plans/+page.svelte`
- `src/routes/(hospital)/[hospitalSlug]/patients/[patientId]/care-plans/new/+page.server.ts`
- `src/routes/(hospital)/[hospitalSlug]/patients/[patientId]/care-plans/new/+page.svelte`
- `src/routes/(hospital)/[hospitalSlug]/patients/[patientId]/care-plans/[planId]/+page.server.ts`
- `src/routes/(hospital)/[hospitalSlug]/patients/[patientId]/care-plans/[planId]/+page.svelte`
- `src/routes/(hospital)/[hospitalSlug]/patients/[patientId]/care-plans/[planId]/pdf/+server.ts`

#### ルート（診療日別ビュー）
- `src/routes/(hospital)/[hospitalSlug]/care-plans/+page.server.ts`
- `src/routes/(hospital)/[hospitalSlug]/care-plans/+page.svelte`
- `src/routes/(hospital)/[hospitalSlug]/care-plans/calendar/+page.server.ts`
- `src/routes/(hospital)/[hospitalSlug]/care-plans/calendar/+page.svelte`

#### コンポーネント
- `src/lib/components/care-plan/BasicInfoForm.svelte`
- `src/lib/components/care-plan/ExamResultsForm.svelte`
- `src/lib/components/care-plan/GoalsForm.svelte`
- `src/lib/components/care-plan/DietGuidanceForm.svelte`
- `src/lib/components/care-plan/ExerciseGuidanceForm.svelte`
- `src/lib/components/care-plan/SmokingGuidanceForm.svelte`
- `src/lib/components/care-plan/OtherGuidanceForm.svelte`
- `src/lib/components/care-plan/SignatureForm.svelte`
- `src/lib/components/care-plan/CarePlanPreview.svelte`
- `src/lib/components/care-plan/LabResultsChart.svelte`

### 更新
- `src/lib/server/db/schema/index.ts`
- `src/routes/(hospital)/[hospitalSlug]/+layout.svelte`
- `CLAUDE.md`
- `docs/database.dbml`

---

## 画面遷移図

```
病院ダッシュボード
    │
    ├── 患者管理
    │   ├── 患者一覧 ──┬── 新規登録
    │   │              └── 患者詳細 ──┬── 編集
    │   │                             └── 療養計画書履歴
    │   │                                  ├── 新規作成
    │   │                                  └── 計画書詳細 ── PDF出力
    │   │
    │   └── 検索・フィルター
    │
    └── 療養計画書
        ├── 診療日別一覧 ── 日付選択
        │
        └── カレンダービュー ── 月選択
```

---

## バリデーションルール

### 必須チェック
- 記入日、患者、主病は必須
- 達成目標、行動目標は必須
- 医師氏名は必須
- 継続用の場合、目標の達成状況は必須

### 整合性チェック
- 採血日は記入日以前
- 目標体重は現在体重の±30%以内（警告）
- 目標HbA1cは現在値の±3%以内（警告）
- 血糖測定条件が「食後」の場合、食後時間は必須
- 継続用の回数は前回より大きい値

### 警告ルール
- HbA1c 7.0%以上：糖尿病コントロール要注意
- 血圧 140/90 mmHg以上：高血圧要注意
- LDLコレステロール 140 mg/dl以上：脂質異常要注意
- BMI 25以上：肥満注意

---

## 依存パッケージ

```bash
# PDF生成
pnpm add puppeteer
# または
pnpm add pdf-lib

# グラフ表示
pnpm add chart.js svelte-chartjs

# 日付処理
pnpm add date-fns
```

---

## セキュリティ考慮事項

1. **アクセス制御**: 病院メンバーのみが自病院の患者・計画書にアクセス可能
2. **監査ログ**: 計画書の作成・更新・削除を記録
3. **個人情報保護**: 患者情報の暗号化を検討
4. **PDFダウンロード**: 認証済みユーザーのみ

---

## 改訂履歴

| 版 | 日付 | 変更内容 | 担当 |
|---|------|---------|------|
| 1.0 | 2025/12/31 | 初版作成 | - |

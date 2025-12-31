# FHIRリソースマッピング設計

## 概要

本ドキュメントでは、Document Creation Systemの内部データモデルとHL7 FHIR R4リソースのマッピングを定義する。

## マッピング一覧

### 1. hospitals → Organization

病院情報をFHIR Organizationリソースにマッピング。

#### 内部スキーマ

```typescript
// src/lib/server/db/schema/hospitals.ts
{
  id: uuid,
  name: varchar(255),
  slug: varchar(100),
  hospitalGroupId: uuid | null,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### FHIR Organization

```json
{
  "resourceType": "Organization",
  "id": "{hospitals.id}",
  "meta": {
    "versionId": "1",
    "lastUpdated": "{hospitals.updatedAt}",
    "profile": ["http://jpfhir.jp/fhir/core/StructureDefinition/JP_Organization"]
  },
  "identifier": [
    {
      "system": "urn:oid:1.2.392.100495.20.3.21",
      "value": "{医療機関コード（将来拡張）}"
    },
    {
      "system": "http://document-creation.local/hospital-slug",
      "value": "{hospitals.slug}"
    }
  ],
  "active": true,
  "type": [
    {
      "coding": [
        {
          "system": "http://terminology.hl7.org/CodeSystem/organization-type",
          "code": "prov",
          "display": "Healthcare Provider"
        }
      ]
    }
  ],
  "name": "{hospitals.name}",
  "partOf": {
    "reference": "Organization/{hospitals.hospitalGroupId}"
  }
}
```

#### 変換関数（TypeScript案）

```typescript
// src/lib/server/fhir/converters/organization.ts
import type { Organization } from 'fhir/r4';
import type { Hospital } from '$lib/server/db/schema';

export function hospitalToOrganization(hospital: Hospital): Organization {
  return {
    resourceType: 'Organization',
    id: hospital.id,
    meta: {
      lastUpdated: hospital.updatedAt.toISOString(),
      profile: ['http://jpfhir.jp/fhir/core/StructureDefinition/JP_Organization']
    },
    identifier: [
      {
        system: 'http://document-creation.local/hospital-slug',
        value: hospital.slug
      }
    ],
    active: true,
    type: [
      {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/organization-type',
            code: 'prov',
            display: 'Healthcare Provider'
          }
        ]
      }
    ],
    name: hospital.name,
    ...(hospital.hospitalGroupId && {
      partOf: {
        reference: `Organization/${hospital.hospitalGroupId}`
      }
    })
  };
}
```

---

### 2. users → Practitioner

ユーザー情報をFHIR Practitionerリソースにマッピング。

#### 内部スキーマ

```typescript
// src/lib/server/db/schema/users.ts
{
  id: uuid,
  keycloakId: varchar(255),
  email: varchar(255),
  name: varchar(255),
  isServiceAdmin: boolean,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### FHIR Practitioner

```json
{
  "resourceType": "Practitioner",
  "id": "{users.id}",
  "meta": {
    "lastUpdated": "{users.updatedAt}",
    "profile": ["http://jpfhir.jp/fhir/core/StructureDefinition/JP_Practitioner"]
  },
  "identifier": [
    {
      "system": "http://document-creation.local/user-id",
      "value": "{users.id}"
    }
  ],
  "active": true,
  "name": [
    {
      "use": "official",
      "text": "{users.name}"
    }
  ],
  "telecom": [
    {
      "system": "email",
      "value": "{users.email}",
      "use": "work"
    }
  ]
}
```

---

### 3. hospital_memberships → PractitionerRole

ユーザーと病院の関連をFHIR PractitionerRoleリソースにマッピング。

#### 内部スキーマ

```typescript
// src/lib/server/db/schema/hospital-memberships.ts
{
  id: uuid,
  userId: uuid,
  hospitalId: uuid,
  role: 'hospital_admin' | 'hospital_user',
  createdAt: timestamp
}
```

#### FHIR PractitionerRole

```json
{
  "resourceType": "PractitionerRole",
  "id": "{hospital_memberships.id}",
  "meta": {
    "lastUpdated": "{hospital_memberships.createdAt}"
  },
  "active": true,
  "practitioner": {
    "reference": "Practitioner/{hospital_memberships.userId}"
  },
  "organization": {
    "reference": "Organization/{hospital_memberships.hospitalId}"
  },
  "code": [
    {
      "coding": [
        {
          "system": "http://document-creation.local/role",
          "code": "{hospital_memberships.role}",
          "display": "{role_display_name}"
        }
      ]
    }
  ]
}
```

---

## 将来の拡張リソース

### Patient（患者）

```json
{
  "resourceType": "Patient",
  "id": "{患者ID}",
  "meta": {
    "profile": ["http://jpfhir.jp/fhir/core/StructureDefinition/JP_Patient"]
  },
  "identifier": [
    {
      "system": "urn:oid:1.2.392.100495.20.3.51.{医療機関コード}",
      "value": "{患者番号}"
    }
  ],
  "name": [
    {
      "use": "official",
      "family": "{姓}",
      "given": ["{名}"],
      "extension": [
        {
          "url": "http://hl7.org/fhir/StructureDefinition/iso21090-EN-representation",
          "valueCode": "IDE"
        }
      ]
    },
    {
      "use": "official",
      "family": "{セイ}",
      "given": ["{メイ}"],
      "extension": [
        {
          "url": "http://hl7.org/fhir/StructureDefinition/iso21090-EN-representation",
          "valueCode": "SYL"
        }
      ]
    }
  ],
  "gender": "male|female|other|unknown",
  "birthDate": "YYYY-MM-DD"
}
```

### DocumentReference（文書参照）

```json
{
  "resourceType": "DocumentReference",
  "id": "{文書ID}",
  "status": "current",
  "type": {
    "coding": [
      {
        "system": "http://loinc.org",
        "code": "{文書タイプコード}"
      }
    ]
  },
  "subject": {
    "reference": "Patient/{患者ID}"
  },
  "date": "{作成日時}",
  "author": [
    {
      "reference": "Practitioner/{作成者ID}"
    }
  ],
  "content": [
    {
      "attachment": {
        "contentType": "application/pdf",
        "url": "{文書URL}",
        "title": "{文書タイトル}"
      }
    }
  ],
  "context": {
    "encounter": [
      {
        "reference": "Encounter/{来院ID}"
      }
    ]
  }
}
```

---

## 同期戦略

### Push同期（内部→FHIR）

1. **イベント駆動**: 内部DBの変更時にFHIRサーバーへ同期
2. **バッチ同期**: 定期的に差分を同期
3. **オンデマンド**: API呼び出し時に必要なリソースを同期

### 推奨アプローチ

```
Phase 1: オンデマンド同期
  - /api/v1/fhir/sync/hospitals でトリガー
  - 手動での同期確認

Phase 2: イベント駆動同期
  - DB変更時にWebhookでFHIR更新
  - リアルタイム性向上

Phase 3: 双方向同期
  - FHIR Subscription機能活用
  - 外部システムからの更新を内部DBに反映
```

---

## API設計

### 同期エンドポイント

```typescript
// POST /api/v1/fhir/sync/hospitals
// 病院情報をFHIRサーバーに同期

// POST /api/v1/fhir/sync/users
// ユーザー情報をFHIRサーバーに同期

// GET /api/v1/fhir/status
// 同期状態の確認
```

### FHIRプロキシエンドポイント

```typescript
// GET /api/v1/fhir/Organization
// FHIRサーバーのOrganizationを取得（認証付きプロキシ）

// GET /api/v1/fhir/Organization/:id
// 特定のOrganizationを取得
```

---

## 実装ファイル構成

```
src/lib/server/fhir/
├── client.ts           # HAPI FHIR HTTPクライアント
├── types.ts            # FHIR型定義（fhir/r4）
└── converters/
    ├── organization.ts # Hospital → Organization
    ├── practitioner.ts # User → Practitioner
    └── index.ts        # エクスポート
```

---

## 依存パッケージ

```bash
# FHIR型定義
pnpm add @types/fhir
```

---

## 参考資料

- [HL7 FHIR R4 Organization](https://www.hl7.org/fhir/organization.html)
- [HL7 FHIR R4 Practitioner](https://www.hl7.org/fhir/practitioner.html)
- [JP Core Organization](https://jpfhir.jp/fhir/core/StructureDefinition-jp-organization.html)
- [JP Core Practitioner](https://jpfhir.jp/fhir/core/StructureDefinition-jp-practitioner.html)

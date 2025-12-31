# HAPI FHIR サーバー導入検討

## 概要

本システムで取り扱う医療情報を外部医療情報システムと連携する際、HL7 FHIR標準形式でデータ交換を行うためにHAPI FHIRサーバーを導入する。

## HAPI FHIRとは

[HAPI FHIR](https://github.com/hapifhir/hapi-fhir-jpaserver-starter) は、HL7 FHIR標準に完全準拠したオープンソースのFHIRサーバー実装。

### 主な特徴

- **オープンソース**: Apache License 2.0
- **FHIR準拠**: R4/R5対応
- **JPA Server**: PostgreSQL等のRDBMSをバックエンドに使用可能
- **REST API**: FHIR標準のRESTful API提供
- **検索機能**: FHIRSearchパラメータ対応
- **日本対応**: JP Coreプロファイルとの互換性あり

## アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Document Creation System                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐   │
│  │   SvelteKit     │     │   HAPI FHIR     │     │   PostgreSQL    │   │
│  │   Application   │────▶│   Server        │────▶│   (FHIR DB)     │   │
│  │   (Port 5173)   │     │   (Port 8090)   │     │                 │   │
│  └────────┬────────┘     └────────┬────────┘     └─────────────────┘   │
│           │                       │                                      │
│           │  内部API              │  FHIR REST API                       │
│           │  (/api/v1/*)          │  (/fhir/*)                          │
│           │                       │                                      │
│           ▼                       ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      PostgreSQL (共有)                           │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │   │
│  │  │ document_    │  │   keycloak   │  │    hapi      │          │   │
│  │  │ creation     │  │              │  │   (FHIR)     │          │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        外部医療情報システム                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │ 電子カルテ   │  │ 検査システム │  │ 地域医療連携 │  │ PHRアプリ   │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

## データフロー

### 内部データ → FHIR形式への変換

```
1. SvelteKitアプリ: 内部DBから医療データを取得
2. FHIR Converter: 内部形式 → FHIRリソースに変換
3. HAPI FHIR Server: FHIRリソースを永続化
4. 外部システム: FHIR REST APIでデータ取得
```

### 双方向連携

```
外部システム → FHIR Server → 変換 → 内部DB
内部DB → 変換 → FHIR Server → 外部システム
```

## 使用するFHIRリソース

### 基本リソース（Phase 1）

| FHIRリソース | 内部データ | 用途 |
|-------------|-----------|------|
| Organization | hospitals | 病院情報 |
| Patient | (将来) | 患者情報 |
| Practitioner | users | 医療従事者情報 |
| DocumentReference | (将来) | 文書参照 |

### 拡張リソース（Phase 2）

| FHIRリソース | 用途 |
|-------------|------|
| Observation | バイタルサイン、検査結果 |
| DiagnosticReport | 診断レポート |
| Encounter | 来院・入院情報 |
| Composition | 診療文書 |

## JP Core対応

[JP Core](https://jpfhir.jp/) は日本医療情報学会（JAMI）が策定した日本向けFHIRプロファイル。

### 主なJP Coreプロファイル

- **JP Core Patient**: 日本の患者情報（保険証番号、漢字氏名等）
- **JP Core Organization**: 医療機関情報（医療機関コード）
- **JP Core Practitioner**: 医療従事者（医師、看護師等）
- **JP Core Observation Common**: バイタルサイン共通

### 用語コード

| 区分 | コード体系 |
|------|-----------|
| 医薬品 | HOTコード、YJコード |
| 病名 | ICD-10、標準病名マスター |
| 検査 | JLAC10 |
| 医療機関 | 医療機関コード |

## docker-compose.yml 更新案

```yaml
services:
  # ... 既存サービス ...

  hapi-fhir:
    image: hapiproject/hapi:latest
    container_name: document-creation-fhir
    restart: unless-stopped
    environment:
      SPRING_DATASOURCE_URL: "jdbc:postgresql://postgres:5432/hapi"
      SPRING_DATASOURCE_USERNAME: ${POSTGRES_USER:-postgres}
      SPRING_DATASOURCE_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      SPRING_DATASOURCE_DRIVERCLASSNAME: org.postgresql.Driver
      SPRING_JPA_PROPERTIES_HIBERNATE_DIALECT: ca.uhn.fhir.jpa.model.dialect.HapiFhirPostgresDialect
      HAPI_FHIR_VALIDATION_REQUESTS_ENABLED: "true"
      HAPI_FHIR_FHIR_VERSION: R4
      HAPI_FHIR_CORS_ALLOWED_ORIGIN: "http://localhost:5173"
      HAPI_FHIR_ALLOW_EXTERNAL_REFERENCES: "true"
    ports:
      - "8090:8080"
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/fhir/metadata"]
      interval: 30s
      timeout: 10s
      retries: 5
```

### PostgreSQL初期化スクリプト更新

```sql
-- docker/postgres/init/01-init.sql に追加
CREATE DATABASE hapi;
GRANT ALL PRIVILEGES ON DATABASE hapi TO postgres;
```

## API設計

### 外部向けFHIR API（HAPI FHIR経由）

| エンドポイント | 説明 |
|---------------|------|
| `GET /fhir/metadata` | CapabilityStatement（サーバー機能情報） |
| `GET /fhir/Organization` | 病院一覧 |
| `GET /fhir/Organization/:id` | 病院詳細 |
| `GET /fhir/Patient` | 患者一覧 |
| `GET /fhir/Patient/:id` | 患者詳細 |
| `POST /fhir/Bundle` | バンドル送信（複数リソース一括） |

### 内部同期API（SvelteKit）

| エンドポイント | 説明 |
|---------------|------|
| `POST /api/v1/fhir/sync/hospitals` | 病院情報をFHIRに同期 |
| `GET /api/v1/fhir/status` | FHIR同期状態確認 |

## セキュリティ考慮事項

### 1. アクセス制御

- HAPI FHIR自体にはセキュリティ機能がない
- **選択肢A**: FHIRサーバーを内部ネットワークのみに公開し、SvelteKitがプロキシ
- **選択肢B**: OAuth2/SMART on FHIRでKeycloakと連携
- **推奨**: Phase 1ではAを採用し、Phase 2でBに移行

### 2. データ分離

- 病院ごとのアクセス制御（既存のAPIクライアントスコープと連携）
- FHIRリソースにmeta.tagで病院IDを付与

### 3. 監査ログ

- HAPI FHIRの監査ログ機能を有効化
- AuditEventリソースで操作履歴を記録

## 実装フェーズ

### Phase 1: 基盤構築

1. docker-compose.ymlにHAPI FHIR追加
2. PostgreSQLにhapiデータベース追加
3. 疎通確認（/fhir/metadata）
4. Organizationリソースの同期実装

### Phase 2: データ連携

1. FHIR Converterモジュール実装
2. 病院情報の双方向同期
3. Practitionerリソース対応

### Phase 3: 本格運用

1. SMART on FHIR認証連携
2. JP Coreプロファイル適用
3. 外部システム接続テスト

## リスクと対策

| リスク | 対策 |
|--------|------|
| パフォーマンス低下 | 非同期同期、キャッシュ活用 |
| データ不整合 | トランザクション管理、冪等性確保 |
| 複雑性増加 | 段階的導入、ドキュメント整備 |
| 学習コスト | FHIRトレーニング、サンプル実装 |

## 参考資料

- [HAPI FHIR JPA Server Starter](https://github.com/hapifhir/hapi-fhir-jpaserver-starter)
- [HAPI FHIR Docker Hub](https://hub.docker.com/r/hapiproject/hapi)
- [HL7 FHIR R4](https://www.hl7.org/fhir/)
- [JP Core Implementation Guide](https://jpfhir.jp/fhir/core/)
- [SMART on FHIR](https://docs.smarthealthit.org/)

## 次のアクション

1. [ ] docker-compose.yml更新の実装
2. [ ] HAPI FHIR起動確認
3. [ ] Organization同期のPOC実装
4. [ ] セキュリティ設計の詳細化

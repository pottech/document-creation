# Next.js 移行ガイド

本ドキュメントは、SvelteKit実装からNext.js App Routerへの移行時の対応関係とベストプラクティスを記載する。

---

## 1. プロジェクト初期化

### 1.1 Next.js プロジェクト作成

```bash
npx create-next-app@latest document-creation-nextjs --typescript --tailwind --eslint --app --src-dir
cd document-creation-nextjs
```

### 1.2 必要パッケージ

```bash
# ORM
pnpm add drizzle-orm pg
pnpm add -D drizzle-kit @types/pg

# 認証（Auth.js推奨）
pnpm add next-auth @auth/drizzle-adapter

# フォーム
pnpm add react-hook-form zod @hookform/resolvers

# PDF生成
pnpm add @pdfme/generator @pdfme/common @pdfme/schemas

# ユーティリティ
pnpm add date-fns uuid
pnpm add -D @types/uuid
```

---

## 2. ディレクトリ構成対応

### SvelteKit → Next.js

```
SvelteKit                           Next.js App Router
─────────────────────────────────────────────────────────
src/routes/                         src/app/
├── +page.svelte                    ├── page.tsx
├── +page.server.ts                 ├── page.tsx (Server Component)
├── +layout.svelte                  ├── layout.tsx
├── +layout.server.ts               ├── layout.tsx (async)
├── +error.svelte                   ├── error.tsx
├── +server.ts                      ├── route.ts
│
├── (auth)/                         ├── (auth)/
│   └── login/                      │   └── login/
│       ├── +page.svelte            │       └── page.tsx
│       └── +page.server.ts         │
│
├── api/                            ├── api/
│   └── v1/                         │   └── v1/
│       └── +server.ts              │       └── route.ts
│
src/lib/                            src/lib/
├── server/                         ├── server/  (with 'use server')
│   ├── auth/                       │   ├── auth/
│   ├── db/                         │   ├── db/
│   └── repositories/               │   └── repositories/
│
src/hooks.server.ts                 src/middleware.ts
src/app.d.ts                        (型定義はコンポーネント内)
```

---

## 3. 認証実装

### 3.1 Auth.js (NextAuth) 設定

```typescript
// src/lib/auth.ts
import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // カスタムセッションデータ
      session.user.id = user.id;
      return session;
    },
    async signIn({ user, account }) {
      // ユーザー同期処理
      await syncUser(user, account);
      return true;
    },
  },
});
```

### 3.2 ミドルウェア

```typescript
// src/middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session?.user;

  // 認証が必要なパス
  const protectedPaths = ["/admin", "/[hospitalSlug]"];
  const isProtected = protectedPaths.some(path =>
    nextUrl.pathname.startsWith(path.replace("[hospitalSlug]", ""))
  );

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // API認証（Bearer Token）
  if (nextUrl.pathname.startsWith("/api/v1/")) {
    // Token検証ロジック
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

---

## 4. データベース

### 4.1 Drizzle ORM 設定

```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema/*",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### 4.2 スキーマ定義

SvelteKit版と同一のスキーマを使用可能。

```typescript
// src/lib/db/schema/users.ts
import { pgTable, uuid, varchar, boolean, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  keycloakId: varchar("keycloak_id", { length: 255 }).unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  isServiceAdmin: boolean("is_service_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
```

---

## 5. ページ実装

### 5.1 Server Component（データフェッチ）

```typescript
// SvelteKit: +page.server.ts load関数
export const load: PageServerLoad = async ({ params }) => {
  const patient = await getPatientById(params.patientId);
  return { patient };
};

// Next.js: page.tsx (Server Component)
import { getPatientById } from "@/lib/repositories/patients";

export default async function PatientPage({
  params
}: {
  params: { patientId: string }
}) {
  const patient = await getPatientById(params.patientId);

  return (
    <div>
      <h1>{patient.name}</h1>
      {/* ... */}
    </div>
  );
}
```

### 5.2 Server Actions（フォーム処理）

```typescript
// SvelteKit: +page.server.ts actions
export const actions: Actions = {
  create: async ({ request }) => {
    const formData = await request.formData();
    // 処理
  }
};

// Next.js: actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createPatient(formData: FormData) {
  const name = formData.get("name") as string;

  // バリデーション
  if (!name) {
    return { error: "名前は必須です" };
  }

  // 作成処理
  await db.insert(patients).values({ name });

  revalidatePath("/patients");
  redirect("/patients");
}
```

### 5.3 Client Component（インタラクティブUI）

```typescript
// SvelteKit: $state()
let count = $state(0);

// Next.js: useState
"use client";

import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count: {count}
    </button>
  );
}
```

---

## 6. フォーム実装

### 6.1 React Hook Form + Zod

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createPatient } from "./actions";

const schema = z.object({
  patientNumber: z.string().min(1, "患者番号は必須です"),
  name: z.string().min(1, "氏名は必須です"),
  birthDate: z.string().min(1, "生年月日は必須です"),
  gender: z.enum(["male", "female"]),
});

type FormData = z.infer<typeof schema>;

export function PatientForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    await createPatient(formData);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("patientNumber")} />
      {errors.patientNumber && <span>{errors.patientNumber.message}</span>}
      {/* ... */}
    </form>
  );
}
```

---

## 7. レイアウト

### 7.1 ルートレイアウト

```typescript
// src/app/layout.tsx
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

### 7.2 認証付きレイアウト

```typescript
// src/app/(admin)/layout.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/admin/Sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.isServiceAdmin) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={session.user} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
```

---

## 8. API Routes

### 8.1 Route Handlers

```typescript
// SvelteKit: +server.ts
export const GET: RequestHandler = async ({ params }) => {
  const data = await getData(params.id);
  return json(data);
};

// Next.js: route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const data = await getData(params.id);
  return NextResponse.json(data);
}
```

---

## 9. PDF生成

```typescript
// src/lib/services/pdf-generator.ts
import { generate } from "@pdfme/generator";
import { readFileSync } from "fs";
import { join } from "path";

// フォント読み込み
const fontPath = join(process.cwd(), "public", "fonts", "NotoSansJP-Regular.ttf");
const fontBuffer = readFileSync(fontPath);

export async function generateCarePlanPdf(data: CarePlanPdfData): Promise<Uint8Array> {
  const template = createTemplate(data);
  const inputs = createInputs(data);

  const pdf = await generate({
    template,
    inputs: [inputs],
    options: {
      font: {
        NotoSansJP: {
          data: fontBuffer,
          fallback: true,
        },
      },
    },
  });

  return pdf;
}
```

---

## 10. 環境変数

```env
# .env.local
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/document_creation

# Keycloak
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=document-creation
KEYCLOAK_CLIENT_ID=nextjs-app
KEYCLOAK_CLIENT_SECRET=your-client-secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

---

## 11. Docker Compose

```yaml
# docker-compose.yml は同一のものを使用可能
# SvelteKitアプリのサービスをNext.jsに置き換えるだけ
```

---

## 12. 移行チェックリスト

### Phase 1: 基盤
- [ ] Next.jsプロジェクト作成
- [ ] Drizzle ORM設定
- [ ] スキーマ移行
- [ ] Auth.js設定
- [ ] ミドルウェア実装

### Phase 2: 認証
- [ ] Keycloak連携
- [ ] セッション管理
- [ ] 招待フロー
- [ ] 権限チェック

### Phase 3: 管理者機能
- [ ] ダッシュボード
- [ ] 病院管理
- [ ] APIクライアント管理
- [ ] 監査ログ

### Phase 4: 病院機能
- [ ] 病院ダッシュボード
- [ ] 患者管理
- [ ] 療養計画書作成
- [ ] PDF出力

### Phase 5: 外部API
- [ ] Bearer Token認証
- [ ] エンドポイント実装
- [ ] スコープ制御

---

## 13. 参考リンク

- [Next.js App Router ドキュメント](https://nextjs.org/docs/app)
- [Auth.js ドキュメント](https://authjs.dev/)
- [Drizzle ORM ドキュメント](https://orm.drizzle.team/)
- [React Hook Form](https://react-hook-form.com/)
- [pdfme](https://pdfme.com/)

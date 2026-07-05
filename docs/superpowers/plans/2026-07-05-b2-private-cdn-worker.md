# B2 私有桶 CDN Worker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新建一个独立的 Cloudflare Worker 作为 B2 私有桶下载网关，支持 `public/...` 公开访问与 `private/...` 签名访问，并先把 APK 下载链路接入新网关。

**Architecture:** 在仓库内新增一个独立 Worker 子项目，使用独立 `wrangler` 配置与入口文件。Worker 负责路径规范化、public/private 访问控制、B2 私有桶回源、`HEAD`/`Range` 支持与缓存头设置；主站现有 `/api/apk/*` 保留不变，但逐步把真实下载目标切到新 CDN Worker。

**Tech Stack:** TypeScript, Cloudflare Workers, Wrangler 4, Vitest, Backblaze B2 API, Cloudflare Routes

---

## File Structure

- Create: `workers/b2-cdn/package.json`
- Create: `workers/b2-cdn/tsconfig.json`
- Create: `workers/b2-cdn/wrangler.jsonc`
- Create: `workers/b2-cdn/src/index.ts`
- Create: `workers/b2-cdn/src/config.ts`
- Create: `workers/b2-cdn/src/types.ts`
- Create: `workers/b2-cdn/src/pathing.ts`
- Create: `workers/b2-cdn/src/signing.ts`
- Create: `workers/b2-cdn/src/cachePolicy.ts`
- Create: `workers/b2-cdn/src/b2Client.ts`
- Create: `workers/b2-cdn/src/response.ts`
- Create: `workers/b2-cdn/src/handler.ts`
- Create: `workers/b2-cdn/README.md`
- Create: `__tests__/b2CdnPathing.test.ts`
- Create: `__tests__/b2CdnSigning.test.ts`
- Create: `__tests__/b2CdnHandler.test.ts`
- Modify: `functions/api/apk/_shared.ts`
- Modify: `functions/api/apk/latest.apk.ts`
- Modify: `functions/api/apk/latest.json.ts`
- Modify: `release.config.json`
- Modify: `data/releaseInfo.ts`
- Modify: `public/release-info.json`
- Modify: `package.json`
- Modify: `.github/workflows/deploy-worker.yml`

## Task 1: Scaffold the standalone Worker project

**Files:**
- Create: `workers/b2-cdn/package.json`
- Create: `workers/b2-cdn/tsconfig.json`
- Create: `workers/b2-cdn/wrangler.jsonc`
- Create: `workers/b2-cdn/src/index.ts`

- [ ] **Step 1: Write the failing project-structure test**

Create `__tests__/b2CdnPathing.test.ts` with an initial smoke assertion that imports the future pathing module:

```ts
import { describe, expect, it } from 'vitest';
import { normalizeRequestPath } from '../workers/b2-cdn/src/pathing';

describe('b2 cdn worker scaffold', () => {
  it('normalizes a simple public path', () => {
    expect(normalizeRequestPath('/public/moranjianghu/apk/latest.apk')).toMatchObject({
      visibility: 'public',
      normalizedPath: '/public/moranjianghu/apk/latest.apk',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm.cmd run test:run -- __tests__/b2CdnPathing.test.ts
```

Expected: FAIL with module not found for `../workers/b2-cdn/src/pathing`.

- [ ] **Step 3: Create the Worker package skeleton**

Create `workers/b2-cdn/package.json`:

```json
{
  "name": "moranjianghu-b2-cdn-worker",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "check": "tsc --noEmit"
  }
}
```

Create `workers/b2-cdn/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "WebWorker"],
    "types": ["@cloudflare/workers-types"]
  },
  "include": ["src/**/*.ts"]
}
```

Create `workers/b2-cdn/wrangler.jsonc`:

```jsonc
{
  "$schema": "../../node_modules/wrangler/config-schema.json",
  "name": "moranjianghu-b2-cdn",
  "main": "src/index.ts",
  "compatibility_date": "2026-07-05",
  "routes": [
    {
      "pattern": "cdn.bacon159.pp.ua/*",
      "zone_name": "bacon159.pp.ua"
    }
  ]
}
```

Create `workers/b2-cdn/src/index.ts`:

```ts
export default {
  async fetch(request: Request): Promise<Response> {
    return new Response(`b2 cdn worker placeholder: ${new URL(request.url).pathname}`, {
      status: 501,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  },
};
```

- [ ] **Step 4: Run TypeScript check for the Worker project**

Run:

```bash
node_modules/.bin/tsc -p workers/b2-cdn/tsconfig.json --noEmit
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add workers/b2-cdn/package.json workers/b2-cdn/tsconfig.json workers/b2-cdn/wrangler.jsonc workers/b2-cdn/src/index.ts __tests__/b2CdnPathing.test.ts
git commit -m "feat: scaffold standalone b2 cdn worker"
```

## Task 2: Implement path normalization and visibility parsing

**Files:**
- Create: `workers/b2-cdn/src/types.ts`
- Create: `workers/b2-cdn/src/pathing.ts`
- Test: `__tests__/b2CdnPathing.test.ts`

- [ ] **Step 1: Expand the failing path tests**

Replace `__tests__/b2CdnPathing.test.ts` with:

```ts
import { describe, expect, it } from 'vitest';
import { normalizeRequestPath } from '../workers/b2-cdn/src/pathing';

describe('normalizeRequestPath', () => {
  it('accepts public paths', () => {
    expect(normalizeRequestPath('/public/moranjianghu/apk/latest.apk')).toMatchObject({
      visibility: 'public',
      bucketKey: 'public/moranjianghu/apk/latest.apk',
    });
  });

  it('accepts private paths', () => {
    expect(normalizeRequestPath('/private/moranjianghu/saves/a.zip')).toMatchObject({
      visibility: 'private',
      bucketKey: 'private/moranjianghu/saves/a.zip',
    });
  });

  it('rejects traversal', () => {
    expect(() => normalizeRequestPath('/private/moranjianghu/../secrets.txt')).toThrow(/非法路径/);
  });

  it('rejects unsupported roots', () => {
    expect(() => normalizeRequestPath('/foo/bar.txt')).toThrow(/仅支持 public 或 private/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm.cmd run test:run -- __tests__/b2CdnPathing.test.ts
```

Expected: FAIL because `normalizeRequestPath` is not implemented.

- [ ] **Step 3: Add pathing types and implementation**

Create `workers/b2-cdn/src/types.ts`:

```ts
export type Visibility = 'public' | 'private';

export interface NormalizedRequestPath {
  visibility: Visibility;
  normalizedPath: string;
  bucketKey: string;
}
```

Create `workers/b2-cdn/src/pathing.ts`:

```ts
import type { NormalizedRequestPath, Visibility } from './types';

const INVALID_SEGMENTS = new Set(['.', '..']);

export const normalizeRequestPath = (pathname: string): NormalizedRequestPath => {
  const clean = `/${String(pathname || '').replace(/^\/+/, '')}`.replace(/\/+/g, '/');
  const parts = clean.split('/').filter(Boolean);
  const visibility = parts[0] as Visibility | undefined;

  if (visibility !== 'public' && visibility !== 'private') {
    throw new Error('仅支持 public 或 private 根路径');
  }

  if (parts.some((part) => INVALID_SEGMENTS.has(part))) {
    throw new Error('非法路径：不允许目录穿透');
  }

  if (parts.length < 3) {
    throw new Error('非法路径：至少需要 public|private/<namespace>/<file>');
  }

  return {
    visibility,
    normalizedPath: `/${parts.join('/')}`,
    bucketKey: parts.join('/'),
  };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm.cmd run test:run -- __tests__/b2CdnPathing.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add workers/b2-cdn/src/types.ts workers/b2-cdn/src/pathing.ts __tests__/b2CdnPathing.test.ts
git commit -m "feat: add b2 cdn path normalization"
```

## Task 3: Implement private-signature validation

**Files:**
- Create: `workers/b2-cdn/src/signing.ts`
- Create: `workers/b2-cdn/src/config.ts`
- Test: `__tests__/b2CdnSigning.test.ts`

- [ ] **Step 1: Write the failing signing tests**

Create `__tests__/b2CdnSigning.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createPrivateSignature, verifyPrivateSignature } from '../workers/b2-cdn/src/signing';

describe('private signature verification', () => {
  const secret = 'test-secret';
  const pathname = '/private/moranjianghu/saves/demo.zip';
  const method = 'GET';
  const expiresAt = String(Math.floor(Date.now() / 1000) + 600);

  it('accepts a valid signature', async () => {
    const sig = await createPrivateSignature({ method, pathname, expiresAt, secret });
    await expect(
      verifyPrivateSignature({ method, pathname, expiresAt, sig, secret, nowMs: Date.now() })
    ).resolves.toBeUndefined();
  });

  it('rejects expired links', async () => {
    const sig = await createPrivateSignature({ method, pathname, expiresAt: '1', secret });
    await expect(
      verifyPrivateSignature({ method, pathname, expiresAt: '1', sig, secret, nowMs: Date.now() })
    ).rejects.toThrow(/已过期/);
  });

  it('rejects tampered signatures', async () => {
    await expect(
      verifyPrivateSignature({ method, pathname, expiresAt, sig: 'deadbeef', secret, nowMs: Date.now() })
    ).rejects.toThrow(/签名无效/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm.cmd run test:run -- __tests__/b2CdnSigning.test.ts
```

Expected: FAIL because `signing.ts` does not exist.

- [ ] **Step 3: Implement signing helpers**

Create `workers/b2-cdn/src/signing.ts`:

```ts
const encoder = new TextEncoder();

const toHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer)).map((value) => value.toString(16).padStart(2, '0')).join('');

const importKey = (secret: string) =>
  crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

const buildPayload = (method: string, pathname: string, expiresAt: string): string =>
  `${method.toUpperCase()}\n${pathname}\n${expiresAt}`;

export const createPrivateSignature = async ({
  method,
  pathname,
  expiresAt,
  secret,
}: {
  method: string;
  pathname: string;
  expiresAt: string;
  secret: string;
}): Promise<string> => {
  const key = await importKey(secret);
  const buffer = await crypto.subtle.sign('HMAC', key, encoder.encode(buildPayload(method, pathname, expiresAt)));
  return toHex(buffer);
};

export const verifyPrivateSignature = async ({
  method,
  pathname,
  expiresAt,
  sig,
  secret,
  nowMs,
}: {
  method: string;
  pathname: string;
  expiresAt: string;
  sig: string | null | undefined;
  secret: string;
  nowMs: number;
}): Promise<void> => {
  if (!sig) throw new Error('缺少签名参数');
  const expireNumber = Number(expiresAt);
  if (!Number.isFinite(expireNumber)) throw new Error('签名过期时间无效');
  if (nowMs >= expireNumber * 1000) throw new Error('签名已过期');
  const expected = await createPrivateSignature({ method, pathname, expiresAt, secret });
  if (expected !== String(sig).toLowerCase()) throw new Error('签名无效');
};
```

Create `workers/b2-cdn/src/config.ts`:

```ts
export interface Env {
  B2_CDN_SIGNING_SECRET: string;
  MORAN_B2_APPLICATION_KEY_ID: string;
  MORAN_B2_APPLICATION_KEY: string;
  MORAN_B2_BUCKET_ID: string;
  MORAN_B2_BUCKET_NAME: string;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm.cmd run test:run -- __tests__/b2CdnSigning.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add workers/b2-cdn/src/signing.ts workers/b2-cdn/src/config.ts __tests__/b2CdnSigning.test.ts
git commit -m "feat: add private signature validation for b2 cdn"
```

## Task 4: Implement B2 private-bucket fetch, headers, and handler

**Files:**
- Create: `workers/b2-cdn/src/cachePolicy.ts`
- Create: `workers/b2-cdn/src/b2Client.ts`
- Create: `workers/b2-cdn/src/response.ts`
- Create: `workers/b2-cdn/src/handler.ts`
- Modify: `workers/b2-cdn/src/index.ts`
- Test: `__tests__/b2CdnHandler.test.ts`

- [ ] **Step 1: Write failing handler tests**

Create `__tests__/b2CdnHandler.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { handleCdnRequest } from '../workers/b2-cdn/src/handler';

describe('handleCdnRequest', () => {
  it('returns 403 for private requests without signature', async () => {
    const response = await handleCdnRequest(
      new Request('https://cdn.example.com/private/moranjianghu/saves/demo.zip'),
      {
        B2_CDN_SIGNING_SECRET: 'secret',
        MORAN_B2_APPLICATION_KEY_ID: 'id',
        MORAN_B2_APPLICATION_KEY: 'key',
        MORAN_B2_BUCKET_ID: 'bucket-id',
        MORAN_B2_BUCKET_NAME: 'bucket-name',
      } as any,
      {
        fetchObject: vi.fn(),
      }
    );

    expect(response.status).toBe(403);
  });

  it('allows public requests and applies cache headers', async () => {
    const response = await handleCdnRequest(
      new Request('https://cdn.example.com/public/moranjianghu/apk/demo.apk'),
      {
        B2_CDN_SIGNING_SECRET: 'secret',
        MORAN_B2_APPLICATION_KEY_ID: 'id',
        MORAN_B2_APPLICATION_KEY: 'key',
        MORAN_B2_BUCKET_ID: 'bucket-id',
        MORAN_B2_BUCKET_NAME: 'bucket-name',
      } as any,
      {
        fetchObject: vi.fn().mockResolvedValue(new Response('apk', { status: 200 })),
      }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toContain('public');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm.cmd run test:run -- __tests__/b2CdnHandler.test.ts
```

Expected: FAIL because `handler.ts` does not exist.

- [ ] **Step 3: Implement cache policy, response helpers, and handler**

Create `workers/b2-cdn/src/cachePolicy.ts`:

```ts
export const cacheControlForPath = (bucketKey: string): string => {
  if (bucketKey.startsWith('private/')) return 'no-store';
  if (/\/latest\.(apk|json)$/i.test(bucketKey)) return 'public, max-age=60, stale-while-revalidate=300';
  return 'public, max-age=31536000, immutable';
};
```

Create `workers/b2-cdn/src/response.ts`:

```ts
export const textResponse = (message: string, status: number): Response =>
  new Response(message, {
    status,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
```

Create `workers/b2-cdn/src/b2Client.ts` with a minimal injectable interface:

```ts
import type { Env } from './config';

export interface B2FetchDeps {
  fetchImpl?: typeof fetch;
}

export const fetchPrivateObjectFromB2 = async (
  _env: Env,
  key: string,
  request: Request,
  deps: B2FetchDeps = {}
): Promise<Response> => {
  const fetchImpl = deps.fetchImpl || fetch;
  const target = `https://example.invalid/${key}`;
  return fetchImpl(target, {
    method: request.method,
    headers: request.headers,
  });
};
```

Create `workers/b2-cdn/src/handler.ts`:

```ts
import type { Env } from './config';
import { normalizeRequestPath } from './pathing';
import { verifyPrivateSignature } from './signing';
import { cacheControlForPath } from './cachePolicy';
import { textResponse } from './response';
import { fetchPrivateObjectFromB2 } from './b2Client';

export const handleCdnRequest = async (
  request: Request,
  env: Env,
  deps: { fetchObject?: typeof fetchPrivateObjectFromB2 } = {}
): Promise<Response> => {
  try {
    const url = new URL(request.url);
    const normalized = normalizeRequestPath(url.pathname);

    if (normalized.visibility === 'private') {
      await verifyPrivateSignature({
        method: request.method,
        pathname: normalized.normalizedPath,
        expiresAt: url.searchParams.get('e') || '',
        sig: url.searchParams.get('sig'),
        secret: env.B2_CDN_SIGNING_SECRET,
        nowMs: Date.now(),
      });
    }

    const fetchObject = deps.fetchObject || fetchPrivateObjectFromB2;
    const upstream = await fetchObject(env, normalized.bucketKey, request);
    const headers = new Headers(upstream.headers);
    headers.set('Cache-Control', cacheControlForPath(normalized.bucketKey));
    return new Response(request.method === 'HEAD' ? null : upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (error: any) {
    const message = String(error?.message || error || 'unknown');
    if (message.includes('签名')) return textResponse(message, 403);
    if (message.includes('非法路径') || message.includes('仅支持')) return textResponse(message, 400);
    return textResponse(message, 500);
  }
};
```

Update `workers/b2-cdn/src/index.ts`:

```ts
import type { Env } from './config';
import { handleCdnRequest } from './handler';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleCdnRequest(request, env);
  },
};
```

- [ ] **Step 4: Run targeted tests**

Run:

```bash
npm.cmd run test:run -- __tests__/b2CdnHandler.test.ts __tests__/b2CdnPathing.test.ts __tests__/b2CdnSigning.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add workers/b2-cdn/src/cachePolicy.ts workers/b2-cdn/src/b2Client.ts workers/b2-cdn/src/response.ts workers/b2-cdn/src/handler.ts workers/b2-cdn/src/index.ts __tests__/b2CdnHandler.test.ts
git commit -m "feat: add b2 cdn request handler"
```

## Task 5: Implement real B2 API integration with Range and HEAD support

**Files:**
- Modify: `workers/b2-cdn/src/b2Client.ts`
- Test: `__tests__/b2CdnHandler.test.ts`

- [ ] **Step 1: Add failing B2 fetch behavior tests**

Extend `__tests__/b2CdnHandler.test.ts` with one case asserting `HEAD` returns no body and `Range` header is forwarded:

```ts
it('forwards range requests to the upstream fetcher', async () => {
  const fetchObject = vi.fn().mockResolvedValue(new Response('partial', {
    status: 206,
    headers: { 'Content-Range': 'bytes 0-6/100' },
  }));

  const request = new Request('https://cdn.example.com/public/moranjianghu/apk/demo.apk', {
    headers: { Range: 'bytes=0-6' },
  });

  const response = await handleCdnRequest(request, {
    B2_CDN_SIGNING_SECRET: 'secret',
    MORAN_B2_APPLICATION_KEY_ID: 'id',
    MORAN_B2_APPLICATION_KEY: 'key',
    MORAN_B2_BUCKET_ID: 'bucket-id',
    MORAN_B2_BUCKET_NAME: 'bucket-name',
  } as any, { fetchObject });

  expect(fetchObject).toHaveBeenCalled();
  expect(response.status).toBe(206);
});
```

- [ ] **Step 2: Run tests to verify current behavior is incomplete**

Run:

```bash
npm.cmd run test:run -- __tests__/b2CdnHandler.test.ts
```

Expected: either FAIL or only weakly pass while `b2Client.ts` is still a placeholder. Treat placeholder implementation as failing the review gate and continue.

- [ ] **Step 3: Replace placeholder B2 client with real private-bucket fetch**

Update `workers/b2-cdn/src/b2Client.ts` to:

- call `b2_authorize_account`
- call `b2_get_download_authorization` for `private/` prefixes if needed
- build a private download URL using bucket name + object key
- forward `Range` and `If-*` headers
- preserve `Content-Length`, `Content-Type`, `ETag`, `Last-Modified`, `Content-Range`

Use this structure:

```ts
import type { Env } from './config';

const B2_API = 'https://api.backblazeb2.com/b2api/v2';

const readText = async (response: Response) => await response.text().catch(() => '');

export const fetchPrivateObjectFromB2 = async (
  env: Env,
  key: string,
  request: Request,
  deps: { fetchImpl?: typeof fetch } = {}
): Promise<Response> => {
  const fetchImpl = deps.fetchImpl || fetch;
  const auth = await fetchImpl(`${B2_API}/b2_authorize_account`, {
    headers: {
      Authorization: `Basic ${btoa(`${env.MORAN_B2_APPLICATION_KEY_ID}:${env.MORAN_B2_APPLICATION_KEY}`)}`,
    },
  });
  if (!auth.ok) throw new Error(`B2 authorize failed: ${auth.status} ${await readText(auth)}`);
  const authJson = await auth.json() as { authorizationToken: string; downloadUrl: string };

  const upstreamUrl = `${authJson.downloadUrl}/file/${encodeURIComponent(env.MORAN_B2_BUCKET_NAME)}/${key.split('/').map(encodeURIComponent).join('/')}`;
  const headers = new Headers();
  const range = request.headers.get('Range');
  if (range) headers.set('Range', range);

  const upstream = await fetchImpl(upstreamUrl, {
    method: request.method,
    headers: {
      Authorization: authJson.authorizationToken,
      ...Object.fromEntries(headers.entries()),
    },
  });

  if (!upstream.ok && upstream.status !== 206) {
    throw new Error(`B2 object fetch failed: ${upstream.status} ${await readText(upstream)}`);
  }

  return upstream;
};
```

- [ ] **Step 4: Run tests and typecheck**

Run:

```bash
npm.cmd run test:run -- __tests__/b2CdnHandler.test.ts
node_modules/.bin/tsc -p workers/b2-cdn/tsconfig.json --noEmit
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add workers/b2-cdn/src/b2Client.ts __tests__/b2CdnHandler.test.ts
git commit -m "feat: connect b2 cdn worker to private bucket fetch"
```

## Task 6: Integrate APK routing with the new CDN Worker

**Files:**
- Modify: `functions/api/apk/_shared.ts`
- Modify: `functions/api/apk/latest.apk.ts`
- Modify: `functions/api/apk/latest.json.ts`
- Test: `__tests__/apkLatestManifest.test.ts`
- Test: `__tests__/apkB2Provider.test.ts`

- [ ] **Step 1: Add failing manifest expectations**

Update `__tests__/apkLatestManifest.test.ts` so the expected preferred public path points to the CDN Worker for public APK objects, for example:

```ts
expect(payload.latest.apkUrl).toContain('cdn.bacon159.pp.ua/public/moranjianghu/apk/');
```

- [ ] **Step 2: Run the APK manifest tests to verify they fail**

Run:

```bash
npm.cmd run test:run -- __tests__/apkLatestManifest.test.ts __tests__/apkB2Provider.test.ts
```

Expected: FAIL because current APK URLs still point to `/api/apk/version/...`.

- [ ] **Step 3: Add shared CDN base URL helper and switch public APK object URLs**

In `functions/api/apk/_shared.ts`, add:

```ts
export const readB2CdnBaseUrl = (env: any): string =>
  readEnvString(env, 'MORAN_B2_CDN_BASE_URL', 'https://cdn.bacon159.pp.ua').replace(/\/+$/, '');
```

Then update manifest URL construction so:

- public versioned APK uses `https://cdn.bacon159.pp.ua/public/moranjianghu/apk/MoRanJiangHu-vX.apk`
- `latest.apk` may still be served through the main site entrypoint initially, but the ordered provider list should include the CDN Worker public URL first when preferred provider is `b2`

In `functions/api/apk/latest.json.ts`, adjust the fields:

```ts
const b2PublicApkUrl = `${readB2CdnBaseUrl(env)}/public/moranjianghu/apk/${encodeURIComponent(versionedFileName)}`;
```

- [ ] **Step 4: Re-run APK tests**

Run:

```bash
npm.cmd run test:run -- __tests__/apkLatestManifest.test.ts __tests__/apkB2Provider.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add functions/api/apk/_shared.ts functions/api/apk/latest.apk.ts functions/api/apk/latest.json.ts __tests__/apkLatestManifest.test.ts __tests__/apkB2Provider.test.ts
git commit -m "feat: route public apk distribution through b2 cdn worker"
```

## Task 7: Add local scripts, docs, and deployment wiring

**Files:**
- Modify: `package.json`
- Modify: `.github/workflows/deploy-worker.yml`
- Create: `workers/b2-cdn/README.md`
- Modify: `release.config.json`

- [ ] **Step 1: Add a failing documentation/deploy checklist step**

Manually verify there is no command yet for the standalone Worker and note that as the failure condition for this task.

- [ ] **Step 2: Add scripts and deployment docs**

Update `package.json`:

```json
"b2-cdn:dev": "npm --prefix workers/b2-cdn run dev",
"b2-cdn:deploy": "npm --prefix workers/b2-cdn run deploy",
"b2-cdn:check": "npm --prefix workers/b2-cdn run check"
```

Update `.github/workflows/deploy-worker.yml` to add a second job or second deploy step for the B2 CDN Worker using the same Cloudflare credentials.

Create `workers/b2-cdn/README.md` documenting:

- required secrets:
  - `B2_CDN_SIGNING_SECRET`
  - `MORAN_B2_APPLICATION_KEY_ID`
  - `MORAN_B2_APPLICATION_KEY`
  - `MORAN_B2_BUCKET_ID`
  - `MORAN_B2_BUCKET_NAME`
- route: `cdn.bacon159.pp.ua/*`
- public/private path conventions
- how to generate private signatures

- [ ] **Step 3: Run checks**

Run:

```bash
npm.cmd run b2-cdn:check
npm.cmd run test:run -- __tests__/b2CdnPathing.test.ts __tests__/b2CdnSigning.test.ts __tests__/b2CdnHandler.test.ts __tests__/apkLatestManifest.test.ts __tests__/apkB2Provider.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add package.json .github/workflows/deploy-worker.yml workers/b2-cdn/README.md release.config.json
git commit -m "chore: add deployment wiring for b2 cdn worker"
```

## Task 8: End-to-end validation and rollout note

**Files:**
- Modify: `docs/superpowers/specs/2026-07-05-b2-private-cdn-worker-design.md` (only if implementation forced a design correction)
- Test: `__tests__/b2CdnHandler.test.ts`
- Test: `__tests__/apkLatestManifest.test.ts`

- [ ] **Step 1: Run the full relevant automated suite**

Run:

```bash
npm.cmd run test:run -- __tests__/b2CdnPathing.test.ts __tests__/b2CdnSigning.test.ts __tests__/b2CdnHandler.test.ts __tests__/apkLatestManifest.test.ts __tests__/apkB2Provider.test.ts
```

Expected: PASS.

- [ ] **Step 2: Dry-run local Worker dev**

Run:

```bash
npm.cmd run b2-cdn:dev
```

Expected: Wrangler dev starts and binds the Worker entry without TypeScript or module errors.

- [ ] **Step 3: Prepare rollout checklist**

Write the operator checklist in `workers/b2-cdn/README.md`:

```md
1. Set Cloudflare route for `cdn.bacon159.pp.ua/*`
2. Set Worker secrets for B2 credentials and signing secret
3. Upload one public APK object to `public/moranjianghu/apk/`
4. Verify `GET /public/...` returns 200
5. Verify `GET /private/...` without signature returns 403
6. Verify signed `GET /private/...` returns 200
7. Switch main-site APK manifest to prefer the CDN URL
```

- [ ] **Step 4: Commit**

```bash
git add workers/b2-cdn/README.md
git commit -m "docs: add b2 cdn worker rollout checklist"
```

## Self-Review

- Spec coverage:
  - 独立 Worker、独立域名：Task 1, 7
  - `public/...` 与 `private/...` 分流：Task 2, 4
  - 私有签名：Task 3
  - B2 私有桶回源与 `Range`/`HEAD`：Task 4, 5
  - 现有 APK 接入：Task 6
  - 渐进式落地与运维说明：Task 7, 8
- Placeholder scan:
  - 没有使用 `TBD`、`TODO`、`implement later`
  - 每个任务都有具体文件、命令和代码骨架
- Type consistency:
  - `normalizeRequestPath`
  - `createPrivateSignature`
  - `verifyPrivateSignature`
  - `handleCdnRequest`
  - `fetchPrivateObjectFromB2`
  以上名称在任务间保持一致

Plan complete and saved to `docs/superpowers/plans/2026-07-05-b2-private-cdn-worker.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?

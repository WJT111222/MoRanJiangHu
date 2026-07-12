# Workers Cache 评估与试点方案

> 来源：Cloudflare 博客《Your Worker can now have its own cache in front of it》(2026-07-06)
> https://blog.cloudflare.com/workers-cache/
>
> 本文档只做评估与试点规划，不改动任何运行代码。是否落地由后续决定。

## 1. Workers Cache 是什么

Cloudflare 新推出的 **Workers Cache**：在 Worker **前面**加一层托管的分层缓存（tiered cache）。

关键特性：

- 开启方式极简：`wrangler.jsonc` 里加一行 `"cache": { "enabled": true }`。
- 配置面就是代码：靠响应上的 `Cache-Control` 头控制缓存行为，不需要 zone 层的 Cache Rules / Page Rules。
- **命中时 Worker 完全不执行**，不计 CPU 费用（仍按标准 request 费率计一次请求）。未命中时 Worker 跑一次、填充缓存，之后全球任意节点都能直接命中。
- 支持 `stale-while-revalidate`：过期后先返回旧内容（`Cf-Cache-Status: UPDATING`），后台刷新，用户不等待。
- 支持 `Cache-Tag` + `ctx.cache.purge({ tags: [...] })` 按标签精确清除。
- 支持标准 `Vary` 头做多版本（内容协商）缓存。
- 缓存属于 **Worker 而非 zone**：purge 只影响本 Worker 入口，不会误伤 zone 其它内容；在 workers.dev、preview、Workers for Platforms 上都可用。
- 分层缓存：下层（离用户最近的数据中心）+ 上层（全网聚合）。首个请求填充上层后，全球后续请求都可能不触发 Worker。

## 2. 本项目现状（重要前提）

项目**已经在手动做边缘缓存**，所以「缓存」不是空白，评估的是**增量收益**。

### 2.1 preset-image 接口（`functions/api/preset-image/[[path]].ts`）

已用 `caches.default`（Cache API）做完整边缘缓存：

- 缓存头常量：
  - 图片：`public, max-age=31536000, immutable`（1 年）
  - 错误：`public, max-age=60`
  - 目录列表 sign-map：`public, max-age=3600`（1 小时）
- 同时设置 `Cache-Control` / `CDN-Cache-Control` / `Cloudflare-CDN-Cache-Control` 三个头。
- 请求流程：`GET` 时先 `cache.match(cacheKey)`，命中就直接返回（带 `X-Moran-Preset-Image-Cache: hit`）；未命中走 OneDrive/OpenList 代理，再 `context.waitUntil(cache.put(...))` 回填。

**注意**：现在的模式是「**Worker 先执行**，再在代码里查 `caches.default`」。也就是说，即使边缘命中，**Worker 本身仍然被调用、仍然计 CPU 费用**。这正是 Workers Cache 能改善的点——它把缓存挡在 Worker **前面**，命中时 Worker 根本不跑。

### 2.2 apk/latest.json 接口

`functions/api/apk/latest.json.ts` 设了 `APK_LATEST_CACHE_CONTROL`（走 KV manifest 通道）。

### 2.3 其它接口

大量接口是动态 / 鉴权 / 代理类，本来就**不应缓存**：`auth/*`、`admin/*`、`image-host/*`、`object-storage-proxy.ts`、`webdav-proxy.ts`、`novelai/*`、`image-backend/*-proxy` 等。

## 3. 增量收益 vs 顾虑

### 3.1 收益

- **省 CPU 计费**：preset-image 目前边缘命中时 Worker 仍执行。改用 Workers Cache 后命中时 Worker 不跑，省 CPU time 计费和一点延迟。这是最对口的高频稳定接口场景。
- **stale-while-revalidate**：manifest / 图片过期时先返回旧内容、后台刷新，用户不等待，体验更平滑。
- **Cache-Tag 精确清除**：比现在按 URL 逐个 purge 更灵活（例如按题材批量清除预设图片）。

### 3.2 顾虑（真实风险，需要评估）

1. **compatibility_date**：当前 `2026-04-21`，博客示例用 `2026-05-01`。启用可能需要升 compat date，需全站兼容性回归。
2. **计费副作用（最需要注意）**：开启缓存后，原本**免费**的 static assets 请求和 service-binding / `ctx.exports` 调用，会因为「每个请求先查缓存」而按标准 request 费率计费。本项目 static assets 很多（一堆 hashed JS chunk + 预设图），这块账单**可能不降反升**，必须实测评估。
3. **动态接口误缓存风险**：全局开关开启后，需要给所有动态/鉴权接口逐个补 `Cache-Control: private` 排除，否则可能缓存到不该缓存的响应（含鉴权数据），有安全与回归风险。
4. **迁移是主动改动**：现有 `caches.default` 方案已稳定运行，迁移属于主动重构而非修 bug，需谨慎权衡收益。

## 4. 建议：小范围试点，不全局开启

**不建议**直接在 `wrangler.jsonc` 全局 `"cache": { "enabled": true }`。

推荐路径：只在 **preset-image 这一个高收益、低风险接口**做受控试点。

### 4.1 试点目标

验证两件事：

1. **命中率**：Workers Cache 的命中率是否 ≥ 现有 `caches.default` 方案。
2. **计费变化**：CPU time 是否真的下降，且 request 费率上升（static assets 计费副作用）不会抵消收益。

### 4.2 试点步骤（后续执行，非本次）

1. **准备**：确认是否需要升 compatibility_date；若需要，先在 preview 环境验证全站无回归。
2. **开启**：按 Cloudflare 文档给 Worker 开启 Workers Cache（注意其作用范围是整个 Worker，需确认能否只对特定入口生效——博客提到可用「多入口 + 每入口缓存开关」组合，需查文档确认 Pages Functions 场景下的可行性）。
3. **排除动态接口**：给所有不该缓存的接口显式返回 `Cache-Control: private`，逐一核对 `auth/*`、`admin/*`、代理类接口。
4. **保留现有头**：preset-image 的 `Cache-Control: public, max-age=31536000, immutable` 可直接被 Workers Cache 复用；可考虑给图片响应加 `Cache-Tag`（如按题材/物品名）以支持精确 purge。
5. **观测**：用 Workers Observability 面板看 per-invocation 的 cache hit ratio、HIT/MISS/UPDATING/BYPASS 分布，以及 CPU time 与 request 数变化。
6. **对比**：跑一段时间（建议 ≥ 1 周覆盖真实流量波动），对比开启前后的账单明细与命中率。
7. **决策**：达标则考虑推广到其它稳定只读接口；不达标或账单反升则回退。

### 4.3 回退方案

Workers Cache 靠 `wrangler.jsonc` 一行开关 + 响应头控制，回退成本低：关闭 `"cache": { "enabled": true }` 即回到现有 `caches.default` 方案（该代码保持不动即可）。

## 5. 结论

- Workers Cache 的核心增量价值在于「命中时 Worker 不执行、省 CPU 计费」，对 preset-image 这类高频稳定只读接口最对口。
- 但存在 static assets / service-binding 计费副作用、动态接口误缓存风险、compat date 升级等真实成本。
- **建议**：先做 preset-image 单接口受控试点，用真实账单和命中率数据说话，再决定是否推广。**不建议**顺手全局开启。

---

## 附：参考链接

- 博客原文：https://blog.cloudflare.com/workers-cache/
- Workers Cache 文档：https://developers.cloudflare.com/workers/cache/
- 现有实现：`functions/api/preset-image/[[path]].ts`、`functions/api/apk/latest.json.ts`
- 当前 `wrangler.jsonc` compatibility_date：`2026-04-21`

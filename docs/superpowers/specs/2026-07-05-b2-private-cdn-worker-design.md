# 通用 B2 私有桶 CDN Worker 设计

## 目标

为 Backblaze B2 私有桶新增一个独立的 Cloudflare Worker 下载网关，统一承载 APK、公开图片、公开静态资源、私有存档、私有设置包与备份文件的读取访问，并把“对象管理/同步”和“对象下载/CDN”职责拆开。

## 背景

- 当前项目已有主站 Worker 与 APK 分发逻辑，相关代码集中在 `@functions/api/apk/_shared.ts`。
- 当前对象存储同步逻辑集中在 `@services/objectStorageSync.ts`，它依赖 S3 兼容 API 做 `manifest.json` 读取、`ListObjectsV2` 列目录、对象上传和下载。
- 用户当前配置里填写的是下载/CDN 域名，而不是标准 B2 S3 API 端点，导致 `manifest.json` 和 `ListObjectsV2` 均返回 404。
- 现有默认对象存储同步逻辑已被限流，不适合在这一轮里直接重写或彻底替换。

## 范围

- 新建一个独立 Worker，绑定独立域名 `https://cdn.bacon159.pp.ua`。
- B2 桶保持私有，外部不再直接暴露桶 URL 作为长期正式入口。
- 统一支持两类资源命名空间：
  - `public/...`：公开可访问，不验签。
  - `private/...`：私有资源，必须验签。
- Worker 负责校验请求、回源 B2 私有桶、流式返回对象、补充缓存头和错误响应。
- 第一阶段优先服务“下载访问”，不重写现有对象存储同步协议与 UI 表单结构。
- 为现有 `MoRanJiangHu/...` 旧前缀提供兼容映射，避免必须先整体搬迁桶内对象。

## 非目标

- 不在本轮重写 `@services/objectStorageSync.ts` 的 S3 管理协议。
- 不在本轮新增完整后台、数据库审计、用户 ACL 或复杂配额系统。
- 不要求本轮立即把桶内所有对象从旧结构批量迁移到新结构。
- 不把新 CDN Worker 和当前主站 Worker 合并成一个项目。

## 域名与部署形态

- 新 Worker：独立项目或独立目录，单独 `wrangler deploy`。
- 独立域名：`cdn.bacon159.pp.ua`。
- 当前主站 `msjh.bacon159.pp.ua` 继续保留业务页面、主站 API、对象存储同步入口。
- 后续主站上的 APK/图片下载入口可以逐步切到 CDN Worker，但不要求一次性改完。

## 目录结构

### 标准新结构

- `public/moranjianghu/apk/...`
- `public/moranjianghu/images/...`
- `public/moranjianghu/static/...`
- `private/moranjianghu/manifest.json`
- `private/moranjianghu/saves/...`
- `private/moranjianghu/settings/...`
- `private/moranjianghu/backups/...`

### 与当前云端存档结构的关系

`private/moranjianghu/...` 第一阶段应尽量保持和当前 `MoRanJiangHu/...` 的内部结构一致，只修改根前缀，不重塑 `manifest.json`、`saves/`、`settings/` 的语义。

即：

- 旧：`MoRanJiangHu/manifest.json`
- 新：`private/moranjianghu/manifest.json`

- 旧：`MoRanJiangHu/saves/...`
- 新：`private/moranjianghu/saves/...`

- 旧：`MoRanJiangHu/settings/...`
- 新：`private/moranjianghu/settings/...`

## URL 规则

### 公开资源

公开资源直接访问，无签名：

```text
https://cdn.bacon159.pp.ua/public/moranjianghu/apk/latest.apk
https://cdn.bacon159.pp.ua/public/moranjianghu/images/foo.webp
https://cdn.bacon159.pp.ua/public/moranjianghu/static/bar.json
```

### 私有资源

私有资源必须带签名参数：

```text
https://cdn.bacon159.pp.ua/private/moranjianghu/saves/abc.zip?e=<unix_expire>&sig=<hex_hmac>
```

Worker 第一版仅要求：

- `e`：Unix 时间戳，表示过期时间
- `sig`：HMAC-SHA256 hex 签名

## 签名规则

私有资源签名原文固定为：

```text
<method>\n<pathname>\n<expire>
```

例如：

```text
GET
/private/moranjianghu/saves/abc.zip
1784000000
```

规则：

- 只允许 `GET` 与 `HEAD`
- 使用 Worker 保存的共享私钥做 `HMAC-SHA256`
- 结果输出 hex 字符串作为 `sig`
- Worker 需要校验：
  - `e` 是否存在
  - `e` 是否未过期
  - `sig` 是否匹配
  - 方法是否允许

## 路径映射

### 第一阶段

Worker 必须支持“新路径 + 旧前缀兼容映射”：

- 新请求：
  - `/private/moranjianghu/saves/...`
- 可临时映射到旧对象：
  - `MoRanJiangHu/saves/...`

- 新请求：
  - `/private/moranjianghu/manifest.json`
- 可临时映射到旧对象：
  - `MoRanJiangHu/manifest.json`

这样可以先上线 Worker，再逐步迁桶内数据。

### 后续阶段

待桶内对象逐步完成迁移后，可收紧为只支持新结构：

- `public/moranjianghu/...`
- `private/moranjianghu/...`

并删除对 `MoRanJiangHu/...` 的兼容映射。

## 访问与缓存策略

### public

- 不验签
- 允许 CDN 缓存
- 版本化文件可长缓存，例如 APK 版本包、哈希图文件
- `latest.apk`、`latest.json` 这类追最新对象建议短缓存

### private

- 必验签
- 默认 `Cache-Control: no-store`
- 若未来需要为只读私有大对象启用短缓存，应按前缀白名单单独放开，而不是默认缓存整个 `private`

## Worker 第一版能力边界

第一版只做：

- 路径规范化与非法路径拦截
- public/private 分流
- private 签名校验
- B2 私有桶回源
- 流式返回对象
- 基础缓存头设置
- `Range` / `HEAD` 支持
- 统一错误响应

第一版不做：

- 用户体系绑定
- 复杂速率限制
- 管理后台
- 多租户桶路由
- 细粒度对象级权限数据库

## 与现有项目的衔接

### APK 下载

- 优先切这条线
- 主站现有 `/api/apk/latest.apk` 可继续保留
- 但它返回的实际下载对象地址，逐步改成 `cdn.bacon159.pp.ua/public/moranjianghu/apk/...`

### 公开图片与静态资源

- 第二批接入
- 适合迁到：
  - `public/moranjianghu/images/...`
  - `public/moranjianghu/static/...`

### 私有存档与设置

- 最后接入
- 第一阶段不改上传、列目录、写 manifest 的管理协议
- 仍让现有对象存储同步逻辑通过 B2 S3 API 端点执行管理操作
- 只把“受控下载私有对象”的能力逐步交给新 Worker

## 对当前对象存储配置页的影响

本轮不要求重做对象存储配置页字段结构。

应明确区分两类端点：

- **B2 S3 API 端点**：用于现有同步逻辑的列目录、读 manifest、上传/下载对象。
- **CDN Worker 域名**：用于公开或签名下载访问。

也就是说：

- 当前对象存储同步设置，不应继续填写下载 CDN 域名去假装 S3 API。
- 新 CDN Worker 不是现有同步表单里“endpoint”字段的直接替代品。

## 迁移策略

### 第一阶段：先上线 Worker

- 新建 Worker 与独立域名
- 接公开 APK 或少量公开资源
- 为私有路径预留签名和旧前缀兼容

### 第二阶段：接入旧前缀兼容

- 支持 `/private/moranjianghu/... -> MoRanJiangHu/...`
- 不强制一次性迁桶内对象

### 第三阶段：渐进迁移

- 逐步把对象搬到：
  - `public/moranjianghu/...`
  - `private/moranjianghu/...`
- 迁完后移除旧前缀兼容逻辑

## 错误处理

- `400`：缺少参数、路径非法、方法不支持
- `403`：私有路径未签名、签名错误、签名过期
- `404`：对象不存在
- `416`：非法 Range
- `500/502`：B2 回源失败、Worker 内部错误

错误响应应保持轻量、可审计，并避免暴露 B2 凭证与内部实现细节。

## 验证

- 本地与线上验证 `public` 路径可直接访问
- 验证 `private` 路径：
  - 无签名返回 403
  - 错签名返回 403
  - 过期签名返回 403
  - 正确签名可下载
- 验证 APK / 大对象的 `HEAD` 与 `Range` 请求
- 验证旧前缀兼容映射可正常读取当前 `MoRanJiangHu/...` 对象
- 验证主站与 CDN Worker 可并存，不影响现有对象存储同步逻辑

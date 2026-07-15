# APK 低内存存档导出 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 避免 APK 批量导出与回合末自动云同步因集中加载、复制和压缩存档图片而触发 WebView OOM。

**Architecture:** 用可测试的顺序批处理函数保证一次只读取和写出一条存档；单条 ZIP 只创建一份可修改副本。对象存储自动同步显式选择不内嵌图片的低内存归档，图片在遍历时逐个转换为同步引用。

**Tech Stack:** TypeScript、React、IndexedDB、fflate、Vitest、Capacitor Filesystem

---

### Task 1: 顺序批量导出协调器

**Files:**
- Create: `services/saveExportBatch.ts`
- Create: `services/saveExportBatch.test.ts`

- [ ] 先写失败测试，断言第二条存档只能在第一条完成写入后读取，并断言失败结果包含已完成数量和失败项。
- [ ] 运行 `npx vitest run services/saveExportBatch.test.ts`，确认因模块缺失失败。
- [ ] 实现纯顺序协调器，输入轻量条目、读取回调、归档回调和进度回调；不得持有已完成存档或 Blob 列表。
- [ ] 运行定向测试确认通过并提交。

### Task 2: APK 导出全部逐条写入

**Files:**
- Modify: `components/features/SaveLoad/SaveLoadModal.tsx`
- Modify: `services/saveArchiveService.ts`
- Test: `services/saveExportBatch.test.ts`

- [ ] 修改单条 ZIP 构建，移除重复的整档深拷贝。
- [ ] APK 导出全部读取轻量摘要，通过顺序协调器逐条读取完整存档、生成 ZIP、写入文档目录。
- [ ] 每条写入后更新 `第 X/Y 条` 进度，完成后只弹一次汇总提示；失败时报告已成功数量。
- [ ] 网页端保留现有单 ZIP 下载行为。
- [ ] 运行 ZIP 归档、顺序协调器和存档相关测试。

### Task 3: 自动云同步低内存归档

**Files:**
- Modify: `services/objectStorageSync.ts`
- Modify: `services/cloudPlayService.ts`
- Test: `__tests__/objectStorageSync.test.ts`

- [ ] 先写失败测试，断言后台单存档自动同步把 `includeImages: false` 传给归档层。
- [ ] 为对象存储增量同步增加明确的归档图片选项，默认保持现有完整归档行为。
- [ ] 后台自动同步调用低内存选项；显式手动同步保持完整归档默认值。
- [ ] 运行对象存储同步测试确认通过。

### Task 4: 完整验证与合并

**Files:**
- Modify only if tests expose defects in the files above.

- [ ] 运行稳定测试全集、定向真实模型测试单独记录、执行 `npm run build`。
- [ ] 检查 `git diff --check` 与工作树状态，提交全部实现。
- [ ] 合并 `codex/low-memory-save-export` 回 `main`，在 `main` 再跑定向测试和构建。

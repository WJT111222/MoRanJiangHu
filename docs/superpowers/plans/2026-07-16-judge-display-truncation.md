# Judge Display Truncation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复 `<judge>` 异常闭合或未闭合时聊天显示区吞掉后续正文的问题，同时保留现有判定思考卡片。

**Architecture:** 新建一个无 React 依赖的 Judge 文本提取工具，集中识别标准标签、重复起始标签、HTML 转义标签和未闭合标签。正文解析器使用它提取 `judge_blocks`，聊天显示层使用它做历史数据防御性清理，避免两套正则规则继续分叉。

**Tech Stack:** TypeScript、React 19、Vitest

---

## 文件结构

- 新建 `utils/judgeBlockExtractor.ts`：统一扫描、提取并清理 Judge 标签块。
- 新建 `utils/judgeBlockExtractor.test.ts`：覆盖标准、错误闭合、未闭合和转义标签。
- 修改 `services/ai/storyResponseParser.ts`：复用统一工具生成干净正文和 `judge_blocks`。
- 修改 `components/features/Chat/TurnItem.tsx`：移除会删到文本结尾的显示层正则，改用统一工具。
- 修改 `utils/dialogueLogNormalizer.ts` 与测试：包含标签的日志先安全清理，不再整条丢弃。

### Task 1: 建立统一 Judge 提取工具

**Files:**
- Create: `utils/judgeBlockExtractor.ts`
- Create: `utils/judgeBlockExtractor.test.ts`

- [ ] **Step 1: 写入失败测试**

测试调用 `提取并清理Judge区块(text)` 并断言：标准闭合提取思考且保留尾文；第二个 `<judge>` 作为错误闭合边界时保留其后的 `【判定】`；只有未闭合标签时仅移除标签并保留后续正文；`&lt;judge&gt;` 行为一致。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test:run -- utils/judgeBlockExtractor.test.ts`

Expected: FAIL，因为 `utils/judgeBlockExtractor.ts` 尚不存在或未导出目标函数。

- [ ] **Step 3: 实现最小扫描器**

导出以下接口：

```ts
export type JudgeBlockExtraction = {
    cleanText: string;
    blocks: string[];
};

export const 提取并清理Judge区块 = (text: string): JudgeBlockExtraction => {
    // 依次扫描 <judge>、</judge> 及其 HTML 转义形式。
    // 标准闭合或重复起始标签形成可提取区块。
    // 未闭合起始标签只移除标签，不删除后续内容。
};
```

清理结果统一压缩标签产生的多余空行，但不改变普通正文内容。

- [ ] **Step 4: 运行单元测试确认通过**

Run: `npm run test:run -- utils/judgeBlockExtractor.test.ts`

Expected: PASS。

### Task 2: 正文解析器接入统一工具

**Files:**
- Modify: `services/ai/storyResponseParser.ts:1035`
- Test: `__tests__/storyResponseParser.test.ts`

- [ ] **Step 1: 写入截图场景的失败测试**

构造 `<正文>`：Judge 前有旁白，Judge 使用异常闭合或未闭合，Judge 后包含 `【判定】` 与 `【旁白】后续剧情`。断言 `parsed.logs` 包含后续剧情，且 `judge_blocks` 在边界可信时包含判定思考。

- [ ] **Step 2: 运行测试确认失败原因是后续正文缺失**

Run: `npm run test:run -- __tests__/storyResponseParser.test.ts`

Expected: 新测试 FAIL，现有实现把 `<judge>` 后内容当作判定块或清理掉。

- [ ] **Step 3: 替换解析器内的专用正则**

让 `提取正文中的Judge区块` 调用 `提取并清理Judge区块`，把 `blocks` 映射为既有 `judge_blocks` 数据结构；继续调用 `清理正文Judge残片` 处理旧格式数值残片。

- [ ] **Step 4: 运行解析器测试确认通过**

Run: `npm run test:run -- __tests__/storyResponseParser.test.ts utils/judgeBlockExtractor.test.ts`

Expected: PASS。

### Task 3: 显示层和日志规范化接入安全清理

**Files:**
- Modify: `components/features/Chat/TurnItem.tsx:224`
- Modify: `utils/dialogueLogNormalizer.ts:580`
- Modify: `utils/dialogueLogNormalizer.test.ts`

- [ ] **Step 1: 写入日志规范化失败测试**

输入一条包含“Judge 前正文 + 未闭合 `<judge>` + `【判定】`/后续正文”的日志，断言规范化结果不会为空且后续正文仍存在。

- [ ] **Step 2: 运行测试确认整条日志当前被丢弃**

Run: `npm run test:run -- utils/dialogueLogNormalizer.test.ts`

Expected: 新测试 FAIL，当前 `是否Judge残留文本(text)` 分支返回空数组。

- [ ] **Step 3: 实现显示防御性清理**

在 `TurnItem` 中使用统一工具的 `cleanText` 替换当前删除到 `$` 的正则。在日志规范化中先得到安全清理后的文本；只有清理后确实为空时才丢弃日志，不再因检测到标签就无条件删除整条日志。

- [ ] **Step 4: 运行相关测试**

Run: `npm run test:run -- utils/dialogueLogNormalizer.test.ts utils/judgeBlockExtractor.test.ts __tests__/storyResponseParser.test.ts`

Expected: PASS。

### Task 4: 全面验证与提交

**Files:**
- Verify only

- [ ] **Step 1: 运行完整测试**

Run: `npm run test:run`

Expected: 全部测试通过，无新增失败。

- [ ] **Step 2: 运行生产构建**

Run: `npm run build`

Expected: Vite 构建退出码为 0。

- [ ] **Step 3: 检查改动范围**

Run: `git diff --check` 与 `git status --short`

Expected: 无空白错误；只包含本计划相关源码、测试和计划文件，保留用户已有的 `.reasonix/` 未跟踪内容。

- [ ] **Step 4: 创建修复提交**

```text
git add -- utils/judgeBlockExtractor.ts utils/judgeBlockExtractor.test.ts services/ai/storyResponseParser.ts components/features/Chat/TurnItem.tsx utils/dialogueLogNormalizer.ts utils/dialogueLogNormalizer.test.ts docs/superpowers/plans/2026-07-16-judge-display-truncation.md
git commit -m "fix: 防止 judge 标签截断后续正文"
```

不部署、不发布、不修改版本号。

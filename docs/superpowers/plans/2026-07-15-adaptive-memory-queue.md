# 后台队列自适应内存保护 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在内存压力较高时自动把动态世界、规划分析、地图更新从并行切换为串行，并给出非阻塞提示和可追踪诊断。

**Architecture:** 新建纯函数模块负责采集可选运行时指标、统计轻量回合负载并输出 `normal/high` 评估结果。`sendWorkflow` 只消费评估结果决定执行模式；高压力模式复用现有进度回调提示玩家，并在阶段边界让出主线程、避免保留不必要的原始流式文本。

**Tech Stack:** TypeScript、React hooks、Vitest、Vite、Capacitor WebView

---

## 文件结构

- Create: `hooks/useGame/queueMemoryPressure.ts` — 定义指标、轻量负载统计、阈值和纯评估函数。
- Create: `hooks/useGame/queueMemoryPressure.test.ts` — 覆盖堆、设备等级、负载和指标缺失场景。
- Modify: `hooks/useGame/sendWorkflow.ts` — 在后台三阶段开始前评估压力，选择串并行、显示提示并写诊断日志。

### Task 1: 内存压力纯评估器

**Files:**
- Create: `hooks/useGame/queueMemoryPressure.ts`
- Test: `hooks/useGame/queueMemoryPressure.test.ts`

- [ ] **Step 1: 写失败测试覆盖核心决策**

测试必须构造最小输入并断言：正常指标返回 `normal`；堆使用率达到 0.72 返回 `high`；设备内存不高于 4GB 且回合负载达到中等规模返回 `high`；系统指标缺失但负载过大仍返回 `high`；小负载且指标缺失保持 `normal`。测试同时断言 `reasons` 不为空且不会包含正文内容。

```ts
import { describe, expect, it } from 'vitest';
import { 评估后台队列内存压力 } from './queueMemoryPressure';

describe('评估后台队列内存压力', () => {
    it('在堆使用率过高时强制节省内存模式', () => {
        const result = 评估后台队列内存压力({
            runtime: { usedJSHeapSize: 720, jsHeapSizeLimit: 1000, deviceMemoryGB: 8 },
            workload: { historyChars: 1000, socialCount: 2, mapNodeCount: 3, commandCount: 4, responseChars: 1200 }
        });
        expect(result.level).toBe('high');
        expect(result.reasons).toContain('js_heap_ratio');
    });
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `npx vitest run hooks/useGame/queueMemoryPressure.test.ts`

Expected: FAIL，提示 `queueMemoryPressure` 模块或导出函数不存在。

- [ ] **Step 3: 实现最小纯函数与轻量统计**

实现以下公开结构：

```ts
export type 后台队列内存压力等级 = 'normal' | 'high';

export type 后台队列运行时内存指标 = {
    usedJSHeapSize?: number;
    jsHeapSizeLimit?: number;
    deviceMemoryGB?: number;
};

export type 后台队列负载指标 = {
    historyChars: number;
    socialCount: number;
    mapNodeCount: number;
    commandCount: number;
    responseChars: number;
};

export const 读取后台队列运行时内存指标 = (): 后台队列运行时内存指标 => { /* 安全读取可选浏览器接口 */ };
export const 构建后台队列负载指标 = (params: { history: unknown[]; social: unknown[]; world: unknown; response: unknown }): 后台队列负载指标 => { /* 有上限的遍历统计，不 stringify 完整状态 */ };
export const 评估后台队列内存压力 = (params: { runtime: 后台队列运行时内存指标; workload: 后台队列负载指标 }): { level: 后台队列内存压力等级; reasons: string[]; heapRatio?: number; score: number } => { /* 集中阈值 */ };
```

阈值采用保守但不频繁误判的组合：堆比例 `>= 0.70` 直接判高；综合负载分数达到高阈值直接判高；`deviceMemoryGB <= 4` 且综合负载达到中阈值判高。遍历世界地图节点时设置最大访问量，避免评估本身制造峰值。

- [ ] **Step 4: 运行评估器测试并确认通过**

Run: `npx vitest run hooks/useGame/queueMemoryPressure.test.ts`

Expected: PASS，所有阈值和缺失指标用例通过。

- [ ] **Step 5: 提交评估器**

```powershell
git add -- hooks/useGame/queueMemoryPressure.ts hooks/useGame/queueMemoryPressure.test.ts
git commit -m "feat: 增加后台队列内存压力评估"
```

### Task 2: 接入自适应串并行与玩家提示

**Files:**
- Modify: `hooks/useGame/sendWorkflow.ts:2585`
- Test: `hooks/useGame/queueMemoryPressure.test.ts`

- [ ] **Step 1: 增加模式选择失败测试**

从评估模块导出纯函数 `选择后台队列执行模式`，测试以下规则：渠道不满足并行条件时始终串行；渠道满足且压力正常时并行；渠道满足但压力高时串行。

```ts
expect(选择后台队列执行模式({ channelsAllowParallel: true, pressureLevel: 'normal' })).toBe('parallel');
expect(选择后台队列执行模式({ channelsAllowParallel: true, pressureLevel: 'high' })).toBe('serial');
expect(选择后台队列执行模式({ channelsAllowParallel: false, pressureLevel: 'normal' })).toBe('serial');
```

- [ ] **Step 2: 运行测试并确认新增断言失败**

Run: `npx vitest run hooks/useGame/queueMemoryPressure.test.ts`

Expected: FAIL，提示 `选择后台队列执行模式` 不存在。

- [ ] **Step 3: 实现模式选择并接入 sendWorkflow**

在三阶段配置确定后读取运行时指标、构建轻量负载、评估压力，并把现有 `后处理三阶段可并行` 改为由纯函数决定。高压力时为首个实际执行阶段的开始文本增加以下前缀，每回合只拼接一次：

```text
检测到当前设备或本回合数据的内存压力较高，已自动启用节省内存模式。后台阶段将依次处理，耗时可能略有增加。
```

写入一条 `recordDiagnosticLog('info', ...)`，仅包含模式、原因、堆比例、设备等级、负载计数、阶段数及渠道并行条件，不记录正文或完整状态。

- [ ] **Step 4: 降低高压力串行阶段的引用保留**

高压力模式下，阶段完成进度不把完整 `rawText` 放入 React 进度状态；只保留状态文本和截断后的命令展示。每个串行阶段合并完命令后执行 `await 让出主线程()`，并在进入下一阶段前清除不再使用的阶段结果引用。正常模式保持现有调试信息行为。

- [ ] **Step 5: 运行定向测试与类型检查构建**

Run: `npx vitest run hooks/useGame/queueMemoryPressure.test.ts`

Expected: PASS。

Run: `npm run build`

Expected: Vite production build 成功，无 TypeScript 或打包错误。

- [ ] **Step 6: 提交队列接入**

```powershell
git add -- hooks/useGame/sendWorkflow.ts hooks/useGame/queueMemoryPressure.ts hooks/useGame/queueMemoryPressure.test.ts
git commit -m "fix: 后台队列按内存压力自动串行"
```

### Task 3: 回归验证与交付记录

**Files:**
- Modify only if verification exposes a defect in files already listed above.

- [ ] **Step 1: 运行完整测试**

Run: `npm run test:run`

Expected: 全部测试通过；若存在与本次无关的既有失败，记录准确测试名和输出，不修改无关代码。

- [ ] **Step 2: 检查差异与敏感信息**

Run: `git diff --check HEAD~2..HEAD`

Expected: 无空白错误。

Run: `git status --short`

Expected: 仅保留用户原有的未跟踪 `.reasonix/`，本次代码均已提交。

- [ ] **Step 3: 汇总工程与客户说明**

工程摘要说明自适应判断信号、触发后的串行顺序、提示位置、测试结果和未部署状态。客户说明使用普通语言，强调“设备压力较高时自动采用更稳妥的处理方式，功能不会被关闭”。

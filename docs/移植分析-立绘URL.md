# 移植分析：人物立绘 URL 和头像提取

> 分支：`Rebase`相对于 `origin/main`  
> 相关提交：`20c46a0d`、`b2e0bb24`  
> 分析日期：2026-07-09

---

## 一、总体概述

本轮修改在三个核心数据结构中新增了 `立绘图片URL` 字段，并提供了 `提取人物立绘地址` 工具函数，使得人物立绘可以不依赖生图历史档案、直接通过 URL 引用图片。各 UI 组件在展示立绘时增加了 `立绘图片URL` 作为 fallback 来源。

---

## 二、按文件分组分析

### 1. `models/character.ts`（主角数据结构）

| 行号 | 改动 | 说明 |
|------|------|------|
| L73（新增） | `立绘图片URL?: string;` | 在 `角色数据结构` 接口中新增可选字段 |

- **冲突风险**：低。纯新增字段，origin/main 在此位置无其他改动。
- **是否需要移植**：✅ 需要。主角立绘直接 URL 引用的核心字段。

---

### 2. `models/social.ts`（NPC 数据结构）

| 行号 | 改动 | 说明 |
|------|------|------|
| L298-301（新增） | `头像图片URL?: string;` / `立绘图片URL?: string;` | NPC 结构末尾新增两个直接 URL 字段 |

- **冲突风险**：低。在接口末尾追加字段。
- **是否需要移植**：✅ 需要。NPC 立绘直接 URL 引用的核心字段。

---

### 3. `models/system.ts`（初始伙伴配置结构）

| 行号 | 改动 | 说明 |
|------|------|------|
| L560（新增） | `立绘图片URL?: string;` | `初始伙伴配置结构` 接口中新增可选字段 |

- **冲突风险**：低。纯新增字段。
- **是否需要移植**：✅ 需要。开局伙伴立绘直接 URL 引用的核心字段。

---

### 4. `utils/personAvatar.ts`（提取人物立绘地址）

| 行号 | 改动 | 说明 |
|------|------|------|
| L25-35（新增） | `export const 提取人物立绘地址 = (person: any): string => { ... }` | 新增函数，优先级：`立绘图片URL` → `图片档案.生图历史[已选立绘图片ID]` → 最近一条 `构图 === '立绘' \| '半身'` 的成功记录 |

函数逻辑：
```
1. person?.立绘图片URL → 直接返回
2. 图片档案.已选立绘图片ID 匹配 → 返回对应记录地址
3. 生图历史中找 构图 === '立绘' 或 '半身' 的成功记录 → 返回
4. 兜底返回 ''
```

- **冲突风险**：低。新增函数，不影响原有 `提取人物头像地址`。
- **是否需要移植**：✅ 需要。这是立绘 URL 提取的核心工具函数。

---

### 5. `components/features/NewGame/NewGameWizard.tsx`

| 行号 | 改动 | 说明 |
|------|------|------|
| L681 | `...(portraitUrl ? { 立绘图片URL: portraitUrl } : {})` | 构建主角数据时写入 `立绘图片URL` |
| L713-718 | `从伙伴配置读取立绘URL` 函数增加 `partner?.立绘图片URL` 作为最高优先级 | 读取伙伴立绘时优先取直接 URL |

- **冲突风险**：中。`NewGameWizard.tsx` 在 Rebase 分支有大量其他改动（题材模式重构、移除 `默认开局时间`、`清理官方题材手动提示词残留` 等），移植时需手动确认上下文。
- **是否需要移植**：✅ 需要。保证新开局创建的角色/伙伴立绘 URL 被正确保存。

---

### 6. `components/features/NewGame/mobile/MobileNewGameWizard.tsx`

| 行号 | 改动 | 说明 |
|------|------|------|
| L643 | `...(portraitUrl ? { 立绘图片URL: portraitUrl } : {})` | 移动端同：构建主角数据时写入 `立绘图片URL` |
| L480-485 | `从伙伴配置读取立绘URL` 函数增加 `partner?.立绘图片URL` 优先级 | 移动端同：读取伙伴立绘 |

- **冲突风险**：中。与桌面端 NewGameWizard 存在同样的周边改动。
- **是否需要移植**：✅ 需要。移动端必须与桌面端保持一致。

---

### 7. `components/features/Equipment/EquipmentModal.tsx`

| 行号 | 改动 | 说明 |
|------|------|------|
| L102 | `主角披挂像地址 = 获取图片展示地址(selectedPortrait) \|\| 获取图片资源文本地址(character?.立绘图片URL)` | 装备模态框中主角披挂像增加 `立绘图片URL` fallback |

- **冲突风险**：低。单行修改，仅增加 fallback。
- **是否需要移植**：✅ 需要。保证装备页面在无生图历史时也能展示立绘。

---

### 8. `components/features/Character/MobileCharacter.tsx`

| 行号 | 改动 | 说明 |
|------|------|------|
| L213 | `avatarUrl = ... \|\| 获取图片资源文本地址(character?.头像图片URL)` | 头像展示增加直接 URL fallback |
| L214 | `portraitUrl = ... \|\| 获取图片资源文本地址(character?.立绘图片URL)` | 立绘展示增加直接 URL fallback |

- **冲突风险**：低。两行独立修改。
- **是否需要移植**：✅ 需要。移动端角色面板立绘展示需要此 fallback。

---

### 9. `components/features/Social/SocialModal.tsx`

| 行号 | 改动 | 说明 |
|------|------|------|
| L459-465 | `提取立绘图片地址` 函数改为：先从 `图片档案` 取，fallback 到 `获取图片资源文本地址(npc?.立绘图片URL)` | NPC 立绘展示增加直接 URL fallback |

- **冲突风险**：低。函数内部逻辑修改，不影响签名。
- **是否需要移植**：✅ 需要。社交模态框 NPC 立绘展示需要此 fallback。

---

### 10. `components/features/Social/MobileSocial.tsx`

| 行号 | 改动 | 说明 |
|------|------|------|
| L540-546 | 同 SocialModal，`提取立绘图片地址` 函数增加 `npc?.立绘图片URL` fallback | 移动端社交模态框 |

- **冲突风险**：低。
- **是否需要移植**：✅ 需要。移动端必须与桌面端保持一致。

---

### 11. `components/features/Team/TeamModal.tsx`

| 行号 | 改动 | 说明 |
|------|------|------|
| L79 | `提取人物头像` 函数末尾增加 `\|\| 获取图片资源文本地址(person?.立绘图片URL)` | 队伍模态框中人物头像提取增加立绘 URL 作为最终 fallback |

- **冲突风险**：低。单行追加。
- **是否需要移植**：✅ 需要。保证队伍面板在无头像/立绘生图记录时仍能展示图片。

---

### 12. `components/features/Team/MobileTeamModal.tsx`

| 行号 | 改动 | 说明 |
|------|------|------|
| L65 | 同 TeamModal，`提取人物头像` 末尾增加 `\|\| 获取图片资源文本地址(person?.立绘图片URL)` | 移动端队伍模态框 |

- **冲突风险**：低。
- **是否需要移植**：✅ 需要。移动端必须与桌面端保持一致。

---

## 三、移植优先级总结

| 优先级 | 文件 | 原因 |
|--------|------|------|
| **P0（核心）** | `models/character.ts`、`models/social.ts`、`models/system.ts` | 数据结构层，所有上层组件依赖 |
| **P0（核心）** | `utils/personAvatar.ts` | 工具函数层，组件调用的提取逻辑 |
| **P1（UI）** | `EquipmentModal.tsx`、`MobileCharacter.tsx`、`SocialModal.tsx`、`MobileSocial.tsx`、`TeamModal.tsx`、`MobileTeamModal.tsx` | 展示层 fallback |
| **P1（UI）** | `NewGameWizard.tsx`、`MobileNewGameWizard.tsx` | 创建角色时的写入逻辑 |

---

## 四、冲突风险评估

| 风险等级 | 文件 | 说明 |
|----------|------|------|
| 🟡 中 | `NewGameWizard.tsx` | 周边有大量题材模式/创意工坊重构，移植时需手动核对 |
| 🟡 中 | `MobileNewGameWizard.tsx` | 同上 |
| 🟢 低 | 其余文件 | 均为独立追加行，不干扰其他逻辑 |

---

## 五、依赖关系

```
models/character.ts ─┐
models/social.ts     ─┤
models/system.ts     ─┘
        ↓
utils/personAvatar.ts (提取人物立绘地址)
        ↓
┌───────────────────────────────────────┐
│ NewGameWizard / MobileNewGameWizard   │ 写入
│ EquipmentModal                        │ 读取
│ MobileCharacter                       │ 读取
│ SocialModal / MobileSocial            │ 读取
│ TeamModal / MobileTeamModal           │ 读取
└───────────────────────────────────────┘
```

移植顺序建议：**先数据结构 → 再工具函数 → 最后 UI 组件**。

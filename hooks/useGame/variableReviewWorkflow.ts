import type { GameResponse, TavernCommand, 聊天记录结构, OpeningConfig, 提示词结构 } from '../../types';
import { generateVariableCalibrationUpdate } from '../../services/ai/text';
import { buildNpcTemplateNameContext } from '../../services/npcTemplateNameContext';
import { 获取变量计算接口配置, 接口配置是否可用 } from '../../utils/apiConfig';
import { normalizeStateCommandKey } from '../../utils/stateHelpers';
import { normalizeNpcNameKey } from '../../utils/npcName';
import { 构建变量路径登记提示, 构建变量路径登记表 } from '../../utils/variableRegistry';
import { 默认提示词 } from '../../prompts';
import { 获取境界配置 } from '../../utils/realmConfig';
import { 检测NPC死亡判定风险命令 } from '../../utils/npcDeathGuard';
import { 获取世界观货币层级配置, 获取货币显示模式, 题材货币字段别名 } from '../../utils/currencyDisplay';
import { 获取游玩请求超时毫秒 } from '../../utils/gameRequestTimeouts';
import { 构建变量相关规则提示词 } from '../../prompts/runtime/variableCalibrationReference';
import { buildVariableReviewTaskPrompt, variableReviewSystemPrompt, type VariableReviewTaskContext } from '../../prompts/runtime/variableReview';
import { 执行响应命令处理, type 响应命令处理状态, type 响应命令处理依赖 } from './responseCommandProcessor';
import { 清理变量模型上下文 } from './variableModelWorkflow';
import { 校验变量命令角色安全, validateVariableCommandBasics, readVariableCommandValue, variableCommandProtectionCode, type VariableCommandRejectionCode } from './variableCommandValidation';
import { 执行带完整性校验的请求, 流式结果疑似被上游掐断 } from './streamIntegrity';
import { 规范化环境信息, 规范化角色物品容器映射, 规范化社交列表 } from './stateTransforms';
import { 规范化世界状态, 规范化战斗状态, 规范化门派状态, 规范化剧情状态, 规范化剧情规划状态, 规范化女主剧情规划状态, 规范化同人剧情规划状态, 规范化同人女主剧情规划状态, 战斗结束自动清空 } from './storyState';

const reviewRoots = ['角色', '环境', '世界', '社交', '战斗', '玩家门派', '任务列表', '约定列表'] as const;
const excludeReviewField = (key: string): boolean => /图片|图像|头像|立绘|base64|b64_json|dataurl|缓存|cache|avatar|portrait|thumbnail|image(?:url|data)|^ui(?:state)?$/iu.test(key);
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
export interface VariableReviewChange { path: string; before: unknown; after: unknown }
export interface VariableReviewRejectedCommand { command: TavernCommand; code: VariableCommandRejectionCode | 'alreadySettled'; reason: string }
export interface VariableReviewResult {
    status: 'noChanges' | 'insufficientEvidence' | 'changesProposed' | 'blocked';
    summary: string;
    issues: Array<{ description: string; code?: string }>;
    proposedCommands: TavernCommand[];
    acceptedCommands: TavernCommand[];
    rejectedCommands: VariableReviewRejectedCommand[];
    previewState: 响应命令处理状态;
    changes: VariableReviewChange[];
    stateFingerprint: string;
    sourceTurnId: string;
    coverage: { roots: readonly string[]; truncated: boolean; warnings: string[]; excluded: string[] };
    rawText: string;
    model: string;
}
export interface VariableReviewInput {
    currentState: 响应命令处理状态;
    history: 聊天记录结构[];
    beforeTurn?: { sourceTurnId: string; state: 响应命令处理状态 };
    originalPlayerInput?: string;
    reviewNotes?: string;
    stateVersion?: string | number;
    turnInProgress?: boolean;
    maxArrayItems?: number;
    maxContextChars?: number;
}
export interface VariableReviewDependencies {
    apiConfig: any;
    gameConfig: any;
    openingConfig?: OpeningConfig;
    promptPool?: 提示词结构[];
    signal?: AbortSignal;
    onStreamDelta?: (delta: string, text: string) => void;
}

const stableJson = (v: any): string => JSON.stringify(v, (_key, value) => value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, value[key]])) : value);
export const createVariableReviewFingerprint = async (input: VariableReviewInput): Promise<string> => {
    const { response, sourceTurnId, originalCommands, originalPlayerInput } = selectCompletedTurn(input);
    const bytes = new TextEncoder().encode(stableJson({ state: input.currentState, logs: response.logs, sourceTurnId, version: input.stateVersion,
        originalCommands, originalPlayerInput, beforeTurn: input.beforeTurn }));
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    return `sha256:${Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('')}`;
};
export const assertVariableReviewPreviewCurrent = async (result: VariableReviewResult, input: VariableReviewInput): Promise<void> => {
    if (await createVariableReviewFingerprint(input) !== result.stateFingerprint) throw new Error('游戏状态或正文已发生变化，请重新运行变量审查。');
};

const selectCompletedTurn = (input: VariableReviewInput) => {
    if (input.turnInProgress) throw new Error('当前回合尚未完成，不能运行变量审查。');
    const history = input.history || [];
    let index = history.length - 1;
    while (index >= 0 && history[index]?.role !== 'assistant') index--;
    const turn = history[index];
    if (!turn?.structuredResponse?.logs?.length || history.slice(index + 1).some(item => item.role === 'user')) throw new Error('缺少最后一个已完成回合的结构化正文。');
    const logs = turn.structuredResponse.logs.map(log => ({ sender: String(log.sender || '旁白'), text: String(log.text || '') }));
    if (!logs.some(log => log.text.trim())) throw new Error('当前回合正文为空，不能审查。');
    return { response: { logs, tavern_commands: [] } as GameResponse, sourceTurnId: `assistant:${turn.timestamp}:${index}`,
        originalCommands: clone(turn.structuredResponse.tavern_commands || []),
        originalPlayerInput: [...history.slice(0, index)].reverse().find(item => item.role === 'user')?.content || '' };
};

export const prepareVariableReview = async (input: VariableReviewInput) => {
    // 请求前冻结输入，避免 await 期间调用者状态变化造成上下文与指纹不一致。
    const frozen = clone(input);
    const turn = selectCompletedTurn(frozen);
    if (frozen.originalPlayerInput !== undefined && frozen.originalPlayerInput !== turn.originalPlayerInput) throw new Error('原回合玩家输入与所选回合不匹配，不能将审查备注替代原输入。');
    const warnings: string[] = [];
    const pick = (state: any) => Object.fromEntries(reviewRoots.map(root => [root, state[root]]));
    const maxArrayItems = Math.max(1, Math.min(500, Math.floor(frozen.maxArrayItems ?? 120)));
    const clean = (state: any, label: string) => 清理变量模型上下文(pick(state), '', path => warnings.push(`${label}.${path}`), '', maxArrayItems, excludeReviewField);
    const stateJson = JSON.stringify(clean(frozen.currentState, '当前状态'));
    const beforeState = frozen.beforeTurn?.sourceTurnId === turn.sourceTurnId ? frozen.beforeTurn.state : undefined;
    if (frozen.beforeTurn && !beforeState) warnings.push('回合前快照与正文不匹配，未使用该快照。');
    const beforeStateJson = beforeState ? JSON.stringify(clean(beforeState, '回合前状态')) : undefined;
    const originalCommands = 清理变量模型上下文(turn.originalCommands, '', path => warnings.push(`原命令.${path}`), '原命令', maxArrayItems, excludeReviewField) as TavernCommand[];
    const registryTruncated = 构建变量路径登记表(frozen.currentState, { maxLines: 221 }).length > 220;
    if (registryTruncated) warnings.push('变量路径提示索引仅展示前220项；实际路径合法性仍按当前状态校验。');
    const reviewContext: VariableReviewTaskContext = { sourceTurnId: turn.sourceTurnId, beforeStateJson,
        originalCommands, originalPlayerInput: frozen.originalPlayerInput ?? turn.originalPlayerInput,
        reviewNotes: frozen.reviewNotes, coverageWarnings: warnings };
    if ((stateJson.length + (beforeStateJson?.length || 0) + JSON.stringify(reviewContext).length + JSON.stringify(turn.response.logs).length) > (frozen.maxContextChars ?? 160000)) {
        throw new Error('变量审查上下文过大，未发起请求；不能静默截断并宣称完成全量审查。');
    }
    return { input: frozen, response: turn.response, sourceTurnId: turn.sourceTurnId, beforeState, stateJson, reviewContext,
        coverage: { roots: reviewRoots, truncated: registryTruncated || warnings.some(w => w.includes('仅读取')), warnings,
            excluded: ['图片、base64、缓存、纯UI状态', '剧情、规划、记忆及非MVP变量域'] }, stateFingerprint: await createVariableReviewFingerprint(frozen) };
};
type Prepared = Awaited<ReturnType<typeof prepareVariableReview>>;

export const generateVariableReview = async (prepared: Prepared, deps: VariableReviewDependencies) => {
    const api = 获取变量计算接口配置(deps.apiConfig, { manualReview: true });
    if (!接口配置是否可用(api)) throw new Error('请先配置可用的变量计算 API / 模型。');
    const controller = new AbortController();
    let rejectAbort: (error: Error) => void;
    const aborted = new Promise<never>((_, reject) => { rejectAbort = reject; });
    const rejectOnAbort = () => rejectAbort(new DOMException('已取消变量审查', 'AbortError'));
    controller.signal.addEventListener('abort', rejectOnAbort, { once: true });
    const abort = () => controller.abort();
    if (deps.signal?.aborted) throw new DOMException('已取消变量审查', 'AbortError');
    deps.signal?.addEventListener('abort', abort, { once: true });
    const timeouts = 获取游玩请求超时毫秒(deps.gameConfig?.游玩请求超时设置);
    let timer: ReturnType<typeof setTimeout>;
    let timedOut = false;
    const resetTimer = (idle = false) => {
        clearTimeout(timer);
        timer = setTimeout(() => { timedOut = true; controller.abort(); }, idle ? timeouts.idleMs || 45000 : timeouts.firstResponseMs || 90000);
    };
    const rules = [构建变量相关规则提示词({ promptPool: deps.promptPool?.length ? deps.promptPool : 默认提示词, gameConfig: deps.gameConfig }), 构建变量路径登记提示(prepared.input.currentState)].filter(Boolean).join('\n\n');
    if (rules.length + variableReviewSystemPrompt.length + buildVariableReviewTaskPrompt(prepared.stateJson, prepared.response, prepared.reviewContext).length > (prepared.input.maxContextChars ?? 160000)) {
        deps.signal?.removeEventListener('abort', abort);
        controller.signal.removeEventListener('abort', rejectOnAbort);
        throw new Error('变量结构规则与审查数据合计过大，未发起请求。');
    }
    const request = (stream: boolean, onStreamEnd?: (info: any) => void) => generateVariableCalibrationUpdate({
        taskMode: 'review', stateJson: prepared.stateJson, response: prepared.response,
        reviewContext: prepared.reviewContext, calibrationRulesContext: rules
    }, api!, controller.signal, undefined, stream ? (delta, text) => { resetTimer(true); deps.onStreamDelta?.(delta, text); } : undefined, true, onStreamEnd);
    resetTimer();
    try {
        let end: any;
        const result = await Promise.race([aborted, 执行带完整性校验的请求({ 功能名: '变量审查', 强制非流式: !deps.onStreamDelta,
            重试失败处置: '抛出错误', 重试前重置超时: () => resetTimer(),
            发起流式请求: async options => {
                try { return await request(true, info => { end = info; options.onStreamEnd?.(info); }); }
                catch (error) {
                    if (controller.signal.aborted || !流式结果疑似被上游掐断(end)) throw error;
                    // 严格解析先于流完整性检查，半截协议不能作为部分合法命令返回。
                    resetTimer();
                    options.onStreamEnd?.({ sawDone: true, accumulatedLength: 0 });
                    return request(false);
                }
            }, 发起非流式请求: () => request(false)
        })]);
        if (controller.signal.aborted) throw new DOMException('已取消变量审查', 'AbortError');
        return { ...result.结果, model: api!.model };
    } catch (error) {
        if (timedOut) throw new Error('变量审查请求超时，未生成可应用预览。');
        throw error;
    } finally { clearTimeout(timer!); deps.signal?.removeEventListener('abort', abort); controller.signal.removeEventListener('abort', rejectOnAbort); }
};

// 对金额只支持可核实的单币种明确收支；复杂结算/未知基准保守报告，不凭备注或说明猜金额。
const moneyEvidenceIssue = (cmd: TavernCommand, prepared: Prepared, openingConfig?: OpeningConfig): VariableReviewRejectedCommand | null => {
    const key = normalizeStateCommandKey(cmd.key);
    if (!/^gameState\.角色\.金钱(?:\.|$)/.test(key)) return null;
    const reject = (reason: string, code: VariableReviewRejectedCommand['code'] = 'insufficientEvidence') => ({ command: cmd, code, reason });
    const current = readVariableCommandValue(prepared.input.currentState, key);
    const before = readVariableCommandValue(prepared.beforeState, key);
    if (!['set', 'add', 'sub'].includes(cmd.action) || typeof current !== 'number' || typeof before !== 'number') return reject('金额缺少可核实的回合前基准，或不是单字段数值修复');
    const field = key.split('.').pop()!;
    const mode = 获取货币显示模式(openingConfig, prepared.input.currentState.角色);
    const tiers = 获取世界观货币层级配置(openingConfig?.modeRuntimeProfile, mode);
    const tier = tiers.find(t => t.key === field || 题材货币字段别名[t.key].includes(field));
    const unit = field === 'baseAmount' ? tiers[2].label : tier?.key === field ? tier.label : field;
    const escaped = unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const body = prepared.response.logs.filter(log => log.sender === '旁白').map(log => log.text.replace(/[“"「『][\s\S]*?[”"」』]/g, '')).join('\n');
    const facts = Array.from(body.matchAll(new RegExp(`(获得|得到|收入|赚得|拾得|支付|花费|失去|扣除)\\s*(\\d+(?:\\.\\d+)?)\\s*(?:枚|个)?\\s*${escaped}`, 'gu')));
    if (facts.length !== 1) return reject('正文缺少唯一明确的该币种收支事实；仅报告疑点');
    const fact = facts[0];
    if (/(?:没有|尚未|未曾|不曾|不会|如果|假如|可能|打算|准备|将要|待|预计)[^。！？\n]{0,16}$/u.test(body.slice(Math.max(0, fact.index! - 24), fact.index))) return reject('正文收支处于否定或未发生语境，不能修复金额');
    const subject = normalizeNpcNameKey(body.slice(0, fact.index).split(/[。！？\n；，,]/u).pop() || '');
    const playerName = normalizeNpcNameKey(prepared.input.currentState.角色?.姓名).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(`^(?:${playerName || '(?!)'}|你|我|主角)(?:终于|刚刚|又|已经|额外|总共|成功|实际|确实)?$`, 'u').test(subject)) return reject('正文收支的主体不能明确对应主角，不能把其他人的金额记入主角');
    const amount = Number(fact[2]);
    const delta = /支付|花费|失去|扣除/.test(fact[1]) ? -amount : amount;
    const expected = before + delta;
    const next = cmd.action === 'set' ? cmd.value : current + (cmd.action === 'sub' ? -cmd.value : cmd.value);
    if (current === expected) return reject('正文收支已正确结算，不得重复执行', 'alreadySettled');
    if (current !== before || next !== expected || expected < 0) return reject('当前值、回合前基准与建议金额不构成可核实的漏结算修复');
    return null;
};

const settledCollectionIssue = (cmd: TavernCommand, prepared: Prepared): VariableReviewRejectedCommand | null => {
    const key = normalizeStateCommandKey(cmd.key);
    if (cmd.action === 'push' && /^gameState\.角色\.(?:物品列表|功法列表|天赋列表|技艺|技能列表)$/.test(key)) {
        const current = readVariableCommandValue(prepared.input.currentState, key);
        const identity = (v: any) => [v?.ID, v?.id, v?.名称, v?.姓名, typeof v === 'string' ? v : ''].map(normalizeNpcNameKey).filter(Boolean);
        const keys = new Set(identity(cmd.value));
        if (Array.isArray(current) && current.some(item => identity(item).some(k => keys.has(k)))) {
            return { command: cmd, code: 'alreadySettled', reason: '同名/同ID物品或技能已经记录，不重复push；如需修正数量或字段，应提出有依据的字段命令' };
        }
    }
    if (/^gameState\.角色\.物品列表\[\d+\]\.(?:数量|堆叠数量)$/.test(key)) {
        const current = readVariableCommandValue(prepared.input.currentState, key);
        if (cmd.action === 'set' && current === cmd.value) return { command: cmd, code: 'alreadySettled', reason: '物品数量已经一致，无需重复修复' };
        // 库存涉及多次获得/消耗，MVP不以同索引快照或备注推算净增量。
        return { command: cmd, code: 'insufficientEvidence', reason: '库存数量需要额外核实获得/消耗和稳定物品身份；本阶段仅报告疑点，避免重复结算' };
    }
    return null;
};

export const validateVariableReviewCommands = async (prepared: Prepared, commands: TavernCommand[], deps: VariableReviewDependencies) => {
    const nameContext = await buildNpcTemplateNameContext(prepared.input.currentState, deps.openingConfig, prepared.reviewContext.originalPlayerInput);
    const acceptedCommands: TavernCommand[] = [];
    const rejectedCommands: VariableReviewRejectedCommand[] = [];
    let moneyCommandAccepted = false;
    const params = { baseState: prepared.input.currentState, parsedResponse: prepared.response, openingConfig: deps.openingConfig, npcNameContext: nameContext };
    const deathBatchValid = 检测NPC死亡判定风险命令(commands, params.baseState.社交, params.parsedResponse).length === 0;
    for (const command of commands) {
        let issue = validateVariableCommandBasics(command, prepared.input.currentState, true);
        if (!issue) {
            try { 校验变量命令角色安全([command], params); }
            catch (error: any) {
                if (!(deathBatchValid && /判定为死亡/.test(error.message))) issue = { code: variableCommandProtectionCode(error.message), reason: error.message };
            }
        }
        const numericIssue = !issue ? settledCollectionIssue(command, prepared) || moneyEvidenceIssue(command, prepared, deps.openingConfig) : null;
        if (issue || numericIssue) rejectedCommands.push(numericIssue || { command, ...issue! });
        else if (/^gameState\.角色\.金钱(?:\.|$)/.test(normalizeStateCommandKey(command.key))) {
            if (moneyCommandAccepted) rejectedCommands.push({ command, code: 'insufficientEvidence', reason: '同次审查已接受金额修复，拒绝重复或别名重复记账' });
            else { moneyCommandAccepted = true; acceptedCommands.push(command); }
        } else acceptedCommands.push(command);
    }
    return { acceptedCommands, rejectedCommands, nameContext };
};

const processorDeps: 响应命令处理依赖 = { 规范化环境信息, 规范化角色物品容器映射, 规范化社交列表,
    规范化世界状态, 规范化战斗状态, 规范化门派状态, 规范化剧情状态, 规范化剧情规划状态,
    规范化女主剧情规划状态, 规范化同人剧情规划状态, 规范化同人女主剧情规划状态, 战斗结束自动清空 };
export const simulateVariableReview = (prepared: Prepared, validation: Awaited<ReturnType<typeof validateVariableReviewCommands>>, deps: VariableReviewDependencies) => {
    const acceptedCommands: TavernCommand[] = [];
    const rejectedCommands = [...validation.rejectedCommands];
    const previewState = 执行响应命令处理({ ...prepared.response, tavern_commands: validation.acceptedCommands }, prepared.input.currentState,
        { ...processorDeps, 境界配置: 获取境界配置(deps.openingConfig?.题材模式, deps.openingConfig?.modeRuntimeProfile), 角色规范化选项: { 题材模式: deps.openingConfig?.题材模式 } }, undefined,
        { executionMode: 'review-preview', reviewNameContext: validation.nameContext, onCommandDiagnostic: diagnostic => {
            if (diagnostic.status === 'accepted') acceptedCommands.push(diagnostic.command);
            else rejectedCommands.push({ command: diagnostic.command, code: diagnostic.code || 'safety', reason: diagnostic.reason || '未通过执行保护' });
        } });
    return { acceptedCommands, rejectedCommands, previewState, changes: diffVariableReviewStates(prepared.input.currentState, previewState) };
};
export const diffVariableReviewStates = (before: any, after: any): VariableReviewChange[] => {
    const changes: VariableReviewChange[] = [];
    const walk = (a: any, b: any, path: string) => {
        if (stableJson(a) === stableJson(b)) return;
        if (a && b && typeof a === 'object' && typeof b === 'object' && Array.isArray(a) === Array.isArray(b)) {
            for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) walk(a[key], b[key], Array.isArray(a) ? `${path}[${key}]` : path ? `${path}.${key}` : key);
        } else changes.push({ path, before: a, after: b });
    };
    walk(before, after, '');
    return changes;
};
export const runVariableReview = async (input: VariableReviewInput, deps: VariableReviewDependencies): Promise<VariableReviewResult> => {
    const prepared = await prepareVariableReview(input);
    const generated = await generateVariableReview(prepared, deps);
    if (!generated.reviewStatus) throw new Error('变量审查没有返回可识别的完整结果状态。');
    const validation = await validateVariableReviewCommands(prepared, generated.commands, deps);
    const simulation = simulateVariableReview(prepared, validation, deps);
    const status = simulation.changes.length > 0 ? 'changesProposed' : simulation.rejectedCommands.some(cmd => cmd.code !== 'alreadySettled') ? 'blocked'
        : generated.reviewStatus === 'insufficientEvidence' ? 'insufficientEvidence' : 'noChanges';
    return { status, summary: status === 'noChanges' ? '当前审查范围内未发现需要修改的内容。' : generated.reports.join('\n'),
        issues: [...generated.reports.map(description => ({ description })), ...simulation.rejectedCommands.map(cmd => ({ description: cmd.reason, code: cmd.code }))],
        proposedCommands: clone(generated.commands), ...simulation, stateFingerprint: prepared.stateFingerprint,
        sourceTurnId: prepared.sourceTurnId, coverage: prepared.coverage, rawText: generated.rawText, model: generated.model };
};

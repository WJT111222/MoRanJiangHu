import React, { useEffect, useMemo, useState } from 'react';
import { 创意工坊模块分区, type 创意工坊模块条目, type 创意工坊模块类型 } from '../../../data/creativeWorkshopModules';
import type { 题材模式类型 } from '../../../models/system';
import { 题材模式顺序 } from '../../../utils/topicModeProfiles';
import {
    编辑创意工坊模块,
    删除创意工坊模块,
    发布创意工坊模块,
    导入本地创意工坊模块,
    列出创意工坊模块
} from '../../../services/creativeWorkshop';
import { 读取云端游玩会话 } from '../../../services/cloudPlayService';

interface Props {
    open: boolean;
    onClose: () => void;
    onNovelDecomposition: () => void;
}

type 来源筛选 = 'all' | 'builtin' | 'cloud' | 'local';
const 可展示工坊类型: 创意工坊模块类型[] = ['topic', 'world_rules', 'ability', 'comfy_workflow'];
const 可展示工坊类型集合 = new Set<创意工坊模块类型>(可展示工坊类型);
const 可展示工坊分区 = 创意工坊模块分区.filter((section) => 可展示工坊类型集合.has(section.id));

type 贡献草稿 = {
    title: string;
    subtitle: string;
    description: string;
    type: 创意工坊模块类型;
    mode: 题材模式类型;
    tags: string;
    body: string;
    style: string;
    scope: 'main' | 'scene' | 'nsfw' | 'all';
};

const 下载JSON = (entry: 创意工坊模块条目) => {
    const payload = {
        schema: 'moranjianghu-creative-workshop-module',
        version: 1,
        exportedAt: new Date().toISOString(),
        module: entry
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${entry.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
};

const 复制文本 = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
};

const 构建模块摘要 = (entry: 创意工坊模块条目): string => [
    `《${entry.title}》`,
    entry.description,
    `标签：${entry.tags.join('、')}`,
    '',
    '注入预览：',
    ...(entry.injectionPreview?.length ? entry.injectionPreview : [`模块数据：${JSON.stringify(entry.payload, null, 2)}`])
].join('\n');

const 空贡献草稿 = (): 贡献草稿 => ({
    title: '',
    subtitle: '',
    description: '',
    type: 'world_rules',
    mode: '武侠',
    tags: '',
    body: '',
    style: '',
    scope: 'main'
});

const 分割文本行 = (value: string): string[] => value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

const 构建贡献模块 = (draft: 贡献草稿, contributor: string): 创意工坊模块条目 => {
    const title = draft.title.trim();
    const bodyLines = 分割文本行(draft.body);
    const tags = [
        draft.mode,
        ...draft.tags.split(/[，,、\s]+/).map((tag) => tag.trim()).filter(Boolean)
    ].filter((tag, index, list) => list.indexOf(tag) === index).slice(0, 12);
    const style = draft.style.trim();
    const scopeLabel = draft.scope === 'nsfw' ? 'NSFW 生图' : draft.scope === 'scene' ? '场景生图' : draft.scope === 'all' ? '通用生图' : '普通生图';
    const injectionPreview = draft.type === 'comfy_workflow'
        ? [
            `适用范围：${draft.scope}`,
            `风格：${style || '未填写'}`,
            ...bodyLines.slice(0, 8),
            '注入方式：玩家在文生图设置里选择该工作流后，写入对应 ComfyUI Workflow JSON。'
        ].filter(Boolean)
        : [
            `适用题材：${draft.mode}`,
            `模块类型：${可展示工坊分区.find((section) => section.id === draft.type)?.title || draft.type}`,
            ...bodyLines.slice(0, 10)
        ];
    return {
        id: `local-${draft.type}-${Date.now()}`,
        type: draft.type,
        title,
        subtitle: draft.subtitle.trim() || (draft.type === 'comfy_workflow' ? `${style || '自定义风格'} · ${scopeLabel}` : `${draft.mode} · 玩家贡献`),
        description: draft.description.trim() || `${draft.mode}可用的玩家贡献模块。`,
        tags,
        payload: draft.type === 'comfy_workflow'
            ? { scope: draft.scope, style, workflowJson: draft.body.trim() }
            : { mode: draft.mode, content: draft.body.trim() },
        injectionPreview: injectionPreview.length ? injectionPreview : ['暂未填写注入内容。'],
        source: 'local',
        contributor: contributor.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
};

const CreativeWorkshopModal: React.FC<Props> = ({ open, onClose, onNovelDecomposition }) => {
    const [activeType, setActiveType] = useState<创意工坊模块类型>('topic');
    const [sourceFilter, setSourceFilter] = useState<来源筛选>('all');
    const [entries, setEntries] = useState<创意工坊模块条目[]>([]);
    const [expandedId, setExpandedId] = useState('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [busyId, setBusyId] = useState('');
    const [contributor, setContributor] = useState('');
    const [anonymousContribution, setAnonymousContribution] = useState(false);
    const [cloudUsername, setCloudUsername] = useState('');
    const [editingEntryId, setEditingEntryId] = useState('');
    const [editingDraft, setEditingDraft] = useState({ title: '', subtitle: '', description: '', tags: '', contributor: '', anonymous: false });
    const [contributionDraft, setContributionDraft] = useState<贡献草稿>(() => 空贡献草稿());
    const [showContributionForm, setShowContributionForm] = useState(true);
    const contributionModule = useMemo(() => 构建贡献模块(contributionDraft, contributor), [contributionDraft, contributor]);
    const contributionReady = contributionDraft.title.trim().length > 0 && contributionDraft.body.trim().length > 0;

    const activeEntries = useMemo(
        () => entries.filter((entry) => 可展示工坊类型集合.has(entry.type) && entry.type === activeType && (sourceFilter === 'all' || entry.source === sourceFilter)),
        [activeType, entries, sourceFilter]
    );

    const refreshEntries = async () => {
        setLoading(true);
        try {
            const nextEntries = (await 列出创意工坊模块()).filter((entry) => 可展示工坊类型集合.has(entry.type));
            setEntries(nextEntries);
            if (!可展示工坊类型集合.has(activeType)) {
                setActiveType('topic');
            }
        } catch (error: any) {
            setStatus(`读取创意工坊失败：${error?.message || '未知错误'}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!open) return;
        const session = 读取云端游玩会话();
        setCloudUsername(session?.username || '');
        void refreshEntries();
    }, [open]);

    if (!open) return null;

    const 发布模块 = async (entry: 创意工坊模块条目) => {
        setBusyId(entry.id);
        try {
            const published = await 发布创意工坊模块({ module: entry, contributor, anonymous: anonymousContribution });
            setStatus(`已发布到社区工坊：${published.title}。`);
            await refreshEntries();
        } catch (error: any) {
            setStatus(`发布失败：${error?.message || '未知错误'}`);
        } finally {
            setBusyId('');
        }
    };

    const 开始编辑社区模块 = (entry: 创意工坊模块条目) => {
        setEditingEntryId(entry.id);
        setEditingDraft({
            title: entry.title || '',
            subtitle: entry.subtitle || '',
            description: entry.description || '',
            tags: (entry.tags || []).join('、'),
            contributor: entry.anonymous ? '' : (entry.contributor || cloudUsername),
            anonymous: entry.anonymous === true
        });
    };

    const 保存社区模块编辑 = async (entry: 创意工坊模块条目) => {
        setBusyId(entry.id);
        try {
            const updated = await 编辑创意工坊模块({
                id: entry.id,
                anonymous: editingDraft.anonymous,
                patch: {
                    title: editingDraft.title,
                    subtitle: editingDraft.subtitle,
                    description: editingDraft.description,
                    tags: editingDraft.tags.split(/[，,、\s]+/).map((tag) => tag.trim()).filter(Boolean),
                    contributor: editingDraft.contributor
                }
            });
            setStatus(`已更新社区工坊：${updated.title}。`);
            setEditingEntryId('');
            await refreshEntries();
        } catch (error: any) {
            setStatus(`编辑失败：${error?.message || '未知错误'}`);
        } finally {
            setBusyId('');
        }
    };

    const 删除社区模块 = async (entry: 创意工坊模块条目) => {
        if (!window.confirm(`确定删除社区投稿「${entry.title}」吗？`)) return;
        setBusyId(entry.id);
        try {
            await 删除创意工坊模块(entry.id);
            setStatus(`已删除社区投稿：${entry.title}。`);
            await refreshEntries();
        } catch (error: any) {
            setStatus(`删除失败：${error?.message || '未知错误'}`);
        } finally {
            setBusyId('');
        }
    };

    const 保存贡献模块到本地 = async () => {
        if (!contributionReady) {
            setStatus('请先填写模块名称和注入内容。');
            return;
        }
        try {
            const module = 导入本地创意工坊模块(contributionModule);
            setStatus(`已保存本地贡献「${module.title}」，可以在本地导入分区预览或发布。`);
            setActiveType(module.type);
            setSourceFilter('local');
            setExpandedId(module.id);
            setContributionDraft(空贡献草稿());
            await refreshEntries();
        } catch (error: any) {
            setStatus(`保存失败：${error?.message || '未知错误'}`);
        }
    };

    return (
        <div className="fixed inset-0 z-[430] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div
                className="w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-2xl border border-wuxia-gold/25 bg-[linear-gradient(180deg,rgba(28,20,10,0.98),rgba(6,6,6,0.98))] shadow-[0_26px_90px_rgba(0,0,0,0.65)]"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4 border-b border-wuxia-gold/10 px-5 py-4">
                    <div>
                        <div className="text-xs font-mono tracking-[0.28em] text-wuxia-gold">CREATIVE WORKSHOP</div>
                        <h2 className="mt-2 text-lg font-serif font-bold tracking-[0.18em] text-wuxia-gold">创意工坊</h2>
                        <p className="mt-2 max-w-4xl text-sm leading-6 text-amber-50/75">
                            玩家贡献内容的总入口。创意工坊聚焦世界观和天赋背景；开局配置保留在新建存档流程中单独调整。
                        </p>
                    </div>
                    <button type="button" onClick={onClose} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-amber-300/25 bg-black/30 text-xl text-amber-100 transition-colors hover:border-amber-300/50 hover:text-white" aria-label="关闭创意工坊" title="关闭">×</button>
                </div>

                <div className="max-h-[calc(92vh-118px)] overflow-y-auto p-5">
                    <button type="button" onClick={() => { onClose(); onNovelDecomposition(); }} className="mb-4 w-full rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-4 text-left transition-colors hover:bg-emerald-500/15">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <div className="text-sm font-bold tracking-[0.14em] text-emerald-300">小说分解模块</div>
                                <div className="mt-2 text-xs leading-5 text-gray-300">导入、拆章、续跑、分段校对、发布和下载小说分解分享 ZIP。</div>
                            </div>
                            <div className="shrink-0 border border-emerald-500/30 px-2 py-1 text-[10px] tracking-[0.14em] text-emerald-200">进入工作台</div>
                        </div>
                    </button>

                    <div className="mb-4 grid gap-2 sm:grid-cols-4">
                        {可展示工坊分区.map((section) => (
                            <button key={section.id} type="button" onClick={() => setActiveType(section.id)} className={`rounded-xl border p-3 text-left transition-colors ${activeType === section.id ? 'border-wuxia-gold/50 bg-wuxia-gold/15 text-wuxia-gold' : 'border-white/10 bg-white/[0.03] text-gray-200 hover:border-wuxia-gold/30'}`}>
                                <div className="flex items-center justify-between gap-2">
                                    <div className="text-sm font-bold">{section.title}</div>
                                </div>
                                <div className="mt-1 text-[11px] leading-4 text-gray-400">{section.description}</div>
                            </button>
                        ))}
                    </div>

                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <div className="flex flex-wrap gap-2">
                            {(['all', 'builtin', 'cloud', 'local'] as 来源筛选[]).map((source) => (
                                <button key={source} type="button" onClick={() => setSourceFilter(source)} className={`rounded-lg border px-3 py-1.5 text-xs ${sourceFilter === source ? 'border-wuxia-gold/50 bg-wuxia-gold/15 text-wuxia-gold' : 'border-white/10 text-gray-300 hover:border-white/25'}`}>
                                    {source === 'all' ? '全部' : source === 'builtin' ? '官方预设' : source === 'cloud' ? '社区贡献' : '本地导入'}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <input value={contributor} onChange={(event) => setContributor(event.target.value)} placeholder="贡献者署名" className="h-9 rounded-lg border border-white/10 bg-black/30 px-3 text-xs text-gray-100 outline-none placeholder:text-gray-500 focus:border-wuxia-gold/40" />
                            <label className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-3 text-xs text-gray-200">
                                <input type="checkbox" checked={anonymousContribution} onChange={(event) => setAnonymousContribution(event.target.checked)} className="h-3.5 w-3.5 accent-wuxia-gold" />
                                匿名发布
                            </label>
                            <span className="text-[11px] text-gray-500">{cloudUsername ? `联机账号：${cloudUsername}` : '登录联机账号后可编辑/删除自己的投稿'}</span>
                            <button type="button" onClick={() => setShowContributionForm((value) => !value)} className="rounded-lg border border-wuxia-gold/25 px-3 py-2 text-xs text-wuxia-gold hover:border-wuxia-gold/45">{showContributionForm ? '收起贡献表单' : '贡献新预设'}</button>
                            <button type="button" onClick={() => void refreshEntries()} disabled={loading} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-gray-200 hover:border-white/25 disabled:opacity-50">{loading ? '刷新中' : '刷新社区'}</button>
                        </div>
                    </div>

                    {showContributionForm && (
                        <div className="mb-4 grid gap-4 rounded-xl border border-wuxia-gold/15 bg-white/[0.035] p-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
                            <div className="space-y-3">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <label className="block text-xs text-gray-300">
                                        模块名称
                                        <input value={contributionDraft.title} onChange={(event) => setContributionDraft((prev) => ({ ...prev, title: event.target.value }))} placeholder="例如：门派暗线世界规则" className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-gray-100 outline-none placeholder:text-gray-500 focus:border-wuxia-gold/45" />
                                    </label>
                                    <label className="block text-xs text-gray-300">
                                        副标题
                                        <input value={contributionDraft.subtitle} onChange={(event) => setContributionDraft((prev) => ({ ...prev, subtitle: event.target.value }))} placeholder="例如：势力渗透、暗线追踪" className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-gray-100 outline-none placeholder:text-gray-500 focus:border-wuxia-gold/45" />
                                    </label>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    <label className="block text-xs text-gray-300">
                                        模块类型
                                        <select value={contributionDraft.type} onChange={(event) => setContributionDraft((prev) => ({ ...prev, type: event.target.value as 创意工坊模块类型 }))} className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-gray-100 outline-none focus:border-wuxia-gold/45">
                                            {可展示工坊分区.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}
                                        </select>
                                    </label>
                                    <label className="block text-xs text-gray-300">
                                        适用模式
                                        <select value={contributionDraft.mode} onChange={(event) => setContributionDraft((prev) => ({ ...prev, mode: event.target.value as 题材模式类型 }))} className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-gray-100 outline-none focus:border-wuxia-gold/45">
                                            {题材模式顺序.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
                                        </select>
                                    </label>
                                    <label className="block text-xs text-gray-300">
                                        标签
                                        <input value={contributionDraft.tags} onChange={(event) => setContributionDraft((prev) => ({ ...prev, tags: event.target.value }))} placeholder="逗号或空格分隔" className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-gray-100 outline-none placeholder:text-gray-500 focus:border-wuxia-gold/45" />
                                    </label>
                                </div>
                                {contributionDraft.type === 'comfy_workflow' && (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <label className="block text-xs text-gray-300">
                                            工作流风格
                                            <input value={contributionDraft.style} onChange={(event) => setContributionDraft((prev) => ({ ...prev, style: event.target.value }))} placeholder="写实、国风、二次元、像素、NSFW 等" className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-gray-100 outline-none placeholder:text-gray-500 focus:border-wuxia-gold/45" />
                                        </label>
                                        <label className="block text-xs text-gray-300">
                                            使用范围
                                            <select value={contributionDraft.scope} onChange={(event) => setContributionDraft((prev) => ({ ...prev, scope: event.target.value as 贡献草稿['scope'] }))} className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-gray-100 outline-none focus:border-wuxia-gold/45">
                                                <option value="main">普通生图</option>
                                                <option value="scene">场景生图</option>
                                                <option value="nsfw">NSFW 生图</option>
                                                <option value="all">全部生图</option>
                                            </select>
                                        </label>
                                    </div>
                                )}
                                <label className="block text-xs text-gray-300">
                                    简介
                                    <input value={contributionDraft.description} onChange={(event) => setContributionDraft((prev) => ({ ...prev, description: event.target.value }))} placeholder="一句话说明这个预设会改变什么体验" className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-sm text-gray-100 outline-none placeholder:text-gray-500 focus:border-wuxia-gold/45" />
                                </label>
                                <label className="block text-xs text-gray-300">
                                    注入内容
                                    <textarea value={contributionDraft.body} onChange={(event) => setContributionDraft((prev) => ({ ...prev, body: event.target.value }))} placeholder={contributionDraft.type === 'comfy_workflow' ? '粘贴 ComfyUI API Workflow JSON，或写清工作流下载/使用说明。' : '逐条写世界观规则、题材模板或能力体系。每行会进入注入预览。'} className="mt-1 min-h-36 w-full resize-y rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm leading-6 text-gray-100 outline-none placeholder:text-gray-500 focus:border-wuxia-gold/45" />
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    <button type="button" onClick={() => void 保存贡献模块到本地()} disabled={!contributionReady} className="rounded-lg border border-emerald-500/35 bg-emerald-500/15 px-4 py-2 text-xs font-bold text-emerald-100 hover:bg-emerald-500/25 disabled:opacity-45">保存到本地</button>
                                    <button type="button" onClick={() => void 发布模块(contributionModule)} disabled={!contributionReady || Boolean(busyId)} className="rounded-lg border border-sky-500/35 bg-sky-500/15 px-4 py-2 text-xs font-bold text-sky-100 hover:bg-sky-500/25 disabled:opacity-45">发布到社区</button>
                                    <button type="button" onClick={() => setContributionDraft(空贡献草稿())} className="rounded-lg border border-white/10 px-4 py-2 text-xs text-gray-200 hover:border-white/25">清空</button>
                                </div>
                            </div>
                            <div className="rounded-lg border border-white/10 bg-black/25 p-3">
                                <div className="text-xs font-bold tracking-[0.14em] text-wuxia-gold">实时预览</div>
                                <div className="mt-3 text-base font-serif font-bold text-gray-100">{contributionModule.title || '未命名预设'}</div>
                                <div className="mt-1 text-xs text-wuxia-gold/80">{contributionModule.subtitle}</div>
                                <p className="mt-2 text-sm leading-6 text-gray-300">{contributionModule.description}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {contributionModule.tags.map((tag) => <span key={tag} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-gray-300">{tag}</span>)}
                                </div>
                                <div className="mt-3 rounded-lg border border-wuxia-gold/15 bg-black/30 p-3">
                                    <div className="text-xs font-bold tracking-[0.14em] text-wuxia-gold">注入预览</div>
                                    <ul className="mt-2 space-y-1 text-xs leading-5 text-gray-300">
                                        {contributionModule.injectionPreview.map((line, index) => <li key={index}>{line}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {status && <div className="mb-4 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">{status}</div>}

                    <div className="grid gap-3 lg:grid-cols-2">
                        {activeEntries.map((entry) => {
                            const expanded = expandedId === entry.id;
                            const canPublishEntry = entry.source !== 'builtin' && entry.source !== 'cloud';
                            const canManageEntry = entry.source === 'cloud' && Boolean(cloudUsername) && entry.ownerUsername === cloudUsername;
                            const editing = editingEntryId === entry.id;
                            return (
                                <div key={`${entry.source || 'builtin'}:${entry.id}`} className="rounded-xl border border-white/10 bg-black/25 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="text-base font-serif font-bold text-gray-100">{entry.title}</h3>
                                            <div className="mt-1 text-xs text-wuxia-gold/80">{entry.subtitle}</div>
                                            <div className="mt-1 text-[11px] text-gray-500">{entry.source === 'cloud' ? '社区贡献' : entry.source === 'local' ? '本地导入' : '官方预设'} · {entry.contributor || '匿名'}</div>
                                        </div>
                                        <div className="shrink-0 border border-white/15 px-2 py-0.5 text-[10px] text-gray-300">可注入</div>
                                    </div>
                                    <p className="mt-3 text-sm leading-6 text-gray-300">{entry.description}</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {entry.tags.map((tag) => <span key={tag} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-gray-300">{tag}</span>)}
                                    </div>
                                    {expanded && (
                                        <div className="mt-3 rounded-lg border border-wuxia-gold/15 bg-black/30 p-3">
                                            <div className="text-xs font-bold tracking-[0.14em] text-wuxia-gold">注入预览</div>
                                            <ul className="mt-2 space-y-1 text-xs leading-5 text-gray-300">
                                                {(entry.injectionPreview?.length ? entry.injectionPreview : [`payload：${JSON.stringify(entry.payload, null, 2)}`]).map((line, index) => <li key={index}>{line}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                    {editing && (
                                        <div className="mt-3 space-y-2 rounded-lg border border-sky-500/20 bg-sky-500/10 p-3">
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                <input value={editingDraft.title} onChange={(event) => setEditingDraft((prev) => ({ ...prev, title: event.target.value }))} className="h-9 rounded-lg border border-white/10 bg-black/30 px-3 text-xs text-gray-100 outline-none focus:border-sky-400/50" placeholder="模块名称" />
                                                <input value={editingDraft.subtitle} onChange={(event) => setEditingDraft((prev) => ({ ...prev, subtitle: event.target.value }))} className="h-9 rounded-lg border border-white/10 bg-black/30 px-3 text-xs text-gray-100 outline-none focus:border-sky-400/50" placeholder="副标题" />
                                            </div>
                                            <input value={editingDraft.description} onChange={(event) => setEditingDraft((prev) => ({ ...prev, description: event.target.value }))} className="h-9 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-xs text-gray-100 outline-none focus:border-sky-400/50" placeholder="简介" />
                                            <div className="grid gap-2 sm:grid-cols-2">
                                                <input value={editingDraft.tags} onChange={(event) => setEditingDraft((prev) => ({ ...prev, tags: event.target.value }))} className="h-9 rounded-lg border border-white/10 bg-black/30 px-3 text-xs text-gray-100 outline-none focus:border-sky-400/50" placeholder="标签" />
                                                <input value={editingDraft.contributor} onChange={(event) => setEditingDraft((prev) => ({ ...prev, contributor: event.target.value }))} disabled={editingDraft.anonymous} className="h-9 rounded-lg border border-white/10 bg-black/30 px-3 text-xs text-gray-100 outline-none focus:border-sky-400/50 disabled:opacity-50" placeholder="署名" />
                                            </div>
                                            <label className="inline-flex items-center gap-2 text-xs text-gray-200">
                                                <input type="checkbox" checked={editingDraft.anonymous} onChange={(event) => setEditingDraft((prev) => ({ ...prev, anonymous: event.target.checked }))} className="h-3.5 w-3.5 accent-wuxia-gold" />
                                                匿名显示
                                            </label>
                                        </div>
                                    )}
                                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                                        <button type="button" onClick={() => setExpandedId(expanded ? '' : entry.id)} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-gray-200 hover:border-white/25">{expanded ? '收起预览' : '预览注入'}</button>
                                        <button type="button" onClick={() => 下载JSON(entry)} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-gray-200 hover:border-white/25">下载 JSON</button>
                                        <button type="button" onClick={() => void 复制文本(构建模块摘要(entry)).then((ok) => setStatus(ok ? `已复制「${entry.title}」注入摘要。` : '复制失败，请改用下载 JSON。'))} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-gray-200 hover:border-white/25">复制摘要</button>
                                        {canPublishEntry ? (
                                            <button type="button" onClick={() => void 发布模块(entry)} disabled={Boolean(busyId)} className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs text-sky-200 hover:bg-sky-500/15 disabled:opacity-50">贡献社区</button>
                                        ) : (
                                            <button type="button" disabled className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-gray-500">无需贡献</button>
                                        )}
                                        {canManageEntry && !editing ? (
                                            <button type="button" onClick={() => 开始编辑社区模块(entry)} className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs text-sky-200 hover:bg-sky-500/15">编辑投稿</button>
                                        ) : null}
                                        {canManageEntry && editing ? (
                                            <button type="button" onClick={() => void 保存社区模块编辑(entry)} disabled={Boolean(busyId)} className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 hover:bg-emerald-500/15 disabled:opacity-50">保存编辑</button>
                                        ) : null}
                                        {canManageEntry && editing ? (
                                            <button type="button" onClick={() => setEditingEntryId('')} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-gray-200 hover:border-white/25">取消编辑</button>
                                        ) : null}
                                        {canManageEntry ? (
                                            <button type="button" onClick={() => void 删除社区模块(entry)} disabled={Boolean(busyId)} className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200 hover:bg-red-500/15 disabled:opacity-50">删除投稿</button>
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreativeWorkshopModal;

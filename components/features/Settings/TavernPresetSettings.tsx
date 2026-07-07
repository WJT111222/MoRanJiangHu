import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 游戏设置结构, 酒馆预设结构, 接口设置结构, 酒馆正则脚本执行状态 } from '../../../types';
import ToggleSwitch from '../../ui/ToggleSwitch';
import GameButton from '../../ui/GameButton';
import { parseJsonWithRepair } from '../../../utils/jsonRepair';
import { 酒馆提示词后处理选项 } from '../../../utils/gameSettings';
import { 规范化酒馆预设, 获取酒馆预设角色ID列表, 获取酒馆预设顺序 } from '../../../utils/tavernPreset';
import { 列出创意工坊模块 } from '../../../services/creativeWorkshop';
import type { 创意工坊模块条目 } from '../../../data/creativeWorkshopModules';

interface Props {
    settings: 游戏设置结构;
    onSave: (settings: 游戏设置结构) => void;
    /** 可选的接口配置，用于"应用预设参数"按钮 */
    apiConfig?: 接口设置结构;
    onSaveApi?: (config: 接口设置结构) => void;
}

const 生成预设ID = (): string => `preset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const 解析角色ID = (preset: 酒馆预设结构 | null | undefined, value: unknown): number | null => {
    if (!preset) return null;
    const parsed = typeof value === 'number' && Number.isFinite(value)
        ? Math.floor(value)
        : (typeof value === 'string' && value.trim() ? Math.floor(Number(value)) : null);
    if (typeof parsed === 'number' && Number.isFinite(parsed)) {
        return 获取酒馆预设顺序(preset, parsed)?.character_id ?? null;
    }
    return 获取酒馆预设顺序(preset, null)?.character_id ?? null;
};

const TavernPresetSettings: React.FC<Props> = ({ settings, onSave, apiConfig, onSaveApi }) => {
    const [form, setForm] = useState<游戏设置结构>(settings);
    const [showOnlyEnabled, setShowOnlyEnabled] = useState(false);
    const [expandedItemKey, setExpandedItemKey] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const [dirty, setDirty] = useState(false);
    const [workshopTavernEntries, setWorkshopTavernEntries] = useState<创意工坊模块条目[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        setForm(settings);
        setDirty(false);
        setExpandedItemKey(null);
    }, [settings]);

    useEffect(() => {
        let cancelled = false;
        void 列出创意工坊模块()
            .then((entries) => {
                if (cancelled) return;
                setWorkshopTavernEntries(entries.filter((entry) => entry.type === 'tavern_preset'));
            })
            .catch(() => {
                if (!cancelled) setWorkshopTavernEntries([]);
            });
        return () => { cancelled = true; };
    }, []);

    const presetList = useMemo(() => (
        Array.isArray(form.酒馆预设列表) ? form.酒馆预设列表 : []
    ), [form.酒馆预设列表]);
    const workshopPresetOptions = useMemo(() => (
        workshopTavernEntries.map((entry) => ({
            key: `workshop:${entry.source || 'builtin'}:${entry.id}`,
            entry,
            label: `${entry.title} · ${entry.source === 'local' ? '玩家自行上传' : '创意工坊'}`
        }))
    ), [workshopTavernEntries]);
    const selectedPresetId = useMemo(() => {
        const rawId = typeof form.当前酒馆预设ID === 'string' ? form.当前酒馆预设ID.trim() : '';
        if (rawId && presetList.some((item) => item.id === rawId)) return rawId;
        return presetList[0]?.id || null;
    }, [form.当前酒馆预设ID, presetList]);
    const selectedEntry = useMemo(() => (
        presetList.find((item) => item.id === selectedPresetId) || null
    ), [presetList, selectedPresetId]);
    const preset = selectedEntry?.预设 || form.酒馆预设 || null;
    const characterIds = useMemo(() => 获取酒馆预设角色ID列表(preset), [preset]);
    const selectedCharacterId = useMemo(() => {
        const candidate = form.酒馆预设角色ID ?? selectedEntry?.角色ID ?? null;
        return 解析角色ID(preset, candidate);
    }, [form.酒馆预设角色ID, selectedEntry?.角色ID, preset]);
    const selectedOrder = useMemo(() => 获取酒馆预设顺序(preset, selectedCharacterId), [preset, selectedCharacterId]);
    const promptMap = useMemo(() => {
        const map = new Map<string, any>();
        (Array.isArray(preset?.prompts) ? preset!.prompts : []).forEach((item: any) => {
            if (!item?.identifier) return;
            if (!map.has(item.identifier)) map.set(item.identifier, item);
        });
        return map;
    }, [preset]);
    const shownOrder = useMemo(() => {
        const order = Array.isArray(selectedOrder?.order) ? selectedOrder!.order : [];
        const indexed = order.map((item, orderIndex) => ({ item, orderIndex }));
        if (!showOnlyEnabled) return indexed;
        return indexed.filter((entry) => entry.item.enabled === true);
    }, [selectedOrder, showOnlyEnabled]);

    useEffect(() => {
        setExpandedItemKey(null);
    }, [selectedPresetId, selectedCharacterId, showOnlyEnabled]);

    const 应用配置 = (nextConfig: 游戏设置结构, options?: { autoSave?: boolean; tip?: string }) => {
        setForm(nextConfig);
        if (options?.autoSave) {
            onSave(nextConfig);
            setDirty(false);
        } else {
            setDirty(true);
        }
        if (options?.tip) setMessage(options.tip);
    };

    const 更新当前条目 = (
        patch: Partial<{ 名称: string; 预设: 酒馆预设结构; 角色ID: number | null }>,
        options?: { autoSave?: boolean; tip?: string }
    ) => {
        if (!selectedEntry) return;
        const nextList = presetList.map((entry) => {
            if (entry.id !== selectedEntry.id) return entry;
            const nextPreset = patch.预设 || entry.预设;
            const nextRoleId = patch.角色ID !== undefined ? patch.角色ID : entry.角色ID;
            return {
                ...entry,
                ...(patch.名称 !== undefined ? { 名称: patch.名称 } : {}),
                ...(patch.预设 ? { 预设: patch.预设 } : {}),
                ...(patch.角色ID !== undefined ? { 角色ID: 解析角色ID(nextPreset, nextRoleId) } : {})
            };
        });
        const active = nextList.find((item) => item.id === selectedEntry.id) || null;
        const nextConfig: 游戏设置结构 = {
            ...form,
            酒馆预设列表: nextList,
            当前酒馆预设ID: active?.id || null,
            酒馆预设: active?.预设 || null,
            酒馆预设名称: active?.名称 || '',
            酒馆预设角色ID: 解析角色ID(active?.预设 || null, patch.角色ID ?? form.酒馆预设角色ID ?? active?.角色ID ?? null)
        };
        应用配置(nextConfig, options);
    };

    const 切换预设 = (presetId: string) => {
        const nextEntry = presetList.find((item) => item.id === presetId) || null;
        if (!nextEntry) return;
        const nextCharacterId = 解析角色ID(nextEntry.预设, nextEntry.角色ID);
        const nextConfig: 游戏设置结构 = {
            ...form,
            当前酒馆预设ID: nextEntry.id,
            酒馆预设: nextEntry.预设,
            酒馆预设名称: nextEntry.名称,
            酒馆预设角色ID: nextCharacterId
        };
        应用配置(nextConfig, { autoSave: true, tip: `已切换到预设：${nextEntry.名称}` });
    };

    const 保存本地改动 = () => {
        onSave(form);
        setDirty(false);
        setMessage('酒馆预设改动已保存。');
    };

    const 修改顺序项启用 = (identifier: string, enabled: boolean) => {
        const currentPreset = selectedEntry?.预设 || null;
        const currentOrder = 获取酒馆预设顺序(currentPreset, selectedCharacterId);
        if (!currentPreset || !currentOrder) return;

        const nextPreset: 酒馆预设结构 = {
            ...currentPreset,
            prompts: [...currentPreset.prompts],
            prompt_order: currentPreset.prompt_order.map((group) => {
                if (group.character_id !== currentOrder.character_id) return group;
                return {
                    ...group,
                    order: group.order.map((item) => (
                        item.identifier === identifier
                            ? { ...item, enabled }
                            : item
                    ))
                };
            })
        };
        更新当前条目({ 预设: nextPreset });
    };

    const 修改提示词字段 = (identifier: string, patch: Partial<{ role: 'system' | 'user' | 'assistant'; content: string }>) => {
        const currentPreset = selectedEntry?.预设 || null;
        if (!currentPreset) return;

        const nextPreset: 酒馆预设结构 = {
            ...currentPreset,
            prompt_order: [...currentPreset.prompt_order],
            prompts: currentPreset.prompts.map((item) => (
                item.identifier === identifier
                    ? {
                        ...item,
                        ...(patch.role ? { role: patch.role } : {}),
                        ...(typeof patch.content === 'string' ? { content: patch.content } : {})
                    }
                    : item
            ))
        };
        更新当前条目({ 预设: nextPreset });
    };

    /** 切换正则脚本的 disabled 状态 */
    const 切换正则脚本启用 = (scriptId: string, disabled: boolean) => {
        const currentPreset = selectedEntry?.预设 || null;
        if (!currentPreset) return;

        // 1. 更新 extensions.regex_scripts 中的原始脚本 disabled 字段
        let nextExtensions = currentPreset.extensions;
        if (nextExtensions) {
            const ext = { ...nextExtensions } as Record<string, unknown>;
            const scripts = (ext as any)?.regex_scripts;
            if (Array.isArray(scripts)) {
                const nextScripts = scripts.map((s: any) => {
                    if (s?.id !== scriptId) return s;
                    return { ...s, disabled };
                });
                ext.regex_scripts = nextScripts;
                nextExtensions = ext;
            }
        }

        // 2. 更新兼容性.已分类脚本列表 中对应脚本的 disabled 字段
        let nextCompat = currentPreset.兼容性;
        if (nextCompat?.已分类脚本列表) {
            nextCompat = {
                ...nextCompat,
                已分类脚本列表: nextCompat.已分类脚本列表.map((entry) => {
                    if (entry.script.id !== scriptId) return entry;
                    return {
                        ...entry,
                        script: { ...entry.script, disabled },
                    };
                }),
            };
        }

        // 3. 更新统计数字
        const allScripts = nextCompat?.已分类脚本列表 || [];
        const disabledCount = allScripts.filter(e => e.script.disabled).length;
        const enabledCount = allScripts.length - disabledCount;

        const nextPreset: 酒馆预设结构 = {
            ...currentPreset,
            ...(nextExtensions ? { extensions: nextExtensions } : {}),
            ...(nextCompat ? { 兼容性: nextCompat } : {}),
        };
        更新当前条目({ 预设: nextPreset });
    };

    const 更新当前条目名称 = (value: string) => {
        const nextName = value.trim();
        if (!selectedEntry || !nextName || nextName === selectedEntry.名称) return;
        更新当前条目({ 名称: nextName }, { autoSave: true, tip: '预设名称已更新。' });
    };

    const 导入预设文件 = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.currentTarget.value = '';
        if (!file) return;

        try {
            const text = await file.text();
            const parsed = parseJsonWithRepair<any>(text);
            if (!parsed.value) {
                throw new Error(parsed.error || 'JSON 解析失败');
            }
            const normalized = 规范化酒馆预设(parsed.value);
            if (!normalized) {
                throw new Error('该文件不是可用的酒馆预设（缺少 prompts / prompt_order）。');
            }

            const nextEntry = {
                id: 生成预设ID(),
                名称: file.name || `酒馆预设_${presetList.length + 1}`,
                预设: normalized,
                角色ID: 解析角色ID(normalized, null),
                导入时间: Date.now(),
                来源: '玩家自行上传' as const
            };
            const nextList = [...presetList, nextEntry];
            const nextConfig: 游戏设置结构 = {
                ...form,
                启用酒馆预设模式: true,
                酒馆预设列表: nextList,
                当前酒馆预设ID: nextEntry.id,
                酒馆预设: nextEntry.预设,
                酒馆预设角色ID: nextEntry.角色ID ?? null,
                酒馆预设名称: nextEntry.名称
            };
            应用配置(nextConfig, {
                autoSave: true,
                tip: `已导入酒馆预设：${nextEntry.名称}${parsed.usedRepair ? '（已自动修复格式）' : ''}`
            });
        } catch (error: any) {
            setMessage(`导入失败：${error?.message || '未知错误'}`);
        }
    };

    const 导出JSON文件 = (filename: string, payload: unknown) => {
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(url);
    };

    const 导出当前预设 = () => {
        if (!preset) {
            setMessage('没有可导出的预设。');
            return;
        }
        const safeName = (selectedEntry?.名称 || 'tavern_preset').replace(/[\\/:*?"<>|]+/g, '_');
        导出JSON文件(`${safeName}.json`, preset);
        setMessage('当前酒馆预设已导出。');
    };

    /** 导出为 SillyTavern Master Export 格式 */
    const 导出MasterExport格式 = () => {
        if (!preset) {
            setMessage('没有可导出的预设。');
            return;
        }
        const safeName = (selectedEntry?.名称 || 'tavern_preset').replace(/[\\/:*?"<>|]+/g, '_');
        const masterExport: Record<string, unknown> = {};

        // 核心预设（prompts + prompt_order + extensions + generationParams）
        const presetCore: Record<string, unknown> = {
            prompts: preset.prompts,
            prompt_order: preset.prompt_order,
        };
        if (preset.extensions) presetCore.extensions = preset.extensions;
        if (preset.generationParams) {
            // 还原为原始字段名
            const gp = preset.generationParams;
            if (gp.temperature !== undefined) presetCore.temperature = gp.temperature;
            if (gp.top_p !== undefined) presetCore.top_p = gp.top_p;
            if (gp.top_k !== undefined) presetCore.top_k = gp.top_k;
            if (gp.frequency_penalty !== undefined) presetCore.frequency_penalty = gp.frequency_penalty;
            if (gp.presence_penalty !== undefined) presetCore.presence_penalty = gp.presence_penalty;
            if (gp.repetition_penalty !== undefined) presetCore.repetition_penalty = gp.repetition_penalty;
            if (gp.max_tokens !== undefined) presetCore.openai_max_tokens = gp.max_tokens;
            if (gp.max_context !== undefined) presetCore.openai_max_context = gp.max_context;
            if (gp.stream !== undefined) presetCore.stream_openai = gp.stream;
            if (gp.assistant_prefill !== undefined) presetCore.assistant_prefill = gp.assistant_prefill;
            if (gp.continue_prefill !== undefined) presetCore.continue_prefill = gp.continue_prefill;
            if (gp.custom_prompt_post_processing !== undefined) presetCore.custom_prompt_post_processing = gp.custom_prompt_post_processing;
        }
        masterExport.preset = presetCore;

        // 子模板
        if (preset.instruct) masterExport.instruct = preset.instruct;
        if (preset.context) masterExport.context = preset.context;
        if (preset.sysprompt) masterExport.sysprompt = preset.sysprompt;
        if (preset.reasoning) masterExport.reasoning = preset.reasoning;

        导出JSON文件(`${safeName}_MasterExport.json`, masterExport);
        setMessage('已导出 Master Export 格式（含 Instruct/Context/Sysprompt/Reasoning 模板）。');
    };

    const 删除当前预设 = () => {
        if (!selectedEntry) return;
        const currentIndex = presetList.findIndex((item) => item.id === selectedEntry.id);
        const nextList = presetList.filter((item) => item.id !== selectedEntry.id);
        if (nextList.length === 0) {
            const nextConfig: 游戏设置结构 = {
                ...form,
                启用酒馆预设模式: false,
                酒馆预设列表: [],
                当前酒馆预设ID: null,
                酒馆预设: null,
                酒馆预设角色ID: null,
                酒馆预设名称: ''
            };
            应用配置(nextConfig, { autoSave: true, tip: '已删除最后一个预设，酒馆预设模式已关闭。' });
            return;
        }

        const fallbackIndex = Math.min(currentIndex, nextList.length - 1);
        const nextEntry = nextList[fallbackIndex];
        const nextConfig: 游戏设置结构 = {
            ...form,
            酒馆预设列表: nextList,
            当前酒馆预设ID: nextEntry.id,
            酒馆预设: nextEntry.预设,
            酒馆预设角色ID: 解析角色ID(nextEntry.预设, nextEntry.角色ID),
            酒馆预设名称: nextEntry.名称
        };
        应用配置(nextConfig, { autoSave: true, tip: `已删除预设，当前切换为：${nextEntry.名称}` });
    };

    const 应用工坊预设 = async (entry: 创意工坊模块条目) => {
        try {
            const rawPreset = entry.tavernPreset || entry.payload?.tavernPreset;
            const normalized = rawPreset
                ? 规范化酒馆预设(rawPreset)
                : typeof entry.payload?.presetPath === 'string'
                    ? await fetch(String(entry.payload.presetPath), { cache: 'no-store' }).then(async (response) => {
                        if (!response.ok) throw new Error(`预设读取失败（HTTP ${response.status}）。`);
                        return 规范化酒馆预设(await response.json());
                    })
                    : null;
            if (!normalized) throw new Error('该创意工坊条目没有可用的酒馆预设 JSON。');
            const sourceLabel = entry.source === 'local' ? '玩家自行上传' : '创意工坊';
            const id = `workshop_${entry.source || 'builtin'}_${entry.id}`;
            const existing = presetList.find((item) => item.id === id);
            const nextEntry = {
                id,
                名称: entry.title,
                预设: normalized,
                角色ID: 解析角色ID(normalized, existing?.角色ID ?? null),
                导入时间: existing?.导入时间 || Date.now(),
                来源: sourceLabel as '创意工坊' | '玩家自行上传',
                工坊模块ID: entry.id,
                工坊来源: entry.source,
                贡献者: entry.contributor || ''
            };
            const nextList = existing
                ? presetList.map((item) => item.id === id ? nextEntry : item)
                : [...presetList, nextEntry];
            const nextConfig: 游戏设置结构 = {
                ...form,
                启用酒馆预设模式: true,
                酒馆预设列表: nextList,
                当前酒馆预设ID: nextEntry.id,
                酒馆预设: nextEntry.预设,
                酒馆预设角色ID: nextEntry.角色ID ?? null,
                酒馆预设名称: nextEntry.名称
            };
            应用配置(nextConfig, {
                autoSave: true,
                tip: existing ? `已刷新并切换到${sourceLabel}预设：${entry.title}` : `已切换到${sourceLabel}预设：${entry.title}`
            });
        } catch (error: any) {
            setMessage(`切换创意工坊预设失败：${error?.message || '未知错误'}`);
        }
    };

    return (
        <div className="space-y-6 text-sm animate-fadeIn">
            <div className="flex justify-between items-center border-b border-wuxia-gold/30 pb-3 mb-6">
                <h3 className="text-wuxia-gold font-serif font-bold text-xl">酒馆预设</h3>
            </div>

            <div className="rounded-md border border-wuxia-gold/20 bg-black/25 p-4 space-y-4">
                <label className="flex items-center justify-between gap-3 text-xs text-gray-300">
                    <span>启用酒馆预设模式</span>
                    <ToggleSwitch
                        checked={form.启用酒馆预设模式 === true}
                        onChange={(next) => {
                            const nextConfig = { ...form, 启用酒馆预设模式: next };
                            应用配置(nextConfig, { autoSave: true });
                        }}
                        ariaLabel="切换酒馆预设模式"
                    />
                </label>

                <div className="flex gap-2 flex-wrap">
                    <GameButton
                        onClick={() => fileInputRef.current?.click()}
                        variant="secondary"
                        className="px-4 py-2 text-xs"
                    >
                        导入酒馆预设
                    </GameButton>
                    <GameButton
                        onClick={导出当前预设}
                        variant="secondary"
                        className="px-4 py-2 text-xs"
                        disabled={!preset}
                    >
                        导出当前预设
                    </GameButton>
                    <GameButton
                        onClick={导出MasterExport格式}
                        variant="secondary"
                        className="px-4 py-2 text-xs"
                        disabled={!preset}
                        title="导出为 SillyTavern Master Export 格式，包含 Instruct/Context/Sysprompt/Reasoning 模板"
                    >
                        Master Export
                    </GameButton>
                    <GameButton
                        onClick={删除当前预设}
                        variant="secondary"
                        className="px-4 py-2 text-xs"
                        disabled={!selectedEntry}
                    >
                        删除当前预设
                    </GameButton>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json,application/json,text/plain"
                        className="hidden"
                        onChange={(e) => { void 导入预设文件(e); }}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-xs text-gray-300">当前预设</label>
                        <select
                            value={selectedPresetId ?? ''}
                            onChange={(e) => {
                                const value = e.target.value;
                                const workshopOption = workshopPresetOptions.find((item) => item.key === value);
                                if (workshopOption) {
                                    void 应用工坊预设(workshopOption.entry);
                                    return;
                                }
                                切换预设(value);
                            }}
                            className="w-full bg-black/50 border border-gray-700 p-2 text-white rounded-md outline-none focus:border-wuxia-gold text-xs"
                        >
                            {presetList.length === 0 && workshopPresetOptions.length === 0 && <option value="">暂无预设</option>}
                            {presetList.map((item, index) => (
                                <option key={item.id} value={item.id}>{index + 1}. [{item.来源 || '玩家自行上传'}] {item.名称}</option>
                            ))}
                            {workshopPresetOptions.length > 0 && (
                                <optgroup label="创意工坊可选预设">
                                    {workshopPresetOptions.map((item) => (
                                        <option key={item.key} value={item.key}>[{item.entry.source === 'local' ? '玩家自行上传' : '创意工坊'}] {item.entry.title}{item.entry.contributor ? ` · ${item.entry.contributor}` : ''}</option>
                                    ))}
                                </optgroup>
                            )}
                        </select>
                        <div className="text-[11px] text-gray-500">
                            选择创意工坊条目会自动应用到当前酒馆预设；玩家本地上传与工坊来源会分别标注。
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs text-gray-300">预设名称</label>
                        <input
                            defaultValue={selectedEntry?.名称 || ''}
                            key={selectedEntry?.id || 'no-preset'}
                            onBlur={(e) => 更新当前条目名称(e.currentTarget.value)}
                            className="w-full bg-black/50 border border-gray-700 p-2 text-white rounded-md outline-none focus:border-wuxia-gold text-xs"
                            placeholder="输入预设名称后失焦保存"
                            disabled={!selectedEntry}
                        />
                    </div>
                </div>

                {characterIds.length > 0 && (
                    <div className="space-y-1">
                        <label className="text-xs text-gray-300">预设角色槽位</label>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] text-gray-500">当前</span>
                            <select
                                value={selectedCharacterId ?? ''}
                                onChange={(e) => {
                                    const parsed = Number(e.target.value);
                                    const nextCharacterId = Number.isFinite(parsed) ? Math.floor(parsed) : null;
                                    更新当前条目(
                                        { 角色ID: nextCharacterId },
                                        { autoSave: true, tip: '角色槽位已切换。' }
                                    );
                                }}
                                className="w-28 bg-black/50 border border-gray-700 px-2 py-1.5 text-white rounded-md outline-none focus:border-wuxia-gold text-xs"
                            >
                                {characterIds.map((id) => (
                                    <option key={id} value={id}>{id}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-xs text-gray-300">角色卡角色描述（用于 {'{{char}}'} / &lt;charname&gt;）</label>
                    <textarea
                        value={typeof form.酒馆角色卡描述 === 'string' ? form.酒馆角色卡描述 : ''}
                        onChange={(e) => {
                            const nextValue = e.target.value;
                            setForm((prev) => ({ ...prev, 酒馆角色卡描述: nextValue }));
                            setDirty(true);
                        }}
                        onBlur={(e) => {
                            const nextConfig: 游戏设置结构 = {
                                ...form,
                                酒馆角色卡描述: e.currentTarget.value
                            };
                            应用配置(nextConfig, { autoSave: true, tip: '角色卡角色描述已保存。' });
                        }}
                        className="w-full h-20 bg-black/50 border border-gray-700 p-2 text-white rounded-md outline-none focus:border-wuxia-gold text-xs leading-relaxed resize-y custom-scrollbar"
                        placeholder="默认留空"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-xs text-gray-300">提示词后处理方式</label>
                    <select
                        value={form.酒馆提示词后处理 || '未选择'}
                        onChange={(e) => {
                            const nextValue = e.target.value as NonNullable<游戏设置结构['酒馆提示词后处理']>;
                            const nextConfig: 游戏设置结构 = {
                                ...form,
                                酒馆提示词后处理: nextValue
                            };
                            应用配置(nextConfig, {
                                autoSave: true,
                                tip: `已切换酒馆提示词后处理：${nextValue}`
                            });
                        }}
                        className="w-full bg-black/50 border border-gray-700 p-2 text-white rounded-md outline-none focus:border-wuxia-gold text-xs"
                    >
                        {酒馆提示词后处理选项.map((item) => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                    </select>
                    <div className="text-[11px] text-gray-500">
                        {(酒馆提示词后处理选项.find((item) => item.value === (form.酒馆提示词后处理 || '未选择'))?.description) || '保持默认处理。'}
                    </div>
                </div>

                {message && <div className="text-xs text-wuxia-cyan">{message}</div>}
            </div>

            {preset?.兼容性 && (
                <div className="rounded-md border border-wuxia-cyan/25 bg-wuxia-cyan/5 p-3 space-y-2">
                    <div className="text-xs font-bold text-wuxia-cyan">酒馆预设兼容状态</div>
                    <div className="grid grid-cols-2 md:grid-cols-7 gap-2 text-[11px] text-gray-300">
	                        <div className="rounded border border-gray-700/70 bg-black/30 p-2">
	                            <div className="text-gray-500">正则脚本</div>
	                            <div className="text-wuxia-gold font-bold">{preset.兼容性.正则脚本总数}</div>
	                        </div>
	                        <div className="rounded border border-gray-700/70 bg-black/30 p-2">
	                            <div className="text-gray-500">✅ 安全清理</div>
	                            <div className="text-sky-300 font-bold">{preset.兼容性.安全清理脚本数}</div>
	                        </div>
	                        <div className="rounded border border-gray-700/70 bg-black/30 p-2">
	                            <div className="text-gray-500">🔘 选项渲染</div>
	                            <div className="text-emerald-300 font-bold">{preset.兼容性.选项渲染脚本数}</div>
	                        </div>
	                        <div className="rounded border border-gray-700/70 bg-black/30 p-2">
	                            <div className="text-gray-500">🎨 HTML美化</div>
	                            <div className="text-purple-300 font-bold">{preset.兼容性.HTML美化脚本数 ?? 0}</div>
	                        </div>
	                        <div className="rounded border border-gray-700/70 bg-black/30 p-2">
	                            <div className="text-gray-500">🔗 JS交互</div>
	                            <div className="text-amber-300 font-bold">{preset.兼容性.JS交互脚本数 ?? preset.兼容性.危险跳过脚本数 ?? 0}</div>
	                        </div>
	                        <div className="rounded border border-gray-700/70 bg-black/30 p-2">
	                            <div className="text-gray-500">⚠️ 仍跳过</div>
	                            <div className="text-red-300 font-bold">{preset.兼容性.仍跳过脚本数 ?? 0}</div>
	                        </div>
	                        <div className="rounded border border-gray-700/70 bg-black/30 p-2">
	                            <div className="text-gray-500">📋 仅元数据</div>
	                            <div className="text-gray-300 font-bold">{preset.兼容性.仅保留元数据脚本数}</div>
	                        </div>
	                    </div>

                    {preset.兼容性.已分类脚本列表 && preset.兼容性.已分类脚本列表.length > 0 && (
                        <details className="mt-2">
                            <summary className="text-[11px] text-gray-400 cursor-pointer hover:text-gray-200 transition-colors">
                                查看正则脚本详情（{preset.兼容性.已分类脚本列表.length} 个）
                            </summary>
                            <div className="mt-2 space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar">
                                {preset.兼容性.已分类脚本列表.map((entry, idx) => {
                                    const safetyColorMap: Record<string, string> = {
                                        '安全清理': 'text-sky-300',
                                        '选项渲染': 'text-emerald-300',
                                        'HTML美化': 'text-purple-300',
                                        'JS交互': 'text-amber-300',
                                        '仍跳过': 'text-red-300',
                                    };
                                    const safetyIconMap: Record<string, string> = {
                                        '安全清理': '✅',
                                        '选项渲染': '🔘',
                                        'HTML美化': '🎨',
                                        'JS交互': '🔗',
                                        '仍跳过': '⚠️',
                                    };
                                    const color = safetyColorMap[entry.safetyType] || 'text-gray-400';
                                    const icon = safetyIconMap[entry.safetyType] || '📋';
                                    const placements = (entry.script.placement || [])
                                        .map((p: number) => {
                                            const names: Record<number, string> = { 1: '用户输入', 2: 'AI输出', 3: '斜杠命令', 5: '世界书', 6: '推理' };
                                            return names[p] || p;
                                        })
                                        .join(', ');
                                    const statusText = entry.executionStatus || '';
                                    const statusColorMap: Record<string, string> = {
                                        '已安全执行': 'text-sky-400',
                                        '已适配为选项按钮': 'text-emerald-400',
                                        'HTML美化已执行': 'text-purple-400',
                                        'iframe沙箱已渲染': 'text-amber-400',
                                        '已跳过': 'text-red-400',
                                    };
                                    const statusColor = statusColorMap[statusText] || 'text-gray-500';
                                    return (
                                        <div key={entry.script.id || idx} className="flex items-center gap-2 text-[10px] text-gray-400 py-0.5 group">
                                            <button
                                                type="button"
                                                onClick={() => 切换正则脚本启用(entry.script.id, !entry.script.disabled)}
                                                className={`flex-shrink-0 w-4 h-4 rounded border transition-colors ${
                                                    entry.script.disabled
                                                        ? 'border-gray-600 bg-black/30 text-gray-600'
                                                        : 'border-sky-500/60 bg-sky-500/20 text-sky-400'
                                                }`}
                                                title={entry.script.disabled ? '点击启用该脚本' : '点击禁用该脚本'}
                                                aria-label={`切换 ${entry.script.scriptName} 启用状态`}
                                            >
                                                {!entry.script.disabled && (
                                                    <svg viewBox="0 0 16 16" className="w-3 h-3 mx-auto" fill="currentColor">
                                                        <path d="M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2.5-2.5a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z"/>
                                                    </svg>
                                                )}
                                            </button>
                                            <span>{icon}</span>
                                            <span className={`truncate max-w-[140px] ${color}`} title={entry.script.scriptName}>
                                                {entry.script.scriptName}
                                            </span>
                                            <span className="text-gray-600 flex-shrink-0">
                                                [{placements || '无placement'}]
                                            </span>
                                            <span className={`${statusColor} flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity`}>
                                                {statusText}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </details>
                    )}

                    <div className="space-y-1">
                        {preset.兼容性.说明.map((item, index) => (
                            <div key={index} className="text-[11px] text-gray-400 leading-relaxed">
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {preset?.generationParams && Object.keys(preset.generationParams).length > 0 && (
                <div className="rounded-md border border-wuxia-gold/20 bg-wuxia-gold/5 p-3 space-y-2">
                    <div className="text-xs font-bold text-wuxia-gold">预设生成参数建议</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-gray-300">
                        {preset.generationParams.temperature !== undefined && (
                            <div className="rounded border border-gray-700/70 bg-black/30 p-2">
                                <div className="text-gray-500">Temperature</div>
                                <div className="text-white font-bold">{preset.generationParams.temperature}</div>
                            </div>
                        )}
                        {preset.generationParams.top_p !== undefined && (
                            <div className="rounded border border-gray-700/70 bg-black/30 p-2">
                                <div className="text-gray-500">Top P</div>
                                <div className="text-white font-bold">{preset.generationParams.top_p}</div>
                            </div>
                        )}
                        {preset.generationParams.frequency_penalty !== undefined && (
                            <div className="rounded border border-gray-700/70 bg-black/30 p-2">
                                <div className="text-gray-500">Freq Penalty</div>
                                <div className="text-white font-bold">{preset.generationParams.frequency_penalty}</div>
                            </div>
                        )}
                        {preset.generationParams.presence_penalty !== undefined && (
                            <div className="rounded border border-gray-700/70 bg-black/30 p-2">
                                <div className="text-gray-500">Pres Penalty</div>
                                <div className="text-white font-bold">{preset.generationParams.presence_penalty}</div>
                            </div>
                        )}
                        {preset.generationParams.max_tokens !== undefined && (
                            <div className="rounded border border-gray-700/70 bg-black/30 p-2">
                                <div className="text-gray-500">Max Tokens</div>
                                <div className="text-white font-bold">{preset.generationParams.max_tokens}</div>
                            </div>
                        )}
                        {preset.generationParams.max_context !== undefined && (
                            <div className="rounded border border-gray-700/70 bg-black/30 p-2">
                                <div className="text-gray-500">Max Context</div>
                                <div className="text-white font-bold">{preset.generationParams.max_context}</div>
                            </div>
                        )}
                        {preset.generationParams.assistant_prefill && (
                            <details className="col-span-2 md:col-span-4">
                                <summary className="text-[11px] text-gray-400 cursor-pointer hover:text-gray-200">
                                    Assistant Prefill
                                </summary>
                                <div className="mt-1 text-[11px] text-gray-300 bg-black/30 rounded p-2 whitespace-pre-wrap break-all max-h-20 overflow-y-auto custom-scrollbar">
                                    {preset.generationParams.assistant_prefill}
                                </div>
                            </details>
                        )}
                    </div>
                    <div className="text-[11px] text-gray-500">
                        💡 这些参数为预设作者的建议值，可一键应用到当前接口配置。
                    </div>
                    {apiConfig && onSaveApi && preset.generationParams && (
                        <GameButton
                            onClick={() => {
                                const gp = preset.generationParams!;
                                const activeId = apiConfig.activeConfigId;
                                const updatedConfigs = apiConfig.configs.map((cfg) => {
                                    if (cfg.id !== activeId) return cfg;
                                    return {
                                        ...cfg,
                                        ...(gp.temperature !== undefined ? { temperature: gp.temperature } : {}),
                                        ...(gp.top_p !== undefined ? { topP: gp.top_p } : {}),
                                        ...(gp.max_tokens !== undefined ? { maxTokens: gp.max_tokens } : {}),
                                    };
                                });
                                onSaveApi({ ...apiConfig, configs: updatedConfigs });
                                setMessage('✅ 预设参数已应用到当前接口（Temperature/Top P/Max Tokens）。');
                            }}
                            variant="secondary"
                            className="px-4 py-2 text-xs"
                        >
                            应用预设参数到当前接口
                        </GameButton>
                    )}
                    {(!apiConfig || !onSaveApi) && (
                        <div className="text-[11px] text-gray-500">
                            ⚙️ 请在 API 设置中手动配置对应参数。
                        </div>
                    )}
                </div>
            )}

            {(preset?.instruct || preset?.context || preset?.sysprompt || preset?.reasoning) && (
                <div className="rounded-md border border-wuxia-gold/20 bg-wuxia-gold/5 p-3 space-y-2">
                    <div className="text-xs font-bold text-wuxia-gold">附加模板</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-gray-300">
                        {preset.instruct && (
                            <div className="rounded border border-gray-700/70 bg-black/30 p-2">
                                <div className="text-gray-500">Instruct 模板</div>
                                <div className="text-white font-bold">{preset.instruct.name}</div>
                            </div>
                        )}
                        {preset.context && (
                            <div className="rounded border border-gray-700/70 bg-black/30 p-2">
                                <div className="text-gray-500">Context 模板</div>
                                <div className="text-white font-bold">{preset.context.name}</div>
                            </div>
                        )}
                        {preset.sysprompt && (
                            <div className="rounded border border-gray-700/70 bg-black/30 p-2">
                                <div className="text-gray-500">System Prompt</div>
                                <div className="text-white font-bold">{preset.sysprompt.name}</div>
                            </div>
                        )}
                        {preset.reasoning && (
                            <div className="rounded border border-gray-700/70 bg-black/30 p-2">
                                <div className="text-gray-500">Reasoning</div>
                                <div className="text-white font-bold">{preset.reasoning.name}</div>
                            </div>
                        )}
                    </div>

                    {/* Instruct 序列详情 */}
                    {preset.instruct && (
                        <details className="mt-1">
                            <summary className="text-[11px] text-gray-400 cursor-pointer hover:text-gray-200 transition-colors">
                                Instruct 序列详情
                            </summary>
                            <div className="mt-1 grid grid-cols-2 md:grid-cols-3 gap-1.5 text-[10px]">
                                {preset.instruct.input_sequence && (
                                    <div className="bg-black/30 rounded p-1.5 border border-gray-700/50">
                                        <span className="text-sky-300">input:</span>
                                        <span className="text-gray-300 ml-1">{preset.instruct.input_sequence.length > 30 ? preset.instruct.input_sequence.slice(0, 30) + '…' : preset.instruct.input_sequence}</span>
                                    </div>
                                )}
                                {preset.instruct.output_sequence && (
                                    <div className="bg-black/30 rounded p-1.5 border border-gray-700/50">
                                        <span className="text-emerald-300">output:</span>
                                        <span className="text-gray-300 ml-1">{preset.instruct.output_sequence.length > 30 ? preset.instruct.output_sequence.slice(0, 30) + '…' : preset.instruct.output_sequence}</span>
                                    </div>
                                )}
                                {preset.instruct.system_sequence && (
                                    <div className="bg-black/30 rounded p-1.5 border border-gray-700/50">
                                        <span className="text-amber-300">system:</span>
                                        <span className="text-gray-300 ml-1">{preset.instruct.system_sequence.length > 30 ? preset.instruct.system_sequence.slice(0, 30) + '…' : preset.instruct.system_sequence}</span>
                                    </div>
                                )}
                                <div className="bg-black/30 rounded p-1.5 border border-gray-700/50">
                                    <span className="text-gray-400">names:</span>
                                    <span className="text-gray-300 ml-1">{preset.instruct.names_behavior || 'none'}</span>
                                </div>
                                <div className="bg-black/30 rounded p-1.5 border border-gray-700/50">
                                    <span className="text-gray-400">wrap:</span>
                                    <span className="text-gray-300 ml-1">{preset.instruct.wrap !== false ? '是' : '否'}</span>
                                </div>
                                {preset.instruct.system_same_as_user && (
                                    <div className="bg-black/30 rounded p-1.5 border border-gray-700/50">
                                        <span className="text-gray-400">system同user:</span>
                                        <span className="text-gray-300 ml-1">是</span>
                                    </div>
                                )}
                            </div>
                        </details>
                    )}

                    {/* Reasoning 模板详情 */}
                    {preset.reasoning && (
                        <details className="mt-1">
                            <summary className="text-[11px] text-gray-400 cursor-pointer hover:text-gray-200 transition-colors">
                                Reasoning 格式详情
                            </summary>
                            <div className="mt-1 grid grid-cols-1 md:grid-cols-3 gap-1.5 text-[10px]">
                                {preset.reasoning.prefix && (
                                    <div className="bg-black/30 rounded p-1.5 border border-gray-700/50">
                                        <span className="text-purple-300">prefix:</span>
                                        <span className="text-gray-300 ml-1">{preset.reasoning.prefix.length > 40 ? preset.reasoning.prefix.slice(0, 40) + '…' : preset.reasoning.prefix}</span>
                                    </div>
                                )}
                                {preset.reasoning.suffix && (
                                    <div className="bg-black/30 rounded p-1.5 border border-gray-700/50">
                                        <span className="text-purple-300">suffix:</span>
                                        <span className="text-gray-300 ml-1">{preset.reasoning.suffix.length > 40 ? preset.reasoning.suffix.slice(0, 40) + '…' : preset.reasoning.suffix}</span>
                                    </div>
                                )}
                                {preset.reasoning.separator && (
                                    <div className="bg-black/30 rounded p-1.5 border border-gray-700/50">
                                        <span className="text-purple-300">separator:</span>
                                        <span className="text-gray-300 ml-1">{preset.reasoning.separator.length > 40 ? preset.reasoning.separator.slice(0, 40) + '…' : preset.reasoning.separator}</span>
                                    </div>
                                )}
                            </div>
                        </details>
                    )}

                    <div className="text-[11px] text-gray-500">
                        ✅ 模板已自动集成：Instruct 用序列包装消息，Context 构建故事字符串，Sysprompt 替代主/post-history 系统提示词，Reasoning 解析和格式化思维块。
                    </div>
                </div>
            )}

            {preset && selectedOrder && (
                <div className="rounded-md border border-wuxia-gold/20 bg-black/25 p-4 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="text-xs text-gray-300">
                            当前顺序项：{selectedOrder.order.length}，启用：{selectedOrder.order.filter((item) => item.enabled === true).length}
                        </div>
                        <label className="flex items-center gap-2 text-xs text-gray-300">
                            <span>仅看启用</span>
                            <ToggleSwitch
                                checked={showOnlyEnabled}
                                onChange={setShowOnlyEnabled}
                                ariaLabel="仅看启用项"
                            />
                        </label>
                    </div>

                    <div className="space-y-3 max-h-[52vh] overflow-y-auto custom-scrollbar pr-1">
                        {shownOrder.map(({ item: slot, orderIndex }) => {
                            const prompt = promptMap.get(slot.identifier) as any;
                            const role = prompt?.role === 'user' || prompt?.role === 'assistant' ? prompt.role : 'system';
                            const content = typeof prompt?.content === 'string' ? prompt.content : '';
                            const name = typeof prompt?.name === 'string' ? prompt.name.trim() : '';
                            const displayName = name || `条目 ${orderIndex + 1}`;
                            const isBuiltinWorldOrHistory = slot.identifier === 'worldInfoBefore' || slot.identifier === 'worldInfoAfter' || slot.identifier === 'chatHistory';
                            const itemKey = `${slot.identifier}_${orderIndex}`;
                            const isExpanded = expandedItemKey === itemKey;

                            return (
                                <div key={itemKey} className="rounded-md border border-gray-700/70 bg-black/40 p-3 space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setExpandedItemKey((prev) => (prev === itemKey ? null : itemKey))}
                                            className="min-w-0 flex-1 text-left"
                                        >
                                            <div className="text-xs text-wuxia-cyan truncate">{displayName}</div>
                                            <div className="text-[11px] text-gray-500 truncate">顺序 #{orderIndex + 1}</div>
                                        </button>
                                        <label className="flex items-center gap-2 text-xs text-gray-300">
                                            <span>启用</span>
                                            <ToggleSwitch
                                                checked={slot.enabled === true}
                                                onChange={(next) => 修改顺序项启用(slot.identifier, next)}
                                                ariaLabel={`切换 ${slot.identifier} 启用状态`}
                                            />
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setExpandedItemKey((prev) => (prev === itemKey ? null : itemKey))}
                                            className="text-gray-400 hover:text-wuxia-gold transition-colors"
                                            aria-label={isExpanded ? '收起编辑区' : '展开编辑区'}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.8}
                                                stroke="currentColor"
                                                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                            </svg>
                                        </button>
                                    </div>

                                    {isExpanded && !prompt && (
                                        <div className="text-[11px] text-gray-500">该顺序项未匹配到 prompts 内容，可能是内置占位符。</div>
                                    )}

                                    {isExpanded && prompt && (
                                        <>
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-300">角色</label>
                                                <div className="inline-flex items-center rounded-md border border-gray-700 bg-black/50 p-1 gap-1">
                                                    {(['system', 'user', 'assistant'] as const).map((roleOption) => {
                                                        const active = role === roleOption;
                                                        return (
                                                            <button
                                                                key={roleOption}
                                                                type="button"
                                                                onClick={() => 修改提示词字段(slot.identifier, { role: roleOption })}
                                                                className={`px-2 py-1 rounded text-[11px] leading-none transition-colors ${
                                                                    active
                                                                        ? 'bg-wuxia-gold/20 text-wuxia-gold border border-wuxia-gold/40'
                                                                        : 'text-gray-300 border border-transparent hover:bg-white/5'
                                                                }`}
                                                            >
                                                                {roleOption}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-gray-300">内容</label>
                                                <textarea
                                                    value={content}
                                                    onChange={(e) => 修改提示词字段(slot.identifier, { content: e.target.value })}
                                                    className="w-full h-28 bg-black/50 border border-gray-700 p-2 text-white rounded-md outline-none focus:border-wuxia-gold text-xs leading-relaxed resize-y custom-scrollbar"
                                                />
                                            </div>
                                            {isBuiltinWorldOrHistory && (
                                                <div className="text-[11px] text-amber-300/80">
                                                    该标识在本项目中由运行时注入：worldInfo* 使用世界书内容，chatHistory 使用真实对话历史。
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-2 border-t border-gray-700/60">
                        <GameButton
                            onClick={保存本地改动}
                            variant="primary"
                            className="w-full"
                            disabled={!dirty}
                        >
                            {dirty ? '保存预设改动' : '无未保存改动'}
                        </GameButton>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TavernPresetSettings;

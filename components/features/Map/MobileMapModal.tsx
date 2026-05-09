import React, { useEffect, useMemo, useState } from 'react';
import { 世界数据结构 } from '../../../models/world';
import { 环境信息结构 } from '../../../models/environment';

interface Props {
    world: 世界数据结构;
    env: 环境信息结构;
    socialList?: any[];
    debugEnabled?: boolean;
    onClose: () => void;
}

type MapNode = {
    id: string;
    name: string;
    type: 'current' | 'building' | 'gate';
    x: number;
    y: number;
    description?: string;
    active?: boolean;
};

const 归一化文本 = (value: unknown) => String(value || '').trim().replace(/\s+/g, '').toLowerCase();
const 读取文本 = (value: unknown, fallback = '') => {
    const text = typeof value === 'string' ? value.trim() : '';
    return text || fallback;
};

const 生成散列 = (text: string) => {
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
        hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    }
    return hash;
};

const 解析坐标 = (raw: unknown): { x: number; y: number } | null => {
    if (Array.isArray(raw) && raw.length >= 2) {
        const x = Number(raw[0]);
        const y = Number(raw[1]);
        return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
    }
    if (raw && typeof raw === 'object') {
        const value = raw as any;
        const x = Number(value.x ?? value.X ?? value.横 ?? value.横坐标);
        const y = Number(value.y ?? value.Y ?? value.纵 ?? value.纵坐标);
        return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
    }
    const match = 读取文本(raw).match(/(-?\d+(?:\.\d+)?)\D+(-?\d+(?:\.\d+)?)/);
    if (!match) return null;
    const x = Number(match[1]);
    const y = Number(match[2]);
    return Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
};

const 坐标转百分比 = (raw: unknown, fallbackKey: string, index: number, total: number) => {
    const coord = 解析坐标(raw);
    if (coord) {
        const normalize = (value: number) => {
            if (value >= 0 && value <= 100) return value;
            return Math.max(8, Math.min(92, ((value % 100) + 100) % 100));
        };
        return { x: normalize(coord.x), y: normalize(coord.y) };
    }
    const hash = 生成散列(fallbackKey);
    const angle = total <= 1 ? -Math.PI / 2 : (-Math.PI / 2) + (Math.PI * 2 * index) / total;
    const ring = 28 + (hash % 18);
    return {
        x: Math.max(10, Math.min(90, 50 + Math.cos(angle) * ring + (((hash >> 4) % 13) - 6))),
        y: Math.max(12, Math.min(88, 50 + Math.sin(angle) * ring + (((hash >> 9) % 13) - 6))),
    };
};

const 节点匹配当前地点 = (name: string, env: 环境信息结构) => {
    const key = 归一化文本(name);
    const current = [env?.具体地点, env?.小地点, env?.中地点, env?.大地点].map(归一化文本).filter(Boolean);
    return current.some((item) => item === key || item.includes(key) || key.includes(item));
};

const MobileMapModal: React.FC<Props> = ({ world, env, socialList = [], debugEnabled = false, onClose }) => {
    const maps = Array.isArray(world?.地图) ? world.地图 : [];
    const buildings = Array.isArray(world?.建筑) ? world.建筑 : [];
    const [selectedNodeId, setSelectedNodeId] = useState('current');
    const [showNpcDebug, setShowNpcDebug] = useState(false);

    const 当前层级 = useMemo(() => ({
        大: 归一化文本(env?.大地点),
        中: 归一化文本(env?.中地点),
        小: 归一化文本(env?.小地点),
        具体: 归一化文本(env?.具体地点),
    }), [env?.大地点, env?.中地点, env?.小地点, env?.具体地点]);

    const 默认地图索引 = useMemo(() => {
        const bySmallName = maps.findIndex((m: any) => 归一化文本(m?.名称) === 当前层级.小);
        if (bySmallName >= 0) return bySmallName;
        const byBelong = maps.findIndex((m: any) => (
            归一化文本(m?.归属?.大地点) === 当前层级.大
            && 归一化文本(m?.归属?.中地点) === 当前层级.中
            && 归一化文本(m?.归属?.小地点) === 当前层级.小
        ));
        if (byBelong >= 0) return byBelong;
        const byCurrentPlace = maps.findIndex((m: any) => {
            const key = 归一化文本(m?.名称);
            return Boolean(key && 当前层级.具体 && (当前层级.具体.includes(key) || key.includes(当前层级.具体)));
        });
        return byCurrentPlace >= 0 ? byCurrentPlace : 0;
    }, [maps, 当前层级]);

    const [selectedMapIndex, setSelectedMapIndex] = useState(默认地图索引);
    useEffect(() => {
        setSelectedMapIndex(默认地图索引);
        setSelectedNodeId('current');
    }, [默认地图索引]);

    const 当前地图 = selectedMapIndex >= 0 ? maps[selectedMapIndex] || null : null;
    const 当前地图内部建筑名 = useMemo(() => {
        if (!当前地图 || !Array.isArray(当前地图.内部建筑)) return [];
        return 当前地图.内部建筑.filter((name: any) => typeof name === 'string' && name.trim().length > 0);
    }, [当前地图]);

    const 当前地图建筑列表 = useMemo(() => {
        if (当前地图内部建筑名.length === 0) return [];
        const nameSet = new Set(当前地图内部建筑名.map(归一化文本));
        return buildings.filter((building: any) => nameSet.has(归一化文本(building?.名称)));
    }, [buildings, 当前地图内部建筑名]);

    const 命中建筑列表 = useMemo(() => {
        if (!当前层级.具体) return [];
        return buildings.filter((building: any) => {
            const name = 归一化文本(building?.名称);
            return Boolean(name && (当前层级.具体 === name || 当前层级.具体.includes(name) || name.includes(当前层级.具体)));
        });
    }, [buildings, 当前层级.具体]);

    const mapNodes = useMemo<MapNode[]>(() => {
        const baseName = 读取文本(当前地图?.名称, 读取文本(env?.小地点, '当前位置'));
        const baseNode: MapNode = {
            id: 'current',
            name: 读取文本(env?.具体地点, baseName),
            type: 'current',
            x: 50,
            y: 50,
            description: 读取文本(当前地图?.描述, '此处尚无详细地貌记载。'),
            active: true,
        };
        const sourceNames = 当前地图内部建筑名.length > 0
            ? 当前地图内部建筑名
            : 当前地图建筑列表.map((item: any) => 读取文本(item?.名称)).filter(Boolean);
        const uniqueNames = Array.from(new Set(sourceNames));
        const buildingNodes = uniqueNames.map((name, index) => {
            const building = 当前地图建筑列表.find((item: any) => 归一化文本(item?.名称) === 归一化文本(name));
            const pos = 坐标转百分比(building?.坐标 ?? building?.位置坐标 ?? building?.方位, name, index, uniqueNames.length);
            return {
                id: `building-${name}-${index}`,
                name,
                type: 'building' as const,
                x: pos.x,
                y: pos.y,
                description: 读取文本(building?.描述, '这里已经被地图记录，但尚未补充建筑细节。'),
                active: 节点匹配当前地点(name, env),
            };
        });
        if (buildingNodes.length === 0) {
            return [
                baseNode,
                { id: 'gate-east', name: '东径', type: 'gate', x: 82, y: 48, description: '通向附近区域的道路。' },
                { id: 'gate-west', name: '西径', type: 'gate', x: 18, y: 55, description: '通向附近区域的道路。' },
            ];
        }
        return [baseNode, ...buildingNodes];
    }, [当前地图, 当前地图内部建筑名, 当前地图建筑列表, env]);

    const selectedNode = mapNodes.find((node) => node.id === selectedNodeId) || mapNodes[0];

    const npcDebugRows = useMemo(() => {
        const currentKeys = [env?.具体地点, env?.小地点, env?.中地点, env?.大地点, 当前地图?.名称, ...当前地图内部建筑名].map(归一化文本).filter(Boolean);
        return (Array.isArray(socialList) ? socialList : []).map((npc: any, index: number) => {
            const rawLocationText = [npc?.当前位置, npc?.所在地点, npc?.具体地点, npc?.地点, npc?.位置, npc?.归属?.大地点, npc?.归属?.中地点, npc?.归属?.小地点].map((item) => String(item || '')).filter(Boolean).join(' / ');
            const normalizedLocation = 归一化文本(rawLocationText);
            const hitKeys = currentKeys.filter((key) => normalizedLocation.includes(key) || (normalizedLocation && key.includes(normalizedLocation)));
            const explicitPresent = npc?.是否在场 === true;
            return {
                id: npc?.id || npc?.姓名 || `mobile-npc-debug-${index}`,
                姓名: npc?.姓名 || '未命名',
                rawLocationText,
                explicitPresent,
                hitKeys,
                finalVisible: explicitPresent || hitKeys.length > 0,
            };
        });
    }, [socialList, env, 当前地图, 当前地图内部建筑名]);

    return (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[220] flex items-center justify-center p-2 md:hidden animate-fadeIn">
            <div className="bg-[#0b0907]/95 border border-wuxia-gold/20 w-full h-[90vh] flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.9)] relative overflow-hidden rounded-xl">
                <div className="h-14 shrink-0 border-b border-wuxia-gold/10 bg-black/70 flex items-center justify-between px-4">
                    <div className="min-w-0">
                        <div className="text-wuxia-gold font-serif font-bold text-lg tracking-[0.22em] truncate">江湖平面图</div>
                        <div className="text-[10px] text-[#bba77b] tracking-[0.16em] truncate">{env?.具体地点 || '未知之境'}</div>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-black/50 border border-gray-700 text-gray-300 hover:text-wuxia-red hover:border-wuxia-red transition-all" aria-label="关闭地图">
                        ×
                    </button>
                </div>

                <div className="shrink-0 border-b border-wuxia-gold/10 bg-black/35 px-3 py-2">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {maps.length > 0 ? maps.map((item: any, index: number) => {
                            const active = index === selectedMapIndex;
                            return (
                                <button
                                    key={`${item?.名称 || 'map'}-${index}`}
                                    type="button"
                                    onClick={() => {
                                        setSelectedMapIndex(index);
                                        setSelectedNodeId('current');
                                    }}
                                    className={`shrink-0 max-w-[9rem] rounded-full border px-3 py-2 text-left text-[11px] transition-all ${active ? 'border-wuxia-gold/55 bg-wuxia-gold/12 text-wuxia-gold' : 'border-white/10 bg-black/30 text-gray-400'}`}
                                >
                                    <div className="truncate font-serif">{item?.名称 || `地界 ${index + 1}`}</div>
                                </button>
                            );
                        }) : (
                            <div className="py-2 text-xs text-gray-500">暂无地图</div>
                        )}
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 space-y-3">
                    <section className="rounded-[18px] border border-[#5d4828]/60 bg-[linear-gradient(180deg,rgba(25,20,15,0.92),rgba(8,7,6,0.96))] p-2">
                        <div className="mb-2 rounded-xl border border-[#6e5533]/40 bg-black/25 px-3 py-2">
                            <div className="text-[8px] tracking-[0.25em] text-[#b89b67]/70">当前区域</div>
                            <div className="mt-1 flex items-center justify-between gap-2">
                                <div className="min-w-0 truncate font-serif text-base font-bold text-[#f1deb8]">{当前地图?.名称 || env?.小地点 || '未具名之地'}</div>
                                <div className="shrink-0 rounded-full border border-wuxia-gold/25 bg-wuxia-gold/10 px-2 py-0.5 text-[9px] text-wuxia-gold">
                                    {当前地图?.坐标 || '未标坐标'}
                                </div>
                            </div>
                            <div className="mt-1 text-[10px] text-gray-500 truncate">{env?.大地点 || '未知'} / {env?.中地点 || '未知'} / {env?.小地点 || '未知'}</div>
                        </div>

                        <div className="relative h-[340px] overflow-hidden rounded-2xl border border-wuxia-gold/20 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.12),rgba(0,0,0,0.35)_38%,rgba(0,0,0,0.78))] shadow-inner">
                            <div className="absolute inset-4 rounded-[2rem] border border-dashed border-wuxia-gold/15" />
                            <div className="absolute left-1/2 top-4 h-[calc(100%-2rem)] w-px -translate-x-1/2 bg-wuxia-gold/10" />
                            <div className="absolute left-4 top-1/2 h-px w-[calc(100%-2rem)] -translate-y-1/2 bg-wuxia-gold/10" />
                            <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                {mapNodes.filter((node) => node.id !== 'current').map((node) => (
                                    <line key={`route-${node.id}`} x1="50" y1="50" x2={node.x} y2={node.y} stroke={node.active ? 'rgba(245,208,92,0.65)' : 'rgba(212,175,55,0.18)'} strokeWidth={node.active ? 0.65 : 0.35} strokeDasharray={node.active ? 'none' : '2 2'} />
                                ))}
                            </svg>
                            {mapNodes.map((node) => {
                                const active = node.id === selectedNode?.id;
                                const current = node.type === 'current';
                                return (
                                    <button
                                        key={node.id}
                                        type="button"
                                        onClick={() => setSelectedNodeId(node.id)}
                                        className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all ${current ? 'h-16 w-16 border-wuxia-gold/70 bg-wuxia-gold/18 text-wuxia-gold shadow-[0_0_26px_rgba(212,175,55,0.25)]' : node.active || active ? 'h-14 w-14 border-amber-300/70 bg-amber-500/16 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.22)]' : 'h-12 w-12 border-white/15 bg-black/70 text-gray-300 hover:border-wuxia-gold/45'}`}
                                        style={{ left: `${node.x}%`, top: `${node.y}%` }}
                                        title={node.name}
                                    >
                                        <span className="mx-auto block text-sm">{current ? '◎' : node.type === 'gate' ? '径' : '屋'}</span>
                                        <span className="mx-auto mt-0.5 block max-w-[3.75rem] truncate px-1 text-[9px] leading-tight">{node.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    <section className="rounded-[18px] border border-[#5d4828]/60 bg-black/35 p-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="truncate font-serif text-base font-bold text-wuxia-gold">{selectedNode?.name || 当前地图?.名称 || '未选地点'}</div>
                                <div className="mt-1 text-[10px] tracking-widest text-gray-500">{selectedNode?.type === 'current' ? '当前位置' : selectedNode?.type === 'gate' ? '路径节点' : '建筑节点'}</div>
                            </div>
                            {selectedNode?.active && <span className="shrink-0 rounded-full border border-wuxia-gold/30 bg-wuxia-gold/10 px-2 py-1 text-[10px] text-wuxia-gold">当前命中</span>}
                        </div>
                        <p className="mt-3 text-sm leading-7 text-gray-300">{selectedNode?.description || 当前地图?.描述 || '暂无描述。'}</p>
                    </section>

                    <section className="rounded-[18px] border border-[#5d4828]/60 bg-black/35 p-3">
                        <div className="mb-2 text-[10px] tracking-[0.3em] text-wuxia-gold/70">当前落脚点</div>
                        {命中建筑列表.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {命中建筑列表.map((building: any, index: number) => (
                                    <span key={`${building?.名称 || 'building'}-${index}`} className="rounded-full border border-wuxia-gold/25 bg-wuxia-gold/10 px-2 py-1 text-[10px] text-wuxia-gold">{building?.名称 || '未命名建筑'}</span>
                                ))}
                            </div>
                        ) : (
                            <div className="text-xs leading-6 text-gray-500">当前具体地点没有命中建筑档案，将按区域中心显示。</div>
                        )}
                    </section>

                    {debugEnabled && (
                        <section className="rounded-[18px] border border-sky-400/20 bg-sky-950/10 p-3">
                            <button type="button" onClick={() => setShowNpcDebug((prev) => !prev)} className="w-full rounded-lg border border-sky-400/25 bg-sky-950/20 px-3 py-2 text-xs text-sky-200">
                                {showNpcDebug ? '收起 NPC 调试' : `展开 NPC 调试（${npcDebugRows.filter((row) => row.finalVisible).length}）`}
                            </button>
                            {showNpcDebug && (
                                <div className="mt-3 max-h-48 overflow-y-auto custom-scrollbar space-y-2">
                                    {npcDebugRows.length > 0 ? npcDebugRows.map((row) => (
                                        <div key={row.id} className="rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-[11px] text-gray-300">
                                            <span className="text-gray-100">{row.姓名}</span>
                                            <span className="mx-2 text-gray-600">/</span>
                                            <span className={row.finalVisible ? 'text-emerald-300' : 'text-gray-500'}>{row.finalVisible ? '会显示' : '未命中'}</span>
                                            <span className="ml-2 text-gray-500">{row.rawLocationText || '无位置字段'}</span>
                                        </div>
                                    )) : <div className="py-3 text-center text-xs text-gray-500">暂无 NPC 数据</div>}
                                </div>
                            )}
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MobileMapModal;

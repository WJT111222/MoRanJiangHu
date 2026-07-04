import React from 'react';
import { 接口设置结构 } from '../../../types';
import { OrnateBorder } from '../../ui/decorations/OrnateBorder';
import NovelDecompositionSettings from '../Settings/NovelDecompositionSettings';

interface Props {
    open: boolean;
    settings: 接口设置结构;
    onSave: (settings: 接口设置结构) => void;
    onClose: () => void;
    requestConfirm?: (options: { title?: string; message: string; confirmText?: string; cancelText?: string; danger?: boolean }) => Promise<boolean>;
    onNotify?: (toast: { title: string; message: string; tone?: 'info' | 'success' | 'error' }) => void;
}

const NovelDecompositionWorkbenchModal: React.FC<Props> = ({ open, settings, onSave, onClose, requestConfirm, onNotify }) => {
    if (!open) return null;

    return (
        <div className="novel-decomposition-workbench-backdrop fixed inset-0 z-[320] overflow-hidden">
            <div className="h-[100dvh] w-full flex items-stretch justify-center p-0 md:p-3 overflow-hidden">
                <OrnateBorder className="novel-decomposition-workbench-surface w-full h-full md:h-[calc(100dvh-1.5rem)] md:max-w-[calc(100vw-1.5rem)] flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.9)] p-0 overflow-hidden rounded-none md:rounded-2xl">
                    <div className="novel-decomposition-workbench-surface pointer-events-none absolute inset-0 z-0 rounded-none md:rounded-2xl" />
                    <div className="relative z-10 shrink-0 flex items-center justify-between gap-4 border-b border-wuxia-gold/10 bg-black/40 px-5 py-3">
                        <div>
                            <h2 className="text-lg md:text-xl font-serif font-bold text-wuxia-gold tracking-[0.18em]">小说分解工作台</h2>
                            <div className="mt-1 text-[11px] text-gray-400">这是创意工坊里的“小说分解模块”编辑区；分解完成后可导出分享 ZIP，也可生成标准同人模式包。</div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="shrink-0 rounded-full border border-gray-700 bg-black/50 px-3 py-2 text-xs text-gray-300 hover:border-wuxia-gold/40 hover:text-wuxia-gold"
                        >
                            关闭
                        </button>
                    </div>

                    <div className="novel-decomposition-workbench-surface relative z-10 flex-1 min-h-0 flex flex-col overflow-hidden">
                        <NovelDecompositionSettings settings={settings} onSave={onSave} requestConfirm={requestConfirm} onNotify={onNotify} />
                    </div>
                </OrnateBorder>
            </div>
        </div>
    );
};

export default NovelDecompositionWorkbenchModal;

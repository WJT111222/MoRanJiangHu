// @vitest-environment jsdom
import React from 'react';
import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import VariableManager from '../components/features/Settings/VariableManager';
import VariableReviewModal from '../components/features/Settings/VariableReviewModal';
import * as client from '../services/ai/chatCompletionClient';
import { createReviewRig, reviewOutput, reviewGold } from './helpers/variableReviewFixture';
vi.mock('../services/ai/chatCompletionClient', async importOriginal => ({ ...await importOriginal<typeof import('../services/ai/chatCompletionClient')>(), 请求模型文本: vi.fn() }));
beforeEach(() => { vi.stubGlobal('crypto', webcrypto); vi.mocked(client.请求模型文本).mockReset(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const start = () => fireEvent.click(screen.getByRole('button', { name: '开始变量审查' }));
const apply = () => screen.getByRole('button', { name: '应用修复' }) as HTMLButtonElement;
describe('VariableManager与真实workflow共用的变量审查弹窗', () => {
    it('打开、传递独立备注、展示diff/诊断并确认应用一次', async () => {
        const rig = createReviewRig();
        vi.mocked(client.请求模型文本).mockResolvedValue(reviewOutput([reviewGold]));
        render(<VariableManager runtimeState={rig.source.currentState as any} onReplaceSection={vi.fn()} onApplyCommand={vi.fn()} variableReviewActions={rig.actions} />);
        fireEvent.click(screen.getByRole('button', { name: '变量审查' }));
        expect(screen.getByRole('dialog', { name: '变量审查' })).toBeTruthy();
        fireEvent.change(screen.getByLabelText('本次审查备注（可选）'), { target: { value: '重点看看金钱' } }); start();
        await screen.findByText(/实际变量变化（/);
        expect(screen.getByText('角色.金钱.金币')).toBeTruthy(); expect(apply().disabled).toBe(false);
        const payload = JSON.parse(vi.mocked(client.请求模型文本).mock.calls[0][1][2].content);
        expect(payload.reviewNotes.text).toBe('重点看看金钱'); expect(payload.originalPlayerInput.text).toBe('走进大厅');
        const applyButton = apply(); fireEvent.click(applyButton); fireEvent.click(applyButton);
        await screen.findByText(/变量修复已应用，共修改/);
        expect(rig.commit).toHaveBeenCalledTimes(1); expect(rig.save).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('button', { name: '应用修复' })).toBeNull();
    });
    it('无修改时禁用应用，不能静默变成一次状态写入', async () => {
        const rig = createReviewRig(); vi.mocked(client.请求模型文本).mockResolvedValue(reviewOutput());
        render(<VariableReviewModal actions={rig.actions} onClose={vi.fn()} />); start();
        await screen.findByText('在本次审查范围内，未发现需要修改的变量。'); expect(apply().disabled).toBe(true); expect(rig.commit).not.toHaveBeenCalled();
    });
    it('证据不足显示疑点，不显示已修复', async () => {
        const rig = createReviewRig('林岳买了物品。');
        vi.mocked(client.请求模型文本).mockResolvedValue('<说明>状态：证据不足\n正文提到购买物品，但无法确定实际价格，因此未修改金钱。</说明><命令></命令>');
        render(<VariableReviewModal actions={rig.actions} onClose={vi.fn()} />); start();
        await screen.findByText('存在疑点，但证据不足，未生成修复命令。'); expect(screen.getAllByText(/无法确定实际价格/).length).toBeGreaterThan(0); expect(apply().disabled).toBe(true);
    });
    it('被拒绝命令折叠显示原因，裁剪明确警告', async () => {
        const rig = createReviewRig('林岳拿出钱包。');
        rig.source.currentState.社交 = Array.from({ length: 65 }, (_, i) => ({ id: `NPC${i}`, 姓名: `已有${i}` }));
        vi.mocked(client.请求模型文本).mockResolvedValue(reviewOutput([{ ...reviewGold, value: 999999 }]));
        render(<VariableReviewModal actions={rig.actions} onClose={vi.fn()} />); start();
        await screen.findByText('本次审查未覆盖全部变量数据，结果可能不完整。');
        const summary = screen.getByText(/命令诊断：提出 1/); fireEvent.click(summary);
        expect(screen.getByText(/原因：正文缺少唯一明确/)).toBeTruthy(); expect(screen.getByText('Rejected · 已拦截')).toBeTruthy(); expect(apply().disabled).toBe(true);
    });
    it('状态变化后主动禁用旧预览，重新审查入口可用', async () => {
        const rig = createReviewRig(); vi.mocked(client.请求模型文本).mockResolvedValue(reviewOutput([reviewGold]));
        const rendered = render(<VariableReviewModal actions={rig.actions} revision={1} onClose={vi.fn()} />); start(); await screen.findByText(/实际变量变化（/);
        rig.source.currentState.角色.年龄++;
        rendered.rerender(<VariableReviewModal actions={rig.actions} revision={2} onClose={vi.fn()} />);
        await screen.findByText('预览已过期'); expect(apply().disabled).toBe(true);
        fireEvent.click(screen.getByRole('button', { name: '重新审查' })); expect(screen.getByRole('button', { name: '开始变量审查' })).toBeTruthy(); expect(rig.commit).not.toHaveBeenCalled();
    });
    it('关闭正在审查的弹窗会abort，请求不能继续写入', async () => {
        const rig = createReviewRig(); const close = vi.fn();
        vi.mocked(client.请求模型文本).mockImplementation(() => new Promise(() => {}));
        const rendered = render(<VariableReviewModal actions={rig.actions} onClose={close} />); start();
        await waitFor(() => expect(client.请求模型文本).toHaveBeenCalled());
        fireEvent.click(screen.getByRole('button', { name: '取消' })); rendered.unmount();
        expect(close).toHaveBeenCalledTimes(1); expect(vi.mocked(client.请求模型文本).mock.calls[0][2].signal?.aborted).toBe(true); expect(rig.commit).not.toHaveBeenCalled();
    });
    it('未应用结果关闭不会修改状态', async () => {
        const rig = createReviewRig(); const close = vi.fn(); vi.mocked(client.请求模型文本).mockResolvedValue(reviewOutput([reviewGold]));
        render(<VariableReviewModal actions={rig.actions} onClose={close} />); start(); await screen.findByText(/实际变量变化（/);
        fireEvent.click(screen.getByRole('button', { name: '取消' })); expect(close).toHaveBeenCalled(); expect(rig.commit).not.toHaveBeenCalled();
    });
    it.each([
        ['config', '请先配置变量计算 API。'], ['parse', '响应解析失败'], ['api', 'API 返回错误'], ['truncated', '响应截断']
    ])('错误%s独立显示，不能显示未发现问题', async (kind, message) => {
        const rig = createReviewRig();
        if (kind === 'config') rig.dependencies.apiConfig = { configs: [], 功能模型占位: {} } as any;
        else if (kind === 'parse') vi.mocked(client.请求模型文本).mockResolvedValue('broken');
        else vi.mocked(client.请求模型文本).mockRejectedValue(new Error(kind === 'truncated' ? '响应截断' : 'API Error: 403'));
        render(<VariableReviewModal actions={rig.actions} onClose={vi.fn()} />); start();
        await screen.findAllByText(message); expect(screen.queryByText(/在本次审查范围内，未发现/)).toBeNull(); expect(screen.queryByRole('button', { name: '应用修复' })).toBeNull();
    });
    it('保存失败显示已应用未保存，不能再次应用', async () => {
        const rig = createReviewRig(); rig.save.mockRejectedValue(new Error('磁盘错误'));
        vi.mocked(client.请求模型文本).mockResolvedValue(reviewOutput([reviewGold]));
        render(<VariableReviewModal actions={rig.actions} onClose={vi.fn()} />); start(); await screen.findByText(/实际变量变化（/); fireEvent.click(apply());
        await screen.findByText('保存失败'); expect(screen.getByText(/变量修复已应用，但保存失败/)).toBeTruthy(); expect(screen.queryByRole('button', { name: '应用修复' })).toBeNull();
    });
});

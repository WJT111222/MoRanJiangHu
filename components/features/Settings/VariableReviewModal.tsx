import React from 'react';
import { createPortal } from 'react-dom';
import type { VariableReviewResult } from '../../../hooks/useGame/variableReviewWorkflow';
import { variableReviewErrorMessage, type VariableReviewActions, type VariableReviewProgress } from '../../../hooks/useGame/variableReviewActions';

export interface VariableReviewModalProps { actions: VariableReviewActions; revision?: unknown; onClose: () => void }
const stages: Record<VariableReviewProgress, string> = { prepare: '准备最近回合与变量上下文', generate: 'AI 正在审查正文与变量', validate: '校验修复命令与保护规则', simulate: '模拟执行并计算实际变化' };
const format = (value: unknown): string => value === undefined ? '（不存在）' : typeof value === 'string' ? value : JSON.stringify(value, null, 2);
const Value: React.FC<{ value: unknown }> = ({ value }) => {
    const text = format(value);
    return text.length > 180 || (value !== null && typeof value === 'object')
        ? <details className="variable-review-value"><summary>展开对象 / 长内容</summary><pre>{text}</pre></details>
        : <pre className="variable-review-value">{text}</pre>;
};
const commandText = (cmd: VariableReviewResult['acceptedCommands'][number]) => `${cmd.action} ${cmd.key}${cmd.action === 'delete' ? '' : ` = ${JSON.stringify(cmd.value)}`}`;

const VariableReviewModal: React.FC<VariableReviewModalProps> = ({ actions, revision, onClose }) => {
    const [notes, setNotes] = React.useState('');
    const [phase, setPhase] = React.useState<'input' | 'reviewing' | 'result' | 'applying' | 'applied'>('input');
    const [stage, setStage] = React.useState<VariableReviewProgress>('prepare');
    const [result, setResult] = React.useState<VariableReviewResult | null>(null);
    const [error, setError] = React.useState<ReturnType<typeof variableReviewErrorMessage> | null>(null);
    const [expired, setExpired] = React.useState(false);
    const [success, setSuccess] = React.useState('');
    const busy = React.useRef(false);
    const alive = React.useRef(true);
    const sequence = React.useRef(0);
    const panel = React.useRef<HTMLDivElement>(null);
    const backdrop = React.useRef<HTMLDivElement>(null);
    const actionsRef = React.useRef(actions);
    actionsRef.current = actions;
    const close = () => {
        if (phase === 'applying') return;
        sequence.current++;
        actionsRef.current.cancelVariableReview();
        onClose();
    };
    const closeRef = React.useRef(close);
    closeRef.current = close;
    React.useEffect(() => {
        alive.current = true;
        const previousFocus = document.activeElement as HTMLElement | null;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        panel.current?.querySelector<HTMLTextAreaElement>('textarea')?.focus();
        const viewport = window.visualViewport;
        const resize = () => {
            if (backdrop.current) {
                backdrop.current.style.height = `${viewport?.height || window.innerHeight}px`;
                backdrop.current.style.top = `${viewport?.offsetTop || 0}px`;
                if (document.activeElement?.tagName === 'TEXTAREA' && panel.current?.contains(document.activeElement)) {
                    (document.activeElement as HTMLElement).scrollIntoView?.({ block: 'nearest' });
                }
            }
        };
        resize();
        viewport?.addEventListener('resize', resize);
        viewport?.addEventListener('scroll', resize);
        const keydown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeRef.current(); }
            if (event.key === 'Tab') {
                const nodes = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), textarea, summary, [tabindex="0"]') || []).filter(node => node.getClientRects().length > 0);
                const first = nodes[0], last = nodes[nodes.length - 1];
                if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
                else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
            }
        };
        document.addEventListener('keydown', keydown, true);
        return () => {
            alive.current = false;
            sequence.current++;
            actionsRef.current.cancelVariableReview();
            viewport?.removeEventListener('resize', resize);
            viewport?.removeEventListener('scroll', resize);
            document.removeEventListener('keydown', keydown, true);
            document.body.style.overflow = previousOverflow;
            previousFocus?.focus();
        };
    }, []);
    React.useEffect(() => {
        if (!result || phase !== 'result' || busy.current || expired) return;
        let cancelled = false;
        actions.checkVariableReviewCurrent(result).catch(cause => {
            if (!cancelled && !busy.current && alive.current) { setExpired(true); setError(variableReviewErrorMessage(cause)); }
        });
        return () => { cancelled = true; };
    }, [actions, revision, result, phase, expired]);
    const start = async () => {
        if (busy.current) return;
        busy.current = true;
        const request = ++sequence.current;
        setError(null); setSuccess(''); setResult(null); setExpired(false); setPhase('reviewing'); setStage('prepare');
        try {
            const next = await actions.reviewVariables({ reviewNotes: notes, onProgress: nextStage => { if (alive.current && sequence.current === request) setStage(nextStage); } });
            if (alive.current && sequence.current === request) { setResult(next); setPhase('result'); }
        } catch (cause) {
            if (alive.current && sequence.current === request) { setError(variableReviewErrorMessage(cause)); setPhase('input'); }
        } finally { if (sequence.current === request) busy.current = false; }
    };
    const apply = async () => {
        if (busy.current || !result || expired || !result.changes.length || !result.acceptedCommands.length || phase !== 'result') return;
        busy.current = true;
        const request = ++sequence.current;
        setPhase('applying'); setError(null);
        try {
            const applied = await actions.applyVariableReview(result);
            if (alive.current && sequence.current === request) { setSuccess(`变量修复已应用，共修改 ${applied.changesCount} 项。`); setPhase('applied'); }
        } catch (cause) {
            if (alive.current && sequence.current === request) {
                const detail = variableReviewErrorMessage(cause);
                setError(detail); setExpired(detail.code === 'stale'); setPhase(detail.applied ? 'applied' : 'result');
            }
        } finally { if (sequence.current === request) busy.current = false; }
    };
    const reset = () => { setResult(null); setError(null); setExpired(false); setSuccess(''); setPhase('input'); };
    const canApply = phase === 'result' && !expired && !!result?.changes.length && !!result?.acceptedCommands.length;
    return createPortal(
        <div className="variable-review-backdrop" ref={backdrop} onClick={event => { if (event.target === event.currentTarget) close(); }}>
            <div className="variable-review-modal" role="dialog" aria-modal="true" aria-labelledby="variable-review-title" ref={panel}>
                <header className="variable-review-header"><h2 id="variable-review-title">变量审查</h2><button type="button" className="variable-review-secondary" onClick={close} disabled={phase === 'applying'} aria-label="关闭变量审查">×</button></header>
                <div className="variable-review-body">
                    {error && <div role="alert" className="variable-review-error"><strong>{({ apiConfig: '未配置 API', request: '请求失败', api: 'API 返回错误', truncated: '响应截断', parse: '响应解析失败', stale: '预览已过期', applyValidation: '应用重新校验失败', saveFailed: '保存失败', consumed: '结果已消费', busy: '操作进行中', cancelled: '已取消' } as const)[error.code]}</strong><p>{error.message}</p></div>}
                    {success && <div role="status" className="variable-review-success">{success}</div>}
                    {phase === 'input' && <>
                        <p>AI 会根据最近完成回合的正文与当前变量检查遗漏和不一致。备注仅用于指定审查重点，不会被当作已经发生的事实。</p>
                        <p className="variable-review-muted">本次审查范围：最近完成回合正文 + 当前主要变量状态。包括角色、环境、世界、社交、战斗、门派、任务和约定；不包含整章历史、图片或缓存。数据过多时会明确提示裁剪。</p>
                        <label className="variable-review-label" htmlFor="variable-review-notes">玩家备注（可选）</label>
                        <textarea id="variable-review-notes" rows={4} value={notes} onChange={event => setNotes(event.target.value)} placeholder="例如：重点检查装备，或检查正文中新出现但未记录的 NPC。" />
                    </>}
                    {(phase === 'reviewing' || phase === 'applying') && <div className="variable-review-loading" role="status" aria-live="polite"><span className="animate-pulse">{phase === 'applying' ? '应用中：重新校验、写入并保存…' : `审查中：${stages[stage]}…`}</span><p>确认应用前不会修改真实变量。</p></div>}
                    {result && <>
                        <div className={result.coverage.truncated ? 'variable-review-warning' : 'variable-review-muted'}>{result.coverage.truncated ? '本次审查未覆盖全部变量数据，结果可能不完整。' : '本次审查范围：最近完成回合正文 + 当前主要变量状态'}
                            {!!result.coverage.warnings.length && <details><summary>查看范围说明</summary><ul>{result.coverage.warnings.map((warning, i) => <li key={i}>{warning}</li>)}</ul></details>}
                        </div>
                        <section><h3>审查摘要</h3><p className="variable-review-wrap">{result.summary}</p>
                            {!result.changes.length && <p>{result.status === 'noChanges' ? '在本次审查范围内，未发现需要修改的变量。' : result.status === 'insufficientEvidence' ? '存在疑点，但证据不足，未生成修复命令。' : '没有可应用的合法变化；建议已被保护规则拦截，未修复变量。'}</p>}
                        </section>
                        <section><h3>实际变量变化（{result.changes.length} 项）</h3><p className="variable-review-muted">以下为程序模拟执行后的差异，应用前仍会重新校验。</p>
                            {result.changes.map((change, i) => <article className="variable-review-change" key={i}><strong className="variable-review-wrap">{change.path}</strong>
                                <p>{change.before === undefined ? `＋ 新增${(change.after as any)?.姓名 ? `：${(change.after as any).姓名}` : ''}` : change.after === undefined ? '－ 删除' : '修改'}</p>
                                <Value value={change.before} /><div aria-label="变更为">→</div><Value value={change.after} />
                            </article>)}
                        </section>
                        <section><h3>疑点与说明</h3><p className="variable-review-muted">这些说明不代表已经修复，实际应用内容以变量变化为准。</p><ul>{result.issues.filter(issue => !/^状态[：:]/.test(issue.description)).map((issue, i) => <li className="variable-review-wrap" key={i}>{issue.description}</li>)}</ul></section>
                        <details className="variable-review-diagnostics"><summary>命令诊断：提出 {result.proposedCommands.length} / Accepted {result.acceptedCommands.length} / Rejected {result.rejectedCommands.length}</summary>
                            <h4>AI 提出的命令</h4>{result.proposedCommands.map((cmd, i) => <pre key={i}>{commandText(cmd)}</pre>)}
                            <h4>Accepted · 已接受</h4>{result.acceptedCommands.map((cmd, i) => <pre key={i}>✓ {commandText(cmd)}</pre>)}
                            <h4>Rejected · 已拦截</h4>{result.rejectedCommands.map((item, i) => <div key={i}><pre>✗ {commandText(item.command)}</pre><p className="variable-review-wrap">原因：{item.reason}</p></div>)}
                        </details>
                    </>}
                </div>
                <footer className="variable-review-footer">
                    <button type="button" className="variable-review-secondary" onClick={close} disabled={phase === 'applying'}>{phase === 'applied' ? '关闭' : '取消'}</button>
                    {phase === 'input' && <button type="button" className="variable-review-primary" onClick={start}>开始审查</button>}
                    {phase === 'reviewing' && <span>等待 AI 返回…</span>}
                    {result && phase !== 'reviewing' && <>
                        {phase !== 'applying' && <button type="button" className="variable-review-secondary" onClick={reset}>{expired ? '重新审查' : '再次审查'}</button>}
                        {phase !== 'applied' && <button type="button" className="variable-review-primary" disabled={!canApply} onClick={apply}>{phase === 'applying' ? '应用中…' : '应用修复'}</button>}
                    </>}
                </footer>
            </div>
        </div>, document.body
    );
};
export default VariableReviewModal;

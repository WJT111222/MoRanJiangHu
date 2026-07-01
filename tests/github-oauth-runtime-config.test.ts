import { describe, expect, it } from 'vitest';
import { onRequestGet } from '../functions/api/auth/github-config';

describe('GitHub OAuth 运行时公开配置', () => {
    it('从 Worker env 暴露网页端 OAuth Client ID 供前端兜底读取', async () => {
        const response = await onRequestGet({
            env: {
                GITHUB_CLIENT_ID: 'primary-client',
                GITHUB_BACKUP_CLIENT_ID: 'backup-client',
                GITHUB_CLIENT_SECRET: 'secret-value'
            }
        });

        expect(response.status).toBe(200);
        const payload = await response.json();
        expect(payload).toEqual({
            githubClientId: 'primary-client',
            githubBackupClientId: 'backup-client'
        });
        expect(JSON.stringify(payload)).not.toContain('secret-value');
    });

    it('缺少 Worker env 时返回空公开配置', async () => {
        const response = await onRequestGet({ env: {} });

        expect(response.status).toBe(200);
        await expect(response.json()).resolves.toEqual({
            githubClientId: '',
            githubBackupClientId: ''
        });
    });
});

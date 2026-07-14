import { describe, expect, it } from 'vitest';
import { 获取代理决策, 构建OpenAI图片生成端点 } from '../services/ai/imageGenerationDiagnostics';

describe('Simplified image proxy decision - user control first', () => {
    it('should force direct connection for 127.0.0.1 targets (cannot be proxied)', () => {
        const decision = 获取代理决策(
            'http://127.0.0.1:8888/v1',
            'openai-custom',
            { 图片需要代理: true } // Even when user enables proxy
        );
        
        expect(decision.走代理).toBe(false);
        expect(decision.原因).toContain('localhost');
    });

    it('should force direct connection for localhost targets (cannot be proxied)', () => {
        const decision = 获取代理决策(
            'http://localhost:8888/v1',
            'openai-custom',
            { 图片需要代理: true } // Even when user enables proxy
        );
        
        expect(decision.走代理).toBe(false);
        expect(decision.原因).toContain('localhost');
    });

    it('should force direct connection for private network targets (192.168.x.x)', () => {
        const decision = 获取代理决策(
            'http://192.168.1.100:8888/v1',
            'openai-custom',
            { 图片需要代理: true } // Even when user enables proxy
        );
        
        expect(decision.走代理).toBe(false);
        expect(decision.原因).toContain('localhost');
    });

    it('should use direct connection when user does not enable proxy (default)', () => {
        const decision = 获取代理决策(
            'https://api.openai.com/v1',
            'openai-official',
            { 图片需要代理: false }
        );
        
        expect(decision.走代理).toBe(false);
        expect(decision.原因).toContain('未开启代理');
    });

    it('should use proxy when user explicitly enables proxy', () => {
        const decision = 获取代理决策(
            'https://cdn.moe-atelier.site/v1',
            'openai-custom',
            { 图片需要代理: true }
        );
        
        expect(decision.走代理).toBe(true);
        expect(decision.原因).toContain('用户开启代理');
    });

    it('should use custom proxy address when user provides it', () => {
        const decision = 获取代理决策(
            'https://cdn.moe-atelier.site/v1',
            'openai-custom',
            { 图片需要代理: true, 自定义图片代理地址: 'https://my-proxy.example.com' }
        );
        
        expect(decision.走代理).toBe(true);
        expect(decision.原因).toContain('自定义地址');
    });

    it('should build direct endpoint for localhost', () => {
        const endpoint = 构建OpenAI图片生成端点(
            'http://127.0.0.1:8888/v1',
            '/v1/images/generations',
            { 图片需要代理: false }
        );
        
        expect(endpoint).toBe('http://127.0.0.1:8888/v1/images/generations');
        expect(endpoint).not.toContain('/api/image-backend/openai-image-proxy');
    });

    it('should build direct endpoint when user does not enable proxy', () => {
        const endpoint = 构建OpenAI图片生成端点(
            'https://cdn.moe-atelier.site/v1',
            '/v1/images/generations',
            { 图片需要代理: false }
        );
        
        expect(endpoint).toBe('https://cdn.moe-atelier.site/v1/images/generations');
        expect(endpoint).not.toContain('/api/image-backend/openai-image-proxy');
    });

    it('should build proxied endpoint when user enables proxy', () => {
        const endpoint = 构建OpenAI图片生成端点(
            'https://cdn.moe-atelier.site/v1',
            '/v1/images/generations',
            { 图片需要代理: true }
        );
        
        expect(endpoint).toContain('/api/image-backend/openai-image-proxy');
        expect(endpoint).toContain('url=');
    });
});

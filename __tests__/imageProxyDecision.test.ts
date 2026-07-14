import { describe, expect, it } from 'vitest';
import { 获取代理决策, 构建OpenAI图片生成端点 } from '../services/ai/imageGenerationDiagnostics';

describe('image proxy decision', () => {
    it('forces direct connection for localhost targets even when the protocol is omitted', () => {
        const decision = 获取代理决策(
            '127.0.0.1:8188',
            'openai-custom',
            { 图片需要代理: true }
        );

        expect(decision.走代理).toBe(false);
        expect(decision.原因).toContain('localhost');
    });

    it('forces direct connection for LAN targets even when the protocol is omitted', () => {
        const decision = 获取代理决策(
            '192.168.1.23:7860',
            'openai-custom',
            { 图片需要代理: true }
        );

        expect(decision.走代理).toBe(false);
        expect(decision.原因).toContain('localhost');
    });

    it('keeps direct endpoint building for localhost targets', () => {
        const endpoint = 构建OpenAI图片生成端点(
            '127.0.0.1:8188',
            '/v1/images/generations',
            { 图片需要代理: true }
        );

        expect(endpoint).toBe('127.0.0.1:8188/v1/images/generations');
        expect(endpoint).not.toContain('/api/image-backend/openai-image-proxy');
    });

    it('uses the default proxy only for whitelisted official providers', () => {
        const endpoint = 构建OpenAI图片生成端点(
            'https://api.openai.com/v1',
            '/v1/images/generations',
            { 图片需要代理: true, 供应商ID: 'openai-official' }
        );

        expect(endpoint).toContain('/api/image-backend/openai-image-proxy/v1/images/generations?provider=openai-official');
    });

    it('recognizes the persisted OpenAI supplier id as an official provider', () => {
        const endpoint = 构建OpenAI图片生成端点(
            'https://api.openai.com/v1',
            '/v1/images/generations',
            { 图片需要代理: true, 供应商ID: 'openai' }
        );

        expect(endpoint).toContain('/api/image-backend/openai-image-proxy/v1/images/generations?provider=openai');
    });

    it('uses the default proxy for the xAI official provider', () => {
        const endpoint = 构建OpenAI图片生成端点(
            'https://api.x.ai/v1',
            '/v1/images/generations',
            { 图片需要代理: true, 供应商ID: 'xai_official' }
        );

        expect(endpoint).toContain('/api/image-backend/openai-image-proxy/v1/images/generations?provider=xai_official');
    });

    it('keeps custom non-whitelisted endpoints direct when no custom proxy address is provided', () => {
        const endpoint = 构建OpenAI图片生成端点(
            'https://cdn.moe-atelier.site/v1',
            '/v1/images/generations',
            { 图片需要代理: true, 供应商ID: 'openai-custom' }
        );

        expect(endpoint).toBe('https://cdn.moe-atelier.site/v1/images/generations');
    });

    it('sends custom endpoints to the user-provided CORS proxy instead of the built-in worker', () => {
        const endpoint = 构建OpenAI图片生成端点(
            'https://cdn.moe-atelier.site/v1',
            '/v1/images/generations',
            {
                图片需要代理: true,
                供应商ID: 'openai-custom',
                自定义图片代理地址: 'https://proxy.example.com/'
            }
        );

        expect(endpoint).toBe('https://proxy.example.com?url=https%3A%2F%2Fcdn.moe-atelier.site%2Fv1%2Fimages%2Fgenerations');
    });
});

import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('存档批量导出 UI', () => {
    it('网页端也逐条读取、压缩和下载，不再构建整库单 ZIP', () => {
        const source = fs.readFileSync(
            path.join(process.cwd(), 'components/features/SaveLoad/SaveLoadModal.tsx'),
            'utf8'
        );

        expect(source).not.toContain('const blob = await 导出ZIP存档文件();');
        expect(source).toMatch(/phase === 'writing'\s*\? \(nativeExport \? '写入设备' : '下载存档'\)/);
        expect(source).toContain('items: allSummaries');
    });

    it('APK 使用已安装的 Capacitor Filesystem 插件写入文档目录', () => {
        const source = fs.readFileSync(
            path.join(process.cwd(), 'components/features/SaveLoad/SaveLoadModal.tsx'),
            'utf8'
        );
        const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));

        expect(source).toContain("from '@capacitor/filesystem'");
        expect(source).toContain('directory: Directory.Documents');
        expect(packageJson.dependencies['@capacitor/filesystem']).toBeTruthy();
    });
});

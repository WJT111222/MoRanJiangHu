import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string): string => (
    fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8')
);

describe('preboot 启动错误兜底', () => {
    it('忽略跨域匿名 Script error，避免第三方脚本误盖启动失败页', () => {
        const source = readSource('index.html');

        expect(source).toContain("message === 'Script error.'");
        expect(source).toContain('hasNoLocation');
        expect(source).toContain('hasNoErrorObject');
        expect(source).toContain('preboot ignored external script error');
        expect(source.indexOf('if (isExternalInjectedError(event))')).toBeLessThan(
            source.indexOf("'preboot window.error'")
        );
    });
});

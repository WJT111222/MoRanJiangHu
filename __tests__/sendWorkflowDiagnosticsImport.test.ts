import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('sendWorkflow diagnostic logging imports', () => {
    it('imports recordDiagnosticLog when the workflow records diagnostic logs', () => {
        const source = fs.readFileSync(
            path.join(process.cwd(), 'hooks/useGame/sendWorkflow.ts'),
            'utf8'
        );

        expect(source).toContain('recordDiagnosticLog(');
        expect(source).toMatch(/import\s*{\s*recordDiagnosticLog\s*}\s*from\s*['"]\.\.\/\.\.\/services\/diagnosticLog['"]/);
    });
});

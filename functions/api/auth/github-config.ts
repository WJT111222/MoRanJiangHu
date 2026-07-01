import { buildAuthJsonResponse, handleAuthOptions } from './_shared';

const readEnvString = (value: unknown) => (
    typeof value === 'string' ? value.trim() : ''
);

export function onRequestOptions(): Response {
    return handleAuthOptions();
}

export function onRequestGet({ env }: any): Response {
    return buildAuthJsonResponse({
        githubClientId: readEnvString(env?.GITHUB_CLIENT_ID),
        githubBackupClientId: readEnvString(env?.GITHUB_BACKUP_CLIENT_ID)
    });
}

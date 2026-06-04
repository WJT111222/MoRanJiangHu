import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import https from 'node:https';
import http from 'node:http';

const rootDir = path.resolve(import.meta.dirname, '..');
const registryPath = path.join(rootDir, 'data', 'presetItemImages.ts');
const endpoint = process.env.MORAN_OSS_ENDPOINT?.replace(/\/+$/, '') || 'https://s3.hi168.com';
const bucket = process.env.MORAN_OSS_BUCKET || '';
const accessKey = process.env.MORAN_OSS_ACCESS_KEY || '';
const secretKey = process.env.MORAN_OSS_SECRET_KEY || '';
const region = 'auto';
const service = 's3';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitArg = args.find(a => a.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : Infinity;

if (!bucket || !accessKey || !secretKey) {
    throw new Error('Missing MORAN_OSS_BUCKET, MORAN_OSS_ACCESS_KEY, or MORAN_OSS_SECRET_KEY');
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

const downloadImage = (url) => new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: 30000 }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return downloadImage(res.headers.location).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
        }
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', reject);
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
});

const signS3Request = (method, key, body, contentType, dateStr) => {
    const encodeKey = (k) => k.split('/').map(p => encodeURIComponent(p)).join('/');
    const url = new URL(`${endpoint}/${encodeURIComponent(bucket)}/${encodeKey(key)}`);
    const shortDate = dateStr.replace(/[-:]/g, '').replace(/\..+/, '').slice(0, 8);
    const payloadHash = crypto.createHash('sha256').update(body).digest('hex');
    const canonicalUri = '/' + encodeURIComponent(bucket) + '/' + encodeKey(key);
    const canonicalHeaders = `host:${url.host}\nx-amz-acl:public-read\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${dateStr}\n`;
    const signedHeaders = 'host;x-amz-acl;x-amz-content-sha256;x-amz-date';
    const canonicalRequest = `${method}\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
    const credentialScope = `${shortDate}/${region}/${service}/aws4_request`;
    const stringToSign = `AWS4-HMAC-SHA256\n${dateStr}\n${credentialScope}\n${crypto.createHash('sha256').update(canonicalRequest).digest('hex')}`;
    const hmac = (k, d) => crypto.createHmac('sha256', k).update(d).digest();
    const signingKey = hmac(hmac(hmac(hmac(`AWS4${secretKey}`, shortDate), region), service), 'aws4_request');
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
    const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    return { url, headers: { 'Content-Type': contentType, 'Content-Length': body.length, 'x-amz-acl': 'public-read', 'x-amz-content-sha256': payloadHash, 'x-amz-date': dateStr, 'Authorization': authHeader } };
};

const uploadToS3 = async (key, body, contentType) => {
    const dateStr = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '') + 'Z';
    const { url, headers } = signS3Request('PUT', key, body, contentType, dateStr);
    return new Promise((resolve, reject) => {
        const req = https.request({ hostname: url.hostname, port: 443, path: url.pathname + url.search, method: 'PUT', headers }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) resolve(url.toString());
                else reject(new Error(`S3 PUT failed (${res.statusCode}): ${data.slice(0, 200)}`));
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
};

const main = async () => {
    const source = await fs.readFile(registryPath, 'utf8');
    const regex = /(名称: '([^']+)', 类型: '([^']+)', 品质: '([^']+)', 图片URL: '([^']+)')/g;
    const entries = [];
    let match;
    while ((match = regex.exec(source)) !== null) {
        entries.push({ fullMatch: match[1], name: match[2], type: match[3], quality: match[4], url: match[5], index: match.index });
    }

    const toMigrate = entries.filter(e => !e.url.includes('s3.hi168.com')).slice(0, limit);
    console.log(`Total entries: ${entries.length}, to migrate: ${toMigrate.length}`);

    let success = 0, failed = 0, skipped = 0;
    let updatedSource = source;

    for (const entry of toMigrate) {
        const safeName = entry.name.replace(/[^\p{Letter}\p{Number}_-]+/gu, '-');
        const ext = entry.url.match(/\.(png|jpg|jpeg|webp)(\?|$)/i)?.[1] || 'png';
        const s3Key = `MoRanJiangHu/preset-items/${safeName}.${ext}`;
        const s3Url = `${endpoint}/${bucket}/${s3Key}`;

        if (dryRun) {
            console.log(`[dry-run] ${entry.name}: ${entry.url} -> ${s3Url}`);
            success++;
            continue;
        }

        try {
            console.log(`[${success + failed + skipped + 1}/${toMigrate.length}] ${entry.name}: downloading...`);
            const imageBuffer = await downloadImage(entry.url);
            const contentType = ext === 'jpg' ? 'image/jpeg' : ext === 'webp' ? 'image/webp' : 'image/png';
            console.log(`  uploading ${imageBuffer.length} bytes...`);
            await uploadToS3(s3Key, imageBuffer, contentType);
            updatedSource = updatedSource.replace(entry.fullMatch, `名称: '${entry.name}', 类型: '${entry.type}', 品质: '${entry.quality}', 图片URL: '${s3Url}'`);
            success++;
            console.log(`  OK -> ${s3Url}`);
            await sleep(200); // Rate limit
        } catch (error) {
            failed++;
            console.error(`  FAILED: ${error.message}`);
        }
    }

    if (!dryRun && success > 0) {
        await fs.writeFile(registryPath, updatedSource, 'utf8');
        console.log(`\nUpdated ${registryPath}`);
    }

    console.log(`\nDone: ${success} success, ${failed} failed, ${skipped} skipped`);
};

main().catch(console.error);

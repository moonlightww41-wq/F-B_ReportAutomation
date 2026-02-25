/**
 * Netlify Function: /api/drive-file
 * サービスアカウントJSONでDrive APIに認証し、xlsxをバイナリで返す
 *
 * 環境変数:
 *   GOOGLE_SERVICE_ACCOUNT_JSON = サービスアカウントJSONの中身（文字列）
 */

import type { Handler } from '@netlify/functions';
import { google } from 'googleapis';
import { Readable } from 'stream';

async function streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
}

export const handler: Handler = async (event) => {
    const fileId = event.queryStringParameters?.fileId;

    if (!fileId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'fileId is required' }),
        };
    }

    const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountJson) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'GOOGLE_SERVICE_ACCOUNT_JSON not set' }),
        };
    }

    try {
        const credentials = JSON.parse(serviceAccountJson);
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive.readonly'],
        });

        const drive = google.drive({ version: 'v3', auth });
        const res = await drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'stream' }
        );

        const buffer = await streamToBuffer(res.data as Readable);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Cache-Control': 'private, max-age=300', // 5分キャッシュ
            },
            body: buffer.toString('base64'),
            isBase64Encoded: true,
        };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('Drive API error:', msg);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: msg }),
        };
    }
};

/**
 * デバッグ用: かね子のシートのrow1-5をすべての列で読み取る
 */
import { google } from 'googleapis';
import ExcelJS from 'exceljs';
import { readFileSync } from 'fs';

const SERVICE_ACCOUNT_KEY = './service_account.json';
// かね子のファイルID
const FILE_ID = '1nvZSdgqpq4AS7Gqei3p37J5m7ZydbCzm';
const SHEET_NAME = 'かね子報告書';

async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

function cellValue(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === 'object') {
        if (v.result !== undefined) return v.result;
        if (v.text !== undefined) return v.text;
        return '(formula)';
    }
    return v;
}

// 列番号 → Excel列名 (1=A, 26=Z, 27=AA...)
function colName(n) {
    let s = '';
    while (n > 0) {
        const r = (n - 1) % 26;
        s = String.fromCharCode(65 + r) + s;
        n = Math.floor((n - 1) / 26);
    }
    return s;
}

async function main() {
    const keyFile = JSON.parse(readFileSync(SERVICE_ACCOUNT_KEY, 'utf8'));
    const auth = new google.auth.GoogleAuth({
        credentials: keyFile,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });
    const drive = google.drive({ version: 'v3', auth });

    const res = await drive.files.get(
        { fileId: FILE_ID, alt: 'media' },
        { responseType: 'stream' }
    );
    const buffer = await streamToBuffer(res.data);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const ws = workbook.getWorksheet(SHEET_NAME);
    if (!ws) {
        console.log('シートが見つかりません:', SHEET_NAME);
        return;
    }

    // 先頭5行を全列で表示
    console.log(`\n=== ${SHEET_NAME}: 先頭6行 × 全列 ===\n`);
    const maxCol = ws.actualColumnCount || 60;

    for (let rowNum = 1; rowNum <= 6; rowNum++) {
        const row = ws.getRow(rowNum);
        const cells = [];
        for (let col = 1; col <= Math.min(maxCol, 55); col++) {
            const v = cellValue(row.getCell(col).value);
            if (v !== null && v !== '' && v !== undefined) {
                cells.push(`  ${colName(col)}${rowNum}="${v}"`);
            }
        }
        console.log(`--- 行${rowNum} ---`);
        console.log(cells.join('\n') || '  (空)');
    }

    // AN〜AQ列（37〜43列目）を行1〜40で詳細表示
    console.log('\n\n=== AN〜AQ列 (37〜43列目) の詳細 ===');
    for (let col = 37; col <= 46; col++) {
        process.stdout.write(`\n${colName(col)}列: `);
        const vals = [];
        for (let rowNum = 1; rowNum <= 40; rowNum++) {
            const v = cellValue(ws.getRow(rowNum).getCell(col).value);
            if (v !== null && v !== '' && v !== undefined) {
                vals.push(`行${rowNum}:${JSON.stringify(v)}`);
            }
        }
        console.log(vals.join(' | ') || '(全空)');
    }

    // 売上行（行5）全列の値
    console.log('\n\n=== 行5（売上）の全列 ===');
    const row5 = ws.getRow(5);
    for (let col = 1; col <= Math.min(maxCol, 55); col++) {
        const v = cellValue(row5.getCell(col).value);
        if (v !== null) {
            console.log(`  ${colName(col)}: ${JSON.stringify(v)}`);
        }
    }
}

main().catch(console.error);

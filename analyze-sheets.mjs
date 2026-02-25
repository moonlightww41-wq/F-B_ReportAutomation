/**
 * Google Drive上のxlsxファイルを直接ダウンロードして解析 (v2)
 * - AN列(40列目)まで読み込み
 * - 動的に「最新月」列を検出（合計列の1列前）
 * - 13ヶ月分のPLデータを構造化して出力
 *
 * 使い方: node analyze-sheets.mjs
 */

import { google } from 'googleapis';
import ExcelJS from 'exceljs';
import { readFileSync, writeFileSync } from 'fs';

const SERVICE_ACCOUNT_KEY = './service_account.json';
const FOLDER_ID = '1JNrYsDY6omdh_l5xkUPku7oqXANcNHS5';

async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

/** セル値を安全に取得（数式の場合は result を使う） */
function cellValue(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === 'object') {
        if (v.result !== undefined) return v.result;
        if (v.text !== undefined) return v.text;
        if (v.formula !== undefined) return null; // sharedFormula only
        return null;
    }
    return v;
}

async function analyzeWorksheet(ws) {
    // 全行を配列化（最大500行 x 60列）
    const grid = [];
    ws.eachRow({ includeEmpty: true }, (row, rowNum) => {
        if (rowNum > 80) return;
        const values = [];
        for (let col = 1; col <= 55; col++) {
            values.push(cellValue(row.getCell(col).value));
        }
        grid.push(values);
    });

    if (grid.length < 4) return null;

    // row 2 (index 1) = 年ラベル行: "2024年", "2025年", "2026年" など
    // row 3 (index 2) = "実績" が並ぶ行
    // row 4 (index 3) = "1月","2月"... の月ラベル行
    const row2 = grid[1] || [];
    const row3 = grid[2] || [];
    const row4 = grid[3] || [];

    // 「合計」列のインデックスを探す（row3 or row4に"合計"がある列）
    let totalColIdx = -1;
    for (let i = 0; i < row3.length; i++) {
        const v3 = String(row3[i] || '');
        const v4 = String(row4[i] || '');
        if (v3.includes('合計') || v4.includes('合計')) {
            totalColIdx = i;
            break;
        }
    }

    // 最新月列 = 合計列の1つ前
    const latestColIdx = totalColIdx > 0 ? totalColIdx - 1 : -1;

    // 最新年・最新月を特定
    let latestYear = null;
    let latestMonth = null;
    if (latestColIdx >= 0) {
        // row2の"年"ラベルを後ろから検索
        for (let i = latestColIdx; i >= 0; i--) {
            const v = String(row2[i] || '');
            if (v.includes('年')) {
                latestYear = v.replace(/[年\s]/g, '');
                break;
            }
        }
        latestMonth = String(row4[latestColIdx] || '').replace('月', '').trim();
    }

    console.log(`  合計列: ${totalColIdx + 1}列目, 最新月列: ${latestColIdx + 1}列目`);
    console.log(`  最新年: ${latestYear || '不明'}, 最新月: ${latestMonth || '不明'}月`);

    // 実績列（"実績"が入っている列）をすべて収集 → 月次データ
    const monthCols = [];
    for (let i = 3; i < row3.length; i++) {
        if (i === totalColIdx) break; // 合計以降は除外
        const v3 = String(row3[i] || '');
        // 前年(8-12月)と当年(1月以降)を含む実績列
        if (v3 === '実績' || (!v3.includes('合計') && row4[i] && String(row4[i]).match(/^\d+月$/))) {
            monthCols.push({ colIdx: i, month: String(row4[i] || '') });
        }
    }

    // 前年8〜12月も含めた月列を確定（先頭のD〜H列、index 3〜7）
    // row4に月名があるものをすべて取得
    const allMonthCols = [];
    for (let i = 3; i < (totalColIdx > 0 ? totalColIdx : 50); i++) {
        const mv = row4[i];
        if (mv && String(mv).match(/^\d+月$|^[0-9]+月$/)) {
            const yearLabel = (() => {
                // この列に対応する年を row2 から後方検索
                for (let j = i; j >= 0; j--) {
                    const y = String(row2[j] || '');
                    if (y.includes('年')) return y.replace(/[年\s]/g, '');
                }
                return '';
            })();
            allMonthCols.push({
                colIdx: i,
                year: yearLabel,
                month: String(mv).replace('月', ''),
            });
        }
    }

    console.log(`  月列数: ${allMonthCols.length}ヶ月分`);
    if (allMonthCols.length > 0) {
        console.log(`  月列: ${allMonthCols.slice(-14).map(c => `${c.year}/${c.month}月`).join(', ')}`);
    }

    // 費目行を解析（行5以降）
    const items = {};
    for (let rowIdx = 4; rowIdx < grid.length; rowIdx++) {
        const row = grid[rowIdx];
        // B列(index 1) = 大分類, C列(index 2) = 小分類/費目名
        const category = String(row[1] || '').trim();
        const itemName = String(row[2] || '').trim();

        if (!itemName || itemName === 'null') continue;
        // 重複や空をスキップ
        if (itemName === category) continue;

        const monthData = {};
        for (const mc of allMonthCols) {
            const v = row[mc.colIdx];
            monthData[`${mc.year}_${mc.month}`] = typeof v === 'number' ? v : null;
        }
        items[itemName] = { category, data: monthData };
    }

    return {
        latestYear,
        latestMonth,
        totalColIdx,
        latestColIdx,
        allMonthCols: allMonthCols.slice(-14), // 直近14ヶ月分
        items,
    };
}

async function main() {
    const keyFile = JSON.parse(readFileSync(SERVICE_ACCOUNT_KEY, 'utf8'));
    const auth = new google.auth.GoogleAuth({
        credentials: keyFile,
        scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    });

    const drive = google.drive({ version: 'v3', auth });

    const filesRes = await drive.files.list({
        q: `'${FOLDER_ID}' in parents and name contains '.xlsx'`,
        fields: 'files(id, name)',
        orderBy: 'name',
    });

    const files = filesRes.data.files || [];
    console.log('=== フォルダ内ファイル一覧 ===');
    files.forEach(f => console.log(`  ${f.name}: ${f.id}`));

    const results = {};

    for (const file of files) {
        const storeName = file.name.replace('.xlsx', '');
        console.log(`\n=== ${storeName} ===`);

        try {
            const res = await drive.files.get(
                { fileId: file.id, alt: 'media' },
                { responseType: 'stream' }
            );
            const buffer = await streamToBuffer(res.data);

            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer);

            const sheetNames = workbook.worksheets.map(ws => ws.name);
            const reportSheets = sheetNames.filter(n => n.includes('報告書'));
            console.log(`  シート: ${sheetNames.join(' / ')}`);
            console.log(`  報告書シート: ${reportSheets.join(' / ')}`);

            results[storeName] = { fileId: file.id, sheetNames, reportSheets, analysis: {} };

            for (const sheetName of reportSheets) {
                const ws = workbook.getWorksheet(sheetName);
                if (!ws) continue;
                const analysis = await analyzeWorksheet(ws);
                results[storeName].analysis[sheetName] = analysis;

                if (analysis) {
                    console.log(`  費目数: ${Object.keys(analysis.items).length}`);
                    // 主要項目の最新月値を表示
                    const target = ['売上', '原価', '人件費', '営業CF', '営業損益(償却後)'];
                    const keyStr = `${analysis.latestYear}_${analysis.latestMonth}`;
                    for (const t of target) {
                        const item = analysis.items[t];
                        if (item && item.data[keyStr] !== undefined) {
                            console.log(`    ${t}: ${item.data[keyStr]?.toLocaleString() ?? 'null'}`);
                        }
                    }
                }
            }
        } catch (err) {
            console.error(`  エラー:`, err.message);
            results[storeName] = { error: err.message };
        }
    }

    writeFileSync('./sheets-analysis-v2.json', JSON.stringify(results, null, 2), 'utf8');
    console.log('\n✅ sheets-analysis-v2.json に保存完了');
}

main().catch(console.error);

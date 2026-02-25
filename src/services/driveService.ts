/**
 * Google Drive → ReportData 変換サービス
 * Drive APIでxlsxをダウンロードしReportDataに変換する
 *
 * 検出ロジック:
 *  - AM列(index 38)に費目名ラベル
 *  - AN列以降の「実績」+月名列を動的に検出
 *  - 「合計」列の前が最新月
 *  - 前年12ヶ月はその前のブロックから
 */

import type { ReportData, MonthlyRecord, SummaryData, YoyComparison, CommentSection } from '../types/report';

// サービスアカウントキーはVITE_GOOGLE_SERVICE_ACCOUNTまたはAPIルート経由で渡す


export interface StoreMetadata {
    storeName: string;
    fileId: string;
    sheetName: string;
    availableMonths: string[]; // "2026年1月" 等
}

// ==========================================
// 事前に解析済みのファイルIDとシート名
// ==========================================
export const STORE_FILE_MAP: Record<string, { fileId: string; sheetName: string }> = {
    'かね子': { fileId: '1nvZSdgqpq4AS7Gqei3p37J5m7ZydbCzm', sheetName: 'かね子報告書' },
    'スロパチコンカフェ': { fileId: '1YkG8ZpIzUiNI3OgXq2KE7HzYco0GzRtd', sheetName: 'スロパチ　報告書' },
    'ダルマ池袋': { fileId: '10QBWZJ3sJnymsQCuG20RQY2TuvCr-UPj', sheetName: 'DARUMA池袋　報告書' },
    'ダーツバーW': { fileId: '11XhsK3GdFssl4yJSpeNaiSUUdqbCm0q8', sheetName: 'ダーツバーW　報告書' },
    'ダルマ田町': { fileId: '1DO5eox-YIvetPelR-eb862mBvF8qtZhP', sheetName: 'DARUMA田町　報告書' },
    '池袋サンガ': { fileId: '1YHcxdarVt6MK71J-aT0Lufm36ccJYTPb', sheetName: 'SANGA 報告書' },
    'どないや': { fileId: '1MG3K9QV4xF5I9CYZ4WBws2jEGVlARfTZ', sheetName: 'どないや　報告書' },
    '紗心': { fileId: '1Pil1CXM-WHPawLhSnd6H9_o4KZH-D9iQ', sheetName: '紗心　報告書' },
};

type Grid = (string | number | null)[][];

/** Netlify Functionか環境変数からアクセストークンを取得してxlsxをダウンロード */
async function fetchXlsxBuffer(fileId: string): Promise<ArrayBuffer> {
    // 開発環境: Netlify Function proxy を叩く
    const res = await fetch(`/api/drive-file?fileId=${fileId}`);
    if (!res.ok) throw new Error(`Drive API エラー: ${res.status} ${res.statusText}`);
    return res.arrayBuffer();
}


function cellVal(v: unknown): string | number | null {
    if (v === null || v === undefined) return null;
    if (typeof v === 'object') {
        const obj = v as Record<string, unknown>;
        if (obj.result !== undefined) return obj.result as number;
        if (obj.text !== undefined) return String(obj.text);
        return null;
    }
    return v as string | number;
}

/**
 * 最新月列のインデックスを検出
 * row3に「実績」、row4に「nN月」が入っている最後の列を探す
 * その後ろに「合計」または「特記事項」列がある
 */
function detectLatestMonthCol(grid: Grid): {
    colIdx: number; year: string; month: string;
} {
    const row2 = grid[1] || [];
    const row3 = grid[2] || [];  // "年間実績"/"実績"行
    const row4 = grid[3] || [];  // "8月"/"1月"等 月名行

    let latestCol = -1;
    let latestYear = '';
    let latestMonth = '';

    for (let i = 0; i < row4.length; i++) {
        const mv = String(row4[i] || '');
        // 月名パターン: "1月","11月","4月(30日)"等
        const monthMatch = mv.match(/^(\d{1,2})月/);
        if (!monthMatch) continue;

        // 「実績」が入っているか確認（row3かrow4）
        const r3v = String(row3[i] || '');
        if (r3v !== '実績' && r3v !== '') continue;

        latestCol = i;
        latestMonth = monthMatch[1];

        // 対応する年をrow2から後方検索
        for (let j = i; j >= 0; j--) {
            const yv = String(row2[j] || '');
            if (yv.match(/\d{4}年/)) {
                latestYear = yv.replace(/[年\s]/g, '');
                break;
            }
        }
    }

    return { colIdx: latestCol, year: latestYear, month: latestMonth };
}

/** 費目ラベル列を検出（AM列 = index 38）*/
function detectLabelCol(grid: Grid): number {
    // 行6以降のB列付近で「売上」「原価」「人件費」が集中している列を探す
    // デバッグで確認済み: AM列(index38)がラベル列
    const candidateCols = [38, 1, 2]; // AM優先
    for (const col of candidateCols) {
        const labels = grid.slice(5, 15).map(row => String(row[col] || ''));
        const hasKey = labels.some(l => ['売上', '原価', '粗利益', '人件費'].includes(l));
        if (hasKey) return col;
    }
    return 38;
}


/**
 * gridから13ヶ月分の月次データ配列を生成
 * 最新月を含む直近13ヶ月を返す
 */
function extractMonthlyRecords(
    grid: Grid,
    labelColIdx: number,
    latestColIdx: number
): MonthlyRecord[] {
    const row2 = grid[1] || [];
    const row4 = grid[3] || [];

    // 費目名とrow番号のマッピング
    const itemRowMap: Record<string, number> = {};
    for (let rowIdx = 5; rowIdx < Math.min(grid.length, 60); rowIdx++) {
        const label = String(grid[rowIdx][labelColIdx] || '').trim();
        if (label) itemRowMap[label] = rowIdx;
    }

    const getVal = (rowIdx: number, colIdx: number): number => {
        if (rowIdx < 0 || colIdx < 0) return 0;
        const v = grid[rowIdx]?.[colIdx];
        const n = typeof v === 'number' ? v : parseFloat(String(v || '0'));
        return isNaN(n) ? 0 : n;
    };

    // 直近13ヶ月の列インデックスを収集（latestColIdx から遡る）
    const monthCols: Array<{ colIdx: number; year: string; month: string }> = [];
    let currentYear = '';

    for (let colIdx = latestColIdx; colIdx >= 0 && monthCols.length < 13; colIdx--) {
        const mv = String(row4[colIdx] || '');
        const monthMatch = mv.match(/^(\d{1,2})月/);
        if (!monthMatch) continue;

        // 年を後方検索
        let year = currentYear;
        for (let j = colIdx; j >= 0; j--) {
            const yv = String(row2[j] || '');
            if (yv.match(/\d{4}年/)) {
                year = yv.replace(/[年\s]/g, '');
                break;
            }
        }
        currentYear = year;
        monthCols.unshift({ colIdx, year, month: monthMatch[1] });
    }

    return monthCols.map(({ colIdx, year, month }): MonthlyRecord => {
        const sales = getVal(itemRowMap['売上'] ?? -1, colIdx);
        const cost = getVal(itemRowMap['原価'] ?? -1, colIdx);
        const labor = getVal(itemRowMap['人件費'] ?? -1, colIdx);
        const opCF = getVal(itemRowMap['営業CF'] ?? -1, colIdx);
        const profitRate = sales > 0 ? (opCF / sales) * 100 : 0;
        const fRate = sales > 0 ? (cost / sales) * 100 : 0;
        const lRate = sales > 0 ? (labor / sales) * 100 : 0;
        // R = 固定費（支払手数料+地代家賃+リース料 等）
        const rent = getVal(itemRowMap['地代家賃'] ?? -1, colIdx);
        const lease = getVal(itemRowMap['リース料'] ?? -1, colIdx);
        const fee = getVal(itemRowMap['支払手数料'] ?? -1, colIdx);
        const rCost = rent + lease + fee;
        const rRate = sales > 0 ? (rCost / sales) * 100 : 0;
        const flrTotal = fRate + lRate + rRate;

        return {
            month: year ? `${year.slice(2)}/${month}月` : `${month}月`,
            sales: Math.round(sales / 1000),    // 千円単位
            cost: Math.round(cost / 1000),
            laborCost: Math.round(labor / 1000),
            operatingCF: Math.round(opCF / 1000),
            profitRate: Math.round(profitRate * 10) / 10,
            fCostRate: Math.round(fRate * 10) / 10,
            lCostRate: Math.round(lRate * 10) / 10,
            rCostRate: Math.round(rRate * 10) / 10,
            flrTotal: Math.round(flrTotal * 10) / 10,
            momTrend: '-',
        };
    });
}

/**
 * メイン: xlsxバッファからReportDataを生成
 */
export async function parseXlsxToReportData(
    buffer: ArrayBuffer,
    sheetName: string,
    storeName: string
): Promise<ReportData> {
    // @ts-ignore dynamic import
    const ExcelJS = (await import('exceljs')).default;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const ws = workbook.getWorksheet(sheetName);
    if (!ws) throw new Error(`シート "${sheetName}" が見つかりません`);

    // GridまたはExcelJS APIで行列データを取得
    const grid: Grid = [];
    ws.eachRow({ includeEmpty: true }, (row: unknown, rowNum: number) => {
        if (rowNum > 60) return;
        const r = row as { getCell: (n: number) => { value: unknown } };
        const values: (string | number | null)[] = [];
        for (let col = 1; col <= 50; col++) {
            values.push(cellVal(r.getCell(col).value));
        }
        grid.push(values);
    });

    const labelColIdx = detectLabelCol(grid);
    const { colIdx: latestColIdx, year, month } = detectLatestMonthCol(grid);

    if (latestColIdx < 0) throw new Error('最新月列の検出に失敗しました');

    const monthly = extractMonthlyRecords(grid, labelColIdx, latestColIdx);
    const latest = monthly[monthly.length - 1];
    const prevYear = monthly.find(m => m.month.includes(`/${month}月`) && !m.month.startsWith(year.slice(2)));

    // サマリー計算
    const prevYoySales = prevYear ? prevYear.sales * 1000 : 0;
    const prevYoyCF = prevYear ? prevYear.operatingCF * 1000 : 0;
    const prevYoyProfit = prevYear ? prevYear.profitRate : 0;
    const curSales = latest.sales * 1000;
    const curCF = latest.operatingCF * 1000;

    const summary: SummaryData = {
        sales: curSales,
        salesYoyLabel: prevYoySales > 0
            ? `(前年同月比 ${((curSales - prevYoySales) / prevYoySales * 100).toFixed(1)}%)`
            : '',
        operatingProfitRate: latest.profitRate,
        profitRateYoyChange: prevYoyProfit ? Math.round((latest.profitRate - prevYoyProfit) * 10) / 10 : 0,
        operatingCF: curCF,
        fCostRate: latest.fCostRate,
        fCostRateChange: prevYear ? Math.round((latest.fCostRate - prevYear.fCostRate) * 10) / 10 : 0,
        flrCostRate: latest.flrTotal,
        flrCostRateChange: prevYear ? Math.round((latest.flrTotal - prevYear.flrTotal) * 10) / 10 : 0,
    };

    const yoyComparison: YoyComparison = {
        previousYear: {
            sales: prevYoySales,
            operatingCF: prevYoyCF,
            profitRate: prevYoyProfit,
        },
        currentYear: {
            sales: curSales,
            operatingCF: curCF,
            profitRate: latest.profitRate,
        },
        change: {
            salesAmount: curSales - prevYoySales,
            salesRate: prevYoySales > 0 ? Math.round((curSales - prevYoySales) / prevYoySales * 1000) / 10 : 0,
            cfAmount: curCF - prevYoyCF,
            cfRate: prevYoyCF > 0 ? Math.round((curCF - prevYoyCF) / prevYoyCF * 1000) / 10 : 0,
            profitRateChange: prevYoyProfit ? Math.round((latest.profitRate - prevYoyProfit) * 10) / 10 : 0,
        },
    };

    const comments: CommentSection[] = [
        {
            id: 'default-1',
            title: 'データ取得完了',
            content: `${storeName} ${year}年${month}月のPLデータを読み込みました。AIコメント生成ボタンで分析コメントを生成できます。`,
        },
    ];

    const createdDate = new Date().toLocaleDateString('ja-JP', {
        year: 'numeric', month: 'long', day: 'numeric',
    });

    return {
        storeName,
        reportMonth: `${year}年${month}月`,
        reportPeriod: `${year}年${month}月度`,
        createdDate,
        summary,
        yoyComparison,
        monthlyTrend: monthly,
        comments,
        deletedComments: [],
    };
}

/** Drive APIプロキシ経由でxlsxを取得してReportDataを返す */
export async function fetchReportData(
    storeName: string
): Promise<ReportData> {
    const storeInfo = STORE_FILE_MAP[storeName];
    if (!storeInfo) throw new Error(`店舗 "${storeName}" のファイル情報が見つかりません`);

    const buffer = await fetchXlsxBuffer(storeInfo.fileId);
    return parseXlsxToReportData(buffer, storeInfo.sheetName, storeName);
}

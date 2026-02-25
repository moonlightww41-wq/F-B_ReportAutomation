// ==========================================
// CSVパーサー: PLデータCSV → ReportData変換
// ==========================================
import type { MonthlyRecord, ReportData, SummaryData, YoyComparison, AiNotes } from '../types/report';

/**
 * CSV文字列をパースして行配列に変換
 */
export function parseCSVToRows(csvText: string): string[][] {
    const lines = csvText.trim().split(/\r?\n/);
    return lines.map(line =>
        line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
    );
}

/**
 * 行配列を MonthlyRecord[] に変換
 * CSVの想定カラム順:
 * 月度, 売上高(千円), 原価(千円), 人件費(千円), 営業CF(千円),
 * 営業利益率(%), Fコスト(%), Lコスト(%), Rコスト(%)
 */
export function rowsToMonthlyRecords(rows: string[][]): MonthlyRecord[] {
    // ヘッダー行をスキップ
    const dataRows = rows.slice(1);

    return dataRows.map((row) => {
        const sales = parseFloat(row[1]) || 0;
        const fCostRate = parseFloat(row[6]) || 0;
        const lCostRate = parseFloat(row[7]) || 0;
        const rCostRate = parseFloat(row[8]) || 0;

        return {
            month: row[0],
            sales,
            cost: parseFloat(row[2]) || 0,
            laborCost: parseFloat(row[3]) || 0,
            operatingCF: parseFloat(row[4]) || 0,
            profitRate: parseFloat(row[5]) || 0,
            fCostRate,
            lCostRate,
            rCostRate,
            flrTotal: Math.round((fCostRate + lCostRate + rCostRate) * 10) / 10,
            momTrend: '-',
        };
    });
}

/**
 * 前月対比トレンドを計算
 */
export function calculateMomTrends(records: MonthlyRecord[]): MonthlyRecord[] {
    return records.map((record, index) => {
        if (index === 0) return { ...record, momTrend: '-' };

        const prev = records[index - 1];
        const flrDiff = record.flrTotal - prev.flrTotal;

        let momTrend: string;
        if (flrDiff <= -2) momTrend = '改善';
        else if (flrDiff <= -0.5) momTrend = '改善';
        else if (flrDiff <= 0.5) momTrend = '維持';
        else if (flrDiff <= 2) momTrend = 'やや悪化';
        else momTrend = '悪化';

        return { ...record, momTrend };
    });
}

/**
 * サマリーデータを算出
 */
export function calculateSummary(
    records: MonthlyRecord[],
    currentMonthIndex: number
): SummaryData {
    const current = records[currentMonthIndex];
    const prevYearRecords = records.slice(0, -1);
    const avgSales = prevYearRecords.reduce((sum, r) => sum + r.sales, 0) / prevYearRecords.length;
    const avgProfitRate = prevYearRecords.reduce((sum, r) => sum + r.profitRate, 0) / prevYearRecords.length;
    const prevMonth = currentMonthIndex > 0 ? records[currentMonthIndex - 1] : null;

    return {
        sales: current.sales * 1000,
        salesYoyLabel: `前年平均比 ${((current.sales - avgSales) / avgSales * 100).toFixed(1)}%`,
        operatingProfitRate: current.profitRate,
        profitRateYoyChange: Math.round((current.profitRate - avgProfitRate) * 10) / 10,
        operatingCF: current.operatingCF * 1000,
        fCostRate: current.fCostRate,
        fCostRateChange: prevMonth ? Math.round((current.fCostRate - prevMonth.fCostRate) * 10) / 10 : 0,
        flrCostRate: current.flrTotal,
        flrCostRateChange: prevMonth ? Math.round((current.flrTotal - prevMonth.flrTotal) * 10) / 10 : 0,
    };
}

/**
 * 前年同月比較を算出
 */
export function calculateYoyComparison(
    records: MonthlyRecord[],
    currentMonthIndex: number
): YoyComparison {
    const current = records[currentMonthIndex];
    // 前年同月は12ヶ月前のレコード
    const prevYearIndex = currentMonthIndex - 12;
    const prevYear = prevYearIndex >= 0 ? records[prevYearIndex] : records[0];

    const salesChange = (current.sales - prevYear.sales) * 1000;
    const cfChange = (current.operatingCF - prevYear.operatingCF) * 1000;

    return {
        previousYear: {
            sales: prevYear.sales * 1000,
            operatingCF: prevYear.operatingCF * 1000,
            profitRate: prevYear.profitRate,
        },
        currentYear: {
            sales: current.sales * 1000,
            operatingCF: current.operatingCF * 1000,
            profitRate: current.profitRate,
        },
        change: {
            salesAmount: salesChange,
            salesRate: Math.round((salesChange / (prevYear.sales * 1000)) * 1000) / 10,
            cfAmount: cfChange,
            cfRate: Math.round((cfChange / (prevYear.operatingCF * 1000)) * 1000) / 10,
            profitRateChange: Math.round((current.profitRate - prevYear.profitRate) * 10) / 10,
        },
    };
}

/**
 * CSV → ReportData へのフル変換
 */
export function csvToReportData(
    csvText: string,
    storeName: string,
    reportMonth: string,
): ReportData {
    const rows = parseCSVToRows(csvText);
    let records = rowsToMonthlyRecords(rows);
    records = calculateMomTrends(records);

    const currentIndex = records.length - 1;
    const summary = calculateSummary(records, currentIndex);
    const yoyComparison = calculateYoyComparison(records, currentIndex);

    const today = new Date();
    const createdDate = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

    const emptyNotes: AiNotes = {
        specialNotes: '',
        costIssues: '',
        futureOutlook: '',
    };

    return {
        storeName,
        reportMonth,
        reportPeriod: `${reportMonth}度`,
        createdDate,
        summary,
        yoyComparison,
        monthlyTrend: records,
        flrAnalysisComment: '',
        aiNotes: emptyNotes,
    };
}

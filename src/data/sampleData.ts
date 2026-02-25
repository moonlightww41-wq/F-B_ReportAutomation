// ==========================================
// サンプルデータ（かね子 2026年1月）
// Phase D: 動的CommentSection対応
// ==========================================
import type { ReportData } from '../types/report';

export const sampleKaneko: ReportData = {
    storeName: 'かね子',
    reportMonth: '2026年1月',
    reportPeriod: '2026年1月度',
    createdDate: '2026年2月5日',

    summary: {
        sales: 7645485,
        salesYoyLabel: '(前年平均比 -1.5%)',
        operatingProfitRate: 18.0,
        profitRateYoyChange: -9.2,
        operatingCF: 1383837,
        fCostRate: 28.7,
        fCostRateChange: -0.1,
        flrCostRate: 70.1,
        flrCostRateChange: 6.6,
    },

    yoyComparison: {
        previousYear: { sales: 6316125, operatingCF: 1243260, profitRate: 23.1 },
        currentYear: { sales: 7645485, operatingCF: 1383837, profitRate: 18.0 },
        change: {
            salesAmount: 1329360,
            salesRate: 21.0,
            cfAmount: 140577,
            cfRate: 11.3,
            profitRateChange: -5.1,
        },
    },

    monthlyTrend: [
        { month: '25/1月', sales: 6316, cost: 1961, laborCost: 1686, operatingCF: 1243, profitRate: 23.1, fCostRate: 31.0, lCostRate: 26.7, rCostRate: 7.8, flrTotal: 65.5, momTrend: '-' },
        { month: '2月', sales: 6887, cost: 2030, laborCost: 1939, operatingCF: 1421, profitRate: 24.4, fCostRate: 29.5, lCostRate: 28.1, rCostRate: 7.1, flrTotal: 64.7, momTrend: '改善' },
        { month: '3月', sales: 7970, cost: 2304, laborCost: 2087, operatingCF: 1886, profitRate: 28.1, fCostRate: 28.9, lCostRate: 26.2, rCostRate: 6.7, flrTotal: 61.3, momTrend: '改善' },
        { month: '4月', sales: 7706, cost: 2076, laborCost: 1985, operatingCF: 2342, profitRate: 37.0, fCostRate: 25.6, lCostRate: 25.6, rCostRate: 6.3, flrTotal: 58.7, momTrend: '改善' },
        { month: '5月', sales: 8706, cost: 2542, laborCost: 2082, operatingCF: 2532, profitRate: 37.2, fCostRate: 29.2, lCostRate: 23.9, rCostRate: 5.7, flrTotal: 58.8, momTrend: '維持' },
        { month: '6月', sales: 7763, cost: 2165, laborCost: 2702, operatingCF: 1543, profitRate: 20.5, fCostRate: 27.9, lCostRate: 33.6, rCostRate: 6.3, flrTotal: 62.8, momTrend: 'やや悪化' },
        { month: '7月', sales: 7956, cost: 2272, laborCost: 2703, operatingCF: 1505, profitRate: 29.3, fCostRate: 29.5, lCostRate: 37.7, rCostRate: 6.5, flrTotal: 62.9, momTrend: '維持' },
        { month: '8月', sales: 8125, cost: 2365, laborCost: 2702, operatingCF: 1562, profitRate: 23.9, fCostRate: 29.1, lCostRate: 33.2, rCostRate: 6.3, flrTotal: 68.7, momTrend: '悪化' },
        { month: '9月', sales: 7960, cost: 2314, laborCost: 2847, operatingCF: 1385, profitRate: 20.3, fCostRate: 29.1, lCostRate: 35.8, rCostRate: 6.5, flrTotal: 71.9, momTrend: '悪化' },
        { month: '10月', sales: 8069, cost: 2372, laborCost: 2918, operatingCF: 1365, profitRate: 19.8, fCostRate: 29.4, lCostRate: 36.2, rCostRate: 6.4, flrTotal: 71.9, momTrend: '悪化' },
        { month: '11月', sales: 8129, cost: 2484, laborCost: 2580, operatingCF: 1689, profitRate: 25.5, fCostRate: 29.9, lCostRate: 31.7, rCostRate: 6.3, flrTotal: 68.0, momTrend: '改善' },
        { month: '12月', sales: 7878, cost: 2195, laborCost: 2633, operatingCF: 1374, profitRate: 23.2, fCostRate: 27.0, lCostRate: 33.4, rCostRate: 6.2, flrTotal: 66.6, momTrend: '改善' },
        { month: '26/1月', sales: 7645, cost: 2191, laborCost: 2678, operatingCF: 1384, profitRate: 18.0, fCostRate: 28.7, lCostRate: 35.0, rCostRate: 6.4, flrTotal: 70.1, momTrend: '悪化' },
    ],

    comments: [
        {
            id: 'c1',
            title: 'FLR分析コメント',
            content: '1月は価格改定後にも関わらずFコストが28.7%に上昇。特にフード原価率は42.3%と前月比+4.4ptの異常上昇を示しており、詳細調査が必要。Lコストも35.0%と高く、FLR合計は70%台に悪化した。',
        },
        {
            id: 'c2',
            title: '特記事項',
            content: 'フード原価率の異常上昇(42.3%)：特異点！価格改定実施後にも関わらず上昇。現在詳細原因を確認中。\n前年同月比増収：売上高は前年同月比+21.0%の大幅増加を達成。',
        },
        {
            id: 'c3',
            title: 'コスト構造の課題',
            content: '人件費の大幅増加：前年同月比+99.2万円増加。Lコスト35.0%と高水準。\nFLRコスト悪化：70.1%と高止まり。収益構造の再点検が必要。',
        },
        {
            id: 'c4',
            title: '今後の課題と展望',
            content: 'フード原価率上昇要因の特定と対策が急務。人件費コントロールの最適化とFLRコスト65%台への回復を目指す。',
        },
    ],

    deletedComments: [],
};

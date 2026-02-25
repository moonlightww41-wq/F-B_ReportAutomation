// ==========================================
// 月次業績報告書 データ型定義
// Phase D: 動的コメントセクション対応
// ==========================================

/** 月次データの1行分 */
export interface MonthlyRecord {
  month: string;          // "25/1月" 等
  sales: number;          // 売上高（千円）
  cost: number;           // 原価（千円）
  laborCost: number;      // 人件費（千円）
  operatingCF: number;    // 営業CF（千円）
  profitRate: number;     // 営業利益率（%）
  fCostRate: number;      // Fコスト＝原価率（%）
  lCostRate: number;      // Lコスト＝人件費率（%）
  rCostRate: number;      // Rコスト＝固定費率（%）
  flrTotal: number;       // FLR合計（%）
  momTrend: string;       // 前月対比（csvParser互換、UI非表示）
}

/** ①全体サマリー */
export interface SummaryData {
  sales: number;                  // 売上高（円）
  salesYoyLabel: string;          // "(前年平均比 -1.5%)" 等
  operatingProfitRate: number;    // 営業利益率（%）
  profitRateYoyChange: number;    // 前年平均比pt変動
  operatingCF: number;            // 営業CF（円）
  fCostRate: number;              // Fコスト(原価率)（%）
  fCostRateChange: number;        // 変動pt
  flrCostRate: number;            // FLRコスト（%）
  flrCostRateChange: number;      // 変動pt
}

/** ②前年同月比較の1行 */
export interface YoyRow {
  sales: number;
  operatingCF: number;
  profitRate: number;
}

/** ②前年同月比較 */
export interface YoyComparison {
  previousYear: YoyRow;
  currentYear: YoyRow;
  change: {
    salesAmount: number;
    salesRate: number;
    cfAmount: number;
    cfRate: number;
    profitRateChange: number;
  };
}

/** ④コメント — AI動的生成セクション */
export interface CommentSection {
  id: string;        // 一意識別子
  title: string;     // セクション名（AIが動的決定、編集可能）
  content: string;   // 本文（編集可能）
}

/** レポート全体データ */
export interface ReportData {
  storeName: string;
  reportMonth: string;         // "2026年1月"
  reportPeriod: string;        // "2026年1月度"
  createdDate: string;         // "2026年2月5日"
  summary: SummaryData;
  yoyComparison: YoyComparison;
  monthlyTrend: MonthlyRecord[];
  comments: CommentSection[];         // ④コメント（AI動的生成）
  deletedComments: CommentSection[];  // UNDO用スタック
}

/** アプリケーション全体のステート */
export type AppStep = 'select' | 'loading' | 'preview' | 'confirmed';

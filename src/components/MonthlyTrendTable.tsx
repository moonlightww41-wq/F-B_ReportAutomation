// ==========================================
// ③月次業績推移 & FLRコスト分析テーブル
// 前月対比列削除、前年度平均行追加、セル条件付き色分け
// ==========================================
import type { MonthlyRecord } from '../types/report';

interface Props {
    data: MonthlyRecord[];
}

/** 営業利益率の色分け */
function profitRateClass(value: number): string {
    if (value >= 30) return 'cell-excellent';
    if (value >= 25) return 'cell-good';
    if (value >= 20) return 'cell-ok';
    return 'cell-warning';
}

/** Fコスト(原価率)の色分け */
function fCostClass(value: number): string {
    if (value <= 25) return 'cell-excellent';
    if (value <= 28) return 'cell-good';
    if (value <= 30) return 'cell-ok';
    return 'cell-warning';
}

/** Lコスト(人件費率)の色分け */
function lCostClass(value: number): string {
    if (value <= 25) return 'cell-excellent';
    if (value <= 28) return 'cell-good';
    if (value <= 32) return 'cell-ok';
    return 'cell-warning';
}

/** FLR合計の色分け */
function flrClass(value: number): string {
    if (value <= 60) return 'cell-excellent';
    if (value <= 65) return 'cell-good';
    if (value <= 70) return 'cell-ok';
    return 'cell-danger';
}

/** 前年度平均を計算（最後の行を除く=前年の12ヶ月分） */
function calcPrevYearAverage(data: MonthlyRecord[]): MonthlyRecord {
    const prevYearData = data.slice(0, -1); // 最新月を除く
    const len = prevYearData.length;

    const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / len);
    const avgRate = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / len * 10) / 10;

    return {
        month: '前年度平均',
        sales: avg(prevYearData.map(r => r.sales)),
        cost: avg(prevYearData.map(r => r.cost)),
        laborCost: avg(prevYearData.map(r => r.laborCost)),
        operatingCF: avg(prevYearData.map(r => r.operatingCF)),
        profitRate: avgRate(prevYearData.map(r => r.profitRate)),
        fCostRate: avgRate(prevYearData.map(r => r.fCostRate)),
        lCostRate: avgRate(prevYearData.map(r => r.lCostRate)),
        rCostRate: avgRate(prevYearData.map(r => r.rCostRate)),
        flrTotal: avgRate(prevYearData.map(r => r.flrTotal)),
        momTrend: '-',
    };
}

export default function MonthlyTrendTable({ data }: Props) {
    const prevYearAvg = calcPrevYearAverage(data);

    return (
        <div className="section trend-section">
            <h3 className="section-title">③月次業績推移 & FLRコスト分析（推移）</h3>
            <div className="trend-table-wrapper">
                <table className="trend-table">
                    <thead>
                        <tr>
                            <th>月度</th>
                            <th>売上高<br /><span className="unit">(千円)</span></th>
                            <th>原価<br /><span className="unit">(千円)</span></th>
                            <th>人件費<br /><span className="unit">(千円)</span></th>
                            <th>営業CF<br /><span className="unit">(千円)</span></th>
                            <th>営業<br />利益率</th>
                            <th>FLRコスト<br /><span className="unit">(原価率)</span></th>
                            <th>Lコスト<br /><span className="unit">(人件費率)</span></th>
                            <th>Rコスト<br /><span className="unit">(固定費率)</span></th>
                            <th>FLR合計</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => {
                            const isLast = index === data.length - 1;
                            return (
                                <tr key={row.month} className={isLast ? 'current-month-row' : ''}>
                                    <td className="month-cell">{row.month}</td>
                                    <td className="num">{row.sales.toLocaleString()}</td>
                                    <td className="num">{row.cost.toLocaleString()}</td>
                                    <td className="num">{row.laborCost.toLocaleString()}</td>
                                    <td className="num">{row.operatingCF.toLocaleString()}</td>
                                    <td className={`num ${profitRateClass(row.profitRate)}`}>
                                        {row.profitRate.toFixed(1)}%
                                    </td>
                                    <td className={`num ${fCostClass(row.fCostRate)}`}>
                                        {row.fCostRate.toFixed(1)}%
                                    </td>
                                    <td className={`num ${lCostClass(row.lCostRate)}`}>
                                        {row.lCostRate.toFixed(1)}%
                                    </td>
                                    <td className="num">{row.rCostRate.toFixed(1)}%</td>
                                    <td className={`num ${flrClass(row.flrTotal)}`}>
                                        {row.flrTotal.toFixed(1)}%
                                    </td>
                                </tr>
                            );
                        })}
                        {/* 前年度平均行 */}
                        <tr className="prev-year-avg-row">
                            <td className="month-cell">{prevYearAvg.month}</td>
                            <td className="num">{prevYearAvg.sales.toLocaleString()}</td>
                            <td className="num">{prevYearAvg.cost.toLocaleString()}</td>
                            <td className="num">{prevYearAvg.laborCost.toLocaleString()}</td>
                            <td className="num">{prevYearAvg.operatingCF.toLocaleString()}</td>
                            <td className={`num ${profitRateClass(prevYearAvg.profitRate)}`}>
                                {prevYearAvg.profitRate.toFixed(1)}%
                            </td>
                            <td className={`num ${fCostClass(prevYearAvg.fCostRate)}`}>
                                {prevYearAvg.fCostRate.toFixed(1)}%
                            </td>
                            <td className={`num ${lCostClass(prevYearAvg.lCostRate)}`}>
                                {prevYearAvg.lCostRate.toFixed(1)}%
                            </td>
                            <td className="num">{prevYearAvg.rCostRate.toFixed(1)}%</td>
                            <td className={`num ${flrClass(prevYearAvg.flrTotal)}`}>
                                {prevYearAvg.flrTotal.toFixed(1)}%
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

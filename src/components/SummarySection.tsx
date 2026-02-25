// ==========================================
// ①全体サマリーセクション
// ==========================================
import type { SummaryData } from '../types/report';

interface Props {
    data: SummaryData;
    month: string;
}

function formatCurrency(value: number): string {
    return value.toLocaleString('ja-JP') + '円';
}

function changeLabel(value: number, unit: string = 'pt'): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value}${unit}`;
}

function changeClass(value: number, invertPositive = false): string {
    if (value === 0) return '';
    const isGood = invertPositive ? value < 0 : value > 0;
    return isGood ? 'positive' : 'negative';
}

export default function SummarySection({ data, month }: Props) {
    return (
        <div className="section summary-section">
            <h3 className="section-title">①全体サマリー：{month}</h3>
            <table className="summary-table">
                <tbody>
                    <tr>
                        <th>売上高</th>
                        <td className="value">{formatCurrency(data.sales)}</td>
                        <td className="change">({data.salesYoyLabel})</td>
                    </tr>
                    <tr>
                        <th>営業利益率</th>
                        <td className="value">{data.operatingProfitRate.toFixed(1)}%</td>
                        <td className={`change ${changeClass(data.profitRateYoyChange)}`}>
                            (前年平均比 {changeLabel(data.profitRateYoyChange)})
                        </td>
                    </tr>
                    <tr>
                        <th>営業CF</th>
                        <td className="value">{formatCurrency(data.operatingCF)}</td>
                        <td></td>
                    </tr>
                    <tr>
                        <th>Fコスト(原価率)</th>
                        <td className="value">{data.fCostRate.toFixed(1)}%</td>
                        <td className={`change ${changeClass(data.fCostRateChange, true)}`}>
                            ({changeLabel(data.fCostRateChange, 'pt')})
                            {' '}
                            <span className={`badge ${data.fCostRateChange <= 0 ? 'badge-improve' : 'badge-worse'}`}>
                                {data.fCostRateChange <= 0 ? '改善' : '悪化'}{Math.abs(data.fCostRateChange).toFixed(1)}pt
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <th>FLRコスト</th>
                        <td className="value">{data.flrCostRate.toFixed(1)}%</td>
                        <td className={`change ${changeClass(data.flrCostRateChange, true)}`}>
                            <span className={`badge ${data.flrCostRateChange <= 0 ? 'badge-improve' : 'badge-worse'}`}>
                                {data.flrCostRateChange <= 0 ? '改善' : '悪化'} {changeLabel(data.flrCostRateChange, 'pt')}
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

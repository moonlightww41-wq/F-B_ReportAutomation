// ==========================================
// ②前年同月比較テーブル
// ==========================================
import type { YoyComparison } from '../types/report';

interface Props {
    data: YoyComparison;
    currentYear: string;
    previousYear: string;
}

function formatNum(value: number): string {
    return value.toLocaleString('ja-JP');
}

function changeClass(value: number, invertPositive = false): string {
    if (value === 0) return '';
    const isGood = invertPositive ? value < 0 : value > 0;
    return isGood ? 'positive' : 'negative';
}

export default function YoyComparisonTable({ data, currentYear, previousYear }: Props) {
    return (
        <div className="section yoy-section">
            <h3 className="section-title">②前年同月比較（対{previousYear}）</h3>
            <table className="yoy-table">
                <thead>
                    <tr>
                        <th>項目</th>
                        <th>売上高</th>
                        <th>営業CF</th>
                        <th>営業利益率</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="label">{previousYear}</td>
                        <td>{formatNum(data.previousYear.sales)}</td>
                        <td>{formatNum(data.previousYear.operatingCF)}</td>
                        <td>{data.previousYear.profitRate.toFixed(1)}%</td>
                    </tr>
                    <tr>
                        <td className="label">{currentYear}</td>
                        <td>{formatNum(data.currentYear.sales)}</td>
                        <td>{formatNum(data.currentYear.operatingCF)}</td>
                        <td>{data.currentYear.profitRate.toFixed(1)}%</td>
                    </tr>
                    <tr className="change-row">
                        <td className="label">増減額/率</td>
                        <td className={changeClass(data.change.salesAmount)}>
                            {data.change.salesAmount >= 0 ? '+' : ''}{formatNum(data.change.salesAmount)}
                            <br />
                            <span className="rate">({data.change.salesRate >= 0 ? '+' : ''}{data.change.salesRate.toFixed(1)}%)</span>
                        </td>
                        <td className={changeClass(data.change.cfAmount)}>
                            {data.change.cfAmount >= 0 ? '+' : ''}{formatNum(data.change.cfAmount)}
                            <br />
                            <span className="rate">({data.change.cfRate >= 0 ? '+' : ''}{data.change.cfRate.toFixed(1)}%)</span>
                        </td>
                        <td className={changeClass(data.change.profitRateChange)}>
                            {data.change.profitRateChange >= 0 ? '+' : ''}{data.change.profitRateChange.toFixed(1)}pt
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

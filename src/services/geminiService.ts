// ==========================================
// Gemini API サービス
// Phase D: 動的コメントセクション生成 + APIキー環境変数対応
// ==========================================
import type { ReportData, CommentSection } from '../types/report';

// APIキー取得: 環境変数 → localStorage フォールバック
function getApiKey(): string {
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (envKey) return envKey;
    return localStorage.getItem('gemini_api_key') || '';
}

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash:generateContent';

function buildPrompt(data: ReportData): string {
    const current = data.monthlyTrend[data.monthlyTrend.length - 1];
    const previous = data.monthlyTrend.length >= 2
        ? data.monthlyTrend[data.monthlyTrend.length - 2]
        : null;

    // 前年同月比の情報
    const yoy = data.yoyComparison;

    return `あなたは飲食業界の経営コンサルタントです。以下の月次業績データを分析し、経営者向けのコメントセクションを生成してください。

## 店舗情報
- 店舗名: ${data.storeName}
- 対象月: ${data.reportMonth}

## 当月実績
- 売上高: ${current.sales.toLocaleString()}千円
- 営業利益率: ${current.profitRate}%
- Fコスト(原価率): ${current.fCostRate}%
- Lコスト(人件費率): ${current.lCostRate}%
- Rコスト(固定費率): ${current.rCostRate}%
- FLR合計: ${current.flrTotal}%
- 営業CF: ${current.operatingCF.toLocaleString()}千円
${previous ? `
## 前月実績
- 売上高: ${previous.sales.toLocaleString()}千円
- FLR合計: ${previous.flrTotal}%
- 営業利益率: ${previous.profitRate}%` : ''}

## 前年同月比
- 売上高変動: ${yoy.change.salesRate >= 0 ? '+' : ''}${yoy.change.salesRate.toFixed(1)}%
- 営業CF変動: ${yoy.change.cfRate >= 0 ? '+' : ''}${yoy.change.cfRate.toFixed(1)}%
- 営業利益率変動: ${yoy.change.profitRateChange >= 0 ? '+' : ''}${yoy.change.profitRateChange.toFixed(1)}pt

## FLRコスト基準（飲食業界）
- Fコスト目標: 25-30%
- Lコスト目標: 25-30%
- FLR合計目標: 60-65%（70%超は危険水準）

## 指示
上記データを分析し、経営者にとって**最も重要な発見・課題・アクション**を2〜4セクションにまとめてください。
- セクション名はデータに応じて動的に決定してください（固定名不要）
- 例: 「原価率の異常上昇」「売上増加の要因分析」「FLRコスト改善提案」「人件費構造の問題点」等
- 各セクションは具体的な数値を引用し、簡潔にまとめてください（各150字以内）
- 改善点には具体的なアクション提案を含めてください

## 出力フォーマット
以下のJSON配列のみを返してください（マークダウンやコードブロック不要）:
[
  {"title": "セクション名1", "content": "本文1"},
  {"title": "セクション名2", "content": "本文2"}
]`;
}

let commentIdCounter = 100;

export async function generateAIComments(reportData: ReportData): Promise<CommentSection[]> {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error('Gemini APIキーが設定されていません。環境変数 VITE_GEMINI_API_KEY を設定してください。');
    }

    const prompt = buildPrompt(reportData);

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 2048,
            },
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`Gemini API エラー: ${response.status} - ${errorData?.error?.message || response.statusText}`);
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // JSON部分を抽出（コードブロックで囲まれている場合にも対応）
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
        throw new Error('AIからの応答をパースできませんでした。');
    }

    const parsed: Array<{ title: string; content: string }> = JSON.parse(jsonMatch[0]);

    return parsed.map(item => ({
        id: `ai-${commentIdCounter++}`,
        title: item.title,
        content: item.content,
    }));
}

/** APIキーが設定されているかチェック */
export function hasApiKey(): boolean {
    return !!getApiKey();
}

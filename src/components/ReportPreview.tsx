// ==========================================
// レポートプレビュー全体コンポーネント
// Phase D: 動的コメント対応
// ①全体サマリー ②前年同月比較 ③月次業績推移 ④コメント
// ==========================================
import type { ReportData, CommentSection } from '../types/report';
import SummarySection from './SummarySection';
import YoyComparisonTable from './YoyComparisonTable';
import MonthlyTrendTable from './MonthlyTrendTable';
import CommentsEditor from './CommentsEditor';

interface Props {
    data: ReportData;
    isEditing: boolean;
    onCommentsChange: (comments: CommentSection[]) => void;
    onCommentDelete: (id: string) => void;
    onCommentUndo: () => void;
    onCommentAdd: () => void;
    onToggleEdit: () => void;
    onConfirm: () => void;
    onRegenerateAI: () => void;
    isGeneratingAI: boolean;
    onBack: () => void;
}

export default function ReportPreview({
    data,
    isEditing,
    onCommentsChange,
    onCommentDelete,
    onCommentUndo,
    onCommentAdd,
    onToggleEdit,
    onConfirm,
    onRegenerateAI,
    isGeneratingAI,
    onBack,
}: Props) {
    const currentYearLabel = data.reportMonth;
    const prevYearMatch = data.reportMonth.match(/(\d+)年(\d+)月/);
    const previousYearLabel = prevYearMatch
        ? `${parseInt(prevYearMatch[1]) - 1}年${prevYearMatch[2]}月`
        : '';

    return (
        <div className="report-container">
            {/* コントロールバー */}
            <div className="control-bar no-print">
                <button className="btn btn-back" onClick={onBack}>
                    ← 店舗選択に戻る
                </button>
                <div className="control-actions">
                    <button
                        className="btn btn-ai"
                        onClick={onRegenerateAI}
                        disabled={isGeneratingAI}
                    >
                        {isGeneratingAI ? '🔄 AI生成中...' : '🤖 AIコメント再生成'}
                    </button>
                    <button
                        className={`btn ${isEditing ? 'btn-save' : 'btn-edit'}`}
                        onClick={onToggleEdit}
                    >
                        {isEditing ? '💾 編集を保存' : '✏️ 編集モード'}
                    </button>
                    <button className="btn btn-confirm" onClick={onConfirm}>
                        ✅ 確定
                    </button>
                </div>
            </div>

            {/* A4横 レポート本体 */}
            <div className="report-page" id="report-page">
                {/* ヘッダー */}
                <div className="report-header">
                    <h1 className="report-title">
                        {data.reportMonth} 「{data.storeName}」 業績報告
                    </h1>
                    <p className="report-meta">
                        対象期間：{data.reportPeriod} ｜ 作成日：{data.createdDate}
                    </p>
                </div>

                {/* 上段: ①サマリー(左) + ②前年同月比較(右) */}
                <div className="report-top-row">
                    <SummarySection
                        data={data.summary}
                        month={data.reportMonth.replace(/^\d+年/, '')}
                    />
                    <YoyComparisonTable
                        data={data.yoyComparison}
                        currentYear={currentYearLabel}
                        previousYear={previousYearLabel}
                    />
                </div>

                {/* 下段: ③月次推移(左) + ④コメント(右) */}
                <div className="report-bottom-row">
                    <MonthlyTrendTable
                        data={data.monthlyTrend}
                    />
                    <CommentsEditor
                        comments={data.comments}
                        deletedComments={data.deletedComments}
                        onChange={onCommentsChange}
                        onDelete={onCommentDelete}
                        onUndo={onCommentUndo}
                        onAdd={onCommentAdd}
                        isEditing={isEditing}
                    />
                </div>
            </div>
        </div>
    );
}

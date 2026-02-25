// ==========================================
// ④その他特記事項 — 全コメントを右下にまとめる
// テキスト色強調対応（**赤字**等のマーカー解釈）
// ==========================================
import { useState, useEffect } from 'react';
import type { AiNotes } from '../types/report';

interface Props {
    notes: AiNotes;
    flrAnalysisComment: string;
    onChange: (notes: AiNotes) => void;
    onFlrCommentChange: (comment: string) => void;
    isEditing: boolean;
}

/**
 * テキスト中の特殊マーカーを解釈してJSXに変換
 * - 【赤】...【/赤】 → 赤字
 * - 【青】...【/青】 → 青字
 * - 数値の悪化（+XX%、+XXpt）→ 赤字ハイライト
 * - 数値の改善（-XX%）→ 青/緑字
 */
function renderHighlightedText(text: string) {
    if (!text) return null;

    // 手動マーカーの変換: 【赤】text【/赤】
    const parts = text.split(/(【赤】.*?【\/赤】|【青】.*?【\/青】)/gs);

    return parts.map((part, i) => {
        const redMatch = part.match(/【赤】(.*?)【\/赤】/s);
        if (redMatch) {
            return <span key={i} className="text-danger">{redMatch[1]}</span>;
        }
        const blueMatch = part.match(/【青】(.*?)【\/青】/s);
        if (blueMatch) {
            return <span key={i} className="text-positive">{blueMatch[1]}</span>;
        }

        // 数値パターンの自動ハイライト: 悪化 +XX.X% / +XXpt
        const autoHighlight = part.split(/(\+\d+\.?\d*%|\+\d+\.?\d*pt|悪化|異常|上昇|高水準|急務)/g);
        return autoHighlight.map((segment, j) => {
            if (/^\+\d|悪化|異常|上昇|高水準|急務/.test(segment)) {
                return <span key={`${i}-${j}`} className="text-danger">{segment}</span>;
            }
            if (/改善|達成|回復/.test(segment)) {
                return <span key={`${i}-${j}`} className="text-positive">{segment}</span>;
            }
            return <span key={`${i}-${j}`}>{segment}</span>;
        });
    });
}

export default function NotesEditor({ notes, flrAnalysisComment, onChange, onFlrCommentChange, isEditing }: Props) {
    const [localNotes, setLocalNotes] = useState<AiNotes>(notes);
    const [localFlrComment, setLocalFlrComment] = useState(flrAnalysisComment);

    useEffect(() => {
        setLocalNotes(notes);
    }, [notes]);

    useEffect(() => {
        setLocalFlrComment(flrAnalysisComment);
    }, [flrAnalysisComment]);

    const handleChange = (field: keyof AiNotes, value: string) => {
        const updated = { ...localNotes, [field]: value };
        setLocalNotes(updated);
        onChange(updated);
    };

    const handleFlrChange = (value: string) => {
        setLocalFlrComment(value);
        onFlrCommentChange(value);
    };

    const renderSection = (
        title: string,
        field: keyof AiNotes,
        marker: string,
        colorClass: string
    ) => {
        const value = localNotes[field];
        return (
            <div className={`note-block ${colorClass}`}>
                <h4 className="note-title">
                    <span className="note-marker">{marker}</span>
                    {title}
                </h4>
                {isEditing ? (
                    <textarea
                        className="note-textarea"
                        value={value}
                        onChange={(e) => handleChange(field, e.target.value)}
                        rows={4}
                        placeholder={`${title}を入力...`}
                    />
                ) : (
                    <div className="note-content">
                        {value.split('\n').filter(l => l.trim()).map((line, i) => (
                            <p key={i}>{renderHighlightedText(line)}</p>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="section notes-section">
            <h3 className="section-title">④その他特記事項</h3>

            {/* FLR分析コメント */}
            <div className="note-block note-flr">
                <h4 className="note-title">
                    <span className="note-marker">■</span>
                    FLR分析コメント
                </h4>
                {isEditing ? (
                    <textarea
                        className="note-textarea"
                        value={localFlrComment}
                        onChange={(e) => handleFlrChange(e.target.value)}
                        rows={2}
                        placeholder="FLR分析コメントを入力..."
                    />
                ) : (
                    <div className="note-content">
                        {localFlrComment.split('\n').filter(l => l.trim()).map((line, i) => (
                            <p key={i}>{renderHighlightedText(line)}</p>
                        ))}
                    </div>
                )}
            </div>

            {renderSection('特記事項', 'specialNotes', '■', 'note-special')}
            {renderSection('コスト構造の課題', 'costIssues', '■', 'note-cost')}
            {renderSection('今後の課題と展望', 'futureOutlook', '■', 'note-future')}
        </div>
    );
}

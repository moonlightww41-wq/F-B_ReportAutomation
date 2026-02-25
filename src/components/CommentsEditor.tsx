// ==========================================
// ④コメント — 動的セクション編集コンポーネント
// タイトル編集/本文編集/削除/UNDO対応
// ==========================================
import { useState, useEffect } from 'react';
import type { CommentSection } from '../types/report';

interface Props {
    comments: CommentSection[];
    deletedComments: CommentSection[];
    onChange: (comments: CommentSection[]) => void;
    onDelete: (id: string) => void;
    onUndo: () => void;
    onAdd: () => void;
    isEditing: boolean;
}

/**
 * テキスト中のキーワードを自動ハイライト
 * 悪化/異常/上昇/高水準/急務 → 赤字
 * 改善/達成/回復 → 緑字
 * +XX%/+XXpt → 赤字
 */
function renderHighlightedText(text: string) {
    if (!text) return null;

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

export default function CommentsEditor({
    comments,
    deletedComments,
    onChange,
    onDelete,
    onUndo,
    onAdd,
    isEditing,
}: Props) {
    const [localComments, setLocalComments] = useState<CommentSection[]>(comments);

    useEffect(() => {
        setLocalComments(comments);
    }, [comments]);

    const handleTitleChange = (id: string, newTitle: string) => {
        const updated = localComments.map(c =>
            c.id === id ? { ...c, title: newTitle } : c
        );
        setLocalComments(updated);
        onChange(updated);
    };

    const handleContentChange = (id: string, newContent: string) => {
        const updated = localComments.map(c =>
            c.id === id ? { ...c, content: newContent } : c
        );
        setLocalComments(updated);
        onChange(updated);
    };

    // セクションのカラーを循環
    const sectionColors = ['note-blue', 'note-orange', 'note-green', 'note-purple'];

    return (
        <div className="section comments-section">
            <h3 className="section-title">④コメント</h3>

            {localComments.map((section, index) => {
                const colorClass = sectionColors[index % sectionColors.length];
                return (
                    <div key={section.id} className={`comment-block ${colorClass}`}>
                        <div className="comment-header">
                            {isEditing ? (
                                <input
                                    type="text"
                                    className="comment-title-input"
                                    value={section.title}
                                    onChange={(e) => handleTitleChange(section.id, e.target.value)}
                                    placeholder="セクション名を入力..."
                                />
                            ) : (
                                <h4 className="comment-title">
                                    <span className="comment-marker">■</span>
                                    {section.title}
                                </h4>
                            )}
                            {isEditing && (
                                <button
                                    className="comment-delete-btn"
                                    onClick={() => onDelete(section.id)}
                                    title="このセクションを削除"
                                >
                                    🗑
                                </button>
                            )}
                        </div>

                        {isEditing ? (
                            <textarea
                                className="comment-textarea"
                                value={section.content}
                                onChange={(e) => handleContentChange(section.id, e.target.value)}
                                rows={4}
                                placeholder="コメントを入力..."
                            />
                        ) : (
                            <div className="comment-content">
                                {section.content.split('\n').filter(l => l.trim()).map((line, i) => (
                                    <p key={i}>{renderHighlightedText(line)}</p>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* 編集モード時: セクション追加ボタン */}
            {isEditing && (
                <button className="comment-add-btn" onClick={onAdd}>
                    ＋ セクション追加
                </button>
            )}

            {/* UNDO バー */}
            {deletedComments.length > 0 && (
                <div className="undo-bar">
                    <span>
                        「{deletedComments[deletedComments.length - 1].title}」を削除しました
                    </span>
                    <button className="undo-btn" onClick={onUndo}>
                        ↩ 元に戻す
                    </button>
                </div>
            )}
        </div>
    );
}

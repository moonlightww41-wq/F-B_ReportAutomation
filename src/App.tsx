// ==========================================
// メインアプリケーション
// Phase D: プルダウン選択 → 自動生成フロー
// ==========================================
import { useState, useCallback } from 'react';
import type { ReportData, AppStep, CommentSection } from './types/report';
import { generateAIComments, hasApiKey } from './services/geminiService';
import { fetchReportData } from './services/driveService';
import { sampleKaneko } from './data/sampleData';
import StoreSelector from './components/StoreSelector';
import ReportPreview from './components/ReportPreview';
import './App.css';

let nextCommentId = 200;

function App() {
  const [step, setStep] = useState<AppStep>('select');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // レポート生成ハンドラ（プルダウン選択後に呼ばれる）
  const handleGenerate = useCallback(async (storeName: string, _reportMonth: string) => {
    setIsLoading(true);
    setStep('loading');

    try {
      let data: ReportData;

      // 本番環境(Netlify)はDrive API経由で取得、開発環境はサンプルデータ使用
      const isDev = import.meta.env.DEV || window.location.hostname === 'localhost';
      if (!isDev) {
        data = await fetchReportData(storeName);
      } else {
        // ローカル開発: サンプルデータ使用
        console.log(`[DEV] ${storeName} のサンプルデータを使用`);
        data = { ...sampleKaneko, storeName, deletedComments: [] };
      }

      // APIキーがあればAIコメントを自動生成
      if (hasApiKey()) {
        try {
          const aiComments = await generateAIComments(data);
          data.comments = aiComments;
        } catch (err) {
          console.warn('AIコメント自動生成失敗:', err);
        }
      }

      setReportData(data);
      setStep('preview');
    } catch (err) {
      console.error('レポート生成エラー:', err);
      alert(`レポートの生成に失敗しました。\n${err instanceof Error ? err.message : err}`);
      setStep('select');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // AIコメント再生成
  const handleRegenerateAI = useCallback(async () => {
    if (!reportData) return;

    if (!hasApiKey()) {
      alert('AIコメント生成には環境変数 VITE_GEMINI_API_KEY の設定が必要です。\n\n.env ファイルに VITE_GEMINI_API_KEY=your-key を追加してください。');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const aiComments = await generateAIComments(reportData);
      setReportData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          comments: aiComments,
          deletedComments: [],
        };
      });
    } catch (err) {
      console.error('AI生成エラー:', err);
      alert('AIコメントの生成に失敗しました。');
    } finally {
      setIsGeneratingAI(false);
    }
  }, [reportData]);

  // コメント更新ハンドラ
  const handleCommentsChange = useCallback((comments: CommentSection[]) => {
    setReportData(prev => {
      if (!prev) return prev;
      return { ...prev, comments };
    });
  }, []);

  // コメント削除ハンドラ
  const handleCommentDelete = useCallback((id: string) => {
    setReportData(prev => {
      if (!prev) return prev;
      const deleted = prev.comments.find(c => c.id === id);
      if (!deleted) return prev;
      return {
        ...prev,
        comments: prev.comments.filter(c => c.id !== id),
        deletedComments: [...prev.deletedComments, deleted],
      };
    });
  }, []);

  // コメントUNDOハンドラ
  const handleCommentUndo = useCallback(() => {
    setReportData(prev => {
      if (!prev || prev.deletedComments.length === 0) return prev;
      const restored = prev.deletedComments[prev.deletedComments.length - 1];
      return {
        ...prev,
        comments: [...prev.comments, restored],
        deletedComments: prev.deletedComments.slice(0, -1),
      };
    });
  }, []);

  // コメントセクション追加ハンドラ
  const handleCommentAdd = useCallback(() => {
    setReportData(prev => {
      if (!prev) return prev;
      const newComment: CommentSection = {
        id: `new-${nextCommentId++}`,
        title: '新規セクション',
        content: '',
      };
      return {
        ...prev,
        comments: [...prev.comments, newComment],
      };
    });
  }, []);

  // 編集モード切替
  const handleToggleEdit = useCallback(() => {
    setIsEditing(prev => !prev);
  }, []);

  // 確定
  const handleConfirm = useCallback(() => {
    if (!reportData) return;
    setStep('confirmed');
    setIsEditing(false);
  }, [reportData]);

  // 店舗選択に戻る
  const handleBack = useCallback(() => {
    setStep('select');
    setIsEditing(false);
  }, []);

  return (
    <div className="app">
      {(step === 'select' || step === 'loading') && (
        <StoreSelector
          onGenerate={handleGenerate}
          isLoading={isLoading}
        />
      )}

      {step === 'preview' && reportData && (
        <ReportPreview
          data={reportData}
          isEditing={isEditing}
          onCommentsChange={handleCommentsChange}
          onCommentDelete={handleCommentDelete}
          onCommentUndo={handleCommentUndo}
          onCommentAdd={handleCommentAdd}
          onToggleEdit={handleToggleEdit}
          onConfirm={handleConfirm}
          onRegenerateAI={handleRegenerateAI}
          isGeneratingAI={isGeneratingAI}
          onBack={handleBack}
        />
      )}

      {step === 'confirmed' && reportData && (
        <div className="confirmed-container">
          <div className="confirmed-card">
            <div className="confirmed-icon">✅</div>
            <h2>レポートが確定されました</h2>
            <p>
              <strong>{reportData.storeName}</strong> {reportData.reportPeriod}の業績報告書が確定されました。
            </p>
            <div className="confirmed-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setStep('preview')}
              >
                📝 レポートに戻る
              </button>
              <button
                className="btn btn-confirm"
                onClick={() => window.print()}
              >
                🖨️ 印刷 / PDF保存
              </button>
              <button
                className="btn btn-back"
                onClick={handleBack}
              >
                📊 新しいレポートを作成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

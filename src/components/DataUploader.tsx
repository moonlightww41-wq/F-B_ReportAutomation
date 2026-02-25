// ==========================================
// データアップロード画面
// ==========================================
import { useState, useCallback } from 'react';

interface Props {
    onDataLoaded: (csvText: string, storeName: string, reportMonth: string) => void;
    onUseSampleData: () => void;
}

const STORE_OPTIONS = [
    'かね子',
    '店舗A',
    '店舗B',
    '店舗C',
    '店舗D',
    '店舗E',
    '店舗F',
    '店舗G',
    '店舗H',
    '店舗I',
];

export default function DataUploader({ onDataLoaded, onUseSampleData }: Props) {
    const [storeName, setStoreName] = useState(STORE_OPTIONS[0]);
    const [reportMonth, setReportMonth] = useState(() => {
        const now = new Date();
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return `${prevMonth.getFullYear()}年${prevMonth.getMonth() + 1}月`;
    });
    const [isDragOver, setIsDragOver] = useState(false);
    const [fileName, setFileName] = useState('');

    const handleFile = useCallback((file: File) => {
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            onDataLoaded(text, storeName, reportMonth);
        };
        reader.readAsText(file, 'UTF-8');
    }, [onDataLoaded, storeName, reportMonth]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    return (
        <div className="upload-container">
            <div className="upload-card">
                <div className="upload-header">
                    <h1 className="upload-title">
                        <span className="title-icon">📊</span>
                        月次業績報告書 自動生成システム
                    </h1>
                    <p className="upload-subtitle">
                        PLデータ（CSV）をアップロードして、レポートを自動生成します
                    </p>
                </div>

                <div className="upload-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="store-select">店舗選択</label>
                            <select
                                id="store-select"
                                value={storeName}
                                onChange={(e) => setStoreName(e.target.value)}
                            >
                                {STORE_OPTIONS.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="month-input">対象月</label>
                            <input
                                id="month-input"
                                type="text"
                                value={reportMonth}
                                onChange={(e) => setReportMonth(e.target.value)}
                                placeholder="例: 2026年1月"
                            />
                        </div>
                    </div>

                    <div
                        className={`dropzone ${isDragOver ? 'dropzone-active' : ''} ${fileName ? 'dropzone-loaded' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={handleDrop}
                    >
                        {fileName ? (
                            <div className="dropzone-loaded-content">
                                <span className="file-icon">✅</span>
                                <p className="file-name">{fileName}</p>
                                <p className="file-hint">クリックまたはドロップで変更</p>
                            </div>
                        ) : (
                            <div className="dropzone-content">
                                <span className="dropzone-icon">📁</span>
                                <p className="dropzone-text">CSVファイルをドラッグ&ドロップ</p>
                                <p className="dropzone-hint">または下のボタンからファイルを選択</p>
                            </div>
                        )}
                        <input
                            type="file"
                            accept=".csv,.txt"
                            onChange={handleFileInput}
                            className="file-input-hidden"
                        />
                    </div>

                    <div className="upload-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onUseSampleData}
                        >
                            📋 サンプルデータで試す
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

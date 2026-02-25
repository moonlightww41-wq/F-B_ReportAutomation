// ==========================================
// 店舗・月選択画面（DataUploaderの後継）
// プルダウン選択 → 自動レポート生成
// ==========================================
import { useState } from 'react';
import { STORE_FILE_MAP } from '../services/driveService';

interface Props {
    onGenerate: (storeName: string, reportMonth: string) => void;
    isLoading: boolean;
}


// driveService.tsのSTORE_FILE_MAPから実際の店舗名を取得
const STORES = Object.keys(STORE_FILE_MAP);

// 直近24ヶ月を生成
function generateMonthOptions(): string[] {
    const months: string[] = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(`${d.getFullYear()}年${d.getMonth() + 1}月`);
    }
    return months;
}

const MONTHS = generateMonthOptions();

export default function StoreSelector({ onGenerate, isLoading }: Props) {
    const [store, setStore] = useState(STORES[0]);
    const [month, setMonth] = useState(MONTHS[0]);

    const handleGenerate = () => {
        if (!store || !month) return;
        onGenerate(store, month);
    };

    return (
        <div className="select-container">
            <div className="select-card">
                <div className="select-header">
                    <h1 className="select-title">
                        <span className="title-icon">📊</span>
                        月次業績報告書
                    </h1>
                    <p className="select-subtitle">
                        店舗と対象月を選択してレポートを自動生成
                    </p>
                </div>

                <div className="select-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="store-select">店舗名</label>
                            <select
                                id="store-select"
                                value={store}
                                onChange={(e) => setStore(e.target.value)}
                                disabled={isLoading}
                            >
                                {STORES.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="month-select">対象月</label>
                            <select
                                id="month-select"
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                disabled={isLoading}
                            >
                                {MONTHS.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button
                        className="btn btn-generate"
                        onClick={handleGenerate}
                        disabled={isLoading || !store || !month}
                    >
                        {isLoading ? (
                            <>
                                <span className="spinner" /> データ読込中...
                            </>
                        ) : (
                            '📄 レポートを生成'
                        )}
                    </button>

                    <p className="select-note">
                        ※ データソースから対象月のPLデータを読み込み、AIがコメントを自動生成します
                    </p>
                </div>
            </div>
        </div>
    );
}

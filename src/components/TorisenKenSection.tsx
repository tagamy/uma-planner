import React, { useState } from 'react';
import type { TorisenKenState, TrainingRecord } from '../types';
import { REGIONS_DATA } from '../constants/torisenKenData';

interface TorisenKenSectionProps {
    state: TorisenKenState;
    records: TrainingRecord[];
    onChangeState: (updater: (prev: TorisenKenState) => TorisenKenState) => void;
    onAddRecord: (rank: string, score: string, sp: string) => void;
    onClearRecords: () => void;
}

export const TorisenKenSection: React.FC<TorisenKenSectionProps> = ({
    state,
    records,
    onChangeState,
    onAddRecord,
    onClearRecords
}) => {
    const [showTips, setShowTips] = useState(false);
    const [recordRank, setRecordRank] = useState('');
    const [recordScore, setRecordScore] = useState('');
    const [recordSp, setRecordSp] = useState('');


    const updateTips = (type: 'noodles' | 'soup' | 'toppings' | 'secret', delta: number) => {
        onChangeState(prev => {
            const current = prev.tips?.[type] || 0;
            return {
                ...prev,
                tips: {
                    ...prev.tips,
                    [type]: Math.max(0, current + delta)
                }
            };
        });
    };

    const totalTips = (state.tips?.noodles || 0) + (state.tips?.soup || 0) + (state.tips?.toppings || 0);

    const handleRegionChange = (period: 'junior' | 'classic' | 'senior', index: number, val: string) => {
        onChangeState(prev => {
            const nextPeriodRegions = [...prev.regions[period]] as [string, string, string];
            nextPeriodRegions[index] = val;
            
            const nextCounts = [...prev.ramenCounts[period]] as [number, number, number];
            nextCounts[index] = 0;

            return {
                ...prev,
                regions: {
                    ...prev.regions,
                    [period]: nextPeriodRegions
                },
                ramenCounts: {
                    ...prev.ramenCounts,
                    [period]: nextCounts
                }
            };
        });
    };

    const JUNIOR_REGIONS = [
        { label: '札幌 (スピードUP)', value: '札幌' },
        { label: '函館 (スタミナUP)', value: '函館' },
        { label: '新潟 (パワーUP)', value: '新潟' },
        { label: '福島 (根性UP)', value: '福島' },
        { label: '東京 (賢さUP)', value: '東京' },
    ];
    const CLASSIC_REGIONS = [
        { label: '中山 (全友情UP)', value: '中山' },
        { label: '中京 (パワー/根性UP)', value: '中京' },
        { label: '京都 (スタミナ/根性UP)', value: '京都' },
        { label: '阪神 (スタミナ/パワーUP)', value: '阪神' },
        { label: '小倉 (賢さUP)', value: '小倉' },
    ];
    const SENIOR_REGIONS = [
        { label: '札幌 (スピード/スキルPt UP)', value: '札幌' },
        { label: '函館 (スタミナ/スキルPt UP)', value: '函館' },
        { label: '新潟 (パワー/スキルPt UP)', value: '新潟' },
        { label: '福島 (根性/スキルPt UP)', value: '福島' },
        { label: '東京 (賢さ/スキルPt UP)', value: '東京' },
        { label: '中山 (スピ/パワ/賢さUP)', value: '中山' },
        { label: '中京 (スピ/パワ/根性UP)', value: '中京' },
        { label: '京都 (スピ/スタ/賢さUP)', value: '京都' },
        { label: '阪神 (スピ/スタ/パワUP)', value: '阪神' },
        { label: '小倉 (スピ/根性/賢さUP)', value: '小倉' },
    ];

    const handleRamenCountChange = (period: 'junior' | 'classic' | 'senior', index: number, delta: number) => {
        onChangeState(prev => {
            const currentArr = [...prev.ramenCounts[period]] as [number, number, number];
            currentArr[index] = Math.max(0, currentArr[index] + delta);
            return {
                ...prev,
                ramenCounts: {
                    ...prev.ramenCounts,
                    [period]: currentArr
                }
            };
        });
    };

    const handleShare = () => {
        const text = `ウマ娘の新シナリオ「トレセン軒編」で育成中！🍜🔥\n究極ラーメンを目指すよっ！\n\n`;
        const url = 'https://uma.tagamy.com/';
        const hashtags = 'ウマ娘,トレセン軒';
        const intentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=${encodeURIComponent(hashtags)}`;
        window.open(intentUrl, '_blank', 'noopener,noreferrer');
    };

    const handleAddRecordClick = () => {
        onAddRecord(recordRank, recordScore, recordSp);
        setRecordRank('');
        setRecordScore('');
        setRecordSp('');
    };

    const generateTsv = () => {
        if (!records || records.length === 0) return '';
        const lines = records.map(record => {
            const parts = [
                record.rank,
                record.score,
                record.sp,
                record.supportCards.join('/'),
            ];
            // Junior
            for (let i = 0; i < 3; i++) {
                parts.push(record.torisenKen.regions.junior[i] || '未選択', String(record.torisenKen.ramenCounts.junior[i] || 0));
            }
            // Classic
            for (let i = 0; i < 3; i++) {
                parts.push(record.torisenKen.regions.classic[i] || '未選択', String(record.torisenKen.ramenCounts.classic[i] || 0));
            }
            // Senior
            for (let i = 0; i < 3; i++) {
                parts.push(record.torisenKen.regions.senior[i] || '未選択', String(record.torisenKen.ramenCounts.senior[i] || 0));
            }
            return parts.join('\t');
        });
        return lines.join('\n');
    };

    const handleCopy = () => {
        const tsv = generateTsv();
        if (!tsv) {
            alert('コピーするデータがありません！');
            return;
        }
        navigator.clipboard.writeText(tsv).then(() => {
            alert('クリップボードにコピーしました！');
        }).catch(err => {
            console.error('Failed to copy', err);
            alert('コピーに失敗しました。');
        });
    };

    return (
        <section className="section torisen-ken-section">
            <div className="bd-section-header">
                <h2><span className="icon">🍜</span> らっしゃい！トレセン軒！ 進行管理</h2>
                <button className="x-share-btn" onClick={handleShare}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    ポスト
                </button>
            </div>

            {/* コツ管理 */}
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem', backgroundColor: '#fff3e0', borderLeft: '4px solid #ff9800' }}>
                <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>🍜 ラーメンのコツ所持数 (最大10)</span>
                    <span style={{ fontSize: '1rem', fontWeight: 'bold', color: totalTips > 10 ? 'red' : 'inherit' }}>
                        合計: {totalTips} / 10
                    </span>
                </h3>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-around', marginTop: '1rem', flexWrap: 'nowrap', overflowX: 'auto' }}>
                    {/* 麺 */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>麺</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button onClick={() => updateTips('noodles', -1)} style={{ padding: '0.25rem 0.75rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#f0f0f0', color: '#333' }}>-</button>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', minWidth: '1.5rem' }}>{state.tips?.noodles || 0}</span>
                            <button onClick={() => updateTips('noodles', 1)} style={{ padding: '0.25rem 0.75rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#f0f0f0', color: '#333' }}>+</button>
                        </div>
                    </div>
                    {/* スープ */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>スープ</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button onClick={() => updateTips('soup', -1)} style={{ padding: '0.25rem 0.75rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#f0f0f0', color: '#333' }}>-</button>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', minWidth: '1.5rem' }}>{state.tips?.soup || 0}</span>
                            <button onClick={() => updateTips('soup', 1)} style={{ padding: '0.25rem 0.75rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#f0f0f0', color: '#333' }}>+</button>
                        </div>
                    </div>
                    {/* トッピング */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>トッピング</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button onClick={() => updateTips('toppings', -1)} style={{ padding: '0.25rem 0.75rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#f0f0f0', color: '#333' }}>-</button>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', minWidth: '1.5rem' }}>{state.tips?.toppings || 0}</span>
                            <button onClick={() => updateTips('toppings', 1)} style={{ padding: '0.25rem 0.75rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#f0f0f0', color: '#333' }}>+</button>
                        </div>
                    </div>
                    {/* 隠し味の秘訣 (Max 4) */}
                    <div style={{ textAlign: 'center', borderLeft: '1px solid #ddd', paddingLeft: '1rem' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#e65100', whiteSpace: 'nowrap' }} title="隠し味の秘訣 (最大4)">隠し味</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button onClick={() => updateTips('secret', -1)} style={{ padding: '0.25rem 0.75rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#f0f0f0', color: '#333' }}>-</button>
                            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', minWidth: '1.5rem', color: (state.tips?.secret || 0) > 4 ? 'red' : 'inherit' }}>{state.tips?.secret || 0}</span>
                            <button onClick={() => updateTips('secret', 1)} style={{ padding: '0.25rem 0.75rem', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#f0f0f0', color: '#333' }}>+</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card region-recommend-card">
                <h3>1. ご当地ラーメン研究 (地域選択)</h3>

                <div className="regions-grid" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                        { id: 'junior' as const, label: 'ジュニア級 (3ターン目)', tip: 'たづな編成時は全コツ+2個でスタート！絆上げ最優先！🌸', options: JUNIOR_REGIONS },
                        { id: 'classic' as const, label: 'クラシック級 (1月前半)', tip: '全友情ボーナスUPの「中山」が超おすすめ！✨', options: CLASSIC_REGIONS },
                        { id: 'senior' as const, label: 'シニア級 (1月前半)', tip: 'ステータス上限（スピード特化なら札幌など）に合わせて選ぼう！🌟', options: SENIOR_REGIONS }
                    ].map((item) => (
                        <div key={item.id} className="region-select-box" style={{ padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                            <span className="region-label" style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>{item.label}</span>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                {[0, 1, 2].map(index => {
                                    const selectedRegionVal = state.regions[item.id][index];
                                    const regionData = selectedRegionVal ? REGIONS_DATA[item.id][selectedRegionVal] : null;
                                    
                                    return (
                                        <div key={index} style={{ marginBottom: '0.25rem', padding: '0.5rem', backgroundColor: '#f9f9f9', borderRadius: '4px', border: '1px solid #eee' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: regionData ? '0.5rem' : '0' }}>
                                                <select 
                                                    value={selectedRegionVal} 
                                                    onChange={(e) => handleRegionChange(item.id, index, e.target.value)}
                                                    className="region-select"
                                                    style={{ flex: 1 }}
                                                >
                                                    <option value="">-- 地域{index + 1} --</option>
                                                    {item.options.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                                
                                                {selectedRegionVal && (
                                                    <div className="counter-stepper" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fff', padding: '2px 6px', borderRadius: '4px', border: '1px solid #ccc' }}>
                                                        <span style={{ fontSize: '0.8rem', color: '#666' }}>作成</span>
                                                        <button 
                                                            onClick={() => handleRamenCountChange(item.id, index, -1)} 
                                                            disabled={!state.ramenCounts[item.id][index]}
                                                            style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#f0f0f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                                                        >-</button>
                                                        <span style={{ fontWeight: 'bold', minWidth: '1.2rem', textAlign: 'center' }}>{state.ramenCounts[item.id][index]}</span>
                                                        <button 
                                                            onClick={() => handleRamenCountChange(item.id, index, 1)}
                                                            style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#f0f0f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                                                        >+</button>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {regionData && (
                                                <div style={{ fontSize: '0.85rem', color: '#444' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                        <span style={{ fontWeight: 'bold' }}>🍜コスト:</span>
                                                        <span>麺{regionData.cost.noodles} / スープ{regionData.cost.soup} / トピ{regionData.cost.toppings}</span>
                                                    </div>
                                                    <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#0056b3' }}>
                                                        {regionData.effects.map((ef, i) => (
                                                            <li key={i}>{ef}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <span className="region-tip" style={{ fontSize: '0.85rem', color: '#666' }}>{item.tip}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* 育成完了＆記録セクション */}
            <div className="card record-card" style={{ marginTop: '2rem' }}>
                <h3>📋 育成完了＆記録 (スプレッドシート用)</h3>
                <div className="record-form" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem', backgroundColor: '#f9f9f9', padding: '1rem', borderRadius: '8px', border: '1px solid #ddd' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>ランク</label>
                        <input type="text" value={recordRank} onChange={e => setRecordRank(e.target.value)} placeholder="例: UE" style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>評価点</label>
                        <input type="number" value={recordScore} onChange={e => setRecordScore(e.target.value)} placeholder="例: 35000" style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>獲得SP</label>
                        <input type="number" value={recordSp} onChange={e => setRecordSp(e.target.value)} placeholder="例: 4500" style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button onClick={handleAddRecordClick} style={{ padding: '0.5rem 1.5rem', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                            ✍️ 記録する
                        </button>
                    </div>
                </div>

                <div className="record-output">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>記録データ (TSV形式)</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button 
                                onClick={handleCopy}
                                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', backgroundColor: '#e3f2fd', color: '#1565c0', border: '1px solid #90caf9', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                📋 コピー
                            </button>
                            <button 
                                onClick={onClearRecords}
                                style={{ fontSize: '0.8rem', padding: '0.25rem 0.5rem', backgroundColor: '#eee', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                🗑️ 記録をクリア
                            </button>
                        </div>
                    </div>
                    <textarea 
                        readOnly 
                        value={generateTsv()} 
                        style={{ width: '100%', height: '150px', padding: '0.5rem', boxSizing: 'border-box', fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre', overflow: 'auto', borderRadius: '4px', border: '1px solid #ccc' }}
                        placeholder="記録を追加するとここにタブ区切りのデータが表示されます。全選択してコピー＆ペーストしてください。"
                    />
                </div>
            </div>

            {/* 詳細効果一覧 */}
            <div className="bd-effects-toggle">
                <button
                    className="bd-effects-btn"
                    onClick={() => setShowTips(!showTips)}
                >
                    {showTips ? "▲ 育成システム概要を隠す" : "▼ 育成システム概要を確認"}
                </button>
                {showTips && (
                    <div className="bd-effects-content full-details">
                        <h4>🍜 新友人サポカ効果 [一杯のノスタルジア] 駿川たづな</h4>
                        <ul>
                            <li>ジュニア3T開始時に、コツ全種を <strong>+2個</strong> 獲得した状態でスタート！</li>
                            <li>お出かけイベントで「隠し味の秘訣」を<strong>各2個ずつ</strong>獲得可能！</li>
                            <li><strong>夏合宿中、練習をするだけで習得ゲージが毎ターンMAX</strong>になる超強力仕様！</li>
                        </ul>

                        <h4>🍜 基礎能力の上限値 (目安)</h4>
                        <div className="stats-grid">
                            <div><span>スピード</span><strong>2150</strong></div>
                            <div><span>スタミナ</span><strong>1800</strong></div>
                            <div><span>パワー</span><strong>1700</strong></div>
                            <div><span>根性</span><strong>1700</strong></div>
                            <div><span>賢さ</span><strong>1800</strong></div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

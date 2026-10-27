import React, { useState } from 'react';
import type {
    ShuntaisaiState,
    SupportCard,
    SupportCardType,
    TrainingRecord,
    EnmokuKey,
    JuniorOshie,
    ClassicOshie,
    SeniorOshie,
} from '../types';
import {
    ENMOKU_LIST,
    JUNIOR_OSHIE_DATA,
    SHUNTAISAI_PRESETS,
    getClassicOshieEffectText,
    getSeniorOshieEffectText,
    getFukutsuStatus,
} from '../constants/shuntaisaiData';

interface ShuntaisaiSectionProps {
    state: ShuntaisaiState;
    supportCards: SupportCard[];
    records: TrainingRecord[];
    onChangeState: (updater: (prev: ShuntaisaiState) => ShuntaisaiState) => void;
    onApplyDeckPreset: (types: SupportCardType[]) => void;
    onAddRecord: (rank: string, score: string, sp: string, juniorSp: string, classicSp: string) => void;
    onClearRecords: () => void;
}

const JUNIOR_OPTIONS: Exclude<JuniorOshie, ''>[] = ['絆', '得意率', 'ヒント', '助力', '体力'];
const CLASSIC_OPTIONS: Exclude<ClassicOshie, ''>[] = ['特化', '研鑽'];
const SENIOR_OPTIONS: Exclude<SeniorOshie, ''>[] = ['協力', '不屈', '両道'];

export const ShuntaisaiSection: React.FC<ShuntaisaiSectionProps> = ({
    state,
    supportCards,
    records,
    onChangeState,
    onApplyDeckPreset,
    onAddRecord,
    onClearRecords,
}) => {
    const [showCheatSheet, setShowCheatSheet] = useState(false);
    const [cheatSheetTab, setCheatSheetTab] = useState<1 | 2 | 3>(1);

    const [recordRank, setRecordRank] = useState('');
    const [recordScore, setRecordScore] = useState('');
    const [recordSp, setRecordSp] = useState('');
    const [recordJuniorSp, setRecordJuniorSp] = useState('');
    const [recordClassicSp, setRecordClassicSp] = useState('');

    // サポカ5種類ルールの計算（上部サポカ5枠 ＋ 吾妻(友人枠)）
    const uniqueTypesSet = new Set<string>(supportCards.map(c => c.type));
    if (state.hasAzuma) {
        uniqueTypesSet.add('友人');
    }
    const uniqueTypeCount = uniqueTypesSet.size;
    const isFiveTypesRuleMet = uniqueTypeCount >= 5;

    // 演目Lv上限（吾妻あり: 10 / なし: 6）
    const maxLevel = state.hasAzuma ? 10 : 6;

    // 最低Lvの算出（吾妻のお出かけ「最低Lv+1」対象）
    const levels = ENMOKU_LIST.map(e => state.enmoku[e.key]?.level || 1);
    const minLevel = Math.min(...levels);
    const totalLevel = levels.reduce((acc, v) => acc + v, 0);

    const handleLevelChange = (key: EnmokuKey, delta: number) => {
        onChangeState(prev => {
            const cur = prev.enmoku[key]?.level || 1;
            const limit = prev.hasAzuma ? 10 : 6;
            const next = Math.max(1, Math.min(limit, cur + delta));
            return {
                ...prev,
                enmoku: {
                    ...prev.enmoku,
                    [key]: {
                        ...prev.enmoku[key],
                        level: next,
                    },
                },
            };
        });
    };

    const handleResetLevels = () => {
        onChangeState(prev => {
            const nextEnmoku = { ...prev.enmoku };
            (Object.keys(nextEnmoku) as EnmokuKey[]).forEach(k => {
                nextEnmoku[k] = { ...nextEnmoku[k], level: 1 };
            });
            return {
                ...prev,
                outingCount: 0,
                enmoku: nextEnmoku,
            };
        });
    };

    const handleOshieChange = <K extends 'junior' | 'classic' | 'senior'>(
        key: EnmokuKey,
        period: K,
        value: ShuntaisaiState['enmoku'][EnmokuKey][K]
    ) => {
        onChangeState(prev => ({
            ...prev,
            presetName: 'custom',
            enmoku: {
                ...prev.enmoku,
                [key]: {
                    ...prev.enmoku[key],
                    [period]: value,
                },
            },
        }));
    };

    const handleApplyPreset = (presetId: string, alsoApplyDeck: boolean) => {
        const preset = SHUNTAISAI_PRESETS.find(p => p.id === presetId);
        if (!preset) return;

        onChangeState(prev => {
            const nextEnmoku = { ...prev.enmoku };
            (Object.keys(preset.enmoku) as EnmokuKey[]).forEach(k => {
                nextEnmoku[k] = {
                    level: prev.enmoku[k]?.level || 1,
                    ...preset.enmoku[k],
                };
            });
            return {
                ...prev,
                presetName: preset.id,
                enmoku: nextEnmoku,
            };
        });

        if (alsoApplyDeck && preset.deckTypes) {
            onApplyDeckPreset(preset.deckTypes);
        }
    };

    const handleToggleAzuma = () => {
        onChangeState(prev => {
            const nextHasAzuma = !prev.hasAzuma;
            const limit = nextHasAzuma ? 10 : 6;
            const nextEnmoku = { ...prev.enmoku };
            (Object.keys(nextEnmoku) as EnmokuKey[]).forEach(k => {
                if (nextEnmoku[k].level > limit) {
                    nextEnmoku[k] = { ...nextEnmoku[k], level: limit };
                }
            });
            return {
                ...prev,
                hasAzuma: nextHasAzuma,
                enmoku: nextEnmoku,
            };
        });
    };

    const handleOutingChange = (count: number) => {
        onChangeState(prev => ({
            ...prev,
            outingCount: Math.max(0, Math.min(5, count)),
        }));
    };

    const handleShare = () => {
        const text = `ウマ娘の新シナリオ「朋、史解き ―午式駿大祭―」で育成中！⛩️🔥\n教え転成＆不屈Lv10で最高峰LGランクを目指すよっ！\n\n`;
        const url = 'https://uma.tagamy.com/';
        const hashtags = 'ウマ娘,午式駿大祭';
        const intentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=${encodeURIComponent(hashtags)}`;
        window.open(intentUrl, '_blank', 'noopener,noreferrer');
    };

    const handleAddRecordClick = () => {
        onAddRecord(recordRank, recordScore, recordSp, recordJuniorSp, recordClassicSp);
        setRecordRank('');
        setRecordScore('');
        setRecordSp('');
        setRecordJuniorSp('');
        setRecordClassicSp('');
    };

    const generateTsv = () => {
        if (!records || records.length === 0) return '';
        const lines = records.map(record => {
            const parts = [
                record.rank,
                record.score,
                record.sp,
                record.juniorSp || '',
                record.classicSp || '',
                record.supportCards.join('/'),
            ];

            if (record.shuntaisai) {
                ENMOKU_LIST.forEach(meta => {
                    const plan = record.shuntaisai?.enmoku[meta.key];
                    if (plan) {
                        parts.push(
                            `${plan.junior || '-'}→${plan.classic || '-'}→${plan.senior || '-'}`,
                            `Lv${plan.level}`
                        );
                    } else {
                        parts.push('-', 'Lv1');
                    }
                });
            } else if (record.torisenKen) {
                for (let i = 0; i < 3; i++) {
                    parts.push(record.torisenKen.regions.junior[i] || '未選択', String(record.torisenKen.ramenCounts.junior[i] || 0));
                }
                for (let i = 0; i < 3; i++) {
                    parts.push(record.torisenKen.regions.classic[i] || '未選択', String(record.torisenKen.ramenCounts.classic[i] || 0));
                }
                for (let i = 0; i < 3; i++) {
                    parts.push(record.torisenKen.regions.senior[i] || '未選択', String(record.torisenKen.ramenCounts.senior[i] || 0));
                }
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
        <section className="section shuntaisai-section">
            <div className="bd-section-header" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2 style={{ margin: 0 }}>
                    <span className="icon">⛩️</span> 朋、史解き ―午式駿大祭― 進行管理
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <a
                        href={`${import.meta.env.BASE_URL}shuntaisai/index.html`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            padding: '0.4rem 0.75rem',
                            backgroundColor: '#fff8e1',
                            color: '#d84315',
                            border: '1px solid #ffb74d',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            textDecoration: 'none',
                        }}
                    >
                        📜 攻略インフォグラフィック
                    </a>
                    <button className="x-share-btn" onClick={handleShare}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        ポスト
                    </button>
                </div>
            </div>

            {/* 1. 5種類ルール自動判定 ＆ 吾妻・お出かけ管理 */}
            <div
                className="card"
                style={{
                    marginBottom: '1.25rem',
                    padding: '1rem 1.25rem',
                    backgroundColor: isFiveTypesRuleMet ? '#f1f8e9' : '#ffebee',
                    borderLeft: `5px solid ${isFiveTypesRuleMet ? '#43a047' : '#e53935'}`,
                    borderRadius: '8px',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>{isFiveTypesRuleMet ? '✅' : '⚠️'}</span>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: isFiveTypesRuleMet ? '#2e7d32' : '#c62828' }}>
                                {isFiveTypesRuleMet
                                    ? `サポカ5種類ルール達成！（現在 ${uniqueTypeCount} 種類）`
                                    : `【編成警告】サポカタイプが ${uniqueTypeCount} 種類しかありません！（5種類必須）`}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: isFiveTypesRuleMet ? '#388e3c' : '#d32f2f', marginTop: '0.15rem' }}>
                                {isFiveTypesRuleMet
                                    ? 'シナリオ固有ボーナス「スキルPtトレーニング効果」＆「獲得上限アップ」が発動中です🔥'
                                    : '5種類未満だと「スキルPtトレーニング効果」と「獲得上限アップ」が発動しません！下のデッキプリセットかサポカ欄で調整しよう！'}
                            </div>
                        </div>
                    </div>

                    {/* デッキタイプ一括プリセット */}
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => onApplyDeckPreset(['スピード', 'スピード', 'スタミナ', 'パワー', '賢さ'])}
                            style={{
                                fontSize: '0.75rem',
                                padding: '0.3rem 0.6rem',
                                backgroundColor: '#fff',
                                color: '#e65100',
                                border: '1px solid #ffb74d',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                            }}
                            title="サポカ5枠を スピ2/スタ1/パワ1/賢1 に設定します"
                        >
                            🎴 中・長距離デッキ適用
                        </button>
                        <button
                            onClick={() => onApplyDeckPreset(['スピード', 'スピード', 'パワー', '根性', '賢さ'])}
                            style={{
                                fontSize: '0.75rem',
                                padding: '0.3rem 0.6rem',
                                backgroundColor: '#fff',
                                color: '#c2185b',
                                border: '1px solid #f48fb1',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                            }}
                            title="サポカ5枠を スピ2/パワ1/根性1/賢1 に設定します"
                        >
                            🎴 短・マイルデッキ適用
                        </button>
                    </div>
                </div>

                {/* SSR吾妻 ＆ お出かけトラッカー */}
                <div
                    style={{
                        marginTop: '0.85rem',
                        paddingTop: '0.75rem',
                        borderTop: '1px dashed rgba(0,0,0,0.15)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <label
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.9rem',
                                color: '#4a148c',
                                backgroundColor: '#f3e5f5',
                                padding: '0.3rem 0.7rem',
                                borderRadius: '6px',
                                border: '1px solid #ce93d8',
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={state.hasAzuma}
                                onChange={handleToggleAzuma}
                                style={{ cursor: 'pointer' }}
                            />
                            <span>👑 友人SSR「吾妻」編成（演目上限 Lv.{maxLevel}）</span>
                        </label>
                    </div>

                    {state.hasAzuma && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#6a1b9a' }}>
                                👘 吾妻お出かけ（最低演目Lv+1）:
                            </span>
                            <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                                {[1, 2, 3, 4, 5].map(step => {
                                    const done = state.outingCount >= step;
                                    return (
                                        <button
                                            key={step}
                                            onClick={() => handleOutingChange(done && state.outingCount === step ? step - 1 : step)}
                                            style={{
                                                width: '28px',
                                                height: '28px',
                                                borderRadius: '50%',
                                                border: done ? '2px solid #ab47bc' : '1px solid #ccc',
                                                backgroundColor: done ? '#ab47bc' : '#fff',
                                                color: done ? '#fff' : '#888',
                                                fontWeight: 'bold',
                                                fontSize: '0.8rem',
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: 0,
                                            }}
                                            title={`お出かけ ${step}回目`}
                                        >
                                            {step}
                                        </button>
                                    );
                                })}
                                <span style={{ fontSize: '0.8rem', color: '#555', marginLeft: '0.25rem' }}>
                                    ({state.outingCount}/5)
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. おすすめ転成ビルド・プリセット */}
            <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem', backgroundColor: '#fff8e1', border: '1px solid #ffe082', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.6rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: '#e65100', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>🎯 おすすめ転成ビルドルート・プリセット</span>
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: '#666' }}>
                        ワンタップで5演目の「ジュニア→クラシック→シニア」教え計画をセット！
                    </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.6rem' }}>
                    {SHUNTAISAI_PRESETS.map(preset => {
                        const isSelected = state.presetName === preset.id;
                        return (
                            <div
                                key={preset.id}
                                style={{
                                    backgroundColor: isSelected ? '#fff3e0' : '#fff',
                                    border: isSelected ? '2px solid #ff9800' : '1px solid #e0e0e0',
                                    borderRadius: '8px',
                                    padding: '0.75rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    gap: '0.5rem',
                                }}
                            >
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                                        <span style={{ fontWeight: 'bold', fontSize: '0.88rem', color: '#333' }}>{preset.name}</span>
                                        <span style={{ fontSize: '0.7rem', backgroundColor: '#ffe0b2', color: '#e65100', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                            {preset.badge}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.76rem', color: '#666', lineHeight: 1.4 }}>
                                        {preset.description}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                    <button
                                        onClick={() => handleApplyPreset(preset.id, false)}
                                        style={{
                                            flex: 1,
                                            padding: '0.35rem 0.5rem',
                                            backgroundColor: '#ff9800',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontSize: '0.78rem',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        📜 教えのみ適用
                                    </button>
                                    {preset.deckTypes && (
                                        <button
                                            onClick={() => handleApplyPreset(preset.id, true)}
                                            style={{
                                                padding: '0.35rem 0.5rem',
                                                backgroundColor: '#ffe0b2',
                                                color: '#bf360c',
                                                border: '1px solid #ffb74d',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                            }}
                                            title="サポカ5枠のタイプも同時に変更します"
                                        >
                                            ＋サポカも適用
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 3. 5演目の「教え＆転成ビルド表」＆ 現在Lvトラッカー */}
            <div className="card" style={{ padding: '1.25rem', borderRadius: '8px', border: '1px solid #e0e0e0', backgroundColor: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div>
                        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>🏮 5演目「教え＆転成」進行トラッカー</span>
                            <span style={{ fontSize: '0.85rem', backgroundColor: '#fce4ec', color: '#c2185b', padding: '0.15rem 0.6rem', borderRadius: '12px', fontWeight: 'bold' }}>
                                合計 Lv.{totalLevel} / {maxLevel * 5}
                            </span>
                        </h3>
                    </div>
                    <button
                        onClick={handleResetLevels}
                        style={{
                            fontSize: '0.78rem',
                            padding: '0.3rem 0.7rem',
                            backgroundColor: '#f5f5f5',
                            color: '#555',
                            border: '1px solid #ccc',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                        }}
                    >
                        🔄 演目Lv・お出かけを1に戻す
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {ENMOKU_LIST.map(meta => {
                        const plan = state.enmoku[meta.key] || { level: 1, junior: '', classic: '', senior: '' };
                        const isLowest = state.hasAzuma && plan.level === minLevel && plan.level < maxLevel;
                        const juniorMeta = plan.junior ? JUNIOR_OSHIE_DATA[plan.junior] : null;
                        const classicEffectText = getClassicOshieEffectText(plan.classic, plan.level);
                        const seniorEffectText = getSeniorOshieEffectText(plan.senior, plan.level);
                        const isFukutsu = plan.senior === '不屈';
                        const fukutsuStatus = isFukutsu ? getFukutsuStatus(plan.level) : null;

                        return (
                            <div
                                key={meta.key}
                                style={{
                                    backgroundColor: meta.bgLight,
                                    border: `2px solid ${meta.borderColor}`,
                                    borderRadius: '10px',
                                    padding: '0.85rem 1rem',
                                }}
                            >
                                {/* 上段：演目名・上限・ターゲットバッジ・Lvカウンター */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.65rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '1.2rem' }}>{meta.icon}</span>
                                        <span style={{ fontWeight: 'bold', fontSize: '1.05rem', color: meta.color }}>
                                            {meta.label}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: '#666', backgroundColor: 'rgba(255,255,255,0.8)', padding: '0.1rem 0.45rem', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.08)' }}>
                                            上限 {meta.cap}
                                        </span>

                                        {isLowest && (
                                            <span
                                                style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold',
                                                    backgroundColor: '#ab47bc',
                                                    color: '#fff',
                                                    padding: '0.15rem 0.5rem',
                                                    borderRadius: '12px',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.2rem',
                                                }}
                                                title="現在最もLvが低いため、SSR吾妻のお出かけでLv+1される対象です"
                                            >
                                                🎯 お出かけ+1対象
                                            </span>
                                        )}
                                    </div>

                                    {/* 演目Lv ＋/ー コントロール */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#fff', padding: '0.25rem 0.5rem', borderRadius: '8px', border: `1px solid ${meta.borderColor}` }}>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#555', marginRight: '0.2rem' }}>演目Lv</span>
                                        <button
                                            onClick={() => handleLevelChange(meta.key, -1)}
                                            disabled={plan.level <= 1}
                                            style={{
                                                width: '30px',
                                                height: '30px',
                                                borderRadius: '6px',
                                                border: '1px solid #ccc',
                                                backgroundColor: plan.level <= 1 ? '#f5f5f5' : '#fff',
                                                color: plan.level <= 1 ? '#bbb' : '#333',
                                                fontWeight: 'bold',
                                                fontSize: '1rem',
                                                cursor: plan.level <= 1 ? 'default' : 'pointer',
                                            }}
                                        >
                                            -
                                        </button>
                                        <span
                                            style={{
                                                fontSize: '1.15rem',
                                                fontWeight: '900',
                                                minWidth: '2.6rem',
                                                textAlign: 'center',
                                                color: plan.level === maxLevel ? '#d32f2f' : '#222',
                                            }}
                                        >
                                            {plan.level}
                                            <span style={{ fontSize: '0.7rem', fontWeight: 'normal', color: '#777' }}>/{maxLevel}</span>
                                        </span>
                                        <button
                                            onClick={() => handleLevelChange(meta.key, 1)}
                                            disabled={plan.level >= maxLevel}
                                            style={{
                                                width: '30px',
                                                height: '30px',
                                                borderRadius: '6px',
                                                border: '1px solid #ccc',
                                                backgroundColor: plan.level >= maxLevel ? '#f5f5f5' : meta.color,
                                                color: plan.level >= maxLevel ? '#bbb' : '#fff',
                                                fontWeight: 'bold',
                                                fontSize: '1rem',
                                                cursor: plan.level >= maxLevel ? 'default' : 'pointer',
                                            }}
                                        >
                                            +
                                        </button>
                                        {plan.level < maxLevel && (
                                            <button
                                                onClick={() => handleLevelChange(meta.key, maxLevel - plan.level)}
                                                style={{
                                                    fontSize: '0.7rem',
                                                    padding: '0.25rem 0.4rem',
                                                    borderRadius: '4px',
                                                    border: '1px solid #ffb74d',
                                                    backgroundColor: '#fff8e1',
                                                    color: '#e65100',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer',
                                                }}
                                                title={`一気にLv.${maxLevel}にします`}
                                            >
                                                MAX
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* 中段：ジュニア・クラシック・シニア 3期の教えプルダウン */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
                                    {/* ジュニア期 */}
                                    <div style={{ backgroundColor: 'rgba(255,255,255,0.9)', padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.08)' }}>
                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 'bold', color: '#666', marginBottom: '0.2rem' }}>
                                            ① ジュニア期（基本5種）
                                        </label>
                                        <select
                                            value={plan.junior}
                                            onChange={e => handleOshieChange(meta.key, 'junior', e.target.value as JuniorOshie)}
                                            style={{ width: '100%', padding: '0.3rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.85rem', fontWeight: 'bold', backgroundColor: '#fff', color: '#333' }}
                                        >
                                            <option value="">-- 未選択 --</option>
                                            {JUNIOR_OPTIONS.map(opt => (
                                                <option key={opt} value={opt}>
                                                    {opt}の教え
                                                </option>
                                            ))}
                                        </select>
                                        {juniorMeta && (
                                            <div style={{ marginTop: '0.3rem', fontSize: '0.73rem', fontWeight: 'bold', color: juniorMeta.color }}>
                                                永続: {juniorMeta.badgeText}
                                            </div>
                                        )}
                                    </div>

                                    {/* クラシック期 */}
                                    <div style={{ backgroundColor: 'rgba(255,255,255,0.9)', padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.08)' }}>
                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 'bold', color: '#666', marginBottom: '0.2rem' }}>
                                            ② クラシック期（1月前〜）
                                        </label>
                                        <select
                                            value={plan.classic}
                                            onChange={e => handleOshieChange(meta.key, 'classic', e.target.value as ClassicOshie)}
                                            style={{ width: '100%', padding: '0.3rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.85rem', fontWeight: 'bold', backgroundColor: '#fff', color: '#333' }}
                                        >
                                            <option value="">-- 未選択 --</option>
                                            {CLASSIC_OPTIONS.map(opt => (
                                                <option key={opt} value={opt}>
                                                    {opt}の教え ({opt === '特化' ? '能力&上限' : '追加稽古率'})
                                                </option>
                                            ))}
                                        </select>
                                        {classicEffectText && (
                                            <div style={{ marginTop: '0.3rem', fontSize: '0.73rem', fontWeight: 'bold', color: plan.classic === '特化' ? '#c62828' : '#ef6c00' }}>
                                                現在(Lv.{plan.level}): {classicEffectText}
                                            </div>
                                        )}
                                    </div>

                                    {/* シニア期 */}
                                    <div style={{ backgroundColor: 'rgba(255,255,255,0.9)', padding: '0.45rem 0.6rem', borderRadius: '6px', border: isFukutsu ? '2px solid #2e7d32' : '1px solid rgba(0,0,0,0.08)' }}>
                                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 'bold', color: '#666', marginBottom: '0.2rem' }}>
                                            ③ シニア期（1月前〜）
                                        </label>
                                        <select
                                            value={plan.senior}
                                            onChange={e => handleOshieChange(meta.key, 'senior', e.target.value as SeniorOshie)}
                                            style={{ width: '100%', padding: '0.3rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.85rem', fontWeight: 'bold', backgroundColor: '#fff', color: '#333' }}
                                        >
                                            <option value="">-- 未選択 --</option>
                                            {SENIOR_OPTIONS.map(opt => (
                                                <option key={opt} value={opt}>
                                                    {opt}の教え ({opt === '不屈' ? '失敗0%条件' : opt === '協力' ? '分身&友情' : 'サブ&演目効果'})
                                                </option>
                                            ))}
                                        </select>
                                        {seniorEffectText && (
                                            <div
                                                style={{
                                                    marginTop: '0.3rem',
                                                    fontSize: '0.74rem',
                                                    fontWeight: 'bold',
                                                    color: fukutsuStatus?.isMax ? '#d32f2f' : isFukutsu ? '#1b5e20' : plan.senior === '協力' ? '#1565c0' : '#e65100',
                                                }}
                                            >
                                                {seniorEffectText}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 4. 育成完了＆記録セクション (LGランク対応・TSV出力) */}
            <div className="card record-card" style={{ marginTop: '1.5rem' }}>
                <h3>📋 育成完了＆記録 (LGランク・スプレッドシート対応)</h3>
                <div
                    className="record-form"
                    style={{
                        display: 'flex',
                        gap: '0.85rem',
                        flexWrap: 'wrap',
                        marginBottom: '1rem',
                        backgroundColor: '#f9f9f9',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 'bold' }}>ランク (LG対応)</label>
                        <input
                            type="text"
                            list="uma-rank-list"
                            value={recordRank}
                            onChange={e => setRecordRank(e.target.value)}
                            placeholder="例: LG1 / US5"
                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', width: '110px' }}
                        />
                        <datalist id="uma-rank-list">
                            <option value="LG" />
                            <option value="LG1" />
                            <option value="LG2" />
                            <option value="LG3" />
                            <option value="US" />
                            <option value="US5" />
                            <option value="US8" />
                            <option value="UE" />
                            <option value="UD" />
                        </datalist>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 'bold' }}>評価点</label>
                        <input
                            type="number"
                            value={recordScore}
                            onChange={e => setRecordScore(e.target.value)}
                            placeholder="例: 52000"
                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', width: '115px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 'bold' }}>獲得SP</label>
                        <input
                            type="number"
                            value={recordSp}
                            onChange={e => setRecordSp(e.target.value)}
                            placeholder="例: 6500"
                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', width: '105px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 'bold' }}>ジュニア終了SP</label>
                        <input
                            type="number"
                            value={recordJuniorSp}
                            onChange={e => setRecordJuniorSp(e.target.value)}
                            placeholder="任意 (例: 1200)"
                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', width: '120px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: 'bold' }}>クラシック終了SP</label>
                        <input
                            type="number"
                            value={recordClassicSp}
                            onChange={e => setRecordClassicSp(e.target.value)}
                            placeholder="任意 (例: 3000)"
                            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', width: '125px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button
                            onClick={handleAddRecordClick}
                            style={{
                                padding: '0.5rem 1.25rem',
                                backgroundColor: '#e53935',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                            }}
                        >
                            ✍️ 記録する
                        </button>
                    </div>
                </div>

                <div className="record-output">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '0.88rem' }}>
                            記録データ (TSV形式: ランク / 評価点 / SP / Jr.SP / Cl.SP / サポカ / 5演目ルート＆最終Lv)
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={handleCopy}
                                style={{
                                    fontSize: '0.8rem',
                                    padding: '0.25rem 0.5rem',
                                    backgroundColor: '#e3f2fd',
                                    color: '#1565c0',
                                    border: '1px solid #90caf9',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                }}
                            >
                                📋 コピー
                            </button>
                            <button
                                onClick={onClearRecords}
                                style={{
                                    fontSize: '0.8rem',
                                    padding: '0.25rem 0.5rem',
                                    backgroundColor: '#eee',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                }}
                            >
                                🗑️ 記録をクリア
                            </button>
                        </div>
                    </div>
                    <textarea
                        readOnly
                        value={generateTsv()}
                        style={{
                            width: '100%',
                            height: '130px',
                            padding: '0.5rem',
                            boxSizing: 'border-box',
                            fontFamily: 'monospace',
                            fontSize: '0.82rem',
                            whiteSpace: 'pre',
                            overflow: 'auto',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                        }}
                        placeholder="「✍️ 記録する」を押すと、ここにスプレッドシート貼り付け用のタブ区切りデータが出力されます。"
                    />
                </div>
            </div>

            {/* 5. 折りたたみ攻略チートシート */}
            <div className="bd-effects-toggle" style={{ marginTop: '1.25rem' }}>
                <button className="bd-effects-btn" onClick={() => setShowCheatSheet(!showCheatSheet)}>
                    {showCheatSheet ? '▲ 「教え＆転成」早見データバンクを隠す' : '▼ 「教え＆転成」早見データバンク・攻略チートシートを開く'}
                </button>
                {showCheatSheet && (
                    <div className="bd-effects-content full-details" style={{ marginTop: '0.75rem' }}>
                        {/* タブ切り替え */}
                        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => setCheatSheetTab(1)}
                                style={{
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '6px',
                                    border: 'none',
                                    fontWeight: 'bold',
                                    fontSize: '0.82rem',
                                    cursor: 'pointer',
                                    backgroundColor: cheatSheetTab === 1 ? '#e53935' : '#eee',
                                    color: cheatSheetTab === 1 ? '#fff' : '#444',
                                }}
                            >
                                ① ジュニア期 (基本5種＆永続効果)
                            </button>
                            <button
                                onClick={() => setCheatSheetTab(2)}
                                style={{
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '6px',
                                    border: 'none',
                                    fontWeight: 'bold',
                                    fontSize: '0.82rem',
                                    cursor: 'pointer',
                                    backgroundColor: cheatSheetTab === 2 ? '#fb8c00' : '#eee',
                                    color: cheatSheetTab === 2 ? '#fff' : '#444',
                                }}
                            >
                                ② クラシック期 (特化・研鑽)
                            </button>
                            <button
                                onClick={() => setCheatSheetTab(3)}
                                style={{
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '6px',
                                    border: 'none',
                                    fontWeight: 'bold',
                                    fontSize: '0.82rem',
                                    cursor: 'pointer',
                                    backgroundColor: cheatSheetTab === 3 ? '#2e7d32' : '#eee',
                                    color: cheatSheetTab === 3 ? '#fff' : '#444',
                                }}
                            >
                                ③ シニア期 (協力・不屈・両道)
                            </button>
                        </div>

                        {cheatSheetTab === 1 && (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                                            <th style={{ padding: '0.5rem' }}>教え</th>
                                            <th style={{ padding: '0.5rem' }}>基本効果</th>
                                            <th style={{ padding: '0.5rem', color: '#d84315' }}>転成後も残る永続「転成効果」</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {JUNIOR_OPTIONS.map(key => {
                                            const item = JUNIOR_OSHIE_DATA[key];
                                            return (
                                                <tr key={key} style={{ borderBottom: '1px solid #eee' }}>
                                                    <td style={{ padding: '0.5rem', fontWeight: 'bold', color: item.color }}>{item.label}</td>
                                                    <td style={{ padding: '0.5rem' }}>{item.basicEffect}</td>
                                                    <td style={{ padding: '0.5rem', fontWeight: 'bold', color: '#bf360c' }}>{item.permanentEffect}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {cheatSheetTab === 2 && (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'center' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                                            <th style={{ padding: '0.45rem' }}>教え / Lv</th>
                                            <th>Lv1</th>
                                            <th>Lv3</th>
                                            <th>Lv5</th>
                                            <th>Lv7</th>
                                            <th>Lv9</th>
                                            <th style={{ color: '#d32f2f' }}>Lv10</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '0.5rem', fontWeight: 'bold', color: '#c62828' }}>特化 (能力UP / 上限UP)</td>
                                            <td>+5% / +5</td>
                                            <td>+7% / +7</td>
                                            <td>+9% / +9</td>
                                            <td>+13% / +13</td>
                                            <td>+20% / +20</td>
                                            <td style={{ fontWeight: 'bold', color: '#d32f2f' }}>+25% / +25</td>
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '0.5rem', fontWeight: 'bold', color: '#ef6c00' }}>研鑽 (追加稽古発生率)</td>
                                            <td>+20%</td>
                                            <td>+24%</td>
                                            <td>+30%</td>
                                            <td>+40%</td>
                                            <td>+65%</td>
                                            <td style={{ fontWeight: 'bold', color: '#ef6c00' }}>+80%</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {cheatSheetTab === 3 && (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'center' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                                            <th style={{ padding: '0.45rem' }}>演目Lv</th>
                                            <th style={{ color: '#1565c0' }}>協力 (友情 / ワープ)</th>
                                            <th style={{ color: '#2e7d32' }}>不屈 (失敗0%条件 / トレ効果)</th>
                                            <th style={{ color: '#e65100' }}>両道 (サブ能力 / 演目トレ)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { lv: 'Lv.1', kyo: '+1%', fuku: '体力 45以上', ryo: '+1% / +1%' },
                                            { lv: 'Lv.3', kyo: '+3%', fuku: '体力 35以上', ryo: '+3% / +3%' },
                                            { lv: 'Lv.5', kyo: '+5%', fuku: '体力 25以上', ryo: '+5% / +5%' },
                                            { lv: 'Lv.7', kyo: '+7%', fuku: '体力 15以上', ryo: '+11% / +9%' },
                                            { lv: 'Lv.8', kyo: '+8%', fuku: '体力 10以上 (+1%)', ryo: '+15% / +11%' },
                                            { lv: 'Lv.9', kyo: '+9%', fuku: '体力 5以上 (+3%)', ryo: '+20% / +13%' },
                                            { lv: 'Lv.10', kyo: '+10%', fuku: '🔥体力0でも失敗0% (+5%)', ryo: '+25% / +15%' },
                                        ].map(row => (
                                            <tr key={row.lv} style={{ borderBottom: '1px solid #eee', fontWeight: row.lv === 'Lv.10' ? 'bold' : 'normal', backgroundColor: row.lv === 'Lv.10' ? '#fff8e1' : 'transparent' }}>
                                                <td style={{ padding: '0.45rem', fontWeight: 'bold' }}>{row.lv}</td>
                                                <td>{row.kyo}</td>
                                                <td style={{ color: row.lv === 'Lv.10' ? '#d32f2f' : '#1b5e20' }}>{row.fuku}</td>
                                                <td>{row.ryo}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <h4 style={{ marginTop: '1rem' }}>✨ シナリオリンク優遇キャラ（ゲージ獲得UP＆スキル進化）</h4>
                        <p style={{ fontSize: '0.85rem', margin: '0.25rem 0 0.75rem 0', color: '#444' }}>
                            ダイワスカーレット ／ マヤノトップガン(新SSRパワ) ／ ノーリーズン ／ ユキノビジン ／ ブラストワンピース
                        </p>

                        <h4>⚡ 解放ステータス上限</h4>
                        <div className="stats-grid">
                            <div><span>スピード</span><strong>2200</strong></div>
                            <div><span>スタミナ</span><strong>1850</strong></div>
                            <div><span>パワー</span><strong>1800</strong></div>
                            <div><span>根性</span><strong>1700</strong></div>
                            <div><span>賢さ</span><strong>1800</strong></div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

import React, { useState } from 'react';
import type {
    ShuntaisaiState,
    SupportCard,
    SupportCardType,
    TrainingRecord,
    EnmokuKey,
    JuniorOshie,
    UpgradedOshie,
    AnyOshie,
} from '../types';
import {
    ENMOKU_LIST,
    ALL_JUNIOR_OSHIE,
    CLASSIC_UPGRADED_OSHIE,
    SENIOR_UPGRADED_OSHIE,
    ALL_UPGRADED_OSHIE,
    SHUNTAISAI_PERIODS,
    JUNIOR_OSHIE_DATA,
    SHUNTAISAI_PRESETS,
    isUpgradedOshie,
    getAvailableOshieForStep,
    getOshieEffectByLevel,
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

    // 合計Lvの算出
    const levelsArr = ENMOKU_LIST.map(e => state.levels[e.key] || 1);
    const totalLevel = levelsArr.reduce((acc, v) => acc + v, 0);

    const activeStep = Math.max(0, Math.min(5, state.activeStep || 0));
    const currentPeriod = SHUNTAISAI_PERIODS[activeStep];
    const currentPlacement = state.placements[activeStep] || {
        speed: '',
        stamina: '',
        power: '',
        guts: '',
        wisdom: '',
    };
    const prevPlacement = activeStep > 0 ? state.placements[activeStep - 1] : null;

    // ジュニア終了時に転成しない残り3つの初期教え
    const usedInClassicSet = new Set<JuniorOshie>([
        state.tenseiPairs['特化'],
        state.tenseiPairs['研鑽'],
    ]);
    const unupgradedInClassic = ALL_JUNIOR_OSHIE.filter(j => !usedInClassicSet.has(j));

    const handleLevelChange = (key: EnmokuKey, delta: number) => {
        onChangeState(prev => {
            const cur = prev.levels[key] || 1;
            const limit = prev.hasAzuma ? 10 : 6;
            const next = Math.max(1, Math.min(limit, cur + delta));
            return {
                ...prev,
                levels: {
                    ...prev.levels,
                    [key]: next,
                },
            };
        });
    };

    const handleResetProgress = () => {
        onChangeState(prev => ({
            ...prev,
            outingCount: 0,
            activeStep: 0,
            levels: {
                speed: 1,
                stamina: 1,
                power: 1,
                guts: 1,
                wisdom: 1,
            },
        }));
    };

    // 転成元の初期教えを変更（重複しないよう既存のペアと自動スワップし、第3・4回の未転成教え配置も同期）
    const handleTenseiPairChange = (upgradedKey: UpgradedOshie, newBase: JuniorOshie) => {
        onChangeState(prev => {
            const oldBase = prev.tenseiPairs[upgradedKey];
            if (oldBase === newBase) return prev;

            const nextPairs = { ...prev.tenseiPairs };
            // すでに newBase を使っている他の UpgradedOshie を探して oldBase と入れ替える
            const otherKey = ALL_UPGRADED_OSHIE.find(k => k !== upgradedKey && prev.tenseiPairs[k] === newBase);
            nextPairs[upgradedKey] = newBase;
            if (otherKey) {
                nextPairs[otherKey] = oldBase;
            }

            // クラシック期（step 2, 3）で使える未転成初期教えが変わった場合、配置内の古い初期教えを新しい初期教えに置き換える
            const nextUsedClassic = new Set<JuniorOshie>([nextPairs['特化'], nextPairs['研鑽']]);
            const nextRemaining = ALL_JUNIOR_OSHIE.filter(j => !nextUsedClassic.has(j));

            const nextPlacements = prev.placements.map((pl, idx) => {
                if (idx !== 2 && idx !== 3) return pl;
                const updated = { ...pl };
                (Object.keys(updated) as EnmokuKey[]).forEach(eKey => {
                    const val = updated[eKey];
                    if (val && !isUpgradedOshie(val) && nextUsedClassic.has(val as JuniorOshie)) {
                        // 使われていない残りの初期教えに差し替え
                        const usedInRow = new Set(Object.values(updated));
                        const replacement = nextRemaining.find(r => !usedInRow.has(r)) || nextRemaining[0];
                        updated[eKey] = replacement;
                    }
                });
                return updated;
            });

            return {
                ...prev,
                presetName: 'custom',
                tenseiPairs: nextPairs,
                placements: nextPlacements,
            };
        });
    };

    // 指定した時期(stepIndex)の指定演目(enmokuKey)に教えをセット（同じ時期内で既に別の演目にセットされていたら自動スワップ！）
    const handlePlacementChange = (stepIndex: number, enmokuKey: EnmokuKey, newOshie: AnyOshie) => {
        onChangeState(prev => {
            const nextPlacements = prev.placements.map((p, idx) => {
                if (idx !== stepIndex) return p;
                const row = { ...p };
                const oldOshie = row[enmokuKey];
                if (oldOshie === newOshie) return row;

                if (newOshie !== '') {
                    const otherEnmoku = (Object.keys(row) as EnmokuKey[]).find(
                        k => k !== enmokuKey && row[k] === newOshie
                    );
                    if (otherEnmoku) {
                        row[otherEnmoku] = oldOshie;
                    }
                }
                row[enmokuKey] = newOshie;
                return row;
            });

            return {
                ...prev,
                presetName: 'custom',
                placements: nextPlacements,
            };
        });
    };

    const handleApplyPreset = (presetId: string, alsoApplyDeck: boolean) => {
        const preset = SHUNTAISAI_PRESETS.find(p => p.id === presetId);
        if (!preset) return;

        onChangeState(prev => ({
            ...prev,
            presetName: preset.id,
            tenseiPairs: { ...preset.tenseiPairs },
            placements: preset.placements.map(p => ({ ...p })),
        }));

        if (alsoApplyDeck && preset.deckTypes) {
            onApplyDeckPreset(preset.deckTypes);
        }
    };

    const handleToggleAzuma = () => {
        onChangeState(prev => {
            const nextHasAzuma = !prev.hasAzuma;
            const limit = nextHasAzuma ? 10 : 6;
            const nextLevels = { ...prev.levels };
            (Object.keys(nextLevels) as EnmokuKey[]).forEach(k => {
                if (nextLevels[k] > limit) {
                    nextLevels[k] = limit;
                }
            });
            return {
                ...prev,
                hasAzuma: nextHasAzuma,
                levels: nextLevels,
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
        const text = `ウマ娘の新シナリオ「朋、史解き ―午式駿大祭―」で育成中！⛩️🔥\n6回の教え配置＆転成ルート管理でLGランクを目指すよっ！\n\n`;
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
                const pairs = record.shuntaisai.tenseiPairs;
                // 転成ペア概要
                parts.push(
                    ALL_UPGRADED_OSHIE.map(u => `${u}[${pairs?.[u] || '-'}]`).join('/')
                );
                // 5演目最終Lvと最終配置(step 5)
                const finalPlace = record.shuntaisai.placements?.[5];
                ENMOKU_LIST.forEach(meta => {
                    const lv = record.shuntaisai?.levels?.[meta.key] || 1;
                    const oshie = finalPlace?.[meta.key] || '-';
                    parts.push(`${oshie}(Lv${lv})`);
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

    const availableForCurrentStep = getAvailableOshieForStep(activeStep, state.tenseiPairs);

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
                                    : '5種類未満だと「スキルPtトレーニング効果」と「獲得上限アップ」が発動しません！'}
                            </div>
                        </div>
                    </div>

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
                    <label
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.88rem',
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

                    {state.hasAzuma && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.84rem', fontWeight: 'bold', color: '#6a1b9a' }}>
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

            {/* 2. おすすめ転成ビルドルート・プリセット */}
            <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem', backgroundColor: '#fff8e1', border: '1px solid #ffe082', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.6rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: '#e65100', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>🎯 おすすめ転成ビルドルート・プリセット</span>
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: '#666' }}>
                        「Jr終了時2つ転成＋Cl終了時3つ転成」と「全6回の教え配置スケジュール」を一括セット！
                    </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.65rem' }}>
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
                                    gap: '0.55rem',
                                }}
                            >
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.25rem', marginBottom: '0.3rem' }}>
                                        <span style={{ fontWeight: 'bold', fontSize: '0.86rem', color: '#333' }}>{preset.name}</span>
                                        <span style={{ fontSize: '0.68rem', backgroundColor: '#ffe0b2', color: '#e65100', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                                            {preset.badge}
                                        </span>
                                    </div>
                                    <p style={{ margin: '0 0 0.4rem 0', fontSize: '0.75rem', color: '#555', lineHeight: 1.4 }}>
                                        {preset.description}
                                    </p>
                                    <div style={{ fontSize: '0.72rem', backgroundColor: '#fafafa', padding: '0.35rem 0.5rem', borderRadius: '4px', border: '1px solid #eee', color: '#444', lineHeight: 1.45 }}>
                                        <div><strong>Jr転成(2つ):</strong> 特化[{preset.tenseiPairs['特化']}] ／ 研鑽[{preset.tenseiPairs['研鑽']}]</div>
                                        <div><strong>Cl転成(3つ):</strong> 協力[{preset.tenseiPairs['協力']}] ／ 不屈[{preset.tenseiPairs['不屈']}] ／ 両道[{preset.tenseiPairs['両道']}]</div>
                                    </div>
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
                                            fontSize: '0.76rem',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        📜 ルートを適用
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
                                                fontSize: '0.74rem',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            ＋サポカも適用
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <details style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: '#444' }}>
                    <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#d84315' }}>
                        💡 SPの稼ぎ方＆稽古Lvの立ち回りポイント（クリックで開く）
                    </summary>
                    <div style={{ padding: '0.75rem', marginTop: '0.45rem', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #ffe082', lineHeight: 1.55 }}>
                        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                            <li><strong>クラシック年末まで</strong>：<strong>スピ稽古中心</strong>に演目Lvを上げる！</li>
                            <li><strong>シニア合宿までに</strong>：<strong style={{ color: '#d32f2f' }}>スピ稽古Lv9〜MAXを目指す！</strong> ➡️ 合宿はスピ3〜4回踏んでSPを盛りながら稼ぐ</li>
                            <li><strong>シニア合宿明け後</strong>：<strong style={{ color: '#d32f2f' }}>凹んだステの稽古LvMAXを目指す！</strong>
                                <div style={{ fontSize: '0.78rem', color: '#555' }}>
                                    例：スタ・賢さの稽古Lvを上げる場合、パワ・根性の稽古ゲージをMAX維持しておくと、目標レースのゲージ上昇をスタ・賢さに確定で回せる！
                                </div>
                            </li>
                            <li><strong>URA期間中</strong>：<strong style={{ color: '#d32f2f' }}>稽古LvMAXにしたステを上げる！</strong> ➡️ シニア合宿で他トレをするよりSP欠損が少なく済む✨</li>
                        </ul>
                    </div>
                </details>
            </div>

            {/* 3. 「教え転成」の組み合わせ設定（Jr終了時2つ ＋ Cl終了時3つ） */}
            <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem', backgroundColor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <h3 style={{ margin: 0, fontSize: '0.98rem', color: '#333', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>🔄 「教え転成」の組み合わせ計画（どの初期教えを転成させるか）</span>
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: '#666' }}>
                        ※変更すると自動的に入れ替わり、下の6回スケジュールにも連動します
                    </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
                    {/* ジュニア級終了時：2つの教えを転成 */}
                    <div style={{ backgroundColor: '#fff3e0', border: '1px solid #ffcc80', borderRadius: '8px', padding: '0.75rem' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '0.84rem', color: '#e65100', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>① ジュニア12月後半終了時（2つ転成）</span>
                            <span style={{ fontSize: '0.7rem', backgroundColor: '#ffe0b2', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>クラシック期〜永続</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            {CLASSIC_UPGRADED_OSHIE.map(upKey => {
                                const base = state.tenseiPairs[upKey];
                                return (
                                    <div key={upKey} style={{ backgroundColor: '#fff', padding: '0.45rem 0.55rem', borderRadius: '6px', border: '1px solid #ffe0b2' }}>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: upKey === '特化' ? '#c62828' : '#ef6c00', marginBottom: '0.2rem' }}>
                                            {upKey}の教え ⬅️ 元:
                                        </div>
                                        <select
                                            value={base}
                                            onChange={e => handleTenseiPairChange(upKey, e.target.value as JuniorOshie)}
                                            style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.82rem', fontWeight: 'bold' }}
                                        >
                                            {ALL_JUNIOR_OSHIE.map(j => (
                                                <option key={j} value={j}>{j}の教え</option>
                                            ))}
                                        </select>
                                        <div style={{ fontSize: '0.68rem', color: JUNIOR_OSHIE_DATA[base].color, marginTop: '0.2rem', fontWeight: 'bold' }}>
                                            {JUNIOR_OSHIE_DATA[base].badgeText}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#555', backgroundColor: 'rgba(255,255,255,0.75)', padding: '0.35rem 0.5rem', borderRadius: '4px' }}>
                            💡 <strong>転成せずクラシック級でそのまま使う3つ：</strong>{' '}
                            <strong style={{ color: '#333' }}>{unupgradedInClassic.map(j => `「${j}」`).join('・')}</strong>
                        </div>
                    </div>

                    {/* クラシック級終了時：残り3つの教えを転成 */}
                    <div style={{ backgroundColor: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '8px', padding: '0.75rem' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '0.84rem', color: '#2e7d32', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>② クラシック12月後半終了時（残り3つ転成）</span>
                            <span style={{ fontSize: '0.7rem', backgroundColor: '#c8e6c9', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>シニア期〜最終</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem' }}>
                            {SENIOR_UPGRADED_OSHIE.map(upKey => {
                                const base = state.tenseiPairs[upKey];
                                return (
                                    <div key={upKey} style={{ backgroundColor: '#fff', padding: '0.45rem 0.5rem', borderRadius: '6px', border: '1px solid #c8e6c9' }}>
                                        <div style={{ fontSize: '0.78rem', fontWeight: 'bold', color: upKey === '不屈' ? '#1b5e20' : upKey === '協力' ? '#1565c0' : '#e65100', marginBottom: '0.2rem' }}>
                                            {upKey} ⬅️ 元:
                                        </div>
                                        <select
                                            value={base}
                                            onChange={e => handleTenseiPairChange(upKey, e.target.value as JuniorOshie)}
                                            style={{ width: '100%', padding: '0.25rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.8rem', fontWeight: 'bold' }}
                                        >
                                            {ALL_JUNIOR_OSHIE.map(j => (
                                                <option key={j} value={j}>{j}の教え</option>
                                            ))}
                                        </select>
                                        <div style={{ fontSize: '0.66rem', color: JUNIOR_OSHIE_DATA[base].color, marginTop: '0.2rem', fontWeight: 'bold' }}>
                                            {JUNIOR_OSHIE_DATA[base].badgeText}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#2e7d32', backgroundColor: 'rgba(255,255,255,0.75)', padding: '0.35rem 0.5rem', borderRadius: '4px' }}>
                            💡 <strong>ジュニア終了時に転成した「特化」「研鑽」もそのままシニア級で継続使用します！</strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* 4. 5演目「教え＆転成」進行トラッカー（6回の時期切替 ＋ 演目Lv ＋ 6回スケジュール一覧表） */}
            <div className="card" style={{ padding: '1.25rem', borderRadius: '8px', border: '1px solid #e0e0e0', backgroundColor: '#fff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span>🏮 5演目「教え＆転成」進行トラッカー</span>
                        <span style={{ fontSize: '0.85rem', backgroundColor: '#fce4ec', color: '#c2185b', padding: '0.15rem 0.6rem', borderRadius: '12px', fontWeight: 'bold' }}>
                            合計 Lv.{totalLevel} / {maxLevel * 5}
                        </span>
                    </h3>
                    <button
                        onClick={handleResetProgress}
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
                        🔄 演目Lv・現在時期を最初に戻す
                    </button>
                </div>

                {/* 全6回の時期選択ステップバー */}
                <div style={{ marginBottom: '1rem', backgroundColor: '#f8f9fa', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#555', marginBottom: '0.45rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                        <span>📅 現在の時期を選択（全6回の教えセットタイミング）:</span>
                        {currentPeriod.tenseiBadge && (
                            <span style={{ backgroundColor: '#d32f2f', color: '#fff', padding: '0.15rem 0.55rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                {currentPeriod.tenseiBadge}
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '0.4rem' }}>
                        {SHUNTAISAI_PERIODS.map(period => {
                            const isActive = period.index === activeStep;
                            const phaseColor = period.phase === 'junior' ? '#1976d2' : period.phase === 'classic' ? '#e65100' : '#2e7d32';
                            return (
                                <button
                                    key={period.index}
                                    onClick={() => onChangeState(prev => ({ ...prev, activeStep: period.index }))}
                                    style={{
                                        padding: '0.45rem 0.5rem',
                                        borderRadius: '6px',
                                        border: isActive ? `2px solid ${phaseColor}` : '1px solid #ccc',
                                        backgroundColor: isActive ? phaseColor : '#fff',
                                        color: isActive ? '#fff' : '#333',
                                        fontWeight: 'bold',
                                        fontSize: '0.78rem',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
                                    }}
                                >
                                    {period.shortLabel}
                                </button>
                            );
                        })}
                    </div>
                    <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span>
                            <strong>選択中: {currentPeriod.label}</strong> — {currentPeriod.timingDesc}
                        </span>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button
                                onClick={() => onChangeState(prev => ({ ...prev, activeStep: Math.max(0, activeStep - 1) }))}
                                disabled={activeStep <= 0}
                                style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: activeStep <= 0 ? '#eee' : '#fff', color: '#333', cursor: activeStep <= 0 ? 'default' : 'pointer' }}
                            >
                                ◀ 前の時期
                            </button>
                            <button
                                onClick={() => onChangeState(prev => ({ ...prev, activeStep: Math.min(5, activeStep + 1) }))}
                                disabled={activeStep >= 5}
                                style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: activeStep >= 5 ? '#eee' : '#fff', color: '#333', cursor: activeStep >= 5 ? 'default' : 'pointer' }}
                            >
                                次の時期 ▶
                            </button>
                        </div>
                    </div>
                </div>

                {/* 5演目の現在Lv ＆ 現在時期の教えカード */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    {ENMOKU_LIST.map(meta => {
                        const lv = state.levels[meta.key] || 1;
                        const currentOshie = currentPlacement[meta.key] || '';
                        const prevOshie = prevPlacement ? prevPlacement[meta.key] : null;
                        const isChangedFromPrev = prevOshie !== null && prevOshie !== currentOshie;

                        const upgraded = isUpgradedOshie(currentOshie);
                        const baseJunior: JuniorOshie | null = upgraded
                            ? state.tenseiPairs[currentOshie]
                            : (currentOshie ? (currentOshie as JuniorOshie) : null);
                        const baseJuniorMeta = baseJunior ? JUNIOR_OSHIE_DATA[baseJunior] : null;
                        const effectText = getOshieEffectByLevel(currentOshie, lv);
                        const isFukutsu = currentOshie === '不屈';
                        const fukutsuStatus = isFukutsu ? getFukutsuStatus(lv) : null;

                        // 6回スケジュール表から、この演目のクラシック期・シニア期の予定転成教えを取得
                        const plannedClassicOshie = state.placements[2]?.[meta.key] || state.placements[3]?.[meta.key] || '';
                        const plannedSeniorOshie = state.placements[4]?.[meta.key] || state.placements[5]?.[meta.key] || '';

                        interface OshiePreviewItem {
                            periodLabel: string;
                            oshie: UpgradedOshie;
                            effectText: string;
                            color: string;
                            isMax: boolean;
                        }

                        const previewItems: OshiePreviewItem[] = [];

                        // ジュニア期（step 0, 1）の場合：クラシック期とシニア期の予定転成教えをプレビュー
                        if (activeStep <= 1) {
                            if (plannedClassicOshie && isUpgradedOshie(plannedClassicOshie)) {
                                previewItems.push({
                                    periodLabel: 'Cl期',
                                    oshie: plannedClassicOshie as UpgradedOshie,
                                    effectText: getOshieEffectByLevel(plannedClassicOshie, lv),
                                    color: plannedClassicOshie === '特化' ? '#c62828' : '#ef6c00',
                                    isMax: lv === maxLevel,
                                });
                            }
                            if (plannedSeniorOshie && isUpgradedOshie(plannedSeniorOshie)) {
                                const isFuk = plannedSeniorOshie === '不屈';
                                const fStatus = isFuk ? getFukutsuStatus(lv) : null;
                                previewItems.push({
                                    periodLabel: 'Sr期',
                                    oshie: plannedSeniorOshie as UpgradedOshie,
                                    effectText: getOshieEffectByLevel(plannedSeniorOshie, lv),
                                    color: fStatus?.isMax ? '#d32f2f' : isFuk ? '#2e7d32' : plannedSeniorOshie === '協力' ? '#1565c0' : '#e65100',
                                    isMax: lv === maxLevel,
                                });
                            }
                        } else if (activeStep >= 2 && activeStep <= 3) {
                            // クラシック期（step 2, 3）の場合：シニア期の予定転成教えをプレビュー（現在と異なる場合）
                            if (plannedSeniorOshie && isUpgradedOshie(plannedSeniorOshie) && plannedSeniorOshie !== currentOshie) {
                                const isFuk = plannedSeniorOshie === '不屈';
                                const fStatus = isFuk ? getFukutsuStatus(lv) : null;
                                previewItems.push({
                                    periodLabel: 'Sr期予定',
                                    oshie: plannedSeniorOshie as UpgradedOshie,
                                    effectText: getOshieEffectByLevel(plannedSeniorOshie, lv),
                                    color: fStatus?.isMax ? '#d32f2f' : isFuk ? '#2e7d32' : plannedSeniorOshie === '協力' ? '#1565c0' : '#e65100',
                                    isMax: lv === maxLevel,
                                });
                            }
                        }

                        return (
                            <div
                                key={meta.key}
                                style={{
                                    backgroundColor: meta.bgLight,
                                    border: `2px solid ${meta.borderColor}`,
                                    borderRadius: '10px',
                                    padding: '0.75rem 0.9rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    gap: '0.55rem',
                                }}
                            >
                                {/* 上段：演目名 ＆ Lvステッパー */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem', flexWrap: 'nowrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap' }}>
                                        <span style={{ fontSize: '1.1rem' }}>{meta.icon}</span>
                                        <span style={{ fontWeight: 'bold', fontSize: '0.98rem', color: meta.color }}>
                                            {meta.label}
                                        </span>
                                        <span style={{ fontSize: '0.72rem', color: '#555', fontWeight: 'bold' }}>
                                            ({meta.enmokuName})
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#fff', padding: '0.2rem 0.4rem', borderRadius: '6px', border: `1px solid ${meta.borderColor}`, flexShrink: 0 }}>
                                        <button
                                            onClick={() => handleLevelChange(meta.key, -1)}
                                            disabled={lv <= 1}
                                            style={{
                                                width: '26px',
                                                height: '26px',
                                                borderRadius: '4px',
                                                border: '1px solid #ccc',
                                                backgroundColor: lv <= 1 ? '#f5f5f5' : '#fff',
                                                color: lv <= 1 ? '#bbb' : '#333',
                                                fontWeight: 'bold',
                                                cursor: lv <= 1 ? 'default' : 'pointer',
                                                padding: 0,
                                            }}
                                        >
                                            -
                                        </button>
                                        <span style={{ fontSize: '1rem', fontWeight: '900', minWidth: '2.5rem', textAlign: 'center', color: lv === maxLevel ? '#d32f2f' : '#222' }}>
                                            Lv.{lv}
                                        </span>
                                        <button
                                            onClick={() => handleLevelChange(meta.key, 1)}
                                            disabled={lv >= maxLevel}
                                            style={{
                                                width: '26px',
                                                height: '26px',
                                                borderRadius: '4px',
                                                border: '1px solid #ccc',
                                                backgroundColor: lv >= maxLevel ? '#f5f5f5' : meta.color,
                                                color: lv >= maxLevel ? '#bbb' : '#fff',
                                                fontWeight: 'bold',
                                                cursor: lv >= maxLevel ? 'default' : 'pointer',
                                                padding: 0,
                                            }}
                                        >
                                            +
                                        </button>
                                        <button
                                            onClick={() => handleLevelChange(meta.key, maxLevel - lv)}
                                            disabled={lv >= maxLevel}
                                            style={{
                                                fontSize: '0.65rem',
                                                padding: '0.2rem 0.35rem',
                                                borderRadius: '4px',
                                                border: lv >= maxLevel ? '1px solid #ddd' : '1px solid #ffb74d',
                                                backgroundColor: lv >= maxLevel ? '#f5f5f5' : '#fff8e1',
                                                color: lv >= maxLevel ? '#bbb' : '#e65100',
                                                fontWeight: 'bold',
                                                cursor: lv >= maxLevel ? 'default' : 'pointer',
                                            }}
                                        >
                                            MAX
                                        </button>
                                    </div>
                                </div>

                                {/* 下段：現在時期のセット教え ＆ 効果表示 */}
                                <div style={{ backgroundColor: 'rgba(255,255,255,0.92)', padding: '0.5rem 0.6rem', borderRadius: '6px', border: isFukutsu ? '2px solid #2e7d32' : '1px solid rgba(0,0,0,0.08)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#555' }}>
                                            {currentPeriod.shortLabel} のセット教え:
                                        </span>
                                        {isChangedFromPrev && (
                                            <span style={{ fontSize: '0.68rem', backgroundColor: '#fff3e0', color: '#e65100', border: '1px solid #ffb74d', padding: '0.05rem 0.35rem', borderRadius: '4px', fontWeight: 'bold' }}>
                                                🔄 前回({prevOshie})から変更
                                            </span>
                                        )}
                                    </div>
                                    <select
                                        value={currentOshie}
                                        onChange={e => handlePlacementChange(activeStep, meta.key, e.target.value as AnyOshie)}
                                        style={{
                                            width: '100%',
                                            padding: '0.35rem',
                                            borderRadius: '4px',
                                            border: '1px solid #bbb',
                                            fontSize: '0.88rem',
                                            fontWeight: 'bold',
                                            backgroundColor: '#fff',
                                            color: '#222',
                                        }}
                                    >
                                        <option value="">-- 未選択 --</option>
                                        {availableForCurrentStep.map(opt => (
                                            <option key={opt} value={opt}>
                                                {isUpgradedOshie(opt)
                                                    ? `★${opt}の教え（転成元: ${state.tenseiPairs[opt]}）`
                                                    : `${opt}の教え（未転成）`}
                                            </option>
                                        ))}
                                    </select>

                                    {/* 現在セット教えの効果表示 */}
                                    {effectText && (
                                        <div
                                            style={{
                                                marginTop: '0.35rem',
                                                fontSize: upgraded ? '0.76rem' : '0.73rem',
                                                fontWeight: upgraded ? 'bold' : 'normal',
                                                color: fukutsuStatus?.isMax ? '#d32f2f' : isFukutsu ? '#1b5e20' : upgraded ? '#bf360c' : '#444',
                                                lineHeight: 1.4,
                                            }}
                                        >
                                            {upgraded && (
                                                <span
                                                    style={{
                                                        backgroundColor: fukutsuStatus?.isMax ? '#ffebee' : '#fff3e0',
                                                        color: fukutsuStatus?.isMax ? '#d32f2f' : '#e65100',
                                                        padding: '0.1rem 0.35rem',
                                                        borderRadius: '4px',
                                                        fontSize: '0.68rem',
                                                        marginRight: '0.3rem',
                                                        fontWeight: 'bold',
                                                    }}
                                                >
                                                    現在 Lv.{lv}効果
                                                </span>
                                            )}
                                            {effectText}
                                        </div>
                                    )}
                                    {upgraded && baseJuniorMeta && (
                                        <div style={{ marginTop: '0.15rem', fontSize: '0.68rem', color: baseJuniorMeta.color, fontWeight: 'bold' }}>
                                            ＋転成効果({baseJunior}): {baseJuniorMeta.badgeText}
                                        </div>
                                    )}

                                    {/* 将来の転成予定のLv連動効果プレビュー */}
                                    {previewItems.length > 0 && (
                                        <div
                                            style={{
                                                marginTop: '0.45rem',
                                                paddingTop: '0.35rem',
                                                borderTop: '1px dashed rgba(0,0,0,0.15)',
                                                backgroundColor: '#fafafa',
                                                padding: '0.35rem 0.45rem',
                                                borderRadius: '5px',
                                                border: '1px solid #f0f0f0',
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: '0.7rem',
                                                    fontWeight: 'bold',
                                                    color: '#666',
                                                    marginBottom: '0.2rem',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <span>🔮 転成後のLv.{lv}効果（連動中）:</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                {previewItems.map(item => (
                                                    <div key={item.periodLabel} style={{ fontSize: '0.72rem', lineHeight: 1.35 }}>
                                                        <span style={{ fontWeight: 'bold', color: item.color, marginRight: '0.25rem' }}>
                                                            [{item.periodLabel} ★{item.oshie}]
                                                        </span>
                                                        <span style={{ fontWeight: 'bold', color: item.color }}>
                                                            {item.effectText}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 全6回 × 5演目「教え配置スケジュール一覧マトリクス表」 */}
                <div style={{ overflowX: 'auto' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#333', marginBottom: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span>📋 全6回「どの練習にどの教えをセットするか」一覧スケジュール表</span>
                        <span style={{ fontSize: '0.74rem', color: '#666', fontWeight: 'normal' }}>
                            ※時期名をクリックすると現在時期が切り替わります（同じ行で同じ教えを選ぶと自動で場所が入れ替わります）
                        </span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '620px' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ccc' }}>
                                <th style={{ padding: '0.45rem', textAlign: 'left', width: '165px' }}>時期（全6回）</th>
                                {ENMOKU_LIST.map(meta => (
                                    <th key={meta.key} style={{ padding: '0.45rem 0.25rem', textAlign: 'center', color: meta.color }}>
                                        {meta.icon} {meta.label}<br />
                                        <span style={{ fontSize: '0.68rem', color: '#666', fontWeight: 'normal' }}>({meta.enmokuName})</span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {SHUNTAISAI_PERIODS.map(period => {
                                const isCurrentRow = period.index === activeStep;
                                const rowPlacement = state.placements[period.index] || { speed: '', stamina: '', power: '', guts: '', wisdom: '' };
                                const prevRowPlacement = period.index > 0 ? state.placements[period.index - 1] : null;
                                const options = getAvailableOshieForStep(period.index, state.tenseiPairs);

                                return (
                                    <tr
                                        key={period.index}
                                        style={{
                                            backgroundColor: isCurrentRow ? '#fff8e1' : period.index % 2 === 0 ? '#fff' : '#fafafa',
                                            borderBottom: '1px solid #e0e0e0',
                                            outline: isCurrentRow ? '2px solid #ff9800' : 'none',
                                        }}
                                    >
                                        <td
                                            onClick={() => onChangeState(prev => ({ ...prev, activeStep: period.index }))}
                                            style={{ padding: '0.5rem', cursor: 'pointer', fontWeight: 'bold', color: isCurrentRow ? '#e65100' : '#333' }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <span>{isCurrentRow ? '👉' : ''}{period.label}</span>
                                            </div>
                                            {period.tenseiBadge && (
                                                <div style={{ fontSize: '0.66rem', color: '#c62828', marginTop: '0.1rem' }}>
                                                    {period.tenseiBadge}
                                                </div>
                                            )}
                                        </td>
                                        {ENMOKU_LIST.map(meta => {
                                            const val = rowPlacement[meta.key] || '';
                                            const prevVal = prevRowPlacement ? prevRowPlacement[meta.key] : null;
                                            const changed = prevVal !== null && prevVal !== val;
                                            const upgraded = isUpgradedOshie(val);

                                            return (
                                                <td key={meta.key} style={{ padding: '0.35rem 0.2rem', textAlign: 'center' }}>
                                                    <select
                                                        value={val}
                                                        onChange={e => handlePlacementChange(period.index, meta.key, e.target.value as AnyOshie)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '0.28rem 0.15rem',
                                                            borderRadius: '4px',
                                                            border: upgraded ? '1px solid #e65100' : '1px solid #ccc',
                                                            backgroundColor: upgraded ? '#fff3e0' : '#fff',
                                                            color: upgraded ? '#bf360c' : '#333',
                                                            fontWeight: 'bold',
                                                            fontSize: '0.75rem',
                                                        }}
                                                    >
                                                        <option value="">-</option>
                                                        {options.map(opt => (
                                                            <option key={opt} value={opt}>
                                                                {isUpgradedOshie(opt)
                                                                    ? `★${opt}[${state.tenseiPairs[opt]}]`
                                                                    : opt}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {changed && (
                                                        <div style={{ fontSize: '0.64rem', color: '#d84315', marginTop: '0.1rem', fontWeight: 'bold' }}>
                                                            🔄前:{prevVal}
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 5. 育成完了＆記録セクション (LGランク対応・TSV出力) */}
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
                        <span style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                            記録データ (TSV形式: ランク / 評価点 / SP / Jr.SP / Cl.SP / サポカ / 転成ペア / 5演目最終配置＆Lv)
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

            {/* 6. 折りたたみ攻略チートシート */}
            <div className="bd-effects-toggle" style={{ marginTop: '1.25rem' }}>
                <button className="bd-effects-btn" onClick={() => setShowCheatSheet(!showCheatSheet)}>
                    {showCheatSheet ? '▲ 「教え＆転成」早見データバンクを隠す' : '▼ 「教え＆転成」早見データバンク・攻略チートシートを開く'}
                </button>
                {showCheatSheet && (
                    <div className="bd-effects-content full-details" style={{ marginTop: '0.75rem' }}>
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
                                ① 初期5種＆転成時の引き継ぎ効果
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
                                ② Jr終了時転成 (特化・研鑽)
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
                                ③ Cl終了時転成 (協力・不屈・両道)
                            </button>
                        </div>

                        {cheatSheetTab === 1 && (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd', textAlign: 'left' }}>
                                            <th style={{ padding: '0.5rem' }}>教え</th>
                                            <th style={{ padding: '0.5rem' }}>基本効果</th>
                                            <th style={{ padding: '0.5rem', color: '#d84315' }}>転成先へ引き継がれる永続「転成効果」</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ALL_JUNIOR_OSHIE.map(key => {
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

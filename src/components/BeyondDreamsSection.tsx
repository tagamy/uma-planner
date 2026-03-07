import React, { useState } from 'react';
import type { BdTarget, BdPresetType } from '../types';
import { BD_PERIODS, STATUS_FOCUSED_TARGETS, SKILL_FOCUSED_TARGETS, HIGH_SCORE_TARGETS, MENTAL_MAX_TARGETS, BALANCE_TARGETS, SKILL_SCORE_MAX_TARGETS, TARGET_TEAM_RANKS } from '../constants/beyondDreams';

interface BeyondDreamsSectionProps {
    preset: BdPresetType;
    targets: BdTarget[];
    currentLevels: BdTarget;
    onPresetChange: (preset: BdPresetType, newTargets: BdTarget[]) => void;
    onTargetsChange: (index: number, newTarget: BdTarget) => void;
    onCurrentLevelChange: (field: keyof BdTarget, delta: number) => void;
}

export const BeyondDreamsSection: React.FC<BeyondDreamsSectionProps> = ({
    preset,
    targets,
    currentLevels,
    onPresetChange,
    onTargetsChange,
    onCurrentLevelChange
}) => {
    const [showEffects, setShowEffects] = useState(false);

    // 次のおすすめを判定するロジック
    const getRecommendations = () => {
        const recs: { msg: string, isNext: boolean }[] = [];

        // フィジカル
        if (currentLevels.physical < 2) recs.push({ msg: 'フィジカルLv2 (体力消費量ダウン40％)', isNext: currentLevels.physical === 1 });
        else if (currentLevels.physical < 4) recs.push({ msg: 'フィジカルLv4 (体力消費量ダウン100％)', isNext: currentLevels.physical === 3 });

        // テクニック
        if (currentLevels.technique < 3) recs.push({ msg: 'テクニックLv3 (ヒント発生開始)', isNext: currentLevels.technique === 2 });
        else if (currentLevels.technique < 5) recs.push({ msg: 'テクニックLv5 (全ヒント発動)', isNext: currentLevels.technique === 4 });

        // メンタル
        if (currentLevels.mental < 3) recs.push({ msg: 'メンタルLv3 (失敗率ダウン100％, スキルPt上限+40)', isNext: currentLevels.mental === 2 });

        return recs;
    };
    const recommendations = getRecommendations();

    const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value as BdPresetType;
        let newTargets = targets;
        if (val === 'status') newTargets = STATUS_FOCUSED_TARGETS;
        else if (val === 'skill') newTargets = SKILL_FOCUSED_TARGETS;
        else if (val === 'high_score') newTargets = HIGH_SCORE_TARGETS;
        else if (val === 'mental_max') newTargets = MENTAL_MAX_TARGETS;
        else if (val === 'balance') newTargets = BALANCE_TARGETS;
        else if (val === 'skill_score_max') newTargets = SKILL_SCORE_MAX_TARGETS;
        onPresetChange(val, newTargets);
    };

    const handleTargetChange = (index: number, field: keyof BdTarget, value: string) => {
        const num = parseInt(value, 10);
        if (isNaN(num)) return;
        const clamped = Math.max(1, Math.min(8, num));
        onTargetsChange(index, { ...targets[index], [field]: clamped });
    };

    const handleShare = () => {
        const presetNames: Record<BdPresetType, string> = {
            status: 'ステータス重視',
            skill: 'スキル重視',
            high_score: '上振れ狙い (8-5-8)',
            mental_max: '序盤の絆特化 (メンタル優先)',
            balance: 'バランス重視',
            skill_score_max: 'スキル評価点特化 (5-8-8)',
            custom: 'カスタム'
        };
        const pName = presetNames[preset] || 'カスタム';

        // 目標LVをフォーマットしてテキストに追加
        // 1回目〜6回目を表す連番絵文字を使用
        const periodEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];
        const targetText = targets.map((t, i) => `${periodEmojis[i]} ${t.physical}-${t.technique}-${t.mental}`).join('\n');
        const text = `新シナリオ「Beyond Dreams」でウマ娘を育成中！\n「${pName}」ルートで進行しています🐎💨\n\n${targetText}\n\n`;

        const url = 'https://uma.tagamy.com/';
        const hashtags = 'ウマ娘';
        const intentUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=${encodeURIComponent(hashtags)}`;
        window.open(intentUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <section className="section beyond-dreams-section">
            <div className="bd-section-header">
                <h2><span className="icon">🌠</span> Beyond Dreams 目標管理</h2>
                <button className="x-share-btn" onClick={handleShare}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    ポスト
                </button>
            </div>

            <div className="bd-controls">
                <div className="bd-preset-select">
                    <label>目標プリセット: </label>
                    <select value={preset} onChange={handlePresetChange}>
                        <option value="status">ステータス重視</option>
                        <option value="balance">バランス重視</option>
                        <option value="skill">スキル重視</option>
                        <option disabled>──────────</option>
                        <option value="high_score">上振れ狙い (8-5-8)</option>
                        <option value="mental_max">序盤の絆特化 (1-1-3)</option>
                        <option value="skill_score_max">スキルヒント特化 (4-8-8)</option>
                        <option disabled>──────────</option>
                        <option value="custom">カスタム</option>
                    </select>
                </div>
            </div>

            <div className="bd-current-levels">
                <h3>現在のトレーニングLV</h3>
                <div className="bd-level-inputs">
                    {(['physical', 'technique', 'mental'] as Array<keyof BdTarget>).map((field) => (
                        <div key={field} className={`bd-level-box ${field}`}>
                            <span className="bd-label">
                                {field === 'physical' ? 'フィジカル' : field === 'technique' ? 'テクニック' : 'メンタル'}
                            </span>
                            <div className="bd-stepper">
                                <button onClick={() => onCurrentLevelChange(field, -1)} disabled={currentLevels[field] <= 1}>-</button>
                                <span className="bd-value">{currentLevels[field]}</span>
                                <button onClick={() => onCurrentLevelChange(field, 1)} disabled={currentLevels[field] >= 8}>+</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {recommendations.length > 0 && (
                <div className="bd-recommendations">
                    <h3><span className="icon">🌟</span> 次のおすすめ目標</h3>
                    <ul>
                        {recommendations.map((rec, i) => (
                            <li key={i} className={rec.isNext ? 'highlight' : ''}>
                                {rec.isNext ? <span className="urgent-badge">あと1Lv!</span> : null}
                                {rec.msg}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="bd-targets-table-wrap">
                <table className="bd-targets-table">
                    <thead>
                        <tr>
                            <th>時期</th>
                            <th>フィジカル</th>
                            <th>テクニック</th>
                            <th>メンタル</th>
                        </tr>
                    </thead>
                    <tbody>
                        {BD_PERIODS.map((period, i) => (
                            <tr key={period}>
                                <td className="bd-period">
                                    <div className="bd-period-name">{period}</div>
                                    {TARGET_TEAM_RANKS[i] !== '-' && (
                                        <div className="bd-target-rank">目標: {TARGET_TEAM_RANKS[i]}</div>
                                    )}
                                </td>
                                {(['physical', 'technique', 'mental'] as Array<keyof BdTarget>).map(field => {
                                    const targetVal = targets[i]?.[field] ?? 1;
                                    const diff = currentLevels[field] - targetVal;
                                    const diffClass = diff >= 0 ? 'achieved' : 'shortfall';
                                    return (
                                        <td key={field} className="bd-target-cell">
                                            <div className="bd-target-input-wrap">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="8"
                                                    value={targetVal}
                                                    onChange={(e) => handleTargetChange(i, field, e.target.value)}
                                                    disabled={preset !== 'custom'}
                                                    className="bd-target-input"
                                                />
                                            </div>
                                            <div className={`bd-diff ${diffClass}`}>
                                                {diff >= 0 ? "OK" : `${diff}`}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bd-effects-toggle">
                <button
                    className="bd-effects-btn"
                    onClick={() => setShowEffects(!showEffects)}
                >
                    {showEffects ? "▲ トレーニング効果を隠す" : "▼ トレーニング効果を確認"}
                </button>
                {showEffects && (
                    <div className="bd-effects-content full-details">
                        <h4>フィジカル</h4>
                        <ul>
                            <li><strong>Lv1</strong>: 友情ボーナス10％ / サポート5種以上でサブ基礎獲得量アップ15％</li>
                            <li><strong>Lv2</strong>: 友情ボーナス20％ / サポート5種以上でサブ基礎獲得量アップ25％ / 体力消費量ダウン40％</li>
                            <li><strong>Lv3</strong>: 友情ボーナス25％ / サポート5種以上でサブ基礎獲得量アップ30％ / 体力消費量ダウン70％</li>
                            <li><strong>Lv4</strong>: 友情ボーナス35％ / サポート5種以上でサブ基礎獲得量アップ35％ / 体力消費量ダウン100％</li>
                            <li><strong>Lv5</strong>: 友情ボーナス40％ / サポート5種以上でサブ基礎獲得量アップ40％ / 体力消費量ダウン100％</li>
                            <li><strong>Lv6</strong>: 友情ボーナス50％ / サポート5種以上でサブ基礎獲得量アップ45％ / 体力消費量ダウン100％</li>
                            <li><strong>Lv7</strong>: 友情ボーナス55％ / サポート5種以上でサブ基礎獲得量アップ50％ / 体力消費量ダウン100％</li>
                            <li><strong>Lv8</strong>: 友情ボーナス65％ / サポート5種以上でサブ基礎獲得量アップ55％ / 体力消費量ダウン100％</li>
                        </ul>

                        <h4>テクニック</h4>
                        <ul>
                            <li><strong>Lv1</strong>: スキルPt効果アップ10％</li>
                            <li><strong>Lv2</strong>: スキルPt効果アップ15％</li>
                            <li><strong>Lv3</strong>: スキルPt効果アップ20％ / 友人とグループを除くサポート1人のヒント発生</li>
                            <li><strong>Lv4</strong>: スキルPt効果アップ25％ / 友人とグループを除くサポート2人のヒント発生</li>
                            <li><strong>Lv5</strong>: スキルPt効果アップ30％ / 友人とグループを除くサポート2人のヒント発生 / サポート5種以上で該当練習の全ヒント発動</li>
                            <li><strong>Lv6</strong>: スキルPt効果アップ30％ / 友人とグループを除くサポート3人のヒント発生 / サポート5種以上で該当練習の全ヒント発動</li>
                            <li><strong>Lv7</strong>: スキルPt効果アップ30％ / 友人とグループを除くサポート4人のヒント発生 / サポート5種以上で該当練習の全ヒント発動</li>
                            <li><strong>Lv8</strong>: スキルPt効果アップ30％ / 友人とグループを除くサポート5人のヒント発生 / サポート5種以上で該当練習の全ヒント発動</li>
                        </ul>

                        <h4>メンタル</h4>
                        <ul>
                            <li><strong>Lv1</strong>: 絆ゲージ上昇量+3 / 失敗率ダウン5％</li>
                            <li><strong>Lv2</strong>: 絆ゲージ上昇量+5 / 失敗率ダウン50％ / サポート5種以上でメイン基礎獲得上限+15</li>
                            <li><strong>Lv3</strong>: 絆ゲージ上昇量+7 / 失敗率ダウン100％ / サポート5種以上でメイン基礎獲得上限+25、スキルPt上限+40</li>
                            <li><strong>Lv4</strong>: 絆ゲージ上昇量+7 / 失敗率ダウン100％ / サポート5種以上でメイン基礎獲得上限+35、スキルPt上限+60</li>
                            <li><strong>Lv5</strong>: 絆ゲージ上昇量+7 / 失敗率ダウン100％ / サポート5種以上でメイン基礎獲得上限+40、スキルPt上限+80</li>
                            <li><strong>Lv6</strong>: 絆ゲージ上昇量+7 / 失敗率ダウン100％ / サポート5種以上でメイン基礎獲得上限+45、スキルPt上限+100</li>
                            <li><strong>Lv7</strong>: 絆ゲージ上昇量+7 / 失敗率ダウン100％ / サポート5種以上でメイン基礎獲得上限+50、スキルPt上限+110</li>
                            <li><strong>Lv8</strong>: 絆ゲージ上昇量+7 / 失敗率ダウン100％ / サポート5種以上でメイン基礎獲得上限+60、スキルPt上限+120</li>
                        </ul>
                    </div>
                )}
            </div>
        </section>
    );
};

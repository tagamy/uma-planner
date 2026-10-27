import type { EnmokuKey, EnmokuPlan, JuniorOshie, ClassicOshie, SeniorOshie, SupportCardType } from '../types';

export interface EnmokuMeta {
    key: EnmokuKey;
    label: string;
    shortLabel: string;
    icon: string;
    color: string;
    bgLight: string;
    borderColor: string;
    cap: number;
}

export const ENMOKU_LIST: EnmokuMeta[] = [
    { key: 'speed', label: 'スピード', shortLabel: 'スピ', icon: '👟', color: '#e53935', bgLight: '#ffebee', borderColor: '#ef9a9a', cap: 2200 },
    { key: 'stamina', label: 'スタミナ', shortLabel: 'スタ', icon: '❤️', color: '#f57c00', bgLight: '#fff3e0', borderColor: '#ffcc80', cap: 1850 },
    { key: 'power', label: 'パワー', shortLabel: 'パワ', icon: '💪', color: '#fb8c00', bgLight: '#fff8e1', borderColor: '#ffe082', cap: 1800 },
    { key: 'guts', label: '根性', shortLabel: '根性', icon: '🔥', color: '#d81b60', bgLight: '#fce4ec', borderColor: '#f48fb1', cap: 1700 },
    { key: 'wisdom', label: '賢さ', shortLabel: '賢さ', icon: '🎓', color: '#1e88e5', bgLight: '#e3f2fd', borderColor: '#90caf9', cap: 1800 },
];

export const JUNIOR_OSHIE_DATA: Record<Exclude<JuniorOshie, ''>, {
    label: string;
    basicEffect: string;
    permanentEffect: string;
    badgeText: string;
    color: string;
}> = {
    '絆': {
        label: '絆の教え',
        basicEffect: '絆ゲージ上昇量UP / 演目稽古のメイン能力UP',
        permanentEffect: '夏合宿中に担当サポカが追加で＋1人出現！',
        badgeText: '⛺ 合宿で担当サポカ＋1人出現',
        color: '#d32f2f',
    },
    '得意率': {
        label: '得意率の教え',
        basicEffect: '得意練習に出現しやすくなる',
        permanentEffect: '演目稽古に友情ボーナスが乗る！',
        badgeText: '🤝 演目稽古に友情ボーナス加算',
        color: '#1976d2',
    },
    'ヒント': {
        label: 'ヒントの教え',
        basicEffect: 'ヒント（！）の発生率UP',
        permanentEffect: '演目稽古時のヒント獲得数＋1！',
        badgeText: '💡 演目稽古ヒント獲得数＋1',
        color: '#2e7d32',
    },
    '助力': {
        label: '助力の教え',
        basicEffect: '友情非発生時のトレ効果UP',
        permanentEffect: '演目稽古で「助力の支え（トレ効果UP）」獲得！',
        badgeText: '🌸 演目稽古でトレ効果UP獲得',
        color: '#c2185b',
    },
    '体力': {
        label: '体力の教え',
        basicEffect: '演目稽古の体力消費量ダウン',
        permanentEffect: '演目稽古の体力消費ダウンがずっと継続！',
        badgeText: '🍵 演目稽古の体力消費ダウン永続',
        color: '#7b1fa2',
    },
};

// クラシック期：特化・研鑽のLv1〜10効果
export const getClassicOshieEffectText = (oshie: ClassicOshie, level: number): string => {
    const lv = Math.max(1, Math.min(10, level));
    if (oshie === '特化') {
        const table: Record<number, { bonus: number; cap: number }> = {
            1: { bonus: 5, cap: 5 },
            2: { bonus: 6, cap: 6 },
            3: { bonus: 7, cap: 7 },
            4: { bonus: 8, cap: 8 },
            5: { bonus: 9, cap: 9 },
            6: { bonus: 11, cap: 11 },
            7: { bonus: 13, cap: 13 },
            8: { bonus: 16, cap: 16 },
            9: { bonus: 20, cap: 20 },
            10: { bonus: 25, cap: 25 },
        };
        const d = table[lv];
        return `メイン能力+${d.bonus}% / 上限+${d.cap}`;
    }
    if (oshie === '研鑽') {
        const table: Record<number, number> = {
            1: 20, 2: 22, 3: 24, 4: 27, 5: 30, 6: 35, 7: 40, 8: 50, 9: 65, 10: 80
        };
        return `追加稽古発生率 +${table[lv]}%`;
    }
    return '';
};

// シニア期：不屈の教え 失敗率0%体力ライン＆トレ効果
export const getFukutsuStatus = (level: number): {
    staminaThreshold: number;
    trainingBonus: number;
    summaryText: string;
    isMax: boolean;
} => {
    const lv = Math.max(1, Math.min(10, level));
    // Lv1:45, Lv2:40, Lv3:35, Lv4:30, Lv5:25, Lv6:20, Lv7:15, Lv8:10(+1%), Lv9:5(+3%), Lv10:0(+5%)
    const staminaThreshold = lv === 10 ? 0 : Math.max(5, 50 - lv * 5);
    const trainingBonus = lv === 10 ? 5 : lv === 9 ? 3 : lv === 8 ? 1 : 0;
    const isMax = lv === 10;

    if (isMax) {
        return {
            staminaThreshold: 0,
            trainingBonus: 5,
            summaryText: '🔥【無双】体力0でも失敗率0%！（トレ効果+5%）',
            isMax: true,
        };
    }
    const bonusStr = trainingBonus > 0 ? ` / トレ効果+${trainingBonus}%` : '';
    return {
        staminaThreshold,
        trainingBonus,
        summaryText: `🛡️ 体力 ${staminaThreshold} 以上で失敗率0%！${bonusStr}`,
        isMax: false,
    };
};

// シニア期の教え効果テキスト
export const getSeniorOshieEffectText = (oshie: SeniorOshie, level: number): string => {
    const lv = Math.max(1, Math.min(10, level));
    if (oshie === '不屈') {
        return getFukutsuStatus(lv).summaryText;
    }
    if (oshie === '協力') {
        return `👥 友情+${lv}% ＆ 別練習へ分身ワープ出現！`;
    }
    if (oshie === '両道') {
        const subTable: Record<number, number> = {
            1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 8, 7: 11, 8: 15, 9: 20, 10: 25
        };
        const trTable: Record<number, number> = {
            1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 7, 7: 9, 8: 11, 9: 13, 10: 15
        };
        return `⚔️ サブ能力+${subTable[lv]}% / 演目トレ効果+${trTable[lv]}%`;
    }
    return '';
};

export interface ShuntaisaiPreset {
    id: string;
    name: string;
    badge: string;
    description: string;
    deckTypes?: SupportCardType[];
    enmoku: Record<EnmokuKey, Omit<EnmokuPlan, 'level'>>;
}

export const SHUNTAISAI_PRESETS: ShuntaisaiPreset[] = [
    {
        id: 'middle_long',
        name: '🏇 中・長距離 王道ビルド（スタ確保）',
        badge: 'スピ2/スタ1/パワ1/賢1',
        description: 'スピード上限2200を「特化→両道」で狙いつつ、スタミナ・パワーを伸ばし、賢さに「不屈」を置いて体力管理も安定させる鉄板構成！',
        deckTypes: ['スピード', 'スピード', 'スタミナ', 'パワー', '賢さ'],
        enmoku: {
            speed:   { junior: '絆',     classic: '特化', senior: '両道' },
            stamina: { junior: '得意率', classic: '特化', senior: '協力' },
            power:   { junior: '助力',   classic: '研鑽', senior: '両道' },
            guts:    { junior: 'ヒント', classic: '研鑽', senior: '協力' },
            wisdom:  { junior: '体力',   classic: '研鑽', senior: '不屈' },
        },
    },
    {
        id: 'short_mile',
        name: '⚡ 短距離・マイル LG狙い（根性・高評価点）',
        badge: 'スピ2/パワ1/根1/賢1',
        description: 'スピ・パワ・根性を同時に爆発させて新ランク「LG」を狙う環境トップ構成！主力を「特化→両道」、終盤連打したい枠に「不屈」を配置。',
        deckTypes: ['スピード', 'スピード', 'パワー', '根性', '賢さ'],
        enmoku: {
            speed:   { junior: '絆',     classic: '特化', senior: '両道' },
            stamina: { junior: 'ヒント', classic: '研鑽', senior: '協力' },
            power:   { junior: '得意率', classic: '特化', senior: '両道' },
            guts:    { junior: '助力',   classic: '特化', senior: '不屈' },
            wisdom:  { junior: '体力',   classic: '研鑽', senior: '協力' },
        },
    },
    {
        id: 'rush_fukutsu',
        name: '🔥 終盤ノーリスク連打型（不屈2枠＆分身）',
        badge: '上振れ特化',
        description: 'スピードとパワー（または主練習2枠）に「不屈」を置き、シニア期に体力0でも失敗率0%で強い練習を踏み続ける爆発力重視ルート！',
        enmoku: {
            speed:   { junior: '絆',     classic: '特化', senior: '不屈' },
            stamina: { junior: 'ヒント', classic: '研鑽', senior: '協力' },
            power:   { junior: '得意率', classic: '特化', senior: '不屈' },
            guts:    { junior: '助力',   classic: '研鑽', senior: '両道' },
            wisdom:  { junior: '体力',   classic: '研鑽', senior: '協力' },
        },
    },
];

export const DEFAULT_SHUNTAISAI_ENMOKU: Record<EnmokuKey, EnmokuPlan> = {
    speed:   { level: 1, junior: '絆',     classic: '特化', senior: '両道' },
    stamina: { level: 1, junior: '得意率', classic: '特化', senior: '協力' },
    power:   { level: 1, junior: '助力',   classic: '研鑽', senior: '両道' },
    guts:    { level: 1, junior: 'ヒント', classic: '研鑽', senior: '協力' },
    wisdom:  { level: 1, junior: '体力',   classic: '研鑽', senior: '不屈' },
};

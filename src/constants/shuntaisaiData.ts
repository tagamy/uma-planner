import type {
    EnmokuKey,
    JuniorOshie,
    UpgradedOshie,
    AnyOshie,
    TenseiPairs,
    PeriodPlacement,
    SupportCardType,
} from '../types';

export interface EnmokuMeta {
    key: EnmokuKey;
    label: string;
    enmokuName: string;
    shortLabel: string;
    icon: string;
    color: string;
    bgLight: string;
    borderColor: string;
    cap: number;
}

export const ENMOKU_LIST: EnmokuMeta[] = [
    { key: 'speed', label: 'スピード', enmokuName: '流鏑馬', shortLabel: 'スピ', icon: '👟', color: '#1e88e5', bgLight: '#e3f2fd', borderColor: '#90caf9', cap: 2200 },
    { key: 'stamina', label: 'スタミナ', enmokuName: '神旗争奪戦', shortLabel: 'スタ', icon: '❤️', color: '#e53935', bgLight: '#ffebee', borderColor: '#ef9a9a', cap: 1850 },
    { key: 'power', label: 'パワー', enmokuName: '納舞', shortLabel: 'パワ', icon: '💪', color: '#fb8c00', bgLight: '#fff3e0', borderColor: '#ffcc80', cap: 1800 },
    { key: 'guts', label: '根性', enmokuName: '大曳神輿', shortLabel: '根性', icon: '🔥', color: '#d81b60', bgLight: '#fce4ec', borderColor: '#f48fb1', cap: 1700 },
    { key: 'wisdom', label: '賢さ', enmokuName: '飛駆', shortLabel: '賢さ', icon: '🎓', color: '#2e7d32', bgLight: '#e8f5e9', borderColor: '#a5d6a7', cap: 1800 },
];

export const ALL_JUNIOR_OSHIE: JuniorOshie[] = ['絆', '得意率', 'ヒント', '助力', '体力'];
export const CLASSIC_UPGRADED_OSHIE: UpgradedOshie[] = ['特化', '研鑽'];
export const SENIOR_UPGRADED_OSHIE: UpgradedOshie[] = ['協力', '不屈', '両道'];
export const ALL_UPGRADED_OSHIE: UpgradedOshie[] = ['特化', '研鑽', '協力', '不屈', '両道'];

export interface PeriodMeta {
    index: number;
    label: string;
    shortLabel: string;
    timingDesc: string;
    phase: 'junior' | 'classic' | 'senior';
    tenseiBadge?: string;
}

export const SHUNTAISAI_PERIODS: PeriodMeta[] = [
    {
        index: 0,
        label: '① ジュニア級 デビュー前',
        shortLabel: '① Jr.デビュー前',
        timingDesc: '育成開始3ターン目（初期5種の教えを配置）',
        phase: 'junior',
    },
    {
        index: 1,
        label: '② ジュニア級 デビュー後',
        shortLabel: '② Jr.デビュー後',
        timingDesc: 'ジュニア7月前半・駿大祭合宿前（初期5種を付け替え）',
        phase: 'junior',
    },
    {
        index: 2,
        label: '③ ジュニア級 12月後半終了時',
        shortLabel: '③ Jr.12月後(★2転成)',
        timingDesc: '2つの教えを「特化・研鑽」に転成！残り3つはそのまま使用',
        phase: 'classic',
        tenseiBadge: '★2つの教えを転成（特化・研鑽）',
    },
    {
        index: 3,
        label: '④ クラシック級 6月後半終了時',
        shortLabel: '④ Cl.6月後(合宿前)',
        timingDesc: 'クラシック夏合宿前（特化・研鑽＋未転成3つを付け替え）',
        phase: 'classic',
    },
    {
        index: 4,
        label: '⑤ クラシック級 12月後半終了時',
        shortLabel: '⑤ Cl.12月後(★3転成)',
        timingDesc: '残り3つの教えを「協力・不屈・両道」に転成！全5種が転成済みに',
        phase: 'senior',
        tenseiBadge: '★残り3つの教えを転成（協力・不屈・両道）',
    },
    {
        index: 5,
        label: '⑥ シニア級 6月後半終了時',
        shortLabel: '⑥ Sr.6月後(合宿前)',
        timingDesc: 'シニア夏合宿前〜終盤（全5種の転成教えを最終配置）',
        phase: 'senior',
    },
];

export const JUNIOR_OSHIE_DATA: Record<JuniorOshie, {
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
        badgeText: '⛺合宿+1人&演目主能力UP',
        color: '#c62828',
    },
    '得意率': {
        label: '得意率の教え',
        basicEffect: '得意練習に出現しやすくなる',
        permanentEffect: '演目稽古に友情ボーナスが乗る！',
        badgeText: '🤝得意率UP&演目友情ボナ',
        color: '#1565c0',
    },
    'ヒント': {
        label: 'ヒントの教え',
        basicEffect: 'ヒント（！）の発生率UP',
        permanentEffect: '演目稽古時のヒント獲得数＋1！',
        badgeText: '💡ヒント率UP&演目ヒント+1',
        color: '#2e7d32',
    },
    '助力': {
        label: '助力の教え',
        basicEffect: '友情非発生時のトレ効果UP',
        permanentEffect: '演目稽古で「助力の支え（トレ効果UP）」獲得！',
        badgeText: '🌸非友情トレ効果&助力の支え',
        color: '#ad1457',
    },
    '体力': {
        label: '体力の教え',
        basicEffect: '演目稽古の体力消費量ダウン',
        permanentEffect: '演目稽古の体力消費ダウンがずっと継続！',
        badgeText: '🍵演目稽古の体力消費軽減',
        color: '#6a1b9a',
    },
};

export const isUpgradedOshie = (oshie: AnyOshie): oshie is UpgradedOshie => {
    return ALL_UPGRADED_OSHIE.includes(oshie as UpgradedOshie);
};

// 指定したステップ(0〜5)で選択可能な5つの教えリストを返す
export const getAvailableOshieForStep = (stepIndex: number, tenseiPairs: TenseiPairs): (JuniorOshie | UpgradedOshie)[] => {
    if (stepIndex <= 1) {
        return [...ALL_JUNIOR_OSHIE];
    }
    if (stepIndex <= 3) {
        // ジュニア終了時に転成した2つ(特化・研鑽) ＋ 転成しなかった初期教え3つ
        const usedInClassic = new Set<JuniorOshie>([tenseiPairs['特化'], tenseiPairs['研鑽']]);
        const remainingJunior = ALL_JUNIOR_OSHIE.filter(j => !usedInClassic.has(j));
        return ['特化', '研鑽', ...remainingJunior];
    }
    // シニア期(step 4, 5)は全5種が転成済み
    return ['特化', '研鑽', '協力', '不屈', '両道'];
};

// シニア期：不屈の教え 失敗率0%体力ライン＆トレ効果
export const getFukutsuStatus = (level: number): {
    staminaThreshold: number;
    trainingBonus: number;
    summaryText: string;
    isMax: boolean;
} => {
    const lv = Math.max(1, Math.min(10, level));
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

// 任意の教えの現在Lvに応じた効果テキストを返す
export const getOshieEffectByLevel = (oshie: AnyOshie, level: number): string => {
    if (!oshie) return '';
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
        return `📈 メイン能力+${d.bonus}% ＆ 上限+${d.cap}`;
    }
    if (oshie === '研鑽') {
        const table: Record<number, number> = {
            1: 20, 2: 22, 3: 24, 4: 27, 5: 30, 6: 35, 7: 40, 8: 50, 9: 65, 10: 80
        };
        return `⚡ 追加の稽古 発生率+${table[lv]}%`;
    }
    if (oshie === '協力') {
        return `👥 友情+${lv}% ＆ 別練習へ分身ワープ出現！`;
    }
    if (oshie === '不屈') {
        return getFukutsuStatus(lv).summaryText;
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

    // 初期5種の教えの場合
    const jr = JUNIOR_OSHIE_DATA[oshie as JuniorOshie];
    return jr ? jr.basicEffect : '';
};

export interface ShuntaisaiPreset {
    id: string;
    name: string;
    badge: string;
    description: string;
    deckTypes?: SupportCardType[];
    tenseiPairs: TenseiPairs;
    placements: PeriodPlacement[]; // 長さ6
}

export const SHUNTAISAI_PRESETS: ShuntaisaiPreset[] = [
    {
        id: 'wisdom_tokka',
        name: '🧠 賢さ「得意率×特化」固定 ＆ スピ「体力×研鑽」型',
        badge: '初日検証トレンド',
        description: 'Jr終了時に「得意率→特化」を賢さに固定して回復＆賢さカンストを安定させ、「体力→研鑽」で主練習の消費を抑えつつ追加稽古を連発させる注目テンプレ！',
        tenseiPairs: {
            '特化': '得意率',
            '研鑽': '体力',
            '協力': 'ヒント',
            '不屈': '助力',
            '両道': '絆',
        },
        placements: [
            // ① Jr.デビュー前
            { speed: '絆', stamina: 'ヒント', power: '体力', guts: '助力', wisdom: '得意率' },
            // ② Jr.デビュー後（合宿前）
            { speed: '体力', stamina: '絆', power: 'ヒント', guts: '助力', wisdom: '得意率' },
            // ③ Jr.12月後半終了時（★2つ転成：特化[得意率]・研鑽[体力] ＋ 残り：絆・ヒント・助力）
            { speed: '研鑽', stamina: '絆', power: 'ヒント', guts: '助力', wisdom: '特化' },
            // ④ Cl.6月後半終了時（合宿前）
            { speed: '研鑽', stamina: 'ヒント', power: '絆', guts: '助力', wisdom: '特化' },
            // ⑤ Cl.12月後半終了時（★残り3つ転成：協力[ヒント]・不屈[助力]・両道[絆]）
            { speed: '協力', stamina: '両道', power: '研鑽', guts: '不屈', wisdom: '特化' },
            // ⑥ Sr.6月後半終了時（合宿前〜終盤）
            { speed: '協力', stamina: '両道', power: '研鑽', guts: '不屈', wisdom: '特化' },
        ],
    },
    {
        id: 'middle_long',
        name: '🏇 中・長距離 バランス（スピ2/スタ1/パワ1/賢1）',
        badge: '中・長距離',
        description: 'Jr終了時に「得意率→特化」「絆→研鑽」、Cl終了時に「ヒント→協力」「体力→不屈」「助力→両道」へ転成する中・長距離向け構成！',
        deckTypes: ['スピード', 'スピード', 'スタミナ', 'パワー', '賢さ'],
        tenseiPairs: {
            '特化': '得意率',
            '研鑽': '絆',
            '協力': 'ヒント',
            '不屈': '体力',
            '両道': '助力',
        },
        placements: [
            // ① Jr.デビュー前
            { speed: '絆', stamina: 'ヒント', power: '助力', guts: '体力', wisdom: '得意率' },
            // ② Jr.デビュー後（合宿前）
            { speed: '得意率', stamina: '絆', power: 'ヒント', guts: '助力', wisdom: '体力' },
            // ③ Jr.12月後半終了時（★2つ転成：特化[得意率]・研鑽[絆] ＋ 残り：ヒント・助力・体力）
            { speed: '特化', stamina: '助力', power: 'ヒント', guts: '体力', wisdom: '研鑽' },
            // ④ Cl.6月後半終了時（合宿前）
            { speed: '特化', stamina: '体力', power: '助力', guts: 'ヒント', wisdom: '研鑽' },
            // ⑤ Cl.12月後半終了時（★残り3つ転成：協力[ヒント]・不屈[体力]・両道[助力]）
            { speed: '協力', stamina: '特化', power: '両道', guts: '不屈', wisdom: '研鑽' },
            // ⑥ Sr.6月後半終了時（合宿前〜終盤）
            { speed: '特化', stamina: '協力', power: '両道', guts: '研鑽', wisdom: '不屈' },
        ],
    },
    {
        id: 'status_priority',
        name: '💪 ステ盛り優先ルート',
        badge: 'ステータス重視',
        description: 'Jr終了時に「得意率→特化」「絆→研鑽」、Cl終了時に「体力→協力」「助力→不屈」「ヒント→両道」へ転成。クラ合宿でスピ特化・パワ研鑽を踏むステ重視ルート！',
        tenseiPairs: {
            '特化': '得意率',
            '研鑽': '絆',
            '協力': '体力',
            '不屈': '助力',
            '両道': 'ヒント',
        },
        placements: [
            // ① Jr.デビュー前
            { speed: '絆', stamina: '助力', power: 'ヒント', guts: '体力', wisdom: '得意率' },
            // ② Jr.デビュー後（合宿前）
            { speed: '絆', stamina: '体力', power: 'ヒント', guts: '助力', wisdom: '得意率' },
            // ③ Jr.12月後半終了時（★2つ転成：特化[得意率]・研鑽[絆] ＋ 残り：体力・ヒント・助力）
            { speed: '研鑽', stamina: '体力', power: 'ヒント', guts: '助力', wisdom: '特化' },
            // ④ Cl.6月後半終了時（合宿前）
            { speed: '特化', stamina: '体力', power: '研鑽', guts: '助力', wisdom: 'ヒント' },
            // ⑤ Cl.12月後半終了時（★残り3つ転成：協力[体力]・不屈[助力]・両道[ヒント]）
            { speed: '協力', stamina: '両道', power: '研鑽', guts: '不屈', wisdom: '特化' },
            // ⑥ Sr.6月後半終了時（合宿前〜終盤）
            { speed: '協力', stamina: '両道', power: '研鑽', guts: '不屈', wisdom: '特化' },
        ],
    },
    {
        id: 'hint_priority',
        name: '💡 ヒント拾い優先ルート',
        badge: 'ヒント回収重視',
        description: 'Jr終了時に「ヒント→特化」「得意率→研鑽」、Cl終了時に「体力→協力」「助力→不屈」「絆→両道」へ転成。スタ・パワでヒント回収＆特化を活かすルート！',
        tenseiPairs: {
            '特化': 'ヒント',
            '研鑽': '得意率',
            '協力': '体力',
            '不屈': '助力',
            '両道': '絆',
        },
        placements: [
            // ① Jr.デビュー前
            { speed: '絆', stamina: 'ヒント', power: '助力', guts: '体力', wisdom: '得意率' },
            // ② Jr.デビュー後（合宿前）
            { speed: '絆', stamina: 'ヒント', power: '体力', guts: '助力', wisdom: '得意率' },
            // ③ Jr.12月後半終了時（★2つ転成：特化[ヒント]・研鑽[得意率] ＋ 残り：体力・助力・絆）
            { speed: '体力', stamina: '特化', power: '助力', guts: '絆', wisdom: '研鑽' },
            // ④ Cl.6月後半終了時（合宿前）
            { speed: '体力', stamina: '助力', power: '特化', guts: '絆', wisdom: '研鑽' },
            // ⑤ Cl.12月後半終了時（★残り3つ転成：協力[体力]・不屈[助力]・両道[絆]）
            { speed: '協力', stamina: '両道', power: '特化', guts: '不屈', wisdom: '研鑽' },
            // ⑥ Sr.6月後半終了時（合宿前〜終盤）
            { speed: '協力', stamina: '両道', power: '研鑽', guts: '不屈', wisdom: '特化' },
        ],
    },
];

export const DEFAULT_TENSEI_PAIRS: TenseiPairs = { ...SHUNTAISAI_PRESETS[0].tenseiPairs };
export const DEFAULT_PLACEMENTS: PeriodPlacement[] = SHUNTAISAI_PRESETS[0].placements.map(p => ({ ...p }));
export const DEFAULT_LEVELS: Record<EnmokuKey, number> = {
    speed: 1,
    stamina: 1,
    power: 1,
    guts: 1,
    wisdom: 1,
};

export type SupportCardType = 'スピード' | 'スタミナ' | 'パワー' | '根性' | '賢さ' | '友人';

export interface SupportCard {
    id: string;
    name: string;
    type: SupportCardType;
    progress: 0 | 1 | 2 | 3;
    isCancelled: boolean; // 打ち切り状態
}

export interface KiremonoEventState {
    completed: boolean;
    failed: boolean;
}

export interface KiremonoState {
    normalEvent: KiremonoEventState;
    costumeEvent: KiremonoEventState;
    acquired: boolean; // 最終的に取得できたか
}

export interface AptitudeSState {
    distance: boolean; // 距離適性
    surface: boolean; // バ場適性
    style: boolean; // 脚質適性
}

export interface InheritedSkill {
    id: string;
    name: string;
    acquired: boolean;
}

export type BdPresetType = 'status' | 'skill' | 'high_score' | 'mental_max' | 'balance' | 'skill_score_max' | 'custom';

export interface BdTarget {
    physical: number;
    technique: number;
    mental: number;
}

export interface BeyondDreamsState {
    preset: BdPresetType;
    targets: BdTarget[]; // 長さ6の配列 (各時期の目標)
    currentLevels: BdTarget; // 現在のレベル
}

export interface TorisenKenState {
    tips: {
        noodles: number;
        soup: number;
        toppings: number;
        secret: number;
    };
    regions: {
        junior: [string, string, string];
        classic: [string, string, string];
        senior: [string, string, string];
    };
    targetDistance: 'short' | 'mile' | 'medium' | 'long' | 'dirt' | '';
    ramenCounts: {
        junior: [number, number, number];
        classic: [number, number, number];
        senior: [number, number, number];
    };
    ultimateRamen: string; // 究極ラーメンの選択メモ
}

export type EnmokuKey = 'speed' | 'stamina' | 'power' | 'guts' | 'wisdom';
export type JuniorOshie = '絆' | '得意率' | 'ヒント' | '助力' | '体力';
export type UpgradedOshie = '特化' | '研鑽' | '協力' | '不屈' | '両道';
export type AnyOshie = JuniorOshie | UpgradedOshie | '';

// 5つの転成教えそれぞれについて、どの初期教え(JuniorOshie)をベースに転成したか
export type TenseiPairs = Record<UpgradedOshie, JuniorOshie>;

// 1回の時期における5演目それぞれの教え配置
export type PeriodPlacement = Record<EnmokuKey, AnyOshie>;

export interface ShuntaisaiState {
    hasAzuma: boolean;
    outingCount: number; // 0〜5
    presetName: string;
    activeStep: number; // 0〜5 (現在の時期インデックス: 全6回)
    levels: Record<EnmokuKey, number>; // 5演目の現在Lv (1〜10)
    tenseiPairs: TenseiPairs; // ジュニア終了時2つ(特化/研鑽)＋クラシック終了時3つ(協力/不屈/両道)の転成元
    placements: PeriodPlacement[]; // 長さ6の配列（全6回の配置）
}

export interface TrainingRecord {
    id: string;
    scenario?: 'shuntaisai' | 'torisenKen' | 'beyondDreams';
    rank: string;
    score: string;
    sp: string;
    juniorSp?: string;
    classicSp?: string;
    supportCards: string[];
    torisenKen: {
        regions: {
            junior: [string, string, string];
            classic: [string, string, string];
            senior: [string, string, string];
        };
        ramenCounts: {
            junior: [number, number, number];
            classic: [number, number, number];
            senior: [number, number, number];
        };
    };
    shuntaisai?: {
        hasAzuma: boolean;
        outingCount: number;
        levels: Record<EnmokuKey, number>;
        tenseiPairs: TenseiPairs;
        placements: PeriodPlacement[];
    };
    createdAt: number;
}

export interface GameState {
    supportCards: SupportCard[];
    kiremono: KiremonoState;
    aptitudeS: AptitudeSState;
    inheritedSkills: InheritedSkill[];
    beyondDreams: BeyondDreamsState;
    selectedScenario: 'shuntaisai' | 'torisenKen' | 'beyondDreams';
    torisenKen: TorisenKenState;
    shuntaisai: ShuntaisaiState;
    records: TrainingRecord[];
}

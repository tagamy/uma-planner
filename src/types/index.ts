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
export type JuniorOshie = '絆' | '得意率' | 'ヒント' | '助力' | '体力' | '';
export type ClassicOshie = '特化' | '研鑽' | '';
export type SeniorOshie = '協力' | '不屈' | '両道' | '';

export interface EnmokuPlan {
    level: number;
    junior: JuniorOshie;
    classic: ClassicOshie;
    senior: SeniorOshie;
}

export interface ShuntaisaiState {
    hasAzuma: boolean;
    outingCount: number; // 0〜5
    presetName: string;
    enmoku: Record<EnmokuKey, EnmokuPlan>;
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
        enmoku: Record<EnmokuKey, EnmokuPlan>;
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

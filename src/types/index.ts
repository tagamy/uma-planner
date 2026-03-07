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

export interface GameState {
    supportCards: SupportCard[];
    kiremono: KiremonoState;
    aptitudeS: AptitudeSState;
    inheritedSkills: InheritedSkill[];
    beyondDreams: BeyondDreamsState;
}

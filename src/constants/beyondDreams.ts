import type { BdTarget } from '../types';

export const BD_PERIODS = [
    'ジュニア開始',
    'ジュニアデビュー前',
    'ジュニア12月後半',
    'クラシック合宿前',
    'クラシック12月後半',
    'シニア合宿前'
] as const;

export const TARGET_TEAM_RANKS = [
    '-',
    'EFF',
    'CDD',
    'BBB',
    'SSS',
    'UgUgUg'
] as const;

export const TARGET_TPS = [
    '-',
    '900',
    '1900',
    '3100',
    '4500',
    '6200'
]

export const STATUS_FOCUSED_TARGETS: BdTarget[] = [
    { physical: 3, technique: 1, mental: 1 },
    { physical: 3, technique: 1, mental: 3 },
    { physical: 5, technique: 1, mental: 5 },
    { physical: 5, technique: 4, mental: 5 },
    { physical: 5, technique: 4, mental: 8 },
    { physical: 8, technique: 4, mental: 8 },
];

export const BALANCE_TARGETS: BdTarget[] = [
    { physical: 2, technique: 1, mental: 2 },
    { physical: 3, technique: 1, mental: 3 },
    { physical: 3, technique: 3, mental: 5 },
    { physical: 4, technique: 5, mental: 5 },
    { physical: 4, technique: 5, mental: 8 },
    { physical: 7, technique: 5, mental: 8 },
];

export const SKILL_FOCUSED_TARGETS: BdTarget[] = [
    { physical: 1, technique: 1, mental: 3 },
    { physical: 3, technique: 1, mental: 3 },
    { physical: 3, technique: 3, mental: 5 },
    { physical: 4, technique: 5, mental: 5 },
    { physical: 4, technique: 5, mental: 8 },
    { physical: 5, technique: 7, mental: 8 },
];

export const HIGH_SCORE_TARGETS: BdTarget[] = [
    { physical: 3, technique: 1, mental: 1 },
    { physical: 3, technique: 2, mental: 3 },
    { physical: 4, technique: 2, mental: 5 },
    { physical: 5, technique: 4, mental: 5 },
    { physical: 5, technique: 5, mental: 8 },
    { physical: 8, technique: 5, mental: 8 },
];

export const MENTAL_MAX_TARGETS: BdTarget[] = [
    { physical: 1, technique: 1, mental: 3 },
    { physical: 3, technique: 1, mental: 3 },
    { physical: 4, technique: 2, mental: 5 },
    { physical: 4, technique: 5, mental: 5 },
    { physical: 4, technique: 5, mental: 8 },
    { physical: 7, technique: 5, mental: 8 },
];

export const SKILL_SCORE_MAX_TARGETS: BdTarget[] = [
    { physical: 3, technique: 1, mental: 1 },
    { physical: 3, technique: 1, mental: 3 },
    { physical: 4, technique: 2, mental: 5 },
    { physical: 4, technique: 5, mental: 5 },
    { physical: 4, technique: 5, mental: 8 },
    { physical: 4, technique: 8, mental: 8 },
];

export const DEFAULT_CURRENT_LEVELS: BdTarget = {
    physical: 1,
    technique: 1,
    mental: 1,
};

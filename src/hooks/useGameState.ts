import { useState, useEffect, useCallback } from 'react';
import type { GameState } from '../types';
import { SKILL_FOCUSED_TARGETS, DEFAULT_CURRENT_LEVELS } from '../constants/beyondDreams';
import {
    DEFAULT_TENSEI_PAIRS,
    DEFAULT_PLACEMENTS,
    DEFAULT_LEVELS,
} from '../constants/shuntaisaiData';

const STORAGE_KEY = 'uma-training-app-state';

export const defaultState: GameState = {
    supportCards: [
        { id: `card-0`, name: '', type: 'スピード', progress: 0, isCancelled: false },
        { id: `card-1`, name: '', type: 'スピード', progress: 0, isCancelled: false },
        { id: `card-2`, name: '', type: 'スタミナ', progress: 0, isCancelled: false },
        { id: `card-3`, name: '', type: 'パワー', progress: 0, isCancelled: false },
        { id: `card-4`, name: '', type: '賢さ', progress: 0, isCancelled: false },
    ],
    kiremono: {
        normalEvent: { completed: false, failed: false },
        costumeEvent: { completed: false, failed: false },
        acquired: false,
    },
    aptitudeS: {
        distance: false,
        surface: false,
        style: false,
    },
    inheritedSkills: [
        { id: 'skill-1', name: 'レースの真髄・体', acquired: false },
        { id: 'skill-2', name: 'レースの真髄・力', acquired: false },
    ],
    beyondDreams: {
        preset: 'skill',
        targets: SKILL_FOCUSED_TARGETS,
        currentLevels: DEFAULT_CURRENT_LEVELS,
    },
    selectedScenario: 'shuntaisai',
    torisenKen: {
        tips: { noodles: 0, soup: 0, toppings: 0, secret: 0 },
        regions: {
            junior: ['', '', ''],
            classic: ['', '', ''],
            senior: ['', '', '']
        },
        targetDistance: '',
        ramenCounts: {
            junior: [0, 0, 0],
            classic: [0, 0, 0],
            senior: [0, 0, 0]
        },
        ultimateRamen: '',
    },
    shuntaisai: {
        hasAzuma: true,
        outingCount: 0,
        presetName: 'wisdom_tokka',
        activeStep: 0,
        levels: DEFAULT_LEVELS,
        tenseiPairs: DEFAULT_TENSEI_PAIRS,
        placements: DEFAULT_PLACEMENTS,
    },
    records: []
};

export const useGameState = () => {
    const [state, setState] = useState<GameState>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const isFirstShuntaisaiLoad = !parsed.shuntaisai;
                const s = parsed.shuntaisai;

                // デフォルトとマージして返す (フィールド追加・構造変更時対策)
                return {
                    ...defaultState,
                    ...parsed,
                    supportCards: parsed.supportCards?.length === 5 ? parsed.supportCards : defaultState.supportCards,
                    kiremono: {
                        normalEvent: typeof parsed.kiremono?.normalEvent === 'boolean'
                            ? { completed: parsed.kiremono.normalEvent, failed: false }
                            : { ...defaultState.kiremono.normalEvent, ...parsed.kiremono?.normalEvent },
                        costumeEvent: typeof parsed.kiremono?.costumeEvent === 'boolean'
                            ? { completed: parsed.kiremono.costumeEvent, failed: false }
                            : { ...defaultState.kiremono.costumeEvent, ...parsed.kiremono?.costumeEvent },
                        acquired: parsed.kiremono?.acquired ?? false,
                    },
                    aptitudeS: { ...defaultState.aptitudeS, ...parsed.aptitudeS },
                    inheritedSkills: parsed.inheritedSkills || defaultState.inheritedSkills,
                    beyondDreams: parsed.beyondDreams || defaultState.beyondDreams,
                    selectedScenario: isFirstShuntaisaiLoad ? 'shuntaisai' : (parsed.selectedScenario ?? 'shuntaisai'),
                    torisenKen: parsed.torisenKen ? { 
                        ...defaultState.torisenKen, 
                        ...parsed.torisenKen,
                        tips: parsed.torisenKen.tips || defaultState.torisenKen.tips,
                        regions: Array.isArray(parsed.torisenKen.regions) ? defaultState.torisenKen.regions : (parsed.torisenKen.regions || defaultState.torisenKen.regions),
                        ramenCounts: parsed.torisenKen.ramenCounts?.junior ? parsed.torisenKen.ramenCounts : defaultState.torisenKen.ramenCounts
                    } : defaultState.torisenKen,
                    shuntaisai: s ? {
                        hasAzuma: s.hasAzuma ?? true,
                        outingCount: s.outingCount ?? 0,
                        presetName: s.presetName || 'middle_long',
                        activeStep: typeof s.activeStep === 'number' ? s.activeStep : 0,
                        levels: s.levels ? { ...defaultState.shuntaisai.levels, ...s.levels } : defaultState.shuntaisai.levels,
                        tenseiPairs: s.tenseiPairs ? { ...defaultState.shuntaisai.tenseiPairs, ...s.tenseiPairs } : defaultState.shuntaisai.tenseiPairs,
                        placements: Array.isArray(s.placements) && s.placements.length === 6 ? s.placements : defaultState.shuntaisai.placements,
                    } : defaultState.shuntaisai,
                    records: Array.isArray(parsed.records) ? parsed.records : defaultState.records,
                };
            } catch (e) {
                console.error('Failed to parse state from LocalStorage', e);
            }
        }
        return defaultState;
    });

    // stateが変わるたびにLocalStorageに保存
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    const updateState = useCallback((updater: (prev: GameState) => GameState) => {
        setState((prev) => updater(prev));
    }, []);

    const resetState = useCallback(() => {
        if (window.confirm('全ての育成状況をリセットしますか？')) {
            setState(defaultState);
        }
    }, []);

    return { state, updateState, resetState };
};

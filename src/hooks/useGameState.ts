import { useState, useEffect, useCallback } from 'react';
import type { GameState } from '../types';
import { STATUS_FOCUSED_TARGETS, DEFAULT_CURRENT_LEVELS } from '../constants/beyondDreams';

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
        preset: 'status',
        targets: STATUS_FOCUSED_TARGETS,
        currentLevels: DEFAULT_CURRENT_LEVELS,
    }
};

export const useGameState = () => {
    const [state, setState] = useState<GameState>(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // デフォルトとマージして返す (フィールド追加時対策)
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
                    // カスタム追加されたスキルが消えないよう、IDベースでマージ
                    inheritedSkills: parsed.inheritedSkills || defaultState.inheritedSkills,
                    beyondDreams: parsed.beyondDreams || defaultState.beyondDreams,
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

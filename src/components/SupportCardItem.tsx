import React from 'react';
import { FaHeart, FaFire, FaGraduationCap } from 'react-icons/fa';
import { GiRunningShoe, GiBiceps } from 'react-icons/gi';
import type { SupportCard, SupportCardType } from '../types';

const FriendIcon = ({ size = 16 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <mask id="friend-mask">
            <rect width="24" height="24" fill="white" />
            <circle cx="8.5" cy="8.5" r="1.7" fill="black" />
            <circle cx="15.5" cy="8.5" r="1.7" fill="black" />
            <path d="M8 12.5 C10 15 14 15 16 12.5" stroke="black" strokeWidth="2" strokeLinecap="round" fill="none" />
        </mask>
        <g mask="url(#friend-mask)" fill="currentColor">
            <circle cx="12" cy="9" r="8" />
            <path d="M4 24 C4 16 7 16 12 16 C17 16 20 16 20 24 Z" />
        </g>
    </svg>
);

interface Props {
    card: SupportCard;
    onChangeName: (id: string, name: string) => void;
    onChangeType: (id: string, type: SupportCardType) => void;
    onProgress: (id: string) => void;
    onCancel: (id: string) => void;
}

const SUPPORT_TYPES: SupportCardType[] = ['スピード', 'スタミナ', 'パワー', '根性', '賢さ', '友人'];

const getTypeIcon = (type: SupportCardType) => {
    switch (type) {
        case 'スピード': return <><span className="type-icon speed"><GiRunningShoe size={14} /></span> スピード</>;
        case 'スタミナ': return <><span className="type-icon stamina"><FaHeart size={14} /></span> スタミナ</>;
        case 'パワー': return <><span className="type-icon power"><GiBiceps size={14} /></span> パワー</>;
        case '根性': return <><span className="type-icon guts"><FaFire size={14} /></span> 根性</>;
        case '賢さ': return <><span className="type-icon wisdom"><FaGraduationCap size={16} /></span> 賢さ</>;
        case '友人': return <><span className="type-icon friend"><FriendIcon size={16} /></span> 友人</>;
        default: return <><span className="type-icon default">❓</span> 不明</>;
    }
};

export const SupportCardItem: React.FC<Props> = ({ card, onChangeName, onChangeType, onProgress, onCancel }) => {
    return (
        <div className={`support-card-item ${card.isCancelled ? 'cancelled' : ''}`}>
            <div className="card-header">
                <div className="custom-type-select">
                    <button
                        className={`type-btn type-${card.type}`}
                        disabled={card.isCancelled}
                        onClick={() => {
                            // シンプルなトグルを実装（次へ次へと切り替わる）
                            const currentIndex = SUPPORT_TYPES.indexOf(card.type);
                            const nextIndex = (currentIndex + 1) % SUPPORT_TYPES.length;
                            onChangeType(card.id, SUPPORT_TYPES[nextIndex]);
                        }}
                        title="クリックでタイプを変更"
                    >
                        {getTypeIcon(card.type)}
                    </button>
                </div>
                <input
                    type="text"
                    className="card-name-input"
                    placeholder="カード名"
                    value={card.name}
                    onChange={(e) => onChangeName(card.id, e.target.value)}
                    disabled={card.isCancelled}
                />
                <button
                    className="cancel-btn"
                    onClick={() => onCancel(card.id)}
                    title={card.isCancelled ? "打ち切り解除" : "イベント打ち切り"}
                >
                    {card.isCancelled ? '復活' : '終了'}
                </button>
            </div>

            <div className="card-progress">
                <div className="progress-label">進行度</div>
                <div
                    className="progress-indicator"
                    onClick={() => !card.isCancelled && onProgress(card.id)}
                >
                    {[1, 2, 3].map((step) => (
                        <div
                            key={step}
                            className={`progress-step ${card.progress >= step ? 'active' : ''}`}
                        ></div>
                    ))}
                </div>
            </div>
        </div>
    );
};

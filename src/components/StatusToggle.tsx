import React from 'react';

interface Props {
    label: string;
    isActive: boolean;
    isFailed?: boolean;
    onToggle?: () => void;
    onFail?: () => void;
    colorType?: 'default' | 'gold' | 'pink' | 'blue' | 'plain';
    hideCheckbox?: boolean;
}

export const StatusToggle: React.FC<Props> = ({ label, isActive, isFailed, onToggle, onFail, colorType = 'default', hideCheckbox }) => {
    return (
        <div className={`status-toggle-wrapper ${isFailed ? 'failed' : ''}`} style={{ display: 'flex', gap: '0.5rem', flex: 1 }}>
            <button
                className={`status-toggle ${isActive ? 'active' : ''} color-${colorType}`}
                onClick={onToggle}
                disabled={!onToggle}
                style={{ flex: 1, cursor: !onToggle ? 'default' : 'pointer' }}
            >
                <span className="toggle-label">{label}</span>
                {!hideCheckbox && (
                    <div className="toggle-checkbox">
                        {isActive && <span className="checkmark">✔</span>}
                    </div>
                )}
            </button>
            {onFail && (
                <button
                    className="cancel-btn"
                    onClick={onFail}
                    title={isFailed ? "失敗取り消し" : "イベント失敗（切れ者獲得ならず）"}
                >
                    {isFailed ? '復活' : '終了'}
                </button>
            )}
        </div>
    );
};

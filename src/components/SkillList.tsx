import React, { useState } from 'react';
import type { InheritedSkill } from '../types';

interface Props {
    skills: InheritedSkill[];
    onToggleSkill: (id: string) => void;
    onAddSkill: (name: string) => void;
    onRemoveSkill: (id: string) => void;
}

export const SkillList: React.FC<Props> = ({ skills, onToggleSkill, onAddSkill, onRemoveSkill }) => {
    const [newSkillName, setNewSkillName] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (newSkillName.trim()) {
            onAddSkill(newSkillName.trim());
            setNewSkillName('');
        }
    };

    return (
        <div className="skill-list-container">
            <div className="skills-grid">
                {skills.map(skill => (
                    <div
                        key={skill.id}
                        className={`skill-item ${skill.acquired ? 'acquired' : ''}`}
                        onClick={() => onToggleSkill(skill.id)}
                    >
                        <div className="skill-item-checkbox">
                            {skill.acquired && <span className="checkmark">✔</span>}
                        </div>
                        <span className="skill-name">{skill.name}</span>
                        <button
                            className="skill-remove-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemoveSkill(skill.id);
                            }}
                            title="削除"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            <form className="add-skill-form" onSubmit={handleAdd}>
                <input
                    type="text"
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    placeholder="スキルの追加"
                    className="add-skill-input"
                />
                <button type="submit" className="add-skill-btn">追加</button>
            </form>
        </div>
    );
};

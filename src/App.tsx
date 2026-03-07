import { useGameState } from './hooks/useGameState';
import { SupportCardItem } from './components/SupportCardItem';
import { StatusToggle } from './components/StatusToggle';
import { SkillList } from './components/SkillList';
import { BeyondDreamsSection } from './components/BeyondDreamsSection';
import type { BdPresetType, BdTarget } from './types';
import './index.css';

function App() {
  const { state, updateState, resetState } = useGameState();

  const handleSupportCardChange = (id: string, updates: Partial<typeof state.supportCards[0]>) => {
    updateState(prev => ({
      ...prev,
      supportCards: prev.supportCards.map(card => card.id === id ? { ...card, ...updates } : card)
    }));
  };

  const handleProgress = (id: string) => {
    updateState(prev => ({
      ...prev,
      supportCards: prev.supportCards.map(card => {
        if (card.id === id) {
          const next = card.progress >= 3 ? 0 : card.progress + 1;
          return { ...card, progress: next as 0 | 1 | 2 | 3 };
        }
        return card;
      })
    }));
  };

  const handleCancel = (id: string) => {
    updateState(prev => ({
      ...prev,
      supportCards: prev.supportCards.map(card => card.id === id ? { ...card, isCancelled: !card.isCancelled } : card)
    }));
  };

  const handleBdPresetChange = (preset: BdPresetType, newTargets: BdTarget[]) => {
    updateState(prev => ({
      ...prev,
      beyondDreams: { ...prev.beyondDreams, preset, targets: newTargets }
    }));
  };

  const handleBdTargetsChange = (index: number, newTarget: BdTarget) => {
    updateState(prev => {
      const newArr = [...prev.beyondDreams.targets];
      newArr[index] = newTarget;
      return { ...prev, beyondDreams: { ...prev.beyondDreams, targets: newArr } };
    });
  };

  const handleBdCurrentLevelChange = (field: keyof BdTarget, delta: number) => {
    updateState(prev => {
      const cur = prev.beyondDreams.currentLevels[field];
      const next = Math.max(1, Math.min(8, cur + delta));
      return {
        ...prev,
        beyondDreams: {
          ...prev.beyondDreams,
          currentLevels: { ...prev.beyondDreams.currentLevels, [field]: next }
        }
      };
    });
  };

  const generateId = () => `skill-${Date.now()}`;

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-title-area">
          <h1>ウマ娘 育成進捗管理アプリ</h1>
          <p className="header-subtitle">もう諦める？それとも続行？育成の”引き際”を見極めよう！</p>
        </div>
        <button className="reset-btn" onClick={resetState}>🔄 リセット</button>
      </header>

      <main className="app-main">
        {/* Beyond Dreams セクション */}
        <BeyondDreamsSection
          preset={state.beyondDreams.preset}
          targets={state.beyondDreams.targets}
          currentLevels={state.beyondDreams.currentLevels}
          onPresetChange={handleBdPresetChange}
          onTargetsChange={handleBdTargetsChange}
          onCurrentLevelChange={handleBdCurrentLevelChange}
        />

        {/* サポートカードセクション */}
        <section className="section card-section">
          <h2><span className="icon">🏃</span> サポートカード進行度</h2>
          <div className="card-list">
            {state.supportCards.map(card => (
              <SupportCardItem
                key={card.id}
                card={card}
                onChangeName={(id, name) => handleSupportCardChange(id, { name })}
                onChangeType={(id, type) => handleSupportCardChange(id, { type })}
                onProgress={handleProgress}
                onCancel={handleCancel}
              />
            ))}
          </div>
        </section>

        {/* 切れ者イベントセクション */}
        <section className="section kiremono-section">
          <h2><span className="icon">💡</span> 切れ者</h2>
          <div className="toggle-group" style={{ flexDirection: 'column' }}>
            <StatusToggle
              label={state.kiremono.normalEvent.failed ? "通常イベント (終了)" : "通常イベント"}
              isActive={!state.kiremono.normalEvent.failed}
              isFailed={state.kiremono.normalEvent.failed}
              hideCheckbox={true}
              onToggle={() => updateState(prev => ({ ...prev, kiremono: { ...prev.kiremono, normalEvent: { ...prev.kiremono.normalEvent, failed: !prev.kiremono.normalEvent.failed } } }))}
              colorType="plain"
            />
            <StatusToggle
              label={state.kiremono.costumeEvent.failed ? "衣装イベント (終了)" : "衣装イベント"}
              isActive={!state.kiremono.costumeEvent.failed}
              isFailed={state.kiremono.costumeEvent.failed}
              hideCheckbox={true}
              onToggle={() => updateState(prev => ({ ...prev, kiremono: { ...prev.kiremono, costumeEvent: { ...prev.kiremono.costumeEvent, failed: !prev.kiremono.costumeEvent.failed } } }))}
              colorType="plain"
            />
          </div>
          <div className="acquired-wrap" style={{ marginTop: '1rem' }}>
            <StatusToggle
              label="切れ者 獲得！"
              isActive={state.kiremono.acquired}
              onToggle={() => updateState(prev => ({ ...prev, kiremono: { ...prev.kiremono, acquired: !prev.kiremono.acquired } }))}
              colorType="pink"
            />
          </div>
        </section>

        {/* 適性Sセクション */}
        <section className="section aptitude-section">
          <h2><span className="icon">🏆</span> 適性 S 継承</h2>
          <div className="toggle-group">
            <StatusToggle
              label="距離🐾"
              isActive={state.aptitudeS.distance}
              onToggle={() => updateState(prev => ({ ...prev, aptitudeS: { ...prev.aptitudeS, distance: !prev.aptitudeS.distance } }))}
              colorType="default"
            />
            <StatusToggle
              label="バ場🌱"
              isActive={state.aptitudeS.surface}
              onToggle={() => updateState(prev => ({ ...prev, aptitudeS: { ...prev.aptitudeS, surface: !prev.aptitudeS.surface } }))}
              colorType="default"
            />
            <StatusToggle
              label="脚質🏇"
              isActive={state.aptitudeS.style}
              onToggle={() => updateState(prev => ({ ...prev, aptitudeS: { ...prev.aptitudeS, style: !prev.aptitudeS.style } }))}
              colorType="default"
            />
          </div>
        </section>

        {/* スキル継承セクション */}
        <section className="section skills-section">
          <h2><span className="icon">✨</span> 継承スキル</h2>
          <SkillList
            skills={state.inheritedSkills}
            onToggleSkill={(id) => updateState(prev => ({
              ...prev,
              inheritedSkills: prev.inheritedSkills.map(s => s.id === id ? { ...s, acquired: !s.acquired } : s)
            }))}
            onAddSkill={(name) => updateState(prev => ({
              ...prev,
              inheritedSkills: [...prev.inheritedSkills, { id: generateId(), name, acquired: false }]
            }))}
            onRemoveSkill={(id) => updateState(prev => ({
              ...prev,
              inheritedSkills: prev.inheritedSkills.filter(s => s.id !== id)
            }))}
          />
        </section>
      </main>

      <footer className="app-footer">
        <p>Created by <a href="https://x.com/tagamycom" target="_blank" rel="noopener noreferrer">@tagamycom</a> & Gemini 3.1 Pro</p>
      </footer>
    </div>
  );
}

export default App;


import { useState } from 'react';
import { useGameStore, type MapId } from '../stores/gameStore';

const MAPS: { id: MapId; name: string; subtitle: string; desc: string; theme: string }[] = [
  {
    id: 'nuketown',
    name: 'NUKETOWN',
    subtitle: 'NEVADA, USA',
    desc: 'Classic cul-de-sac — two houses, open road, desert sun',
    theme: '#c9a84c',
  },
  {
    id: 'osaka',
    name: 'DOTONBORI',
    subtitle: 'OSAKA, JAPAN',
    desc: 'Neon-lit canal — cherry blossoms, bridges, night fight',
    theme: '#ff4488',
  },
  {
    id: 'vatican',
    name: 'VATICAN',
    subtitle: 'ROME, ITALY',
    desc: "Pope's balcony — enemies swarm St. Peter's Square below",
    theme: '#d4aa44',
  },
  {
    id: 'hormuz',
    name: 'HORMUZ',
    subtitle: 'STRAIT OF HORMUZ',
    desc: 'Cliff fortress — stop enemy ships from passing the chokepoint',
    theme: '#2288cc',
  },
  {
    id: 'eisland',
    name: 'E ISLAND',
    subtitle: 'PRIVATE ISLAND',
    desc: 'AC-130 gunship — circle the island, rain rockets on billionaires below',
    theme: '#44cc66',
  },
];

export function MainMenu() {
  const startGame = useGameStore((s) => s.startGame);
  const selectedMap = useGameStore((s) => s.selectedMap);
  const setMap = useGameStore((s) => s.setMap);
  const [showControls, setShowControls] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  const currentMap = MAPS.find((m) => m.id === selectedMap) || MAPS[0];

  const handlePlay = () => {
    setTransitioning(true);
    setTimeout(() => {
      startGame();
      const canvas = document.querySelector('canvas');
      if (canvas) canvas.requestPointerLock();
    }, 600);
  };

  return (
    <div className={`main-menu ${transitioning ? 'fade-out' : ''}`}>
      {/* Left gradient panel */}
      <div className="menu-panel">
        {/* Top: branding */}
        <div className="menu-header">
          <div className="menu-eyebrow">CALL OF DUTY</div>
          <h1 className="menu-title" style={{
            background: `linear-gradient(180deg, #fff 40%, ${currentMap.theme} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            {currentMap.name}
          </h1>
          <h2 className="menu-subtitle" style={{ color: currentMap.theme }}>
            SNIPER 1v1
          </h2>
          <div className="menu-divider" style={{ background: currentMap.theme }} />
        </div>

        {/* Menu items */}
        <nav className="menu-nav">
          <button
            className={`menu-item ${hoveredItem === 'play' ? 'active' : ''}`}
            onMouseEnter={() => setHoveredItem('play')}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={handlePlay}
          >
            <span className="menu-item-bar" style={{ background: currentMap.theme }} />
            <span className="menu-item-text">PLAY</span>
            <span className="menu-item-desc">Start a 1v1 sniper match</span>
          </button>

          <button
            className={`menu-item ${hoveredItem === 'controls' ? 'active' : ''}`}
            onMouseEnter={() => setHoveredItem('controls')}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={() => setShowControls(!showControls)}
          >
            <span className="menu-item-bar" style={{ background: currentMap.theme }} />
            <span className="menu-item-text">CONTROLS</span>
            <span className="menu-item-desc">View keybindings</span>
          </button>
        </nav>

        {/* Controls panel (slides in) */}
        {showControls && (
          <div className="controls-panel">
            <div className="control-row"><span className="key">W A S D</span><span>Move</span></div>
            <div className="control-row"><span className="key">SPACE</span><span>Jump</span></div>
            <div className="control-row"><span className="key">SHIFT</span><span>Sprint</span></div>
            <div className="control-row"><span className="key">LMB</span><span>Shoot</span></div>
            <div className="control-row"><span className="key">RMB</span><span>Aim Down Sights</span></div>
            <div className="control-row"><span className="key">R</span><span>Reload</span></div>
            <div className="control-row"><span className="key">Q</span><span>Lasso Whip</span></div>
            <div className="control-row"><span className="key">1</span><span>Sniper</span></div>
            <div className="control-row"><span className="key">2</span><span>Rocket Launcher</span></div>
          </div>
        )}

        {/* Map selector */}
        <div className="map-selector">
          <div className="map-selector-label">SELECT MAP</div>
          <div className="map-cards">
            {MAPS.map((map) => (
              <button
                key={map.id}
                className={`map-card ${selectedMap === map.id ? 'selected' : ''}`}
                style={{
                  borderColor: selectedMap === map.id ? map.theme : 'rgba(255,255,255,0.1)',
                }}
                onClick={() => setMap(map.id)}
              >
                <div className="map-card-name" style={{ color: selectedMap === map.id ? map.theme : '#aaa' }}>
                  {map.name}
                </div>
                <div className="map-card-sub">{map.subtitle}</div>
                <div className="map-card-desc">{map.desc}</div>
                {selectedMap === map.id && (
                  <div className="map-card-check" style={{ color: map.theme }}>&#10003;</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom: game mode badge */}
        <div className="menu-footer">
          <div className="mode-badge">
            <span className="mode-label">MODE</span>
            <span className="mode-name" style={{ color: currentMap.theme }}>SNIPER 1v1</span>
          </div>
          <div className="mode-badge">
            <span className="mode-label">SCORE LIMIT</span>
            <span className="mode-name" style={{ color: currentMap.theme }}>FIRST TO 500</span>
          </div>
          <div className="mode-badge">
            <span className="mode-label">MAP</span>
            <span className="mode-name" style={{ color: currentMap.theme }}>{currentMap.name}</span>
          </div>
        </div>
      </div>

      {/* Ambient floating particles */}
      <div className="menu-particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 8}s`,
              opacity: 0.1 + Math.random() * 0.2,
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              background: selectedMap === 'osaka'
                ? 'rgba(255,68,136,0.5)'
                : selectedMap === 'vatican'
                ? 'rgba(212,170,68,0.5)'
                : selectedMap === 'hormuz'
                ? 'rgba(34,136,204,0.5)'
                : selectedMap === 'eisland'
                ? 'rgba(68,204,102,0.5)'
                : 'rgba(201,168,76,0.5)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

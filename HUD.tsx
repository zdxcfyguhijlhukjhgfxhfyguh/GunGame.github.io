import { useGameStore } from '../stores/gameStore';

export function HUD() {
  const health = useGameStore((s) => s.health);
  const ammo = useGameStore((s) => s.ammo);
  const reserveAmmo = useGameStore((s) => s.reserveAmmo);
  const rocketAmmo = useGameStore((s) => s.rocketAmmo);
  const currentWeapon = useGameStore((s) => s.currentWeapon);
  const isReloading = useGameStore((s) => s.isReloading);
  const playerKills = useGameStore((s) => s.playerKills);
  const enemyKills = useGameStore((s) => s.enemyKills);
  const showHitMarker = useGameStore((s) => s.showHitMarker);
  const showKillBanner = useGameStore((s) => s.showKillBanner);
  const isAiming = useGameStore((s) => s.isAiming);
  const selectedMap = useGameStore((s) => s.selectedMap);
  const vaticanHealth = useGameStore((s) => s.vaticanHealth);
  const maxVaticanHealth = useGameStore((s) => s.maxVaticanHealth);

  const lowHealth = health <= 30;
  const vaticanPct = (vaticanHealth / maxVaticanHealth) * 100;
  const vaticanLow = vaticanPct <= 25;

  return (
    <div className="hud">
      {/* Crosshair — hidden when scoped */}
      {!isAiming && (
        <div className="crosshair">
          <div className="ch-h l" />
          <div className="ch-h r" />
          <div className="ch-v t" />
          <div className="ch-v b" />
          <div className="ch-dot" />
        </div>
      )}

      {/* Scope overlay */}
      {isAiming && (
        <div className="scope-overlay">
          <div className="scope-crosshair-h" />
          <div className="scope-crosshair-v" />
          <div className="scope-circle" />
        </div>
      )}

      {/* Hit marker */}
      <div className={`hitmarker ${showHitMarker ? 'show' : ''}`}>
        <svg viewBox="0 0 24 24">
          <line x1="4" y1="4" x2="9" y2="9" stroke="white" strokeWidth="2" />
          <line x1="20" y1="4" x2="15" y2="9" stroke="white" strokeWidth="2" />
          <line x1="4" y1="20" x2="9" y2="15" stroke="white" strokeWidth="2" />
          <line x1="20" y1="20" x2="15" y2="15" stroke="white" strokeWidth="2" />
        </svg>
      </div>

      {/* Kill banner */}
      <div className={`kill-banner ${showKillBanner ? 'show' : ''}`}>
        ELIMINATED
      </div>

      {/* Score */}
      <div className="score-box">
        <div className="score-side">
          <div className="who">You</div>
          <div className="num you">{playerKills}</div>
        </div>
        <div className="score-sep">:</div>
        <div className="score-side">
          <div className="who">Enemy</div>
          <div className="num enemy">{enemyKills}</div>
        </div>
      </div>

      {/* Health */}
      <div className="health-box">
        <div className="label">Health</div>
        <div className="health-bar">
          <div
            className={`health-fill ${lowHealth ? 'low' : ''}`}
            style={{ width: `${health}%` }}
          />
        </div>
        <div className="health-val">{Math.ceil(health)}</div>
      </div>

      {/* Ammo */}
      <div className="ammo-box">
        <div className="label">
          {isReloading ? 'Reloading...' : currentWeapon === 'sniper' ? 'Sniper' : 'Rockets'}
        </div>
        {currentWeapon === 'sniper' ? (
          <div className={`count ${ammo === 0 ? 'empty' : ''}`}>
            {ammo}
            <span className="reserve"> / {reserveAmmo}</span>
          </div>
        ) : (
          <div className="count">
            &infin;
          </div>
        )}
      </div>

      {/* Defense health bar (Vatican / Hormuz) */}
      {(selectedMap === 'vatican' || selectedMap === 'hormuz') && (
        <div style={{
          position: 'absolute', top: '60px', left: '50%', transform: 'translateX(-50%)',
          width: '300px', textAlign: 'center', fontFamily: 'monospace',
        }}>
          <div style={{ color: vaticanLow ? '#ff4444' : selectedMap === 'hormuz' ? '#44aaff' : '#ffd700', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '2px' }}>
            {selectedMap === 'hormuz' ? 'Strait Defense' : 'Vatican Health'}
          </div>
          <div style={{
            width: '100%', height: '10px', background: 'rgba(0,0,0,0.6)',
            border: `1px solid ${selectedMap === 'hormuz' ? 'rgba(68,170,255,0.4)' : 'rgba(255,215,0,0.4)'}`, borderRadius: '2px',
          }}>
            <div style={{
              width: `${vaticanPct}%`, height: '100%', borderRadius: '2px',
              background: vaticanLow ? '#ff4444' : selectedMap === 'hormuz' ? 'linear-gradient(90deg, #2288cc, #44aaff)' : 'linear-gradient(90deg, #ffd700, #ffaa00)',
              transition: 'width 0.3s',
            }} />
          </div>
          <div style={{ color: '#ccc', fontSize: '10px', marginTop: '2px' }}>
            {Math.ceil(vaticanHealth)} / {maxVaticanHealth}
          </div>
        </div>
      )}

      {/* Weapon selector */}
      <div className="weapon-selector">
        <div className={`weapon-slot ${currentWeapon === 'sniper' ? 'active' : ''}`}>
          <span className="weapon-key">1</span> Sniper
        </div>
        <div className={`weapon-slot ${currentWeapon === 'rocket' ? 'active' : ''}`}>
          <span className="weapon-key">2</span> Rocket
        </div>
      </div>
    </div>
  );
}

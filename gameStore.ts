import { create } from 'zustand';

const SCORE_LIMIT = 500;

type Screen = 'menu' | 'playing';
export type MapId = 'nuketown' | 'osaka' | 'vatican' | 'hormuz' | 'eisland';
export type WeaponSlot = 'sniper' | 'rocket';

interface GameState {
  screen: Screen;
  selectedMap: MapId;
  health: number;
  ammo: number;
  maxAmmo: number;
  reserveAmmo: number;
  isReloading: boolean;
  isShooting: boolean;
  isMoving: boolean;
  isSprinting: boolean;
  isAiming: boolean;
  isWhipping: boolean;

  currentWeapon: WeaponSlot;
  rocketAmmo: number;
  maxRocketAmmo: number;

  vaticanHealth: number;
  maxVaticanHealth: number;

  playerKills: number;
  enemyKills: number;
  gameOver: boolean;
  winner: 'player' | 'enemy' | null;

  // Hit feedback
  showHitMarker: boolean;
  showKillBanner: boolean;

  setMap: (map: MapId) => void;
  startGame: () => void;
  shoot: () => boolean;
  reload: () => void;
  setIsReloading: (v: boolean) => void;
  setIsShooting: (v: boolean) => void;
  setIsMoving: (v: boolean) => void;
  setIsSprinting: (v: boolean) => void;
  setIsAiming: (v: boolean) => void;
  setIsWhipping: (v: boolean) => void;
  setCurrentWeapon: (w: WeaponSlot) => void;
  fireRocket: () => boolean;
  takeDamage: (amount: number) => void;
  respawnPlayer: () => void;
  addPlayerKill: () => void;
  addEnemyKill: () => void;
  damageVatican: (amount: number) => void;
  flashHitMarker: () => void;
  flashKillBanner: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  screen: 'menu' as Screen,
  selectedMap: 'nuketown' as MapId,
  health: 100,
  ammo: 5,
  maxAmmo: 5,
  reserveAmmo: 20,
  isReloading: false,
  isShooting: false,
  isMoving: false,
  isSprinting: false,
  isAiming: false,
  isWhipping: false,
  currentWeapon: 'sniper' as WeaponSlot,
  rocketAmmo: 3,
  maxRocketAmmo: 3,
  vaticanHealth: 5000,
  maxVaticanHealth: 5000,
  playerKills: 0,
  enemyKills: 0,
  gameOver: false,
  winner: null,
  showHitMarker: false,
  showKillBanner: false,

  setMap: (map) => set({ selectedMap: map }),
  startGame: () => set({ screen: 'playing' }),

  shoot: () => {
    const { ammo, isReloading } = get();
    if (ammo <= 0 || isReloading) return false;
    set({ ammo: ammo - 1 });
    return true;
  },

  reload: () => {
    const { ammo, maxAmmo, reserveAmmo, isReloading } = get();
    if (isReloading || ammo === maxAmmo || reserveAmmo <= 0) return;
    const needed = maxAmmo - ammo;
    const available = Math.min(needed, reserveAmmo);
    set({ ammo: ammo + available, reserveAmmo: reserveAmmo - available });
  },

  setIsReloading: (v) => set({ isReloading: v }),
  setIsShooting: (v) => set({ isShooting: v }),
  setIsMoving: (v) => set({ isMoving: v }),
  setIsSprinting: (v) => set({ isSprinting: v }),
  setIsAiming: (v) => set({ isAiming: v }),
  setIsWhipping: (v) => set({ isWhipping: v }),
  setCurrentWeapon: (w) => set({ currentWeapon: w }),
  fireRocket: () => {
    return true; // infinite rockets
  },

  takeDamage: (amount) => {
    const hp = Math.max(0, get().health - amount);
    set({ health: hp });
    if (hp <= 0) {
      get().addEnemyKill();
      setTimeout(() => get().respawnPlayer(), 2000);
    }
  },

  respawnPlayer: () => {
    set({ health: 100, ammo: 5, reserveAmmo: 20, rocketAmmo: 3, isReloading: false });
  },

  addPlayerKill: () => {
    const kills = get().playerKills + 1;
    set({ playerKills: kills });
    if (kills >= SCORE_LIMIT) set({ gameOver: true, winner: 'player' });
  },

  addEnemyKill: () => {
    const kills = get().enemyKills + 1;
    set({ enemyKills: kills });
    if (kills >= SCORE_LIMIT) set({ gameOver: true, winner: 'enemy' });
  },

  damageVatican: (amount) => {
    const hp = Math.max(0, get().vaticanHealth - amount);
    set({ vaticanHealth: hp });
    if (hp <= 0 && !get().gameOver) {
      set({ gameOver: true, winner: 'enemy' });
    }
  },

  flashHitMarker: () => {
    set({ showHitMarker: true });
    setTimeout(() => set({ showHitMarker: false }), 200);
  },

  flashKillBanner: () => {
    set({ showKillBanner: true });
    setTimeout(() => set({ showKillBanner: false }), 1500);
  },

  resetGame: () => {
    set({
      health: 100, ammo: 5, maxAmmo: 5, reserveAmmo: 20, rocketAmmo: 3, maxRocketAmmo: 3,
      currentWeapon: 'sniper' as WeaponSlot,
      isReloading: false, isShooting: false, isMoving: false, isSprinting: false, isAiming: false, isWhipping: false,
      vaticanHealth: 5000, maxVaticanHealth: 5000,
      playerKills: 0, enemyKills: 0, gameOver: false, winner: null,
      showHitMarker: false, showKillBanner: false,
      screen: 'menu' as Screen,
    });
  },
}));

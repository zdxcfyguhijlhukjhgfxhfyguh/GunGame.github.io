import * as THREE from 'three';

export type ProjType = 'fire' | 'lightning';

export interface EnemyProjectile {
  active: boolean;
  pos: THREE.Vector3;
  dir: THREE.Vector3;
  type: ProjType;
  speed: number;
  damage: number;
  life: number; // seconds remaining
}

const MAX_PROJECTILES = 24;

export const enemyProjectiles: EnemyProjectile[] = [];

// Initialize pool
for (let i = 0; i < MAX_PROJECTILES; i++) {
  enemyProjectiles.push({
    active: false,
    pos: new THREE.Vector3(),
    dir: new THREE.Vector3(),
    type: 'fire',
    speed: 0,
    damage: 0,
    life: 0,
  });
}

const _dir = new THREE.Vector3();

export function spawnEnemyProjectile(
  from: THREE.Vector3,
  target: THREE.Vector3,
  type: ProjType
) {
  const proj = enemyProjectiles.find(p => !p.active);
  if (!proj) return;

  proj.active = true;
  proj.pos.copy(from);
  proj.pos.y += 1.5; // shoot from chest height
  _dir.subVectors(target, proj.pos).normalize();
  proj.dir.copy(_dir);
  proj.type = type;
  proj.speed = type === 'fire' ? 20 : 35;
  proj.damage = type === 'fire' ? 15 : 10;
  proj.life = 3;
}

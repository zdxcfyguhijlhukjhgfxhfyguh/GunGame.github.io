import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../stores/gameStore';

const FIRE_RATE = 1800; // Sniper - bolt action, slow fire rate
const DAMAGE = 70; // High damage sniper
const HEADSHOT_MULT = 2;

const _screenCenter = new THREE.Vector2(0, 0);

export function Shooting() {
  const { camera, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const lastFire = useRef(0);
  const firing = useRef(false);
  const shootTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const down = (e: MouseEvent) => { if (e.button === 0) firing.current = true; };
    const up = (e: MouseEvent) => { if (e.button === 0) firing.current = false; };
    window.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousedown', down); window.removeEventListener('mouseup', up); };
  }, []);

  useFrame(() => {
    if (!firing.current || !document.pointerLockElement) return;

    const gs = useGameStore.getState();
    if (gs.currentWeapon !== 'sniper') return;

    const now = Date.now();
    if (now - lastFire.current < FIRE_RATE) return;

    if (!gs.shoot()) return;
    lastFire.current = now;

    // Shooting state for weapon recoil
    gs.setIsShooting(true);
    if (shootTimeout.current) clearTimeout(shootTimeout.current);
    shootTimeout.current = setTimeout(() => useGameStore.getState().setIsShooting(false), 100);

    // Raycast
    raycaster.current.setFromCamera(_screenCenter, camera);
    raycaster.current.near = 0.5;
    raycaster.current.far = 500;

    const hits = raycaster.current
      .intersectObjects(scene.children, true)
      .filter((h) => {
        if (!(h.object instanceof THREE.Mesh)) return false;
        if (h.distance < 1) return false;
        return true;
      });

    if (hits.length > 0) {
      const hit = hits[0];

      // Walk parent chain to find enemy userData
      let obj: THREE.Object3D | null = hit.object;
      while (obj) {
        if (obj.userData?.isEnemy && obj.userData?.takeDamage) {
          const isHeadshot = hit.object.userData?.isHead === true;
          const dmg = isHeadshot ? DAMAGE * HEADSHOT_MULT : DAMAGE;
          obj.userData.takeDamage(dmg);
          gs.flashHitMarker();
          break;
        }
        obj = obj.parent;
      }

      // Bullet hole on world geometry
      if (hit.face) {
        const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize();
        addBulletHole(hit.point, normal, scene);
      }
    }
  });

  return null;
}

// Simple bullet hole system using a shared pool
const MAX_HOLES = 50;
const holePool: THREE.Mesh[] = [];
let holeIdx = 0;

const holeMat = new THREE.MeshBasicMaterial({
  color: 0x111111,
  transparent: true,
  opacity: 0.8,
  side: THREE.DoubleSide,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: -2,
  polygonOffsetUnits: -2,
});

const holeGeo = new THREE.CircleGeometry(0.03, 8);
const _holeQ = new THREE.Quaternion();
const _holeFwd = new THREE.Vector3(0, 0, 1);

function addBulletHole(position: THREE.Vector3, normal: THREE.Vector3, scene: THREE.Scene) {
  let mesh: THREE.Mesh;

  if (holePool.length < MAX_HOLES) {
    mesh = new THREE.Mesh(holeGeo, holeMat);
    holePool.push(mesh);
    scene.add(mesh);
  } else {
    mesh = holePool[holeIdx % MAX_HOLES];
    holeIdx++;
  }

  mesh.position.copy(position).addScaledVector(normal, 0.005);
  _holeQ.setFromUnitVectors(_holeFwd, normal);
  mesh.quaternion.copy(_holeQ);
}

import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../stores/gameStore';

const ROCKET_SPEED = 70;
const ROCKET_MAX_DIST = 300;
const BLAST_RADIUS = 18;
const BLAST_DAMAGE = 200;
const BLAST_KNOCKBACK = 40;
const FIRE_COOLDOWN = 800; // ms
const MAX_ROCKETS = 8;
const MAX_EXPLOSIONS = 8;

const _forward = new THREE.Vector3();
const _toEnemy = new THREE.Vector3();
const _knockDir = new THREE.Vector3();
const _enemyPos = new THREE.Vector3();

interface Rocket {
  active: boolean;
  pos: THREE.Vector3;
  dir: THREE.Vector3;
  dist: number;
}

interface Explosion {
  active: boolean;
  pos: THREE.Vector3;
  phase: number; // 0->1
  scale: number;
}

export function Rockets() {
  const { camera, scene } = useThree();
  const firing = useRef(false);
  const lastFire = useRef(0);

  // Rocket pool
  const rockets = useRef<Rocket[]>([]);
  const rocketMeshes = useRef<(THREE.Group | null)[]>([]);

  // Explosion pool
  const explosions = useRef<Explosion[]>([]);
  const explGrps = useRef<(THREE.Group | null)[]>([]);

  // Initialize pools
  if (rockets.current.length === 0) {
    for (let i = 0; i < MAX_ROCKETS; i++) {
      rockets.current.push({ active: false, pos: new THREE.Vector3(), dir: new THREE.Vector3(), dist: 0 });
    }
  }
  if (explosions.current.length === 0) {
    for (let i = 0; i < MAX_EXPLOSIONS; i++) {
      explosions.current.push({ active: false, pos: new THREE.Vector3(), phase: 0, scale: 0 });
    }
  }

  useEffect(() => {
    const down = (e: MouseEvent) => { if (e.button === 0) firing.current = true; };
    const up = (e: MouseEvent) => { if (e.button === 0) firing.current = false; };
    window.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousedown', down); window.removeEventListener('mouseup', up); };
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const gs = useGameStore.getState();

    // Fire rocket
    if (firing.current && document.pointerLockElement && gs.currentWeapon === 'rocket') {
      const now = Date.now();
      if (now - lastFire.current >= FIRE_COOLDOWN && gs.fireRocket()) {
        lastFire.current = now;

        // Find inactive rocket slot
        const rocket = rockets.current.find(r => !r.active);
        if (rocket) {
          rocket.active = true;
          rocket.pos.copy(camera.position);
          _forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
          rocket.dir.copy(_forward);
          rocket.dist = 0;

          // Trigger shooting state for feedback
          gs.setIsShooting(true);
          setTimeout(() => useGameStore.getState().setIsShooting(false), 100);
        }
      }
    }

    // Update rockets
    for (let i = 0; i < MAX_ROCKETS; i++) {
      const rocket = rockets.current[i];
      const mesh = rocketMeshes.current[i];
      if (!mesh) continue;

      if (!rocket.active) {
        mesh.visible = false;
        continue;
      }

      mesh.visible = true;

      // Move rocket
      const step = ROCKET_SPEED * dt;
      rocket.pos.addScaledVector(rocket.dir, step);
      rocket.dist += step;

      // Position mesh
      mesh.position.copy(rocket.pos);
      mesh.lookAt(rocket.pos.x + rocket.dir.x, rocket.pos.y + rocket.dir.y, rocket.pos.z + rocket.dir.z);

      // Check collision with scene geometry
      let hit = false;

      // Simple proximity check against enemies
      scene.traverse((obj) => {
        if (hit) return;
        if (!obj.userData?.isEnemy) return;
        obj.getWorldPosition(_enemyPos);
        if (rocket.pos.distanceTo(_enemyPos) < 1.5) {
          hit = true;
        }
      });

      // Check if rocket hit ground/walls (below ground or too far)
      if (rocket.pos.y < 0.3) hit = true;
      if (rocket.dist > ROCKET_MAX_DIST) hit = true;

      if (hit) {
        rocket.active = false;
        mesh.visible = false;
        spawnExplosion(rocket.pos);
        applyBlastDamage(rocket.pos);
      }
    }

    // Update explosions
    for (let i = 0; i < MAX_EXPLOSIONS; i++) {
      const expl = explosions.current[i];
      const grp = explGrps.current[i];
      if (!grp) continue;

      if (!expl.active) {
        grp.visible = false;
        continue;
      }

      grp.visible = true;
      expl.phase += dt * 1.5; // explosion lasts ~0.65s

      if (expl.phase >= 1) {
        expl.active = false;
        grp.visible = false;
        continue;
      }

      const p = expl.phase;
      // Fast expand, slow fade
      const expand = 1 - Math.pow(1 - Math.min(p * 3, 1), 3); // quick expansion
      const fade = 1 - p;

      grp.position.copy(expl.pos);
      const s = expand * 12; // max blast visual radius — huge
      grp.scale.setScalar(s);

      // Update materials opacity
      grp.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          (child.material as THREE.MeshStandardMaterial).opacity = fade * 0.9;
        }
      });
    }
  });

  function spawnExplosion(pos: THREE.Vector3) {
    const expl = explosions.current.find(e => !e.active);
    if (!expl) {
      // Reuse oldest
      explosions.current[0].active = true;
      explosions.current[0].pos.copy(pos);
      explosions.current[0].phase = 0;
      return;
    }
    expl.active = true;
    expl.pos.copy(pos);
    expl.phase = 0;
  }

  function applyBlastDamage(pos: THREE.Vector3) {
    scene.traverse((obj) => {
      if (!obj.userData?.isEnemy || !obj.userData?.takeDamage) return;
      obj.getWorldPosition(_enemyPos);
      const dist = pos.distanceTo(_enemyPos);
      if (dist > BLAST_RADIUS) return;

      // Damage falls off with distance
      const falloff = 1 - (dist / BLAST_RADIUS);
      const dmg = Math.round(BLAST_DAMAGE * falloff);
      obj.userData.takeDamage(dmg);

      // Knockback away from blast center
      if (obj.userData.applyKnockback) {
        _knockDir.subVectors(_enemyPos, pos);
        _knockDir.y = 0.4;
        _knockDir.normalize();
        obj.userData.applyKnockback(_knockDir, BLAST_KNOCKBACK * falloff);
      }
    });
  }

  return (
    <>
      {/* Rocket meshes pool */}
      {Array.from({ length: MAX_ROCKETS }, (_, i) => (
        <group key={`rocket-${i}`} ref={el => { rocketMeshes.current[i] = el; }} visible={false}>
          {/* Rocket body */}
          <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.03, 0.3, 8]} />
            <meshStandardMaterial color="#555" roughness={0.4} metalness={0.7} />
          </mesh>
          {/* Warhead */}
          <mesh position={[0, 0, -0.18]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <coneGeometry args={[0.04, 0.08, 8]} />
            <meshStandardMaterial color="#2a2a2a" roughness={0.3} metalness={0.8} />
          </mesh>
          {/* Fins */}
          {[0, 1, 2, 3].map(f => (
            <mesh key={f} position={[0, 0, 0.15]} rotation={[0, 0, f * Math.PI / 2]}>
              <boxGeometry args={[0.005, 0.06, 0.06]} />
              <meshStandardMaterial color="#444" roughness={0.5} metalness={0.6} />
            </mesh>
          ))}
          {/* Rocket flame trail */}
          <pointLight position={[0, 0, 0.2]} color="#ff6600" intensity={3} distance={6} />
          <mesh position={[0, 0, 0.2]}>
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshBasicMaterial color="#ff8800" transparent opacity={0.8} />
          </mesh>
          <mesh position={[0, 0, 0.28]}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshBasicMaterial color="#ffaa00" transparent opacity={0.6} />
          </mesh>
        </group>
      ))}

      {/* Explosion meshes pool */}
      {Array.from({ length: MAX_EXPLOSIONS }, (_, i) => (
        <group key={`expl-${i}`} ref={el => { explGrps.current[i] = el; }} visible={false}>
          {/* White-hot core */}
          <mesh>
            <sphereGeometry args={[0.3, 12, 12]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffee88"
              emissiveIntensity={5}
              transparent
              opacity={0.95}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Inner fireball */}
          <mesh>
            <sphereGeometry args={[0.5, 12, 12]} />
            <meshStandardMaterial
              color="#ff4400"
              emissive="#ff6600"
              emissiveIntensity={4}
              transparent
              opacity={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Mid fireball */}
          <mesh>
            <sphereGeometry args={[0.75, 10, 10]} />
            <meshStandardMaterial
              color="#ff8800"
              emissive="#ff4400"
              emissiveIntensity={3}
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Outer fireball */}
          <mesh>
            <sphereGeometry args={[1.0, 10, 10]} />
            <meshStandardMaterial
              color="#ffaa00"
              emissive="#ff2200"
              emissiveIntensity={1.5}
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Shockwave ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.2, 0.15, 8, 24]} />
            <meshStandardMaterial
              color="#ff6600"
              emissive="#ff4400"
              emissiveIntensity={2}
              transparent
              opacity={0.5}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Smoke columns */}
          <mesh position={[0, 0.5, 0]}>
            <sphereGeometry args={[0.9, 8, 8]} />
            <meshStandardMaterial color="#222" transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0.3, 0.8, 0.2]}>
            <sphereGeometry args={[0.6, 8, 8]} />
            <meshStandardMaterial color="#333" transparent opacity={0.4} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[-0.2, 1.0, -0.1]}>
            <sphereGeometry args={[0.5, 8, 8]} />
            <meshStandardMaterial color="#444" transparent opacity={0.35} side={THREE.DoubleSide} />
          </mesh>
          {/* Blast light — very bright */}
          <pointLight color="#ff6600" intensity={40} distance={40} />
        </group>
      ))}
    </>
  );
}

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, useRapier } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameStore, type MapId } from '../stores/gameStore';
import { spawnEnemyProjectile } from '../systems/enemyProjectiles';

type EnemyClass = 'melee' | 'fire_mage' | 'lightning_mage' | 'cyclops' | 'titan';

function getEnemyClass(id: number): EnemyClass {
  if (id === 99) return 'titan'; // one super huge minion
  if (id % 15 === 0 && id > 0) return 'cyclops';
  if (id % 7 === 1) return 'fire_mage';
  if (id % 7 === 3) return 'lightning_mage';
  return 'melee';
}

// Reusable vector for spawning projectiles (avoid per-frame allocation)
const _spawnPos = new THREE.Vector3();

const VATICAN_WALL_Z = -50; // enemies reaching this Z damage the vatican

const WAYPOINTS: THREE.Vector3[] = [
  new THREE.Vector3(-17, 2, 0),
  new THREE.Vector3(-10, 2, 6),
  new THREE.Vector3(-4, 2, 3),
  new THREE.Vector3(4, 2, -3),
  new THREE.Vector3(10, 2, -6),
  new THREE.Vector3(17, 2, 0),
  new THREE.Vector3(0, 2, -16),
  new THREE.Vector3(-12, 2, -10),
  new THREE.Vector3(12, 2, 10),
  new THREE.Vector3(0, 2, 14),
  new THREE.Vector3(-8, 2, -22),
  new THREE.Vector3(8, 2, -22),
  new THREE.Vector3(0, 2, -50),
  new THREE.Vector3(0, 2, 50),
  new THREE.Vector3(40, 2, 0),
  new THREE.Vector3(-40, 2, 0),
  new THREE.Vector3(30, 2, -30),
  new THREE.Vector3(-30, 2, 30),
];

const SPAWN_POINTS_NUKETOWN: [number, number, number][] = [
  [-28, 2, -12], [-28, 2, 4], [-18, 2, -24],
  [0, 2, -50], [0, 2, 50], [40, 2, 10],
  [-40, 2, -10], [25, 2, -40], [-25, 2, 40], [50, 2, -20],
  [15, 2, 30], [-15, 2, -35], [35, 2, 25], [-35, 2, -25],
  [60, 2, 0], [-60, 2, 0], [0, 2, 70], [0, 2, -70],
  [45, 2, -35], [-45, 2, 35],
];

// Vatican: 100 enemies fill St. Peter's Square like a massive crowd
const SPAWN_POINTS_VATICAN: [number, number, number][] = (() => {
  const pts: [number, number, number][] = [];
  // Dense grid filling the piazza (-40..40 X, -30..40 Z)
  for (let x = -36; x <= 36; x += 8) {
    for (let z = -25; z <= 35; z += 7) {
      const ox = (Math.abs(z) % 14 === 0) ? 4 : 0;
      pts.push([x + ox, 1, z]);
    }
  }
  // Avenue crowd streaming in (Z 40..100)
  for (let z = 40; z <= 100; z += 8) {
    for (let x = -10; x <= 10; x += 5) {
      pts.push([x, 1, z]);
    }
  }
  return pts;
})();

function getSpawnPoints(map: MapId): [number, number, number][] {
  return map === 'vatican' ? SPAWN_POINTS_VATICAN : SPAWN_POINTS_NUKETOWN;
}

const KURTA_COLORS = [
  '#c44a2a', '#2a6a9a', '#8a6a2a', '#3a7a4a', '#9a3a5a',
  '#d48a2a', '#2a4a7a', '#7a3a2a', '#4a8a5a', '#5a2a6a',
  '#b44a3a', '#3a5a8a', '#7a7a1a', '#2a8a6a', '#8a2a4a',
  '#c48a1a', '#1a5a8a', '#6a4a3a', '#3a9a6a', '#6a3a7a',
];
const TURBAN_COLORS = [
  '#cc5522', '#e8a030', '#aa3344', '#dd6622', '#cc8833',
  '#aa4455', '#dd7744', '#bb5533', '#cc6644', '#ee9922',
  '#dd4422', '#d8b040', '#bb2244', '#cc7733', '#bb9944',
  '#bb3355', '#ee6644', '#aa6644', '#dd5544', '#ff8811',
];
const SKIN_TONES = [
  '#a0714a', '#8a6040', '#b07a50', '#966a48', '#a87a52',
  '#9a6844', '#b0804e', '#8a5e3e', '#a47046', '#9c6c4a',
  '#a8784e', '#926244', '#b87e54', '#9e7250', '#a67a56',
  '#947048', '#bc8458', '#886042', '#ac764c', '#a0704e',
];

type WeaponType = 'knife' | 'bat' | 'bowlingpin';

interface WeaponConfig {
  type: WeaponType;
  damage: number;
  range: number;
  cooldown: number;
  speed: number; // multiplier
}

const WEAPON_CONFIGS: WeaponConfig[] = [
  { type: 'knife', damage: 30, range: 4, cooldown: 1.2, speed: 1.2 }, // elder big knife
  { type: 'knife', damage: 25, range: 3.5, cooldown: 1.0, speed: 1.3 },
  { type: 'bat', damage: 35, range: 4, cooldown: 1.5, speed: 1.1 },
  { type: 'bowlingpin', damage: 20, range: 3, cooldown: 0.8, speed: 1.4 },
  { type: 'knife', damage: 25, range: 3.5, cooldown: 1.0, speed: 1.3 },
  { type: 'bat', damage: 35, range: 4, cooldown: 1.5, speed: 1.1 },
  { type: 'bowlingpin', damage: 20, range: 3, cooldown: 0.8, speed: 1.4 },
  { type: 'knife', damage: 25, range: 3.5, cooldown: 1.0, speed: 1.3 },
  { type: 'bat', damage: 40, range: 4.5, cooldown: 1.8, speed: 1.0 },
  { type: 'bowlingpin', damage: 20, range: 3, cooldown: 0.8, speed: 1.4 },
  { type: 'knife', damage: 25, range: 3.5, cooldown: 1.0, speed: 1.3 },
  { type: 'bat', damage: 35, range: 4, cooldown: 1.5, speed: 1.1 },
  { type: 'bowlingpin', damage: 22, range: 3, cooldown: 0.7, speed: 1.5 },
  { type: 'knife', damage: 28, range: 3.5, cooldown: 0.9, speed: 1.3 },
  { type: 'bat', damage: 30, range: 4, cooldown: 1.3, speed: 1.2 },
  { type: 'bowlingpin', damage: 20, range: 3, cooldown: 0.8, speed: 1.4 },
  { type: 'knife', damage: 25, range: 3.5, cooldown: 1.0, speed: 1.3 },
  { type: 'bat', damage: 35, range: 4, cooldown: 1.5, speed: 1.1 },
  { type: 'bowlingpin', damage: 20, range: 3, cooldown: 0.8, speed: 1.4 },
  { type: 'knife', damage: 25, range: 3.5, cooldown: 1.0, speed: 1.3 },
];

const BASE_SPEED = 5;
const CHASE_RANGE = 60;

export function Enemy({ id }: { id: number }) {
  const rbRef = useRef<any>(null);
  const modelRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const weaponArmRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const { world } = useRapier();
  const ctrl = useRef<any>(null);

  const vecs = useMemo(() => ({
    toPlayer: new THREE.Vector3(),
    moveDir: new THREE.Vector3(),
    toWaypoint: new THREE.Vector3(),
    knockbackVel: new THREE.Vector3(),
  }), []);

  const enemyClass = getEnemyClass(id);
  const isElder = id === 0;
  const isTitan = enemyClass === 'titan';
  const isCyclops = enemyClass === 'cyclops';
  const isMage = enemyClass === 'fire_mage' || enemyClass === 'lightning_mage';
  const isGiant = isCyclops || isTitan;
  const isBig = !isElder && !isCyclops && !isTitan && id % 5 === 0;
  const scale = isTitan ? 4.0 : isCyclops ? 2.2 : isElder ? 1.4 : isBig ? 1.3 : isMage ? 1.1 : 1;
  const maxHealth = isTitan ? 3000 : isCyclops ? 600 : isElder ? 250 : isBig ? 180 : isMage ? 80 : 100;

  const [isDead, setIsDead] = useState(false);
  const healthRef = useRef(maxHealth);
  const isDeadRef = useRef(false);
  const currentWP = useRef((id * 3) % WAYPOINTS.length);
  const lastAttack = useRef(0);
  const facing = useRef(0);
  const velY = useRef(0);
  const grounded = useRef(false);
  const stateRef = useRef<'patrol' | 'chase' | 'dead'>('patrol');
  const respawnTimer = useRef(0);
  const walkPhase = useRef(Math.random() * Math.PI * 2);
  const swingPhase = useRef(0);
  const isMovingRef = useRef(false);
  const deathTilt = useRef(0);
  const deathDir = useRef(Math.random() > 0.5 ? 1 : -1);
  const weapon = WEAPON_CONFIGS[id % WEAPON_CONFIGS.length];
  const currentMap = useGameStore.getState().selectedMap;
  const spawnPoints = getSpawnPoints(currentMap);
  const spawnPoint = spawnPoints[id % spawnPoints.length];
  const kurtaColor = KURTA_COLORS[id % KURTA_COLORS.length];
  const turbanColor = TURBAN_COLORS[id % TURBAN_COLORS.length];
  const skinTone = SKIN_TONES[id % SKIN_TONES.length];

  const takeDamage = useCallback((damage: number) => {
    if (isDeadRef.current) return;
    healthRef.current -= damage;

    if (healthRef.current <= 0) {
      isDeadRef.current = true;
      setIsDead(true);
      stateRef.current = 'dead';
      respawnTimer.current = isTitan ? 10 : isCyclops ? 6 : isElder ? 5 : isBig ? 4 : 2;

      useGameStore.getState().addPlayerKill();
      useGameStore.getState().flashHitMarker();
      useGameStore.getState().flashKillBanner();
    } else {
      useGameStore.getState().flashHitMarker();
    }
  }, [isTitan, isCyclops, isGiant, isElder, isBig]);

  const applyKnockback = useCallback((dir: THREE.Vector3, force: number) => {
    vecs.knockbackVel.copy(dir).multiplyScalar(force);
  }, [vecs]);

  useEffect(() => {
    ctrl.current = world.createCharacterController(0.01);
    ctrl.current.enableAutostep(0.4, 0.1, true);
    ctrl.current.enableSnapToGround(0.3);
    return () => {
      if (ctrl.current) {
        try { world.removeCharacterController(ctrl.current); } catch {}
      }
    };
  }, [world]);

  useFrame((_, delta) => {
    if (!rbRef.current || !ctrl.current) return;
    const dt = Math.min(delta, 0.05);

    // Swing animation decay
    if (swingPhase.current > 0) {
      swingPhase.current = Math.max(0, swingPhase.current - dt * 5);
    }

    if (stateRef.current === 'dead') {
      // Animate falling over then disappear
      if (deathTilt.current < Math.PI / 2) {
        deathTilt.current = Math.min(Math.PI / 2, deathTilt.current + dt * 4);
      }
      if (modelRef.current) {
        const pos = rbRef.current.translation();
        modelRef.current.position.set(pos.x, pos.y, pos.z);
        modelRef.current.rotation.y = facing.current;
        modelRef.current.rotation.z = deathTilt.current * deathDir.current;
        modelRef.current.position.y = pos.y - deathTilt.current * 0.3;
        // Hide after 2 seconds
        modelRef.current.visible = respawnTimer.current > (isTitan ? 7 : isCyclops ? 4 : isElder ? 3 : isBig ? 2 : 0.5);
      }
      respawnTimer.current -= dt;
      if (respawnTimer.current <= 0) {
        const sps = getSpawnPoints(useGameStore.getState().selectedMap);
        const sp = sps[Math.floor(Math.random() * sps.length)];
        rbRef.current.setNextKinematicTranslation({ x: sp[0], y: sp[1], z: sp[2] });
        healthRef.current = maxHealth;
        isDeadRef.current = false;
        setIsDead(false);
        stateRef.current = 'patrol';
        deathTilt.current = 0;
        deathDir.current = Math.random() > 0.5 ? 1 : -1;
        currentWP.current = Math.floor(Math.random() * WAYPOINTS.length);
        if (modelRef.current) modelRef.current.visible = true;
      }
      return;
    }

    const pos = rbRef.current.translation();
    vecs.toPlayer.set(camera.position.x - pos.x, 0, camera.position.z - pos.z);
    const distToPlayer = vecs.toPlayer.length();

    if (distToPlayer < CHASE_RANGE) {
      stateRef.current = 'chase';
    } else {
      stateRef.current = 'patrol';
    }

    let moving = false;

    if (stateRef.current === 'patrol') {
      const wp = WAYPOINTS[currentWP.current];
      vecs.toWaypoint.set(wp.x - pos.x, 0, wp.z - pos.z);
      if (vecs.toWaypoint.length() < 2) {
        currentWP.current = (currentWP.current + 1) % WAYPOINTS.length;
      }
      vecs.moveDir.copy(vecs.toWaypoint).normalize();
      facing.current = Math.atan2(vecs.moveDir.x, vecs.moveDir.z);
      moving = true;
    } else {
      vecs.moveDir.copy(vecs.toPlayer).normalize();
      facing.current = Math.atan2(vecs.toPlayer.x, vecs.toPlayer.z);
      moving = true;

      const now = Date.now() / 1000;

      if (isMage) {
        // Mages stop at range and shoot projectiles
        const castRange = 30;
        if (distToPlayer < castRange && now - lastAttack.current > 2.0) {
          lastAttack.current = now;
          swingPhase.current = 1;
          _spawnPos.set(pos.x, pos.y, pos.z);
          spawnEnemyProjectile(
            _spawnPos,
            camera.position,
            enemyClass === 'fire_mage' ? 'fire' : 'lightning'
          );
        }
        // Stay at range — don't rush in
        if (distToPlayer < 15) {
          vecs.moveDir.multiplyScalar(-0.5); // back away
        }
      } else {
        // Melee / cyclops attack when close
        if (distToPlayer < weapon.range && now - lastAttack.current > weapon.cooldown) {
          lastAttack.current = now;
          swingPhase.current = 1;
          const gs = useGameStore.getState();
          if (gs.health > 0) gs.takeDamage(isTitan ? weapon.damage * 4 : isCyclops ? weapon.damage * 2 : weapon.damage);
        }
      }

      // Strafe mid-range (melee only)
      if (!isMage && distToPlayer > weapon.range && distToPlayer <= 12) {
        const strafe = Math.sin(Date.now() / 800 + id * 2) * 0.3;
        vecs.moveDir.x += -vecs.toPlayer.z * strafe;
        vecs.moveDir.z += vecs.toPlayer.x * strafe;
        vecs.moveDir.normalize();
      }
    }

    // Vatican damage: enemies reaching the basilica wall
    if (currentMap === 'vatican' && pos.z < VATICAN_WALL_Z) {
      const gs = useGameStore.getState();
      gs.damageVatican((isTitan ? 50 : isCyclops ? 20 : 5) * dt);
    }

    isMovingRef.current = moving;

    if (!grounded.current) velY.current -= 25 * dt;
    else velY.current = -0.1;

    const sizeMult = isTitan ? 0.5 : isCyclops ? 0.7 : isElder ? 0.85 : isBig ? 0.9 : 1;
    const spd = (stateRef.current === 'chase' ? BASE_SPEED * weapon.speed : BASE_SPEED) * sizeMult;

    // Apply and decay knockback
    const kb = vecs.knockbackVel;
    const kbLen = kb.length();
    let kbX = 0, kbZ = 0;
    if (kbLen > 0.1) {
      kbX = kb.x * dt;
      kbZ = kb.z * dt;
      kb.multiplyScalar(Math.exp(-5 * dt)); // decay knockback
    } else if (kbLen > 0) {
      kb.set(0, 0, 0);
    }

    const collider = rbRef.current.collider(0);
    if (collider) {
      ctrl.current.computeColliderMovement(collider, {
        x: vecs.moveDir.x * spd * dt + kbX,
        y: velY.current * dt,
        z: vecs.moveDir.z * spd * dt + kbZ,
      });
      const c = ctrl.current.computedMovement();
      grounded.current = ctrl.current.computedGrounded();
      rbRef.current.setNextKinematicTranslation({
        x: pos.x + c.x, y: pos.y + c.y, z: pos.z + c.z,
      });
    }

    if (modelRef.current) {
      modelRef.current.position.set(pos.x, pos.y, pos.z);
      modelRef.current.rotation.set(0, facing.current, 0);
    }

    // ── WALK ANIMATION ──
    if (moving) {
      walkPhase.current += dt * 10;
    }
    const walkSin = Math.sin(walkPhase.current);
    const walkCos = Math.cos(walkPhase.current);
    const walkAmp = moving ? 0.5 : 0;

    // Legs swing opposite to each other
    if (leftLegRef.current) {
      leftLegRef.current.rotation.x = walkSin * walkAmp;
    }
    if (rightLegRef.current) {
      rightLegRef.current.rotation.x = -walkSin * walkAmp;
    }
    // Arms swing opposite to legs
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = -walkSin * walkAmp * 0.6;
    }

    // ── WEAPON ARM SWING ──
    if (weaponArmRef.current) {
      if (swingPhase.current > 0) {
        // Swing forward arc
        const swing = Math.sin(swingPhase.current * Math.PI) * -1.8;
        weaponArmRef.current.rotation.x = swing;
      } else {
        // Idle walk bob
        weaponArmRef.current.rotation.x = walkCos * walkAmp * 0.4;
      }
    }
  });

  const deadGray = '#555';
  const skin = isDead ? '#666' : skinTone;
  const kurta = isDead ? '#444' : kurtaColor;
  const pantsC = isDead ? '#333' : '#e8d8c0';
  const turban = isDead ? deadGray : turbanColor;

  return (
    <>
      <RigidBody
        ref={rbRef}
        type="kinematicPosition"
        colliders={false}
        position={spawnPoint}
        userData={{ isEnemy: true, takeDamage, applyKnockback }}
      >
        <CapsuleCollider args={[0.5 * scale, 0.3 * scale]} />
      </RigidBody>

      <group ref={modelRef} userData={{ isEnemy: true, takeDamage, applyKnockback }}>
        {/* Always render — dead bodies stay visible and fall over */}
        <group scale={[scale, scale, scale]}>
            {/* ── CYCLOPS / TITAN HEAD ── */}
            {(isCyclops || isTitan) ? (
              <group>
                {/* Big bald head */}
                <mesh position={[0, 1.7, 0.02]} userData={{ isHead: true }}>
                  <sphereGeometry args={[0.18, 10, 10]} />
                  <meshStandardMaterial color={isDead ? '#666' : '#7a6a5a'} roughness={0.7} />
                </mesh>
                {/* Single giant eye */}
                <mesh position={[0, 1.72, 0.17]}>
                  <sphereGeometry args={[0.07, 8, 8]} />
                  <meshStandardMaterial color="#ffffcc" roughness={0.3} />
                </mesh>
                <mesh position={[0, 1.72, 0.22]}>
                  <sphereGeometry args={[0.035, 6, 6]} />
                  <meshStandardMaterial color="#aa2200" roughness={0.3} />
                </mesh>
                <mesh position={[0, 1.72, 0.24]}>
                  <sphereGeometry args={[0.018, 6, 6]} />
                  <meshStandardMaterial color="#111" />
                </mesh>
                {/* Heavy brow ridge */}
                <mesh position={[0, 1.78, 0.12]}>
                  <boxGeometry args={[0.24, 0.04, 0.08]} />
                  <meshStandardMaterial color={isDead ? '#555' : '#6a5a4a'} roughness={0.8} />
                </mesh>
                {/* Jaw */}
                <mesh position={[0, 1.58, 0.04]}>
                  <boxGeometry args={[0.2, 0.1, 0.14]} />
                  <meshStandardMaterial color={isDead ? '#666' : '#7a6a5a'} roughness={0.7} />
                </mesh>
                {/* Tusks */}
                <mesh position={[-0.06, 1.56, 0.1]} rotation={[0.2, 0, -0.1]}>
                  <cylinderGeometry args={[0.01, 0.02, 0.08, 6]} />
                  <meshStandardMaterial color="#eed" roughness={0.4} />
                </mesh>
                <mesh position={[0.06, 1.56, 0.1]} rotation={[0.2, 0, 0.1]}>
                  <cylinderGeometry args={[0.01, 0.02, 0.08, 6]} />
                  <meshStandardMaterial color="#eed" roughness={0.4} />
                </mesh>
                {/* Titan: massive horns + chest armor + glowing runes */}
                {isTitan && (
                  <group>
                    {/* Left horn */}
                    <mesh position={[-0.12, 1.85, 0]} rotation={[0.3, 0, -0.5]}>
                      <coneGeometry args={[0.03, 0.2, 6]} />
                      <meshStandardMaterial color="#2a2a2a" roughness={0.6} />
                    </mesh>
                    {/* Right horn */}
                    <mesh position={[0.12, 1.85, 0]} rotation={[0.3, 0, 0.5]}>
                      <coneGeometry args={[0.03, 0.2, 6]} />
                      <meshStandardMaterial color="#2a2a2a" roughness={0.6} />
                    </mesh>
                    {/* Chest plate armor */}
                    <mesh position={[0, 1.15, 0.14]}>
                      <boxGeometry args={[0.45, 0.5, 0.04]} />
                      <meshStandardMaterial color="#3a3a3a" roughness={0.4} metalness={0.6} />
                    </mesh>
                    {/* Glowing rune on chest */}
                    <mesh position={[0, 1.15, 0.17]}>
                      <boxGeometry args={[0.12, 0.12, 0.01]} />
                      <meshStandardMaterial color="#ff2200" emissive="#ff2200" emissiveIntensity={isDead ? 0 : 4} />
                    </mesh>
                    {/* Shoulder pauldrons */}
                    <mesh position={[-0.32, 1.4, 0]}>
                      <sphereGeometry args={[0.1, 6, 6]} />
                      <meshStandardMaterial color="#3a3a3a" roughness={0.4} metalness={0.6} />
                    </mesh>
                    <mesh position={[0.32, 1.4, 0]}>
                      <sphereGeometry args={[0.1, 6, 6]} />
                      <meshStandardMaterial color="#3a3a3a" roughness={0.4} metalness={0.6} />
                    </mesh>
                  </group>
                )}
              </group>
            ) : isMage ? (
              /* ── MAGE HEAD ── */
              <group>
                <mesh position={[0, 1.65, 0.02]} userData={{ isHead: true }}>
                  <sphereGeometry args={[0.12, 10, 10]} />
                  <meshStandardMaterial color={skin} roughness={0.7} />
                </mesh>
                {/* Hood */}
                <mesh position={[0, 1.76, -0.02]} userData={{ isHead: true }}>
                  <sphereGeometry args={[0.16, 10, 8]} />
                  <meshStandardMaterial color={isDead ? '#444' : enemyClass === 'fire_mage' ? '#551100' : '#001155'} roughness={0.9} />
                </mesh>
                {/* Hood drape */}
                <mesh position={[0, 1.6, -0.1]}>
                  <boxGeometry args={[0.2, 0.2, 0.06]} />
                  <meshStandardMaterial color={isDead ? '#444' : enemyClass === 'fire_mage' ? '#551100' : '#001155'} roughness={0.9} />
                </mesh>
                {/* Glowing eyes */}
                <mesh position={[-0.04, 1.66, 0.12]}>
                  <sphereGeometry args={[0.018, 6, 6]} />
                  <meshStandardMaterial color={enemyClass === 'fire_mage' ? '#ff4400' : '#4488ff'} emissive={enemyClass === 'fire_mage' ? '#ff4400' : '#4488ff'} emissiveIntensity={isDead ? 0 : 3} />
                </mesh>
                <mesh position={[0.04, 1.66, 0.12]}>
                  <sphereGeometry args={[0.018, 6, 6]} />
                  <meshStandardMaterial color={enemyClass === 'fire_mage' ? '#ff4400' : '#4488ff'} emissive={enemyClass === 'fire_mage' ? '#ff4400' : '#4488ff'} emissiveIntensity={isDead ? 0 : 3} />
                </mesh>
              </group>
            ) : (
              /* ── STANDARD HEAD ── */
              <group>
                <mesh position={[0, 1.65, 0.02]} userData={{ isHead: true }}>
                  <sphereGeometry args={[0.12, 10, 10]} />
                  <meshStandardMaterial color={skin} roughness={0.7} />
                </mesh>
                {/* Turban */}
                <mesh position={[0, 1.78, 0]} userData={{ isHead: true }}>
                  <sphereGeometry args={[0.15, 10, 8]} />
                  <meshStandardMaterial color={turban} roughness={0.9} />
                </mesh>
                <mesh position={[0, 1.88, 0.02]} userData={{ isHead: true }}>
                  <sphereGeometry args={[0.1, 8, 6]} />
                  <meshStandardMaterial color={turban} roughness={0.9} />
                </mesh>
                {/* Turban tail */}
                <mesh position={[0.06, 1.7, -0.1]} rotation={[0.3, 0, 0.2]}>
                  <boxGeometry args={[0.06, 0.25, 0.04]} />
                  <meshStandardMaterial color={turban} roughness={0.9} />
                </mesh>
                {/* Eyes */}
                <mesh position={[-0.04, 1.66, 0.12]}>
                  <sphereGeometry args={[0.015, 6, 6]} />
                  <meshStandardMaterial color="#1a1a1a" />
                </mesh>
                <mesh position={[0.04, 1.66, 0.12]}>
                  <sphereGeometry args={[0.015, 6, 6]} />
                  <meshStandardMaterial color="#1a1a1a" />
                </mesh>
                {/* Mustache */}
                <mesh position={[0, 1.6, 0.11]}>
                  <boxGeometry args={[0.08, 0.015, 0.02]} />
                  <meshStandardMaterial color="#2a1a0a" roughness={0.9} />
                </mesh>

                {/* Giant: war paint stripes on face */}
                {isGiant && (
                  <group>
                    <mesh position={[-0.06, 1.64, 0.12]}>
                      <boxGeometry args={[0.02, 0.08, 0.01]} />
                      <meshStandardMaterial color="#cc2222" roughness={0.9} />
                    </mesh>
                    <mesh position={[0.06, 1.64, 0.12]}>
                      <boxGeometry args={[0.02, 0.08, 0.01]} />
                      <meshStandardMaterial color="#cc2222" roughness={0.9} />
                    </mesh>
                    <mesh position={[0, 1.52, 0.06]}>
                      <boxGeometry args={[0.14, 0.18, 0.1]} />
                      <meshStandardMaterial color="#1a1a1a" roughness={0.95} />
                    </mesh>
                    <mesh position={[0, 1.38, 0.05]}>
                      <boxGeometry args={[0.12, 0.15, 0.08]} />
                      <meshStandardMaterial color="#1a1a1a" roughness={0.95} />
                    </mesh>
                  </group>
                )}

                {/* Elder: big beard */}
                {isElder && (
                  <group>
                    <mesh position={[0, 1.52, 0.06]}>
                      <boxGeometry args={[0.12, 0.15, 0.08]} />
                      <meshStandardMaterial color="#ddd" roughness={0.95} />
                    </mesh>
                    <mesh position={[0, 1.42, 0.05]}>
                      <boxGeometry args={[0.1, 0.12, 0.07]} />
                      <meshStandardMaterial color="#ccc" roughness={0.95} />
                    </mesh>
                    <mesh position={[0, 1.34, 0.04]}>
                      <boxGeometry args={[0.08, 0.1, 0.06]} />
                      <meshStandardMaterial color="#bbb" roughness={0.95} />
                    </mesh>
                    <mesh position={[-0.04, 1.69, 0.12]}>
                      <boxGeometry args={[0.04, 0.012, 0.015]} />
                      <meshStandardMaterial color="#ccc" roughness={0.9} />
                    </mesh>
                    <mesh position={[0.04, 1.69, 0.12]}>
                      <boxGeometry args={[0.04, 0.012, 0.015]} />
                      <meshStandardMaterial color="#ccc" roughness={0.9} />
                    </mesh>
                  </group>
                )}
              </group>
            )}

            {/* Neck */}
            <mesh position={[0, (isCyclops || isTitan) ? 1.5 : 1.52, 0]}>
              <cylinderGeometry args={[(isCyclops || isTitan) ? 0.1 : 0.06, (isCyclops || isTitan) ? 0.12 : 0.07, 0.1, 8]} />
              <meshStandardMaterial color={skin} roughness={0.7} />
            </mesh>

            {/* ── TORSO ── */}
            {(isCyclops || isTitan) ? (
              /* Cyclops/Titan: bulky bare torso */
              <group>
                <mesh position={[0, 1.1, 0]}>
                  <boxGeometry args={[0.55, 0.75, 0.32]} />
                  <meshStandardMaterial color={isDead ? '#555' : '#7a6a5a'} roughness={0.8} />
                </mesh>
                <mesh position={[0, 0.62, 0]}>
                  <boxGeometry args={[0.5, 0.25, 0.3]} />
                  <meshStandardMaterial color={isDead ? '#555' : '#7a6a5a'} roughness={0.8} />
                </mesh>
                {/* Loincloth */}
                <mesh position={[0, 0.48, 0]}>
                  <boxGeometry args={[0.45, 0.15, 0.28]} />
                  <meshStandardMaterial color={isDead ? '#333' : '#4a3a2a'} roughness={0.9} />
                </mesh>
              </group>
            ) : isMage ? (
              /* Mage: dark robes */
              <group>
                <mesh position={[0, 1.1, 0]}>
                  <boxGeometry args={[0.42, 0.7, 0.24]} />
                  <meshStandardMaterial color={isDead ? '#333' : enemyClass === 'fire_mage' ? '#331100' : '#001133'} roughness={0.85} />
                </mesh>
                <mesh position={[0, 0.55, 0]}>
                  <boxGeometry args={[0.44, 0.45, 0.25]} />
                  <meshStandardMaterial color={isDead ? '#333' : enemyClass === 'fire_mage' ? '#331100' : '#001133'} roughness={0.85} />
                </mesh>
                {/* Robe trim */}
                <mesh position={[0, 0.32, 0]}>
                  <boxGeometry args={[0.46, 0.03, 0.26]} />
                  <meshStandardMaterial color={isDead ? '#444' : enemyClass === 'fire_mage' ? '#ff6600' : '#4488ff'} emissive={isDead ? '#000' : enemyClass === 'fire_mage' ? '#ff4400' : '#2266cc'} emissiveIntensity={isDead ? 0 : 1} />
                </mesh>
              </group>
            ) : (
              /* Standard kurta torso */
              <group>
                <mesh position={[0, 1.1, 0]}>
                  <boxGeometry args={[0.42, 0.7, 0.24]} />
                  <meshStandardMaterial color={kurta} roughness={0.85} />
                </mesh>
                <mesh position={[0, 0.65, 0]}>
                  <boxGeometry args={[0.4, 0.25, 0.23]} />
                  <meshStandardMaterial color={kurta} roughness={0.85} />
                </mesh>
                <mesh position={[0, 1.46, 0.06]}>
                  <boxGeometry args={[0.12, 0.06, 0.06]} />
                  <meshStandardMaterial color={kurta} roughness={0.85} />
                </mesh>
              </group>
            )}

            {/* ── LEFT ARM (animated) ── */}
            <group ref={leftArmRef} position={[(isCyclops || isTitan) ? -0.35 : -0.28, 1.35, 0]}>
              <mesh position={[0, -0.05, 0]}>
                <boxGeometry args={[(isCyclops || isTitan) ? 0.16 : 0.12, 0.2, (isCyclops || isTitan) ? 0.16 : 0.12]} />
                <meshStandardMaterial color={isMage ? (isDead ? '#333' : enemyClass === 'fire_mage' ? '#331100' : '#001133') : kurta} roughness={0.85} />
              </mesh>
              <mesh position={[0, -0.25, 0]}>
                <boxGeometry args={[(isCyclops || isTitan) ? 0.14 : 0.1, 0.35, (isCyclops || isTitan) ? 0.14 : 0.1]} />
                <meshStandardMaterial color={(isCyclops || isTitan) ? (isDead ? '#555' : '#7a6a5a') : skin} roughness={0.7} />
              </mesh>
              <mesh position={[0, -0.45, 0]}>
                <boxGeometry args={[(isCyclops || isTitan) ? 0.12 : 0.08, (isCyclops || isTitan) ? 0.12 : 0.08, (isCyclops || isTitan) ? 0.12 : 0.08]} />
                <meshStandardMaterial color={(isCyclops || isTitan) ? (isDead ? '#555' : '#7a6a5a') : skin} roughness={0.7} />
              </mesh>
              {/* Mage: glowing orb in left hand */}
              {isMage && !isDead && (
                <mesh position={[0, -0.52, 0]}>
                  <sphereGeometry args={[0.06, 8, 8]} />
                  <meshStandardMaterial
                    color={enemyClass === 'fire_mage' ? '#ff6600' : '#4488ff'}
                    emissive={enemyClass === 'fire_mage' ? '#ff4400' : '#2266ff'}
                    emissiveIntensity={4}
                    transparent
                    opacity={0.8}
                  />
                </mesh>
              )}
            </group>

            {/* ── RIGHT ARM + WEAPON (animated swing) ── */}
            <group ref={weaponArmRef} position={[(isCyclops || isTitan) ? 0.35 : 0.28, 1.35, 0]}>
              <mesh position={[0, -0.05, 0]}>
                <boxGeometry args={[(isCyclops || isTitan) ? 0.16 : 0.12, 0.2, (isCyclops || isTitan) ? 0.16 : 0.12]} />
                <meshStandardMaterial color={isMage ? (isDead ? '#333' : enemyClass === 'fire_mage' ? '#331100' : '#001133') : kurta} roughness={0.85} />
              </mesh>
              <mesh position={[0, -0.25, 0]}>
                <boxGeometry args={[(isCyclops || isTitan) ? 0.14 : 0.1, 0.35, (isCyclops || isTitan) ? 0.14 : 0.1]} />
                <meshStandardMaterial color={(isCyclops || isTitan) ? (isDead ? '#555' : '#7a6a5a') : skin} roughness={0.7} />
              </mesh>
              <mesh position={[0, -0.45, 0]}>
                <boxGeometry args={[(isCyclops || isTitan) ? 0.12 : 0.08, (isCyclops || isTitan) ? 0.12 : 0.08, (isCyclops || isTitan) ? 0.12 : 0.08]} />
                <meshStandardMaterial color={(isCyclops || isTitan) ? (isDead ? '#555' : '#7a6a5a') : skin} roughness={0.7} />
              </mesh>

              {/* WEAPON — cyclops uses club, mages use staff, others use melee weapons */}
              {(isCyclops || isTitan) ? <CyclopsClub /> : isMage ? <MageStaff type={enemyClass as 'fire_mage' | 'lightning_mage'} /> : (
                <>
                  {weapon.type === 'knife' && <Knife big={isElder} />}
                  {weapon.type === 'bat' && <Bat />}
                  {weapon.type === 'bowlingpin' && <BowlingPin />}
                </>
              )}
            </group>

            {/* ── LEFT LEG (animated) ── */}
            <group ref={leftLegRef} position={[(isCyclops || isTitan) ? -0.12 : -0.09, 0.5, 0]}>
              <mesh position={[0, -0.2, 0]}>
                <boxGeometry args={[(isCyclops || isTitan) ? 0.18 : 0.14, 0.55, (isCyclops || isTitan) ? 0.18 : 0.14]} />
                <meshStandardMaterial color={(isCyclops || isTitan) ? (isDead ? '#444' : '#4a3a2a') : isMage ? (isDead ? '#333' : enemyClass === 'fire_mage' ? '#331100' : '#001133') : pantsC} roughness={0.9} />
              </mesh>
              <mesh position={[0, -0.49, 0.02]}>
                <boxGeometry args={[(isCyclops || isTitan) ? 0.14 : 0.1, 0.04, (isCyclops || isTitan) ? 0.2 : 0.16]} />
                <meshStandardMaterial color={(isCyclops || isTitan) ? '#3a2a1a' : '#5a3a1a'} roughness={0.9} />
              </mesh>
            </group>

            {/* ── RIGHT LEG (animated) ── */}
            <group ref={rightLegRef} position={[(isCyclops || isTitan) ? 0.12 : 0.09, 0.5, 0]}>
              <mesh position={[0, -0.2, 0]}>
                <boxGeometry args={[(isCyclops || isTitan) ? 0.18 : 0.14, 0.55, (isCyclops || isTitan) ? 0.18 : 0.14]} />
                <meshStandardMaterial color={(isCyclops || isTitan) ? (isDead ? '#444' : '#4a3a2a') : isMage ? (isDead ? '#333' : enemyClass === 'fire_mage' ? '#331100' : '#001133') : pantsC} roughness={0.9} />
              </mesh>
              <mesh position={[0, -0.49, 0.02]}>
                <boxGeometry args={[(isCyclops || isTitan) ? 0.14 : 0.1, 0.04, (isCyclops || isTitan) ? 0.2 : 0.16]} />
                <meshStandardMaterial color={(isCyclops || isTitan) ? '#3a2a1a' : '#5a3a1a'} roughness={0.9} />
              </mesh>
            </group>

          </group>
      </group>
    </>
  );
}

// ─── WEAPONS ───────────────────────────────────────────

function Knife({ big }: { big?: boolean }) {
  const s = big ? 1.6 : 1;
  return (
    <group position={[0, -0.48, -0.08]} rotation={[-0.3, 0, 0]}>
      {/* Handle */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.035 * s, 0.1 * s, 0.03 * s]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.8} />
      </mesh>
      {/* Guard */}
      <mesh position={[0, -0.06 * s, 0]}>
        <boxGeometry args={[0.06 * s, 0.015 * s, 0.025 * s]} />
        <meshStandardMaterial color="#666" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Blade */}
      <mesh position={[0, -0.2 * s, 0]}>
        <boxGeometry args={[0.018 * s, 0.25 * s, 0.01 * s]} />
        <meshStandardMaterial color="#ddd" roughness={0.1} metalness={0.95} />
      </mesh>
      {/* Blade tip */}
      <mesh position={[0, -0.34 * s, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.014 * s, 0.04 * s, 0.008 * s]} />
        <meshStandardMaterial color="#ddd" roughness={0.1} metalness={0.95} />
      </mesh>
    </group>
  );
}

function Bat() {
  return (
    <group position={[0, -0.48, -0.06]} rotation={[-0.2, 0, 0]}>
      {/* Handle — thin grip */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.022, 0.18, 8]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.8} />
      </mesh>
      {/* Handle tape */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.023, 0.023, 0.08, 8]} />
        <meshStandardMaterial color="#222" roughness={0.9} />
      </mesh>
      {/* Barrel — thick part */}
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.04, 0.03, 0.3, 10]} />
        <meshStandardMaterial color="#6a4a2a" roughness={0.75} />
      </mesh>
      {/* Barrel tip — rounded end */}
      <mesh position={[0, -0.36, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#6a4a2a" roughness={0.75} />
      </mesh>
    </group>
  );
}

function CyclopsClub() {
  return (
    <group position={[0, -0.48, -0.06]} rotation={[-0.2, 0, 0]}>
      {/* Thick trunk club */}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.2, 8]} />
        <meshStandardMaterial color="#4a3a2a" roughness={0.85} />
      </mesh>
      <mesh position={[0, -0.25, 0]}>
        <cylinderGeometry args={[0.06, 0.04, 0.35, 8]} />
        <meshStandardMaterial color="#4a3a2a" roughness={0.85} />
      </mesh>
      {/* Knobby end */}
      <mesh position={[0, -0.44, 0]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
      </mesh>
      {/* Spikes */}
      <mesh position={[0.06, -0.4, 0]} rotation={[0, 0, 0.5]}>
        <coneGeometry args={[0.015, 0.05, 4]} />
        <meshStandardMaterial color="#888" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[-0.06, -0.38, 0]} rotation={[0, 0, -0.5]}>
        <coneGeometry args={[0.015, 0.05, 4]} />
        <meshStandardMaterial color="#888" roughness={0.3} metalness={0.7} />
      </mesh>
    </group>
  );
}

function MageStaff({ type }: { type: 'fire_mage' | 'lightning_mage' }) {
  const color = type === 'fire_mage' ? '#ff6600' : '#4488ff';
  const emissive = type === 'fire_mage' ? '#ff4400' : '#2266ff';
  return (
    <group position={[0, -0.48, -0.06]} rotation={[-0.1, 0, 0]}>
      {/* Staff shaft */}
      <mesh position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.015, 0.018, 0.7, 6]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.8} />
      </mesh>
      {/* Crystal orb at top */}
      <mesh position={[0, 0.22, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={5} transparent opacity={0.85} />
      </mesh>
      {/* Glow ring */}
      <mesh position={[0, 0.22, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.05, 0.008, 6, 12]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={3} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

function BowlingPin() {
  return (
    <group position={[0, -0.48, -0.05]} rotation={[-0.15, 0, 0]}>
      {/* Neck — narrow grip area */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.025, 0.12, 8]} />
        <meshStandardMaterial color="#eee" roughness={0.4} />
      </mesh>
      {/* Body — bulbous */}
      <mesh position={[0, -0.14, 0]}>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshStandardMaterial color="#eee" roughness={0.4} />
      </mesh>
      <mesh position={[0, -0.22, 0]}>
        <cylinderGeometry args={[0.045, 0.05, 0.12, 10]} />
        <meshStandardMaterial color="#eee" roughness={0.4} />
      </mesh>
      {/* Base */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.035, 0.045, 0.06, 10]} />
        <meshStandardMaterial color="#eee" roughness={0.4} />
      </mesh>
      {/* Red stripes */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.036, 0.036, 0.02, 10]} />
        <meshStandardMaterial color="#cc2222" roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.06, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.02, 10]} />
        <meshStandardMaterial color="#cc2222" roughness={0.5} />
      </mesh>
    </group>
  );
}

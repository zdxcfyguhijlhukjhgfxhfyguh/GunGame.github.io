import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, useRapier } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameStore } from '../stores/gameStore';

// Tiny cute billionaires, half player size
const SCALE = 0.5;
const BASE_SPEED = 4;
const CHASE_RANGE = 40;

// Spawn around the island — pool, mansion, gardens
const SPAWN_POINTS: [number, number, number][] = [
  [-20, 2, 5], [20, 2, 8], [-10, 2, 20], [10, 2, 15],
  [-30, 2, 15], [30, 2, 12], [0, 2, 25], [-15, 2, 30],
  [15, 2, 25], [-25, 2, 0], [25, 2, 0], [0, 2, 10],
  [-35, 2, 20], [35, 2, 18], [-5, 2, 35], [5, 2, 38],
  [-40, 2, 5], [40, 2, 10], [-20, 2, 35], [20, 2, 30],
  [0, 2, 0], [-10, 2, -5], [10, 2, -5], [-30, 2, -10],
  [30, 2, -8], [-45, 2, 15], [45, 2, 12],
];

// Suit jacket colors — dark luxury
const SUIT_COLORS = [
  '#1a1a1a', '#222', '#2a2a30', '#1a1a2a', '#282828',
  '#333', '#1e1e2e', '#252530', '#2a2a2a', '#1c1c1c',
  '#0a0a1a', '#303038', '#202028', '#2e2e2e', '#181820',
];

// Tie colors — flashy
const TIE_COLORS = [
  '#cc9900', '#cc2222', '#2255cc', '#884488', '#cc6600',
  '#22aa44', '#cc0066', '#4488cc', '#ddaa00', '#aa2244',
];

const HAIR_COLORS = [
  '#888', '#666', '#aaa', '#777', '#999',
  '#555', '#bbb', '#707070', '#8a8a8a', '#606060',
];

const _toPlayer = new THREE.Vector3();
const _moveDir = new THREE.Vector3();

export function MiniPerson({ id }: { id: number }) {
  const rbRef = useRef<any>(null);
  const modelRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const { world } = useRapier();
  const ctrl = useRef<any>(null);

  const healthRef = useRef(30);
  const isDeadRef = useRef(false);
  const [isDead, setIsDead] = useState(false);
  const facing = useRef(Math.random() * Math.PI * 2);
  const velY = useRef(0);
  const grounded = useRef(false);
  const respawnTimer = useRef(0);
  const walkPhase = useRef(Math.random() * Math.PI * 2);
  const deathTilt = useRef(0);
  const deathDir = useRef(Math.random() > 0.5 ? 1 : -1);

  // Wandering behavior — run around randomly, flee from player when close
  const wanderTarget = useRef(new THREE.Vector3(
    (Math.random() - 0.5) * 80,
    2,
    (Math.random() - 0.5) * 60 + 10
  ));
  const wanderTimer = useRef(Math.random() * 3);

  const spawnPoint = useMemo<[number, number, number]>(() =>
    SPAWN_POINTS[id % SPAWN_POINTS.length], [id]);
  const suitColor = SUIT_COLORS[id % SUIT_COLORS.length];
  const tieColor = TIE_COLORS[id % TIE_COLORS.length];
  const hairColor = HAIR_COLORS[id % HAIR_COLORS.length];
  const hasTopHat = id % 4 === 0;
  const hasBriefcase = id % 3 !== 0;
  const hasGolfClub = id % 5 === 0;

  const takeDamage = useCallback((damage: number) => {
    if (isDeadRef.current) return;
    healthRef.current -= damage;
    if (healthRef.current <= 0) {
      isDeadRef.current = true;
      setIsDead(true);
      respawnTimer.current = 3;
      useGameStore.getState().addPlayerKill();
      useGameStore.getState().flashHitMarker();
      useGameStore.getState().flashKillBanner();
    } else {
      useGameStore.getState().flashHitMarker();
    }
  }, []);

  const applyKnockback = useCallback(() => {}, []);

  useEffect(() => {
    ctrl.current = world.createCharacterController(0.01);
    ctrl.current.enableAutostep(0.3, 0.1, true);
    ctrl.current.enableSnapToGround(0.2);
    return () => {
      if (ctrl.current) {
        try { world.removeCharacterController(ctrl.current); } catch {}
      }
    };
  }, [world]);

  useFrame((_, delta) => {
    if (!rbRef.current || !ctrl.current) return;
    const dt = Math.min(delta, 0.05);

    if (isDeadRef.current) {
      if (deathTilt.current < Math.PI / 2) {
        deathTilt.current = Math.min(Math.PI / 2, deathTilt.current + dt * 5);
      }
      if (modelRef.current) {
        const pos = rbRef.current.translation();
        modelRef.current.position.set(pos.x, pos.y, pos.z);
        modelRef.current.rotation.y = facing.current;
        modelRef.current.rotation.z = deathTilt.current * deathDir.current;
        modelRef.current.position.y = pos.y - deathTilt.current * 0.15;
        modelRef.current.visible = respawnTimer.current > 1;
      }
      respawnTimer.current -= dt;
      if (respawnTimer.current <= 0) {
        const sp = SPAWN_POINTS[Math.floor(Math.random() * SPAWN_POINTS.length)];
        rbRef.current.setNextKinematicTranslation({ x: sp[0], y: sp[1], z: sp[2] });
        healthRef.current = 30;
        isDeadRef.current = false;
        setIsDead(false);
        deathTilt.current = 0;
        deathDir.current = Math.random() > 0.5 ? 1 : -1;
        if (modelRef.current) {
          modelRef.current.visible = true;
          modelRef.current.rotation.set(0, 0, 0);
        }
      }
      return;
    }

    const pos = rbRef.current.translation();
    _toPlayer.set(camera.position.x - pos.x, 0, camera.position.z - pos.z);
    const distToPlayer = _toPlayer.length();

    // Behavior: flee when player is close, otherwise wander cutely
    if (distToPlayer < 15) {
      // RUN AWAY from player
      _moveDir.copy(_toPlayer).normalize().multiplyScalar(-1);
      facing.current = Math.atan2(-_toPlayer.x, -_toPlayer.z);
    } else {
      // Wander randomly
      wanderTimer.current -= dt;
      if (wanderTimer.current <= 0) {
        wanderTarget.current.set(
          (Math.random() - 0.5) * 80,
          2,
          (Math.random() - 0.5) * 60 + 10
        );
        wanderTimer.current = 2 + Math.random() * 4;
      }
      _moveDir.set(
        wanderTarget.current.x - pos.x,
        0,
        wanderTarget.current.z - pos.z
      );
      if (_moveDir.length() < 2) {
        wanderTimer.current = 0; // pick new target
      }
      _moveDir.normalize();
      facing.current = Math.atan2(_moveDir.x, _moveDir.z);
    }

    if (!grounded.current) velY.current -= 25 * dt;
    else velY.current = -0.1;

    const spd = distToPlayer < 15 ? BASE_SPEED * 1.5 : BASE_SPEED;

    const collider = rbRef.current.collider(0);
    if (collider) {
      ctrl.current.computeColliderMovement(collider, {
        x: _moveDir.x * spd * dt,
        y: velY.current * dt,
        z: _moveDir.z * spd * dt,
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

    // Walk animation (faster, cuter)
    walkPhase.current += dt * 14;
    const s = Math.sin(walkPhase.current);
    const amp = 0.6;
    if (leftLegRef.current) leftLegRef.current.rotation.x = s * amp;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -s * amp;
    if (leftArmRef.current) leftArmRef.current.rotation.x = -s * amp * 0.7;
    if (rightArmRef.current) rightArmRef.current.rotation.x = s * amp * 0.7;
  });

  const skin = isDead ? '#aaa' : '#ffe0c0';
  const suit = isDead ? '#555' : suitColor;
  const tie = isDead ? '#444' : tieColor;
  const pants = isDead ? '#444' : '#1a1a1a';
  const hair = isDead ? '#777' : hairColor;

  return (
    <>
      <RigidBody
        ref={rbRef}
        type="kinematicPosition"
        colliders={false}
        position={spawnPoint}
        userData={{ isEnemy: true, takeDamage, applyKnockback }}
      >
        <CapsuleCollider args={[0.25 * SCALE, 0.15 * SCALE]} />
      </RigidBody>

      <group ref={modelRef} userData={{ isEnemy: true, takeDamage, applyKnockback }}>
        <group scale={[SCALE, SCALE, SCALE]}>
          {/* Head */}
          <mesh position={[0, 1.7, 0]} userData={{ isHead: true }}>
            <sphereGeometry args={[0.17, 8, 8]} />
            <meshStandardMaterial color={skin} roughness={0.6} />
          </mesh>
          {/* Slicked-back hair */}
          <mesh position={[0, 1.82, -0.04]}>
            <sphereGeometry args={[0.15, 8, 6]} />
            <meshStandardMaterial color={hair} roughness={0.9} />
          </mesh>

          {/* Top hat (some billionaires) */}
          {hasTopHat && (
            <>
              <mesh position={[0, 1.92, 0]}>
                <cylinderGeometry args={[0.12, 0.12, 0.2, 8]} />
                <meshStandardMaterial color="#111" roughness={0.7} />
              </mesh>
              <mesh position={[0, 1.83, 0]}>
                <cylinderGeometry args={[0.18, 0.18, 0.03, 8]} />
                <meshStandardMaterial color="#111" roughness={0.7} />
              </mesh>
            </>
          )}

          {/* Sunglasses */}
          <mesh position={[-0.06, 1.72, 0.15]}>
            <boxGeometry args={[0.06, 0.03, 0.02]} />
            <meshStandardMaterial color="#111" roughness={0.3} metalness={0.5} />
          </mesh>
          <mesh position={[0.06, 1.72, 0.15]}>
            <boxGeometry args={[0.06, 0.03, 0.02]} />
            <meshStandardMaterial color="#111" roughness={0.3} metalness={0.5} />
          </mesh>
          {/* Bridge */}
          <mesh position={[0, 1.72, 0.15]}>
            <boxGeometry args={[0.04, 0.01, 0.01]} />
            <meshStandardMaterial color="#333" />
          </mesh>

          {/* Smug little smirk */}
          <mesh position={[0.02, 1.64, 0.16]}>
            <boxGeometry args={[0.06, 0.01, 0.01]} />
            <meshStandardMaterial color="#cc8888" />
          </mesh>

          {/* Neck */}
          <mesh position={[0, 1.55, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.08, 6]} />
            <meshStandardMaterial color={skin} roughness={0.6} />
          </mesh>

          {/* Suit jacket (with round belly bulge) */}
          <mesh position={[0, 1.2, 0]}>
            <boxGeometry args={[0.35, 0.55, 0.22]} />
            <meshStandardMaterial color={suit} roughness={0.6} />
          </mesh>
          {/* Belly */}
          <mesh position={[0, 1.1, 0.08]}>
            <sphereGeometry args={[0.14, 6, 6]} />
            <meshStandardMaterial color={suit} roughness={0.6} />
          </mesh>
          {/* White shirt collar */}
          <mesh position={[0, 1.48, 0.08]}>
            <boxGeometry args={[0.15, 0.06, 0.06]} />
            <meshStandardMaterial color="#fff" roughness={0.7} />
          </mesh>
          {/* Tie */}
          <mesh position={[0, 1.3, 0.12]}>
            <boxGeometry args={[0.04, 0.3, 0.02]} />
            <meshStandardMaterial color={tie} roughness={0.5} />
          </mesh>

          {/* Suit jacket lapels */}
          <mesh position={[-0.08, 1.38, 0.12]} rotation={[0, 0, -0.2]}>
            <boxGeometry args={[0.06, 0.15, 0.02]} />
            <meshStandardMaterial color={suit} roughness={0.6} />
          </mesh>
          <mesh position={[0.08, 1.38, 0.12]} rotation={[0, 0, 0.2]}>
            <boxGeometry args={[0.06, 0.15, 0.02]} />
            <meshStandardMaterial color={suit} roughness={0.6} />
          </mesh>

          {/* Left arm */}
          <group ref={leftArmRef} position={[-0.24, 1.4, 0]}>
            <mesh position={[0, -0.15, 0]}>
              <boxGeometry args={[0.09, 0.35, 0.09]} />
              <meshStandardMaterial color={suit} roughness={0.6} />
            </mesh>
            <mesh position={[0, -0.35, 0]}>
              <sphereGeometry args={[0.04, 6, 6]} />
              <meshStandardMaterial color={skin} roughness={0.6} />
            </mesh>
            {/* Briefcase in left hand */}
            {hasBriefcase && (
              <mesh position={[0, -0.4, 0.06]}>
                <boxGeometry args={[0.12, 0.09, 0.04]} />
                <meshStandardMaterial color="#4a3020" roughness={0.7} />
              </mesh>
            )}
          </group>
          {/* Right arm */}
          <group ref={rightArmRef} position={[0.24, 1.4, 0]}>
            <mesh position={[0, -0.15, 0]}>
              <boxGeometry args={[0.09, 0.35, 0.09]} />
              <meshStandardMaterial color={suit} roughness={0.6} />
            </mesh>
            <mesh position={[0, -0.35, 0]}>
              <sphereGeometry args={[0.04, 6, 6]} />
              <meshStandardMaterial color={skin} roughness={0.6} />
            </mesh>
            {/* Golf club in right hand */}
            {hasGolfClub && (
              <>
                <mesh position={[0, -0.25, 0.05]} rotation={[0.3, 0, 0]}>
                  <cylinderGeometry args={[0.01, 0.01, 0.5, 4]} />
                  <meshStandardMaterial color="#888" roughness={0.4} metalness={0.6} />
                </mesh>
                <mesh position={[0, -0.5, 0.12]} rotation={[0.3, 0, 0]}>
                  <boxGeometry args={[0.06, 0.02, 0.04]} />
                  <meshStandardMaterial color="#888" roughness={0.4} metalness={0.6} />
                </mesh>
              </>
            )}
          </group>

          {/* Left leg */}
          <group ref={leftLegRef} position={[-0.08, 0.9, 0]}>
            <mesh position={[0, -0.2, 0]}>
              <boxGeometry args={[0.1, 0.45, 0.1]} />
              <meshStandardMaterial color={pants} roughness={0.7} />
            </mesh>
            {/* Dress shoe */}
            <mesh position={[0, -0.45, 0.02]}>
              <boxGeometry args={[0.08, 0.04, 0.13]} />
              <meshStandardMaterial color="#111" roughness={0.5} />
            </mesh>
          </group>
          {/* Right leg */}
          <group ref={rightLegRef} position={[0.08, 0.9, 0]}>
            <mesh position={[0, -0.2, 0]}>
              <boxGeometry args={[0.1, 0.45, 0.1]} />
              <meshStandardMaterial color={pants} roughness={0.7} />
            </mesh>
            {/* Dress shoe */}
            <mesh position={[0, -0.45, 0.02]}>
              <boxGeometry args={[0.08, 0.04, 0.13]} />
              <meshStandardMaterial color="#111" roughness={0.5} />
            </mesh>
          </group>

          {/* Gold watch on left wrist */}
          <mesh position={[-0.24, 1.08, 0]}>
            <boxGeometry args={[0.05, 0.03, 0.05]} />
            <meshStandardMaterial color="#cc9900" roughness={0.3} metalness={0.8} />
          </mesh>
        </group>
      </group>
    </>
  );
}

// ─── PLANE that flies in, lands, and spawns mini people ───

export function IslandPlane({ id }: { id: number }) {
  const modelRef = useRef<THREE.Group>(null);
  const phase = useRef<'approach' | 'landed' | 'takeoff'>('approach');
  const timer = useRef(0);
  const posRef = useRef(new THREE.Vector3(
    0,
    40 + id * 5,
    150 + id * 40
  ));

  useFrame((_, delta) => {
    if (!modelRef.current) return;
    const dt = Math.min(delta, 0.05);

    if (phase.current === 'approach') {
      // Fly toward runway
      posRef.current.z -= 18 * dt;
      posRef.current.y -= 4 * dt;
      if (posRef.current.y < 3) posRef.current.y = 3;
      if (posRef.current.z < 30) {
        // Landed
        posRef.current.y = 2.5;
        posRef.current.z = 30;
        phase.current = 'landed';
        timer.current = 4; // stay for 4 seconds
      }
    } else if (phase.current === 'landed') {
      timer.current -= dt;
      if (timer.current <= 0) {
        phase.current = 'takeoff';
      }
    } else {
      // Take off
      posRef.current.z += 15 * dt;
      posRef.current.y += 6 * dt;
      if (posRef.current.z > 200) {
        // Reset for another approach
        posRef.current.set(0, 40 + Math.random() * 10, 150 + Math.random() * 30);
        phase.current = 'approach';
      }
    }

    modelRef.current.position.copy(posRef.current);
    // Pitch based on phase
    if (phase.current === 'approach') {
      modelRef.current.rotation.x = 0.1;
    } else if (phase.current === 'takeoff') {
      modelRef.current.rotation.x = -0.15;
    } else {
      modelRef.current.rotation.x = 0;
    }
  });

  const bodyColor = id % 3 === 0 ? '#e8e8e8' : id % 3 === 1 ? '#2266aa' : '#cc4422';

  return (
    <group ref={modelRef}>
      {/* Fuselage */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 1.5, 10]} />
        <meshStandardMaterial color={bodyColor} roughness={0.5} />
      </mesh>
      {/* Nose cone */}
      <mesh position={[0, 0, 5.5]}>
        <boxGeometry args={[1.2, 1.2, 2]} />
        <meshStandardMaterial color={bodyColor} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.1, 6.8]}>
        <boxGeometry args={[0.8, 0.8, 1]} />
        <meshStandardMaterial color={bodyColor} roughness={0.5} />
      </mesh>
      {/* Cockpit windows */}
      <mesh position={[0, 0.5, 5.8]}>
        <boxGeometry args={[1, 0.4, 1.5]} />
        <meshStandardMaterial color="#88ccff" roughness={0.2} metalness={0.5} />
      </mesh>
      {/* Wings */}
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[14, 0.2, 3]} />
        <meshStandardMaterial color={bodyColor} roughness={0.5} />
      </mesh>
      {/* Wing tips */}
      <mesh position={[-7.2, 0.3, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.6, 1, 1.5]} />
        <meshStandardMaterial color={bodyColor} roughness={0.5} />
      </mesh>
      <mesh position={[7.2, 0.3, 0]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.6, 1, 1.5]} />
        <meshStandardMaterial color={bodyColor} roughness={0.5} />
      </mesh>
      {/* Tail fin */}
      <mesh position={[0, 1.5, -4.5]}>
        <boxGeometry args={[0.15, 2.5, 2.5]} />
        <meshStandardMaterial color={bodyColor} roughness={0.5} />
      </mesh>
      {/* Horizontal stabilizers */}
      <mesh position={[0, 0.3, -4.5]}>
        <boxGeometry args={[5, 0.12, 1.5]} />
        <meshStandardMaterial color={bodyColor} roughness={0.5} />
      </mesh>
      {/* Engines (under wings) */}
      {[-3.5, 3.5].map((x, i) => (
        <group key={`eng-${i}`} position={[x, -0.7, 0.5]}>
          <mesh>
            <cylinderGeometry args={[0.35, 0.4, 2, 6]} />
            <meshStandardMaterial color="#666" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

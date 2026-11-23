import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../stores/gameStore';

const READY_POS = new THREE.Vector3(0.22, -0.2, -0.5);
// ADS position: scope eyepiece aligned to screen center
const ADS_POS = new THREE.Vector3(0, -0.075, -0.42);
const ADS_SPEED = 10;
const BOB_FREQ = 8;
const BOB_AMP_Y = 0.006;
const BOB_AMP_X = 0.003;
const BOB_FIXED_DT = 1 / 120;
const POS_SMOOTH = 18;
const ROT_SMOOTH = 14;
const RECOIL_BACK = 0.08;
const RECOIL_UP = 0.04;
const RECOIL_ROT = 0.15;
const RECOIL_DECAY = 6;
const RELOAD_DUR = 2.0;

const _basePos = new THREE.Vector3();
const _baseEuler = new THREE.Euler();
const _localQ = new THREE.Quaternion();

export function SniperWeapon() {
  const grp = useRef<THREE.Group>(null);
  const boltRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  const curPos = useRef(new THREE.Vector3());
  const curQuat = useRef(new THREE.Quaternion());
  const tgtPos = useRef(new THREE.Vector3());
  const tgtQuat = useRef(new THREE.Quaternion());
  const inited = useRef(false);

  const bobAcc = useRef(0);
  const bobPhase = useRef(0);
  const bobVel = useRef(0);
  const bobOff = useRef(new THREE.Vector3());
  const tgtBobOff = useRef(new THREE.Vector3());

  const recoilOff = useRef(new THREE.Vector3());
  const recoilRot = useRef(0);
  const prevShoot = useRef(false);

  const reloadBlend = useRef(0);
  const reloadProg = useRef(0);
  const prevReloading = useRef(false);
  const boltOff = useRef(0);
  const aimBlend = useRef(0);

  useFrame((_, delta) => {
    if (!grp.current) return;
    const dt = Math.min(delta, 0.05);
    const gs = useGameStore.getState();

    // Bob velocity
    const tgtVel = gs.isMoving ? (gs.isSprinting ? 1.3 : 1.0) : 0;
    bobVel.current += (tgtVel - bobVel.current) * 8 * dt;
    if (bobVel.current < 0.05) bobVel.current = 0;

    // Fixed timestep bob
    bobAcc.current += dt;
    while (bobAcc.current >= BOB_FIXED_DT) {
      bobAcc.current -= BOB_FIXED_DT;
      if (bobVel.current > 0.1) bobPhase.current += BOB_FIXED_DT * BOB_FREQ;
    }

    tgtBobOff.current.set(
      Math.sin(bobPhase.current) * BOB_AMP_X * bobVel.current,
      Math.abs(Math.sin(bobPhase.current * 2)) * BOB_AMP_Y * bobVel.current,
      Math.sin(bobPhase.current * 2) * 0.002 * bobVel.current
    );
    bobOff.current.lerp(tgtBobOff.current, Math.min(1, 8 * dt));

    // Reload
    if (gs.isReloading && !prevReloading.current) reloadProg.current = 0;
    prevReloading.current = gs.isReloading;

    if (gs.isReloading || reloadProg.current > 0) {
      reloadProg.current += dt / RELOAD_DUR;
      if (reloadProg.current > 1) reloadProg.current = 0;
      reloadBlend.current = Math.sin(reloadProg.current * Math.PI);

      // Bolt action animation
      const p = reloadProg.current;
      if (p < 0.3) boltOff.current = (p / 0.3) * 0.06;
      else if (p < 0.7) boltOff.current = 0.06;
      else boltOff.current = 0.06 * (1 - (p - 0.7) / 0.3);
    } else {
      reloadBlend.current *= 0.9;
      boltOff.current *= 0.9;
    }

    // Recoil
    if (gs.isShooting && !prevShoot.current) {
      recoilOff.current.z += RECOIL_BACK;
      recoilOff.current.y += RECOIL_UP;
      recoilRot.current += RECOIL_ROT;
    }
    prevShoot.current = gs.isShooting;
    const decay = Math.exp(-RECOIL_DECAY * dt);
    recoilOff.current.multiplyScalar(decay);
    recoilRot.current *= decay;

    // ADS blend
    const aimTgt = gs.isAiming ? 1 : 0;
    aimBlend.current += (aimTgt - aimBlend.current) * Math.min(1, ADS_SPEED * dt);

    // Hide gun when fully scoped in or when not using sniper
    grp.current.visible = gs.currentWeapon === 'sniper' && aimBlend.current < 0.7;

    // Build transform — lerp between hip and ADS position
    _basePos.lerpVectors(READY_POS, ADS_POS, aimBlend.current);
    _baseEuler.set(0, 0, 0);

    if (reloadBlend.current > 0.001) {
      _basePos.y -= reloadBlend.current * 0.08;
      _basePos.z += reloadBlend.current * 0.05;
      _baseEuler.x -= reloadBlend.current * 0.2;
    }

    // Reduce bob when aiming
    const bobScale = 1 - aimBlend.current * 0.85;
    _basePos.x += bobOff.current.x * bobScale;
    _basePos.y += bobOff.current.y * bobScale + recoilOff.current.y;
    _basePos.z += recoilOff.current.z;
    _baseEuler.x += recoilRot.current;

    _localQ.setFromEuler(_baseEuler);

    grp.current.position.copy(_basePos).applyQuaternion(camera.quaternion).add(camera.position);
    grp.current.quaternion.copy(camera.quaternion).multiply(_localQ);

    // Bolt handle animation
    if (boltRef.current) boltRef.current.position.z = boltOff.current;
  });

  const metal = '#1a1a1a';
  const darkMetal = '#0d0d0d';
  const wood = '#3d2b1f';
  const woodLight = '#5c3a24';

  return (
    <group ref={grp}>
      {/* Barrel - long sniper barrel */}
      <mesh position={[0, 0.01, -0.35]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.008, 0.01, 0.5, 8]} />
        <meshStandardMaterial color={darkMetal} roughness={0.15} metalness={0.95} />
      </mesh>

      {/* Muzzle brake */}
      <mesh position={[0, 0.01, -0.6]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.013, 0.01, 0.03, 8]} />
        <meshStandardMaterial color={metal} roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Receiver */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.035, 0.05, 0.2]} />
        <meshStandardMaterial color={metal} roughness={0.3} metalness={0.85} />
      </mesh>

      {/* Bolt handle */}
      <group ref={boltRef}>
        <mesh position={[0.025, 0.02, 0.02]} castShadow>
          <boxGeometry args={[0.015, 0.012, 0.04]} />
          <meshStandardMaterial color={metal} roughness={0.3} metalness={0.9} />
        </mesh>
        <mesh position={[0.04, 0.02, 0.02]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.006, 0.006, 0.02, 6]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.4} metalness={0.8} />
        </mesh>
      </group>

      {/* Scope */}
      <group position={[0, 0.055, -0.02]}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.022, 0.012, 0.04]} />
          <meshStandardMaterial color={metal} roughness={0.4} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.018, 0.018, 0.16, 12]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.25} metalness={0.75} />
        </mesh>
        <mesh position={[0, 0.02, -0.085]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.024, 0.02, 0.015, 12]} />
          <meshStandardMaterial color="#111" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.02, -0.093]}>
          <circleGeometry args={[0.02, 16]} />
          <meshStandardMaterial color="#1a3a5a" roughness={0.05} metalness={0.3} transparent opacity={0.5} />
        </mesh>
        <mesh position={[0, 0.02, 0.085]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.018, 0.015, 12]} />
          <meshStandardMaterial color="#111" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.04, 0]} castShadow>
          <cylinderGeometry args={[0.007, 0.007, 0.012, 6]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.5} metalness={0.6} />
        </mesh>
      </group>

      {/* Stock - wooden */}
      <group position={[0, -0.01, 0.14]}>
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.03, 0.045, 0.12]} />
          <meshStandardMaterial color={wood} roughness={0.7} metalness={0.05} />
        </mesh>
        <mesh position={[0, 0, 0.07]} castShadow>
          <boxGeometry args={[0.032, 0.05, 0.03]} />
          <meshStandardMaterial color={woodLight} roughness={0.75} metalness={0.03} />
        </mesh>
      </group>

      {/* Trigger guard */}
      <mesh position={[0, -0.03, 0.02]} castShadow>
        <boxGeometry args={[0.02, 0.006, 0.05]} />
        <meshStandardMaterial color={metal} roughness={0.4} metalness={0.8} />
      </mesh>

      {/* Grip */}
      <mesh position={[0, -0.05, 0.04]} rotation={[0.2, 0, 0]} castShadow>
        <boxGeometry args={[0.025, 0.06, 0.03]} />
        <meshStandardMaterial color={wood} roughness={0.7} metalness={0.05} />
      </mesh>

      {/* Magazine */}
      <mesh position={[0, -0.055, -0.02]} castShadow>
        <boxGeometry args={[0.02, 0.05, 0.03]} />
        <meshStandardMaterial color={metal} roughness={0.5} metalness={0.7} />
      </mesh>

      {/* Right hand */}
      <group position={[0.03, -0.06, 0.05]}>
        <mesh rotation={[0.2, 0, -0.15]} castShadow>
          <boxGeometry args={[0.035, 0.04, 0.04]} />
          <meshStandardMaterial color="#c4956a" roughness={0.7} />
        </mesh>
      </group>

      {/* Left hand on foregrip */}
      <group position={[-0.02, -0.02, -0.18]}>
        <mesh rotation={[0.1, 0, 0.2]} castShadow>
          <boxGeometry args={[0.035, 0.035, 0.04]} />
          <meshStandardMaterial color="#c4956a" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

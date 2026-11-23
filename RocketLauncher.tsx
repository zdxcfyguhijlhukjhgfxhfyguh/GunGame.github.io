import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../stores/gameStore';

const HIP_POS = new THREE.Vector3(0.25, -0.22, -0.45);
const BOB_FREQ = 8;
const BOB_AMP_Y = 0.005;
const BOB_AMP_X = 0.003;

const _basePos = new THREE.Vector3();
const _baseEuler = new THREE.Euler();
const _localQ = new THREE.Quaternion();

export function RocketLauncher() {
  const grp = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const bobPhase = useRef(0);
  const bobVel = useRef(0);

  useFrame((_, delta) => {
    if (!grp.current) return;
    const dt = Math.min(delta, 0.05);
    const gs = useGameStore.getState();

    // Only visible when rocket launcher is selected
    grp.current.visible = gs.currentWeapon === 'rocket';
    if (!grp.current.visible) return;

    // Walk bob
    const tgtVel = gs.isMoving ? (gs.isSprinting ? 1.3 : 1.0) : 0;
    bobVel.current += (tgtVel - bobVel.current) * 8 * dt;
    if (bobVel.current < 0.05) bobVel.current = 0;
    if (bobVel.current > 0.1) bobPhase.current += dt * BOB_FREQ;

    const bobX = Math.sin(bobPhase.current) * BOB_AMP_X * bobVel.current;
    const bobY = Math.abs(Math.sin(bobPhase.current * 2)) * BOB_AMP_Y * bobVel.current;

    _basePos.copy(HIP_POS);
    _basePos.x += bobX;
    _basePos.y += bobY;
    _baseEuler.set(0, 0, 0);
    _localQ.setFromEuler(_baseEuler);

    grp.current.position.copy(_basePos).applyQuaternion(camera.quaternion).add(camera.position);
    grp.current.quaternion.copy(camera.quaternion).multiply(_localQ);
  });

  const tubeMetal = '#3a3a3a';
  const darkMetal = '#1a1a1a';
  const olive = '#4a5a2a';

  return (
    <group ref={grp}>
      {/* Main tube */}
      <mesh position={[0, 0, -0.1]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.028, 0.028, 0.55, 10]} />
        <meshStandardMaterial color={olive} roughness={0.7} />
      </mesh>

      {/* Front flare */}
      <mesh position={[0, 0, -0.38]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.028, 0.04, 10]} />
        <meshStandardMaterial color={tubeMetal} roughness={0.5} metalness={0.6} />
      </mesh>

      {/* Back opening */}
      <mesh position={[0, 0, 0.17]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.032, 0.03, 10]} />
        <meshStandardMaterial color={tubeMetal} roughness={0.5} metalness={0.6} />
      </mesh>

      {/* Sight */}
      <mesh position={[0, 0.04, -0.15]} castShadow>
        <boxGeometry args={[0.008, 0.03, 0.05]} />
        <meshStandardMaterial color={darkMetal} roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[0, 0.055, -0.15]} castShadow>
        <boxGeometry args={[0.012, 0.005, 0.008]} />
        <meshStandardMaterial color={darkMetal} roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Front sight post */}
      <mesh position={[0, 0.04, -0.32]} castShadow>
        <boxGeometry args={[0.006, 0.025, 0.006]} />
        <meshStandardMaterial color={darkMetal} roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Grip */}
      <mesh position={[0, -0.05, 0.02]} rotation={[0.3, 0, 0]} castShadow>
        <boxGeometry args={[0.025, 0.07, 0.03]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
      </mesh>

      {/* Trigger guard */}
      <mesh position={[0, -0.03, -0.01]} castShadow>
        <boxGeometry args={[0.02, 0.006, 0.05]} />
        <meshStandardMaterial color={darkMetal} roughness={0.4} metalness={0.7} />
      </mesh>

      {/* Shoulder rest */}
      <mesh position={[0, -0.01, 0.14]} castShadow>
        <boxGeometry args={[0.04, 0.05, 0.06]} />
        <meshStandardMaterial color="#2a2a1a" roughness={0.8} />
      </mesh>

      {/* Band/strap detail */}
      <mesh position={[0, 0, -0.05]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.032, 0.032, 0.015, 10]} />
        <meshStandardMaterial color="#555" roughness={0.6} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.032, 0.032, 0.015, 10]} />
        <meshStandardMaterial color="#555" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Right hand */}
      <group position={[0.03, -0.06, 0.03]}>
        <mesh rotation={[0.2, 0, -0.15]} castShadow>
          <boxGeometry args={[0.035, 0.04, 0.04]} />
          <meshStandardMaterial color="#c4956a" roughness={0.7} />
        </mesh>
      </group>

      {/* Left hand on tube */}
      <group position={[-0.02, -0.03, -0.18]}>
        <mesh rotation={[0.1, 0, 0.2]} castShadow>
          <boxGeometry args={[0.035, 0.035, 0.04]} />
          <meshStandardMaterial color="#c4956a" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

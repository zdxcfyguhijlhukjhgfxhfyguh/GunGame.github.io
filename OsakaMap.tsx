import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';

// ── helpers ──────────────────────────────────────────────────────────────────

function Box({
  pos,
  size,
  color,
  emissive,
  emissiveIntensity = 0,
  metalness = 0,
  roughness = 0.8,
  castShadow = true,
  receiveShadow = true,
}: {
  pos: [number, number, number];
  size: [number, number, number];
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  metalness?: number;
  roughness?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
}) {
  return (
    <mesh position={pos} castShadow={castShadow} receiveShadow={receiveShadow}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        emissive={emissive || color}
        emissiveIntensity={emissiveIntensity}
        metalness={metalness}
        roughness={roughness}
      />
    </mesh>
  );
}

function NeonSign({
  pos,
  size,
  color,
  intensity = 2,
}: {
  pos: [number, number, number];
  size: [number, number, number];
  color: string;
  intensity?: number;
}) {
  return (
    <mesh position={pos}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={intensity}
        toneMapped={false}
      />
    </mesh>
  );
}

// ── Staircase ────────────────────────────────────────────────────────────────

function Staircase({
  pos,
  steps,
  stepW,
  stepH,
  stepD,
  dir,
  color = '#3a3a44',
}: {
  pos: [number, number, number];
  steps: number;
  stepW: number;
  stepH: number;
  stepD: number;
  dir: 'north' | 'south' | 'east' | 'west';
  color?: string;
}) {
  const dz = dir === 'north' ? -stepD : dir === 'south' ? stepD : 0;
  const dx = dir === 'east' ? stepD : dir === 'west' ? -stepD : 0;

  return (
    <group>
      {Array.from({ length: steps }, (_, i) => (
        <RigidBody key={i} type="fixed" colliders="cuboid">
          <Box
            pos={[
              pos[0] + dx * i,
              pos[1] + stepH * i + stepH / 2,
              pos[2] + dz * i,
            ]}
            size={[stepW, stepH, stepD]}
            color={color}
            roughness={0.85}
          />
        </RigidBody>
      ))}
    </group>
  );
}

// ── Cherry Blossom Tree ──────────────────────────────────────────────────────

function CherryBlossomTree({ pos, scale = 1 }: { pos: [number, number, number]; scale?: number }) {
  const petals = useMemo(() => {
    const p: { pos: [number, number, number]; s: number }[] = [];
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = (1.2 + Math.random() * 3) * scale;
      const h = (4.5 + Math.random() * 3.5) * scale;
      p.push({
        pos: [Math.cos(angle) * r, h, Math.sin(angle) * r],
        s: (0.8 + Math.random() * 1.5) * scale,
      });
    }
    return p;
  }, [scale]);

  return (
    <group position={pos}>
      <mesh position={[0, 3 * scale, 0]}>
        <cylinderGeometry args={[0.12 * scale, 0.3 * scale, 6 * scale, 4]} />
        <meshStandardMaterial color="#4a3728" roughness={0.9} />
      </mesh>
      {[
        { p: [0.9, 4.5, 0.3], r: [0, 0, 0.5] },
        { p: [-0.7, 5, -0.4], r: [0, 0.5, -0.4] },
        { p: [0.3, 5.5, -0.8], r: [0.3, 0, 0.3] },
      ].map((b, i) => (
        <mesh
          key={i}
          position={[b.p[0] * scale, b.p[1] * scale, b.p[2] * scale]}
          rotation={b.r as [number, number, number]}
        >
          <cylinderGeometry args={[0.05 * scale, 0.1 * scale, 2.5 * scale, 3]} />
          <meshStandardMaterial color="#4a3728" roughness={0.9} />
        </mesh>
      ))}
      {petals.map((p, i) => (
        <mesh key={i} position={p.pos}>
          <sphereGeometry args={[p.s * 0.35, 4, 4]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? '#ffb7c5' : i % 3 === 1 ? '#ff91a4' : '#ffc0cb'}
            emissive="#ff91a4"
            emissiveIntensity={0.12}
            roughness={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

// ── Falling Petals (animated) ────────────────────────────────────────────────

function FallingPetals() {
  const count = 60;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const petals = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 140,
      y: 12 + Math.random() * 18,
      z: (Math.random() - 0.5) * 100,
      speed: 0.3 + Math.random() * 0.5,
      drift: (Math.random() - 0.5) * 0.6,
      spin: Math.random() * Math.PI * 2,
      spinSpeed: 1 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    for (let i = 0; i < count; i++) {
      const p = petals[i];
      p.y -= p.speed * delta;
      p.x += Math.sin(p.phase + p.y * 0.3) * p.drift * delta;
      p.spin += p.spinSpeed * delta;
      if (p.y < -6) {
        p.y = 14 + Math.random() * 10;
        p.x = (Math.random() - 0.5) * 140;
        p.z = (Math.random() - 0.5) * 100;
      }
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.spin, p.spin * 0.7, 0);
      dummy.scale.setScalar(0.09);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <planeGeometry args={[1, 0.6]} />
      <meshStandardMaterial
        color="#ffb7c5"
        emissive="#ff91a4"
        emissiveIntensity={0.15}
        side={THREE.DoubleSide}
        transparent
        opacity={0.85}
      />
    </instancedMesh>
  );
}

// ── Lantern ──────────────────────────────────────────────────────────────────

function Lantern({ pos, color = '#ff4444' }: { pos: [number, number, number]; color?: string }) {
  return (
    <group position={pos}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1, 4]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.25, 0.2, 0.6, 6]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2}
          toneMapped={false}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  );
}

// ── Vending Machine ──────────────────────────────────────────────────────────

function VendingMachine({ pos, rotation = 0, color = '#2244aa' }: { pos: [number, number, number]; rotation?: number; color?: string }) {
  return (
    <group position={pos} rotation={[0, rotation, 0]}>
      <Box pos={[0, 1, 0]} size={[1, 2, 0.8]} color={color} metalness={0.4} roughness={0.3} />
      <Box pos={[0, 1.2, 0.35]} size={[0.8, 1.2, 0.12]} color="#aaddff" emissive="#88ccff" emissiveIntensity={1.5} />
    </group>
  );
}

// ── Bridge Railing ───────────────────────────────────────────────────────────

function BridgeRailing({
  pos,
  length,
  along = 'z',
}: {
  pos: [number, number, number];
  length: number;
  along?: 'x' | 'z';
}) {
  const posts = Math.floor(length / 2);
  const isZ = along === 'z';

  return (
    <group position={pos}>
      <Box
        pos={[0, 1.1, 0]}
        size={isZ ? [0.1, 0.1, length] : [length, 0.1, 0.1]}
        color="#888899"
        metalness={0.6}
        roughness={0.3}
      />
      {Array.from({ length: posts + 1 }, (_, i) => (
        <Box
          key={i}
          pos={
            isZ
              ? [0, 0.55, -length / 2 + i * 2]
              : [-length / 2 + i * 2, 0.55, 0]
          }
          size={[0.08, 1.1, 0.08]}
          color="#888899"
          metalness={0.6}
          roughness={0.3}
        />
      ))}
    </group>
  );
}

// ── Shop Front ───────────────────────────────────────────────────────────────

function ShopFront({
  pos,
  width,
  depth,
  height,
  wallColor,
  signColor,
  roofColor = '#2a2a3a',
  side,
  hasBalcony = false,
  hasRoofAccess = false,
}: {
  pos: [number, number, number];
  width: number;
  depth: number;
  height: number;
  wallColor: string;
  signColor: string;
  roofColor?: string;
  side: 'north' | 'south';
  hasBalcony?: boolean;
  hasRoofAccess?: boolean;
}) {
  const signFaceZ = side === 'north' ? pos[2] + depth / 2 + 0.05 : pos[2] - depth / 2 - 0.05;
  const balconyZ = side === 'north' ? pos[2] + depth / 2 + 1.2 : pos[2] - depth / 2 - 1.2;
  const balconyY = pos[1] + 1;

  return (
    <group>
      {/* Main building body */}
      <Box pos={pos} size={[width, height, depth]} color={wallColor} />
      {/* Roof */}
      <Box
        pos={[pos[0], pos[1] + height / 2 + 0.15, pos[2]]}
        size={[width + 0.6, 0.3, depth + 1]}
        color={roofColor}
      />
      {/* Neon sign */}
      <NeonSign
        pos={[pos[0], pos[1] + height / 2 - 1.5, signFaceZ]}
        size={[width * 0.7, 1.2, 0.15]}
        color={signColor}
        intensity={2.5}
      />
      {/* Second smaller sign */}
      <NeonSign
        pos={[pos[0] + width * 0.25, pos[1], signFaceZ]}
        size={[width * 0.3, 0.6, 0.1]}
        color={signColor}
        intensity={1.5}
      />
      {/* Awning */}
      <Box
        pos={[pos[0], pos[1] - height / 2 + 2, signFaceZ + (side === 'north' ? 0.8 : -0.8)]}
        size={[width, 0.08, 1.6]}
        color="#1a1a2e"
      />
      {/* Door */}
      <Box
        pos={[pos[0], pos[1] - height / 2 + 1.2, signFaceZ]}
        size={[1.4, 2.4, 0.1]}
        color="#1a1a1a"
        emissive="#ffaa00"
        emissiveIntensity={0.3}
      />
      {/* Windows */}
      <Box
        pos={[pos[0] + width * 0.3, pos[1] - height / 2 + 1.4, signFaceZ]}
        size={[width * 0.25, 1.6, 0.08]}
        color="#334455"
        emissive="#ffcc66"
        emissiveIntensity={0.4}
      />
      <Box
        pos={[pos[0] - width * 0.3, pos[1] - height / 2 + 1.4, signFaceZ]}
        size={[width * 0.2, 1.2, 0.08]}
        color="#334455"
        emissive="#ffcc66"
        emissiveIntensity={0.3}
      />

      {/* ── Balcony (Level 2) ── */}
      {hasBalcony && (
        <>
          {/* Balcony floor — walkable */}
          <RigidBody type="fixed" colliders="cuboid">
            <Box
              pos={[pos[0], balconyY, balconyZ]}
              size={[width, 0.2, 2.4]}
              color="#3a3a44"
              roughness={0.85}
            />
          </RigidBody>
          {/* Balcony railing */}
          <BridgeRailing
            pos={[pos[0], balconyY + 0.1, balconyZ + (side === 'north' ? 1 : -1)]}
            length={width}
            along="x"
          />
          {/* Balcony side walls */}
          <Box
            pos={[pos[0] - width / 2 + 0.1, balconyY + 0.6, balconyZ]}
            size={[0.2, 1.2, 2.4]}
            color="#3a3a44"
          />
          <Box
            pos={[pos[0] + width / 2 - 0.1, balconyY + 0.6, balconyZ]}
            size={[0.2, 1.2, 2.4]}
            color="#3a3a44"
          />
          {/* Upper windows behind balcony */}
          <Box
            pos={[pos[0], balconyY + 1, signFaceZ]}
            size={[width * 0.5, 1.2, 0.08]}
            color="#334455"
            emissive="#885522"
            emissiveIntensity={0.5}
          />
        </>
      )}

      {/* ── Rooftop access marker ── */}
      {hasRoofAccess && (
        <>
          {/* Rooftop floor (walkable) */}
          <RigidBody type="fixed" colliders="cuboid">
            <Box
              pos={[pos[0], pos[1] + height / 2 + 0.35, pos[2]]}
              size={[width + 0.4, 0.2, depth + 0.8]}
              color="#2a2a34"
              roughness={0.9}
            />
          </RigidBody>
          {/* Rooftop railing on canal side */}
          <BridgeRailing
            pos={[pos[0], pos[1] + height / 2 + 0.4, signFaceZ + (side === 'north' ? 0.3 : -0.3)]}
            length={width}
            along="x"
          />
          {/* AC unit / cover on roof */}
          <RigidBody type="fixed" colliders="cuboid">
            <Box
              pos={[pos[0] + width * 0.25, pos[1] + height / 2 + 1, pos[2] - (side === 'north' ? 1 : -1)]}
              size={[1.5, 1.2, 1.2]}
              color="#444455"
              metalness={0.3}
            />
          </RigidBody>
        </>
      )}
    </group>
  );
}

// ── Glico Running Man Sign ───────────────────────────────────────────────────

function RunningManSign({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <Box pos={[0, 0, 0]} size={[10, 7, 0.3]} color="#1a1a2e" metalness={0.3} roughness={0.5} />
      <Box pos={[0, 0, 0.2]} size={[9.2, 6.4, 0.1]} color="#0044aa" emissive="#0066ff" emissiveIntensity={1.5} />
      {/* Running man */}
      <Box pos={[0, 0.5, 0.35]} size={[1.2, 2, 0.1]} color="#fff" emissive="#fff" emissiveIntensity={2} />
      <mesh position={[0, 2, 0.35]}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <Box pos={[-1, 1.4, 0.35]} size={[1.4, 0.35, 0.1]} color="#fff" emissive="#fff" emissiveIntensity={2} />
      <Box pos={[0.8, 0.3, 0.35]} size={[1.2, 0.35, 0.1]} color="#fff" emissive="#fff" emissiveIntensity={2} />
      <mesh position={[-0.6, -1.4, 0.35]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.35, 2, 0.1]} />
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <mesh position={[0.6, -1.4, 0.35]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.35, 2, 0.1]} />
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <Box pos={[0, -2.6, 0.35]} size={[5, 0.7, 0.1]} color="#ff0000" emissive="#ff0000" emissiveIntensity={2} />
      <Box pos={[-4.5, -3.5, -0.2]} size={[0.5, 7, 0.5]} color="#333344" />
      <Box pos={[4.5, -3.5, -0.2]} size={[0.5, 7, 0.5]} color="#333344" />
    </group>
  );
}

// ── Torii Gate ───────────────────────────────────────────────────────────────

function ToriiGate({ pos, rotation = 0 }: { pos: [number, number, number]; rotation?: number }) {
  return (
    <group position={pos} rotation={[0, rotation, 0]}>
      {/* Pillars */}
      <mesh position={[-2.5, 3, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 6, 5]} />
        <meshStandardMaterial color="#cc2200" emissive="#cc2200" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[2.5, 3, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 6, 5]} />
        <meshStandardMaterial color="#cc2200" emissive="#cc2200" emissiveIntensity={0.2} />
      </mesh>
      {/* Top beam (kasagi) */}
      <Box pos={[0, 6.2, 0]} size={[7, 0.4, 0.5]} color="#cc2200" emissive="#cc2200" emissiveIntensity={0.15} />
      {/* Lower beam (nuki) */}
      <Box pos={[0, 5, 0]} size={[5.5, 0.25, 0.3]} color="#cc2200" emissive="#cc2200" emissiveIntensity={0.15} />
    </group>
  );
}

// ── Street Lamp ──────────────────────────────────────────────────────────────

function StreetLamp({ pos, color = '#ffaa55' }: { pos: [number, number, number]; color?: string }) {
  return (
    <group position={pos}>
      <mesh>
        <cylinderGeometry args={[0.08, 0.1, 5, 4]} />
        <meshStandardMaterial color="#333" metalness={0.5} />
      </mesh>
      <mesh position={[0, 2.8, 0]}>
        <boxGeometry args={[0.6, 0.4, 0.6]} />
        <meshStandardMaterial color="#444" emissive={color} emissiveIntensity={2} toneMapped={false} />
      </mesh>
    </group>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ██  OSAKA MAP — DOTONBORI  ██
// ══════════════════════════════════════════════════════════════════════════════
//
//  Size: ~140 x 100 units
//
//  LEVELS:
//    L1 (Y=0)   — Street / walkways along canal
//    L2 (Y=5)   — Balconies, elevated walkways, bridge deck
//    L3 (Y=10+) — Rooftops (select buildings)
//
//  Canal: deep gorge (water at Y=-6), walls down to Y=-7
//  Bridge deck: Y=5, arches high above water
//
//  Layout (top-down):
//
//   ┌──────────────────────────────────────────────────────────────┐
//   │  Back alley (north)                                          │
//   │  ┌─────┬─────┬─────┬──────┬─────┬─────┬─────┬──────┐       │
//   │  │Shop │Shop │Shop │RM Bld│Shop │Shop │Shop │Tower │       │
//   │  └─────┴─────┴─────┴──────┴─────┴─────┴─────┴──────┘       │
//   │  ═══════ North walkway (L1) + balconies (L2) ══════════      │
//   │  ─── railing ──── [Bridge1] ──── [Bridge2] ──── [Bridge3] ─ │
//   │  ══════════════════ CANAL (deep) ═══════════════════════     │
//   │  ─── railing ──── [Bridge1] ──── [Bridge2] ──── [Bridge3] ─ │
//   │  ═══════ South walkway (L1) + balconies (L2) ══════════      │
//   │  ┌─────┬─────┬─────┬──────┬─────┬─────┬─────┬──────┐       │
//   │  │Shop │Shop │Shop │Shop  │Shop │Shop │Shop │Tower │       │
//   │  └─────┴─────┴─────┴──────┴─────┴─────┴─────┴──────┘       │
//   │  Back alley (south)                                          │
//   └──────────────────────────────────────────────────────────────┘
//

export function OsakaMap() {
  const waterRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (waterRef.current) {
      const mat = waterRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.15 + Math.sin(state.clock.elapsedTime * 0.8) * 0.05;
    }
  });

  // Y constants
  const WATER_Y = -6;
  const GROUND_Y = 0;
  const BRIDGE_Y = 5;
  const CANAL_HALF_W = 7; // canal is 14 units wide
  const CANAL_DEPTH = 8; // from ground to water surface

  return (
    <group>
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ██  TERRAIN  ██ */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {/* North ground (street level) */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, GROUND_Y - 0.25, -25]} receiveShadow>
          <boxGeometry args={[140, 0.5, 40]} />
          <meshStandardMaterial color="#1a1a24" roughness={0.9} />
        </mesh>
      </RigidBody>
      {/* South ground (street level) */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, GROUND_Y - 0.25, 25]} receiveShadow>
          <boxGeometry args={[140, 0.5, 40]} />
          <meshStandardMaterial color="#1a1a24" roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* ── Walkway pavement (lighter stone along canal edge) ────── */}
      {/* North walkway */}
      <mesh position={[0, GROUND_Y + 0.01, -10]} receiveShadow>
        <boxGeometry args={[130, 0.05, 8]} />
        <meshStandardMaterial color="#3a3a44" roughness={0.85} />
      </mesh>
      {/* South walkway */}
      <mesh position={[0, GROUND_Y + 0.01, 10]} receiveShadow>
        <boxGeometry args={[130, 0.05, 8]} />
        <meshStandardMaterial color="#3a3a44" roughness={0.85} />
      </mesh>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ██  CANAL  ██ */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {/* Canal walls — north side (vertical concrete wall) */}
      <RigidBody type="fixed" colliders="cuboid">
        <Box
          pos={[0, GROUND_Y - CANAL_DEPTH / 2, -CANAL_HALF_W]}
          size={[130, CANAL_DEPTH, 0.8]}
          color="#2a2a33"
          roughness={0.9}
        />
      </RigidBody>
      {/* Canal walls — south side */}
      <RigidBody type="fixed" colliders="cuboid">
        <Box
          pos={[0, GROUND_Y - CANAL_DEPTH / 2, CANAL_HALF_W]}
          size={[130, CANAL_DEPTH, 0.8]}
          color="#2a2a33"
          roughness={0.9}
        />
      </RigidBody>
      {/* Canal floor */}
      <RigidBody type="fixed" colliders="cuboid">
        <Box
          pos={[0, WATER_Y - 1.5, 0]}
          size={[130, 0.5, CANAL_HALF_W * 2]}
          color="#111118"
        />
      </RigidBody>

      {/* Water surface (visual only — no collider, player falls through) */}
      <mesh ref={waterRef} position={[0, WATER_Y, 0]} receiveShadow>
        <boxGeometry args={[130, 0.15, CANAL_HALF_W * 2 - 1]} />
        <meshStandardMaterial
          color="#0a1a2a"
          emissive="#112244"
          emissiveIntensity={0.15}
          metalness={0.85}
          roughness={0.15}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* ── KILL ZONE under water — teleport/respawn trigger ────── */}
      <RigidBody type="fixed" colliders="cuboid" sensor>
        <CuboidCollider args={[65, 0.5, CANAL_HALF_W]} position={[0, WATER_Y - 0.5, 0]} />
      </RigidBody>

      {/* Canal edge railings */}
      <BridgeRailing pos={[-30, GROUND_Y, -CANAL_HALF_W + 0.5]} length={50} along="x" />
      <BridgeRailing pos={[35, GROUND_Y, -CANAL_HALF_W + 0.5]} length={50} along="x" />
      <BridgeRailing pos={[-30, GROUND_Y, CANAL_HALF_W - 0.5]} length={50} along="x" />
      <BridgeRailing pos={[35, GROUND_Y, CANAL_HALF_W - 0.5]} length={50} along="x" />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ██  BRIDGES (elevated, arched)  ██ */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {/* ── Bridge 1: Ebisubashi (main, center) ── */}
      {/* Ramps up from ground to bridge deck */}
      {/* North ramp */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh
          position={[0, BRIDGE_Y / 2, -CANAL_HALF_W - 3]}
          rotation={[Math.atan2(BRIDGE_Y, 6), 0, 0]}
          receiveShadow castShadow
        >
          <boxGeometry args={[10, 0.5, 7]} />
          <meshStandardMaterial color="#555566" roughness={0.7} metalness={0.2} />
        </mesh>
      </RigidBody>
      {/* South ramp */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh
          position={[0, BRIDGE_Y / 2, CANAL_HALF_W + 3]}
          rotation={[-Math.atan2(BRIDGE_Y, 6), 0, 0]}
          receiveShadow castShadow
        >
          <boxGeometry args={[10, 0.5, 7]} />
          <meshStandardMaterial color="#555566" roughness={0.7} metalness={0.2} />
        </mesh>
      </RigidBody>
      {/* Bridge deck (flat span over canal) */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, BRIDGE_Y, 0]} receiveShadow castShadow>
          <boxGeometry args={[10, 0.6, CANAL_HALF_W * 2 + 2]} />
          <meshStandardMaterial color="#555566" roughness={0.7} metalness={0.2} />
        </mesh>
      </RigidBody>
      {/* Bridge railings */}
      <BridgeRailing pos={[-4.8, BRIDGE_Y + 0.3, 0]} length={CANAL_HALF_W * 2 + 2} />
      <BridgeRailing pos={[4.8, BRIDGE_Y + 0.3, 0]} length={CANAL_HALF_W * 2 + 2} />
      {/* Arch supports under bridge */}
      <Box pos={[-3, BRIDGE_Y / 2 - 1, 0]} size={[0.6, BRIDGE_Y + 2, 0.6]} color="#444455" />
      <Box pos={[3, BRIDGE_Y / 2 - 1, 0]} size={[0.6, BRIDGE_Y + 2, 0.6]} color="#444455" />
      <Box pos={[0, BRIDGE_Y / 2 - 1.5, -3]} size={[9, 0.4, 0.4]} color="#444455" />
      <Box pos={[0, BRIDGE_Y / 2 - 1.5, 3]} size={[9, 0.4, 0.4]} color="#444455" />

      {/* ── Bridge 2: West footbridge ── */}
      {/* North ramp */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh
          position={[-35, BRIDGE_Y / 2, -CANAL_HALF_W - 3]}
          rotation={[Math.atan2(BRIDGE_Y, 6), 0, 0]}
          receiveShadow castShadow
        >
          <boxGeometry args={[7, 0.5, 7]} />
          <meshStandardMaterial color="#555566" roughness={0.7} metalness={0.2} />
        </mesh>
      </RigidBody>
      {/* South ramp */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh
          position={[-35, BRIDGE_Y / 2, CANAL_HALF_W + 3]}
          rotation={[-Math.atan2(BRIDGE_Y, 6), 0, 0]}
          receiveShadow castShadow
        >
          <boxGeometry args={[7, 0.5, 7]} />
          <meshStandardMaterial color="#555566" roughness={0.7} metalness={0.2} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-35, BRIDGE_Y, 0]} receiveShadow castShadow>
          <boxGeometry args={[7, 0.5, CANAL_HALF_W * 2 + 2]} />
          <meshStandardMaterial color="#555566" roughness={0.7} metalness={0.2} />
        </mesh>
      </RigidBody>
      <BridgeRailing pos={[-38.3, BRIDGE_Y + 0.3, 0]} length={CANAL_HALF_W * 2 + 2} />
      <BridgeRailing pos={[-31.7, BRIDGE_Y + 0.3, 0]} length={CANAL_HALF_W * 2 + 2} />
      <Box pos={[-35, BRIDGE_Y / 2 - 1, 0]} size={[0.5, BRIDGE_Y + 2, 0.5]} color="#444455" />

      {/* ── Bridge 3: East covered bridge ── */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh
          position={[38, BRIDGE_Y / 2, -CANAL_HALF_W - 3]}
          rotation={[Math.atan2(BRIDGE_Y, 6), 0, 0]}
          receiveShadow castShadow
        >
          <boxGeometry args={[8, 0.5, 7]} />
          <meshStandardMaterial color="#4a3a2a" roughness={0.8} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh
          position={[38, BRIDGE_Y / 2, CANAL_HALF_W + 3]}
          rotation={[-Math.atan2(BRIDGE_Y, 6), 0, 0]}
          receiveShadow castShadow
        >
          <boxGeometry args={[8, 0.5, 7]} />
          <meshStandardMaterial color="#4a3a2a" roughness={0.8} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[38, BRIDGE_Y, 0]} receiveShadow castShadow>
          <boxGeometry args={[8, 0.5, CANAL_HALF_W * 2 + 2]} />
          <meshStandardMaterial color="#4a3a2a" roughness={0.8} />
        </mesh>
      </RigidBody>
      <BridgeRailing pos={[34.2, BRIDGE_Y + 0.3, 0]} length={CANAL_HALF_W * 2 + 2} />
      <BridgeRailing pos={[41.8, BRIDGE_Y + 0.3, 0]} length={CANAL_HALF_W * 2 + 2} />
      {/* Covered roof on east bridge */}
      <Box pos={[38, BRIDGE_Y + 3.5, 0]} size={[9, 0.3, CANAL_HALF_W * 2]} color="#3a2a1a" />
      {/* Roof support pillars */}
      <Box pos={[34.5, BRIDGE_Y + 1.8, -4]} size={[0.3, 3.2, 0.3]} color="#4a3728" />
      <Box pos={[34.5, BRIDGE_Y + 1.8, 4]} size={[0.3, 3.2, 0.3]} color="#4a3728" />
      <Box pos={[41.5, BRIDGE_Y + 1.8, -4]} size={[0.3, 3.2, 0.3]} color="#4a3728" />
      <Box pos={[41.5, BRIDGE_Y + 1.8, 4]} size={[0.3, 3.2, 0.3]} color="#4a3728" />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ██  NORTH SIDE BUILDINGS  ██ */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {/* Row 1 — canal-facing shops with balconies */}
      <RigidBody type="fixed">
        <CuboidCollider args={[65, 7, 8]} position={[0, 7, -22]} />
      </RigidBody>

      <ShopFront pos={[-55, 7, -22]} width={9} depth={12} height={14} wallColor="#2a1a1a" signColor="#ff4400" side="north" hasBalcony hasRoofAccess />
      <ShopFront pos={[-43, 6, -22]} width={8} depth={12} height={12} wallColor="#1a2a1a" signColor="#ffaa00" side="north" hasBalcony />
      <ShopFront pos={[-32, 7.5, -22]} width={9} depth={12} height={15} wallColor="#1a1a2a" signColor="#00ff88" side="north" hasBalcony hasRoofAccess />
      <ShopFront pos={[-20, 6.5, -22]} width={10} depth={12} height={13} wallColor="#2a1a2a" signColor="#ff00ff" side="north" hasBalcony />
      {/* Running Man building */}
      <ShopFront pos={[-7, 8, -22]} width={12} depth={12} height={16} wallColor="#1a1a2e" signColor="#0066ff" side="north" hasBalcony hasRoofAccess />
      <RunningManSign pos={[-7, 18, -15.8]} />
      <ShopFront pos={[8, 6.5, -22]} width={9} depth={12} height={13} wallColor="#2a2a1a" signColor="#ff6600" side="north" hasBalcony />
      <ShopFront pos={[20, 7, -22]} width={8} depth={12} height={14} wallColor="#1a2a2a" signColor="#00ccff" side="north" hasBalcony hasRoofAccess />
      <ShopFront pos={[31, 6, -22]} width={9} depth={12} height={12} wallColor="#2a1a1a" signColor="#aa00ff" side="north" hasBalcony />
      <ShopFront pos={[43, 7.5, -22]} width={10} depth={12} height={15} wallColor="#1a1a2a" signColor="#ff0088" side="north" hasRoofAccess />

      {/* Tall tower — far east north */}
      <Box pos={[55, 12, -22]} size={[8, 24, 12]} color="#181828" />
      <NeonSign pos={[55, 22, -15.8]} size={[6, 2, 0.15]} color="#ff0066" intensity={3} />
      <NeonSign pos={[55, 18, -15.8]} size={[0.5, 6, 0.15]} color="#00ffcc" intensity={2} />
      <RigidBody type="fixed" colliders="cuboid">
        <Box pos={[55, 24.2, -22]} size={[8.5, 0.2, 12.5]} color="#222233" />
      </RigidBody>
      <BridgeRailing pos={[55, 24.3, -15.8]} length={8} along="x" />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ██  SOUTH SIDE BUILDINGS  ██ */}
      {/* ══════════════════════════════════════════════════════════════ */}

      <RigidBody type="fixed">
        <CuboidCollider args={[65, 7, 8]} position={[0, 7, 22]} />
      </RigidBody>

      <ShopFront pos={[-55, 6, 22]} width={8} depth={12} height={12} wallColor="#2a2a1a" signColor="#ffcc00" side="south" hasBalcony />
      <ShopFront pos={[-44, 7, 22]} width={9} depth={12} height={14} wallColor="#1a1a2a" signColor="#ff6644" side="south" hasBalcony hasRoofAccess />
      <ShopFront pos={[-32, 7.5, 22]} width={10} depth={12} height={15} wallColor="#1a0a2a" signColor="#aa00ff" side="south" hasBalcony hasRoofAccess />
      <ShopFront pos={[-19, 6, 22]} width={9} depth={12} height={12} wallColor="#2a1a2a" signColor="#ff0088" side="south" hasBalcony />
      <ShopFront pos={[-7, 6.5, 22]} width={10} depth={12} height={13} wallColor="#1a2a1a" signColor="#00ffaa" side="south" hasBalcony />
      <ShopFront pos={[6, 7, 22]} width={8} depth={12} height={14} wallColor="#2a2a2a" signColor="#44aaff" side="south" hasRoofAccess />
      <ShopFront pos={[17, 6, 22]} width={9} depth={12} height={12} wallColor="#2a1a1a" signColor="#ff4400" side="south" hasBalcony />
      <ShopFront pos={[29, 7.5, 22]} width={10} depth={12} height={15} wallColor="#1a1a2a" signColor="#ffaa00" side="south" hasBalcony hasRoofAccess />
      <ShopFront pos={[42, 6.5, 22]} width={9} depth={12} height={13} wallColor="#1a2a2a" signColor="#00ff88" side="south" hasBalcony />

      {/* Tall tower — far east south */}
      <Box pos={[55, 11, 22]} size={[8, 22, 12]} color="#181828" />
      <NeonSign pos={[55, 20, 15.8]} size={[6, 1.5, 0.15]} color="#ff4488" intensity={3} />
      <RigidBody type="fixed" colliders="cuboid">
        <Box pos={[55, 22.2, 22]} size={[8.5, 0.2, 12.5]} color="#222233" />
      </RigidBody>
      <BridgeRailing pos={[55, 22.3, 15.8]} length={8} along="x" />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ██  BACK ALLEYS (behind buildings)  ██ */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {/* North back alley — narrow street behind north shops */}
      <mesh position={[0, GROUND_Y + 0.01, -34]} receiveShadow>
        <boxGeometry args={[130, 0.05, 6]} />
        <meshStandardMaterial color="#222230" roughness={0.9} />
      </mesh>
      {/* Back alley walls (north boundary buildings — just visual backdrops) */}
      <Box pos={[0, 8, -42]} size={[130, 16, 8]} color="#151520" />

      {/* South back alley */}
      <mesh position={[0, GROUND_Y + 0.01, 34]} receiveShadow>
        <boxGeometry args={[130, 0.05, 6]} />
        <meshStandardMaterial color="#222230" roughness={0.9} />
      </mesh>
      <Box pos={[0, 8, 42]} size={[130, 16, 8]} color="#151520" />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ██  SIDE ALLEYS (perpendicular to canal, between buildings)  ██ */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {/* North side alleys — gaps between buildings create flanking routes */}
      {[-48, -26, -13, 2, 14, 26, 48].map((x, i) => (
        <group key={`n-alley-${i}`}>
          <mesh position={[x, GROUND_Y + 0.01, -22]} receiveShadow>
            <boxGeometry args={[3, 0.05, 16]} />
            <meshStandardMaterial color="#1e1e28" roughness={0.9} />
          </mesh>
          {/* Alley dumpster / cover */}
          {i % 2 === 0 && (
            <RigidBody type="fixed" colliders="cuboid">
              <Box pos={[x + 0.5, 0.6, -24]} size={[1.5, 1.2, 1]} color="#334" />
            </RigidBody>
          )}
        </group>
      ))}

      {/* South side alleys */}
      {[-48, -26, -13, 2, 14, 26, 48].map((x, i) => (
        <group key={`s-alley-${i}`}>
          <mesh position={[x, GROUND_Y + 0.01, 22]} receiveShadow>
            <boxGeometry args={[3, 0.05, 16]} />
            <meshStandardMaterial color="#1e1e28" roughness={0.9} />
          </mesh>
          {i % 2 === 1 && (
            <RigidBody type="fixed" colliders="cuboid">
              <Box pos={[x - 0.5, 0.6, 24]} size={[1.5, 1.2, 1]} color="#334" />
            </RigidBody>
          )}
        </group>
      ))}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ██  LEVEL 2 — ELEVATED WALKWAYS (connecting balconies)  ██ */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {/* North elevated walkway — runs along balcony level, connecting shops */}
      <RigidBody type="fixed" colliders="cuboid">
        <Box pos={[-25, 5, -14.5]} size={[40, 0.2, 2.5]} color="#3a3a44" roughness={0.85} />
      </RigidBody>
      <BridgeRailing pos={[-25, 5.1, -13.2]} length={40} along="x" />

      <RigidBody type="fixed" colliders="cuboid">
        <Box pos={[25, 5, -14.5]} size={[35, 0.2, 2.5]} color="#3a3a44" roughness={0.85} />
      </RigidBody>
      <BridgeRailing pos={[25, 5.1, -13.2]} length={35} along="x" />

      {/* South elevated walkway */}
      <RigidBody type="fixed" colliders="cuboid">
        <Box pos={[-25, 5, 14.5]} size={[40, 0.2, 2.5]} color="#3a3a44" roughness={0.85} />
      </RigidBody>
      <BridgeRailing pos={[-25, 5.1, 13.2]} length={40} along="x" />

      <RigidBody type="fixed" colliders="cuboid">
        <Box pos={[25, 5, 14.5]} size={[35, 0.2, 2.5]} color="#3a3a44" roughness={0.85} />
      </RigidBody>
      <BridgeRailing pos={[25, 5.1, 13.2]} length={35} along="x" />

      {/* ── Stairs to L2 (north side) ── */}
      <Staircase pos={[-45, 0, -11]} steps={12} stepW={3} stepH={0.42} stepD={0.5} dir="north" />
      <Staircase pos={[-15, 0, -11]} steps={12} stepW={3} stepH={0.42} stepD={0.5} dir="north" />
      <Staircase pos={[15, 0, -11]} steps={12} stepW={3} stepH={0.42} stepD={0.5} dir="north" />
      <Staircase pos={[42, 0, -11]} steps={12} stepW={3} stepH={0.42} stepD={0.5} dir="north" />

      {/* ── Stairs to L2 (south side) ── */}
      <Staircase pos={[-45, 0, 11]} steps={12} stepW={3} stepH={0.42} stepD={0.5} dir="south" />
      <Staircase pos={[-15, 0, 11]} steps={12} stepW={3} stepH={0.42} stepD={0.5} dir="south" />
      <Staircase pos={[15, 0, 11]} steps={12} stepW={3} stepH={0.42} stepD={0.5} dir="south" />
      <Staircase pos={[42, 0, 11]} steps={12} stepW={3} stepH={0.42} stepD={0.5} dir="south" />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ██  LEVEL 3 — ROOFTOP STAIRS  ██ */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {/* Stairs from L2 walkway up to rooftop on key buildings */}
      {/* North: up to RM building roof (Y=5 to Y=16) */}
      <Staircase pos={[-13.5, 5, -18]} steps={24} stepW={2} stepH={0.46} stepD={0.4} dir="north" color="#444455" />
      {/* North: up to drug store roof */}
      <Staircase pos={[-32, 5, -18]} steps={20} stepW={2} stepH={0.5} stepD={0.4} dir="north" color="#444455" />
      {/* South: up to arcade roof */}
      <Staircase pos={[-32, 5, 18]} steps={20} stepW={2} stepH={0.5} stepD={0.4} dir="south" color="#444455" />
      {/* South: up to big building roof */}
      <Staircase pos={[29, 5, 18]} steps={20} stepW={2} stepH={0.5} stepD={0.4} dir="south" color="#444455" />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ██  GAMEPLAY COVER / PROPS  ██ */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {/* ── Food stall carts (north walkway) ── */}
      {[-50, -30, -10, 12, 30, 48].map((x, i) => (
        <RigidBody key={`cart-n-${i}`} type="fixed" colliders="cuboid">
          <Box pos={[x, 0.9, -8.5]} size={[2.5, 1.8, 1.8]} color={i % 2 === 0 ? '#8B4513' : '#654321'} roughness={0.9} />
          {/* Cart canopy */}
          <Box pos={[x, 2, -8.5]} size={[3, 0.1, 2.2]} color={i % 2 === 0 ? '#cc3333' : '#3355aa'} />
        </RigidBody>
      ))}

      {/* ── Food stall carts (south walkway) ── */}
      {[-45, -22, 5, 20, 40].map((x, i) => (
        <RigidBody key={`cart-s-${i}`} type="fixed" colliders="cuboid">
          <Box pos={[x, 0.9, 8.5]} size={[2.5, 1.8, 1.8]} color={i % 2 === 0 ? '#654321' : '#8B4513'} roughness={0.9} />
          <Box pos={[x, 2, 8.5]} size={[3, 0.1, 2.2]} color={i % 2 === 0 ? '#cc8833' : '#33aa55'} />
        </RigidBody>
      ))}

      {/* ── Vending machines ── */}
      <RigidBody type="fixed" colliders="cuboid">
        <VendingMachine pos={[-52, 0, -13.5]} />
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <VendingMachine pos={[-51, 0, -13.5]} color="#aa2244" />
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <VendingMachine pos={[25, 0, -13.5]} />
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <VendingMachine pos={[-30, 0, 13.5]} rotation={Math.PI} color="#22aa44" />
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <VendingMachine pos={[45, 0, 13.5]} rotation={Math.PI} />
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <VendingMachine pos={[46, 0, 13.5]} rotation={Math.PI} color="#aa2244" />
      </RigidBody>

      {/* ── Crate stacks ── */}
      {[[-40, -9], [-5, -12], [35, -9], [-25, 9], [10, 12], [50, 9]].map(([x, z], i) => (
        <RigidBody key={`crate-${i}`} type="fixed" colliders="cuboid">
          <group>
            <Box pos={[x, 0.5, z]} size={[1.2, 1, 1.2]} color="#556B2F" />
            <Box pos={[x + 0.2, 1.3, z]} size={[1, 0.8, 1]} color="#556B2F" />
          </group>
        </RigidBody>
      ))}

      {/* ── Concrete barriers ── */}
      {[[-20, -7.5], [20, -7.5], [-20, 7.5], [20, 7.5], [-50, -7], [50, 7]].map(([x, z], i) => (
        <RigidBody key={`barrier-${i}`} type="fixed" colliders="cuboid">
          <Box pos={[x, 0.5, z]} size={[2.5, 1, 0.6]} color="#666666" roughness={0.9} />
        </RigidBody>
      ))}

      {/* ── Planters / benches on bridge ── */}
      <RigidBody type="fixed" colliders="cuboid">
        <Box pos={[-2, BRIDGE_Y + 0.5, -2]} size={[1.5, 0.7, 0.7]} color="#554433" />
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <Box pos={[2, BRIDGE_Y + 0.5, 2]} size={[1.5, 0.7, 0.7]} color="#554433" />
      </RigidBody>

      {/* ── Back alley dumpsters / cover ── */}
      {[-40, -15, 10, 35].map((x, i) => (
        <RigidBody key={`dump-n-${i}`} type="fixed" colliders="cuboid">
          <Box pos={[x, 0.8, -33]} size={[2, 1.6, 1.2]} color="#333" metalness={0.3} />
        </RigidBody>
      ))}
      {[-35, -5, 20, 45].map((x, i) => (
        <RigidBody key={`dump-s-${i}`} type="fixed" colliders="cuboid">
          <Box pos={[x, 0.8, 33]} size={[2, 1.6, 1.2]} color="#333" metalness={0.3} />
        </RigidBody>
      ))}

      {/* ── Rooftop cover (AC units, water tanks) ── */}
      {/* These are placed on the rooftop-accessible buildings */}
      <RigidBody type="fixed" colliders="cuboid">
        <Box pos={[-55, 14.8, -24]} size={[2, 1.5, 2]} color="#444" metalness={0.4} />
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <Box pos={[20, 14.8, -24]} size={[1.5, 2, 1.5]} color="#555" metalness={0.3} />
      </RigidBody>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ██  CHERRY BLOSSOM TREES  ██ */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {/* Along north walkway */}
      <CherryBlossomTree pos={[-55, 0, -8]} scale={1.2} />
      <CherryBlossomTree pos={[-35, 0, -9]} />
      <CherryBlossomTree pos={[-18, 0, -8.5]} scale={1.1} />
      <CherryBlossomTree pos={[5, 0, -9]} />
      <CherryBlossomTree pos={[25, 0, -8]} scale={1.2} />
      <CherryBlossomTree pos={[48, 0, -8.5]} />

      {/* Along south walkway */}
      <CherryBlossomTree pos={[-48, 0, 8.5]} />
      <CherryBlossomTree pos={[-25, 0, 9]} scale={1.2} />
      <CherryBlossomTree pos={[-8, 0, 8]} />
      <CherryBlossomTree pos={[15, 0, 9]} scale={1.1} />
      <CherryBlossomTree pos={[35, 0, 8.5]} />
      <CherryBlossomTree pos={[55, 0, 9]} scale={1.3} />

      {/* Back alleys */}
      <CherryBlossomTree pos={[-50, 0, -34]} scale={0.9} />
      <CherryBlossomTree pos={[0, 0, -35]} scale={1.1} />
      <CherryBlossomTree pos={[45, 0, -34]} />
      <CherryBlossomTree pos={[-30, 0, 34]} />
      <CherryBlossomTree pos={[20, 0, 35]} scale={1.1} />
      <CherryBlossomTree pos={[55, 0, 34]} scale={0.9} />

      {/* Tree trunk colliders */}
      {[
        [-55, -8], [-35, -9], [-18, -8.5], [5, -9], [25, -8], [48, -8.5],
        [-48, 8.5], [-25, 9], [-8, 8], [15, 9], [35, 8.5], [55, 9],
        [-50, -34], [0, -35], [45, -34], [-30, 34], [20, 35], [55, 34],
      ].map(([x, z], i) => (
        <RigidBody key={`tree-col-${i}`} type="fixed">
          <CuboidCollider args={[0.3, 3, 0.3]} position={[x, 3, z]} />
        </RigidBody>
      ))}

      <FallingPetals />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ██  TORII GATES  ██ */}
      {/* ══════════════════════════════════════════════════════════════ */}

      <ToriiGate pos={[-58, 0, -10]} rotation={Math.PI / 2} />
      <ToriiGate pos={[60, 0, 10]} rotation={-Math.PI / 2} />
      <ToriiGate pos={[-48, 0, -34]} />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ██  LANTERNS  ██ */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {/* North side */}
      <Lantern pos={[-50, 6, -15.5]} color="#ff3333" />
      <Lantern pos={[-35, 6, -15.5]} color="#ff6600" />
      <Lantern pos={[-20, 6, -15.5]} color="#ff3333" />
      <Lantern pos={[-5, 6, -15.5]} color="#ff6600" />
      <Lantern pos={[10, 6, -15.5]} color="#ff3333" />
      <Lantern pos={[25, 6, -15.5]} color="#ff6600" />
      <Lantern pos={[40, 6, -15.5]} color="#ff3333" />
      <Lantern pos={[52, 6, -15.5]} color="#ff6600" />

      {/* South side */}
      <Lantern pos={[-50, 6, 15.5]} color="#ff3333" />
      <Lantern pos={[-35, 6, 15.5]} color="#ff6600" />
      <Lantern pos={[-18, 6, 15.5]} color="#ff3333" />
      <Lantern pos={[0, 6, 15.5]} color="#ff6600" />
      <Lantern pos={[18, 6, 15.5]} color="#ff3333" />
      <Lantern pos={[35, 6, 15.5]} color="#ff6600" />
      <Lantern pos={[50, 6, 15.5]} color="#ff3333" />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ██  STREET LAMPS  ██ */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {[-45, -5, 35].map((x, i) => (
        <StreetLamp key={`lamp-n-${i}`} pos={[x, 0, -7]} />
      ))}
      {[-35, 15, 50].map((x, i) => (
        <StreetLamp key={`lamp-s-${i}`} pos={[x, 0, 7]} />
      ))}
      {/* Back alley lamps */}
      {[-25, 25].map((x, i) => (
        <StreetLamp key={`lamp-bn-${i}`} pos={[x, 0, -34]} color="#ffbb77" />
      ))}
      {[-25, 25].map((x, i) => (
        <StreetLamp key={`lamp-bs-${i}`} pos={[x, 0, 34]} color="#ffbb77" />
      ))}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ██  ADDITIONAL NEON SIGNS  ██ */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {/* Vertical strips */}
      <NeonSign pos={[-50, 10, -15.8]} size={[0.4, 6, 0.15]} color="#ff0044" intensity={2} />
      <NeonSign pos={[-37, 9, -15.8]} size={[0.4, 5, 0.15]} color="#00ffcc" intensity={2} />
      <NeonSign pos={[13, 10, -15.8]} size={[0.4, 6, 0.15]} color="#ffaa00" intensity={2} />
      <NeonSign pos={[35, 9, -15.8]} size={[0.4, 5, 0.15]} color="#ff00ff" intensity={2} />
      <NeonSign pos={[-50, 9, 15.8]} size={[0.4, 5, 0.15]} color="#aa44ff" intensity={2} />
      <NeonSign pos={[-25, 10, 15.8]} size={[0.4, 6, 0.15]} color="#ff6688" intensity={2} />
      <NeonSign pos={[10, 9, 15.8]} size={[0.4, 5, 0.15]} color="#00ff66" intensity={2} />
      <NeonSign pos={[35, 10, 15.8]} size={[0.4, 6, 0.15]} color="#ff4400" intensity={2} />
      <NeonSign pos={[48, 9, 15.8]} size={[0.4, 5, 0.15]} color="#44aaff" intensity={2} />

      {/* Big horizontal billboard signs */}
      <NeonSign pos={[-43, 12, -15.8]} size={[7, 2, 0.15]} color="#ff2266" intensity={2} />
      <NeonSign pos={[8, 12, -15.8]} size={[6, 1.8, 0.15]} color="#22ff88" intensity={2} />
      <NeonSign pos={[-44, 12, 15.8]} size={[7, 2, 0.15]} color="#ff8800" intensity={2} />
      <NeonSign pos={[29, 13, 15.8]} size={[8, 2.5, 0.15]} color="#ff00aa" intensity={2.5} />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ██  LIGHTING — NIGHT SCENE  ██ */}
      {/* ══════════════════════════════════════════════════════════════ */}

      <ambientLight intensity={0.08} color="#445566" />
      <hemisphereLight color="#1a1a3a" groundColor="#0a0a14" intensity={0.15} />

      <directionalLight
        position={[30, 60, 20]}
        intensity={0.35}
        color="#8899bb"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={160}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-bias={-0.0003}
      />

      {/* Key area lights (few but impactful) */}
      <pointLight position={[-7, 4, -10]} color="#0066ff" intensity={5} distance={25} decay={2} />
      <pointLight position={[0, 6, 0]} color="#ffaa55" intensity={4} distance={20} decay={2} />
      <pointLight position={[-35, 4, 10]} color="#ff4400" intensity={4} distance={20} decay={2} />
      <pointLight position={[38, 6, 0]} color="#ff8844" intensity={4} distance={20} decay={2} />
      <pointLight position={[25, 4, -10]} color="#00ffcc" intensity={4} distance={20} decay={2} />
      <pointLight position={[-50, 4, 0]} color="#ffaa00" intensity={3} distance={18} decay={2} />

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ██  BOUNDARY WALLS  ██ */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {/* East/West */}
      <RigidBody type="fixed">
        <CuboidCollider args={[0.5, 20, 50]} position={[66, 20, 0]} />
      </RigidBody>
      <RigidBody type="fixed">
        <CuboidCollider args={[0.5, 20, 50]} position={[-66, 20, 0]} />
      </RigidBody>
      {/* North/South */}
      <RigidBody type="fixed">
        <CuboidCollider args={[66, 20, 0.5]} position={[0, 20, -47]} />
      </RigidBody>
      <RigidBody type="fixed">
        <CuboidCollider args={[66, 20, 0.5]} position={[0, 20, 47]} />
      </RigidBody>

      {/* ── Death plane (way below, catch anyone who clips through) ── */}
      <RigidBody type="fixed" colliders="cuboid">
        <CuboidCollider args={[70, 0.5, 50]} position={[0, -12, 0]} />
      </RigidBody>
    </group>
  );
}

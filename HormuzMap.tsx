import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';

// Strait runs along X axis. Water channel between two landmasses.
// Player is on the south cliff (negative Z) at high elevation looking north over the strait.

const WATER_COLOR = '#1a5577';
const ROCK_COLOR = '#6a5a4a';
const ROCK_DARK = '#4a3a2a';
const SAND_COLOR = '#c4a870';

export function HormuzMap() {
  return (
    <group>
      {/* ── WATER (the strait) ── */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, -1, 0]} receiveShadow>
          <boxGeometry args={[300, 2, 300]} />
          <meshStandardMaterial color={WATER_COLOR} roughness={0.2} metalness={0.3} transparent opacity={0.85} />
        </mesh>
      </RigidBody>

      {/* Animated water surface */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#1a6688" roughness={0.15} metalness={0.4} transparent opacity={0.5} />
      </mesh>

      {/* ── SOUTH LANDMASS (player side) ── */}
      {/* Main cliff */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 10, -70]} receiveShadow>
          <boxGeometry args={[200, 22, 80]} />
          <meshStandardMaterial color={ROCK_COLOR} roughness={0.9} />
        </mesh>
      </RigidBody>
      {/* Cliff face detail */}
      <mesh position={[0, 5, -32]}>
        <boxGeometry args={[180, 12, 4]} />
        <meshStandardMaterial color={ROCK_DARK} roughness={0.95} />
      </mesh>
      {/* Beach/shore slope */}
      <mesh position={[0, 0.5, -28]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[160, 1, 10]} />
        <meshStandardMaterial color={SAND_COLOR} roughness={0.9} />
      </mesh>

      {/* ── Player fortress / lookout on the cliff ── */}
      {/* Main platform */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 22, -55]}>
          <boxGeometry args={[20, 2, 16]} />
          <meshStandardMaterial color="#555" roughness={0.7} metalness={0.3} />
        </mesh>
      </RigidBody>
      {/* Fortress walls */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 23.5, -63]}>
          <boxGeometry args={[22, 5, 2]} />
          <meshStandardMaterial color="#666" roughness={0.7} metalness={0.3} />
        </mesh>
      </RigidBody>
      {/* Low front wall (so player can look over) */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 23.3, -47]}>
          <boxGeometry args={[22, 0.6, 1]} />
          <meshStandardMaterial color="#666" roughness={0.7} metalness={0.3} />
        </mesh>
      </RigidBody>
      {/* Side walls */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-10.5, 23.5, -55]}>
          <boxGeometry args={[1, 5, 16]} />
          <meshStandardMaterial color="#666" roughness={0.7} metalness={0.3} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[10.5, 23.5, -55]}>
          <boxGeometry args={[1, 5, 16]} />
          <meshStandardMaterial color="#666" roughness={0.7} metalness={0.3} />
        </mesh>
      </RigidBody>

      {/* Battlements / crenellations on front wall */}
      {Array.from({ length: 11 }).map((_, i) => (
        <mesh key={`cren-${i}`} position={[-10 + i * 2, 24, -47]}>
          <boxGeometry args={[0.8, 1, 1.2]} />
          <meshStandardMaterial color="#777" roughness={0.7} metalness={0.3} />
        </mesh>
      ))}

      {/* Tower left */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-12, 25, -55]}>
          <boxGeometry args={[4, 8, 4]} />
          <meshStandardMaterial color="#5a5a5a" roughness={0.7} metalness={0.3} />
        </mesh>
      </RigidBody>
      {/* Tower right */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[12, 25, -55]}>
          <boxGeometry args={[4, 8, 4]} />
          <meshStandardMaterial color="#5a5a5a" roughness={0.7} metalness={0.3} />
        </mesh>
      </RigidBody>

      {/* ── NORTH LANDMASS (opposite side) ── */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 8, 60]} receiveShadow>
          <boxGeometry args={[200, 18, 80]} />
          <meshStandardMaterial color={ROCK_COLOR} roughness={0.9} />
        </mesh>
      </RigidBody>
      <mesh position={[0, 3, 22]}>
        <boxGeometry args={[180, 8, 4]} />
        <meshStandardMaterial color={ROCK_DARK} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.5, 18]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[160, 1, 10]} />
        <meshStandardMaterial color={SAND_COLOR} roughness={0.9} />
      </mesh>

      {/* ── Small buoy markers at edges ── */}
      <mesh position={[-45, 2, -5]}>
        <cylinderGeometry args={[0.3, 0.3, 4, 6]} />
        <meshStandardMaterial color="#cc3322" roughness={0.5} />
      </mesh>
      <mesh position={[45, 2, -5]}>
        <cylinderGeometry args={[0.3, 0.3, 4, 6]} />
        <meshStandardMaterial color="#cc3322" roughness={0.5} />
      </mesh>
      <mesh position={[-45, 4.3, -5]}>
        <sphereGeometry args={[0.5, 6, 6]} />
        <meshStandardMaterial color="#ff4422" emissive="#ff2200" emissiveIntensity={2} />
      </mesh>
      <mesh position={[45, 4.3, -5]}>
        <sphereGeometry args={[0.5, 6, 6]} />
        <meshStandardMaterial color="#ff4422" emissive="#ff2200" emissiveIntensity={2} />
      </mesh>

      {/* ── Distant mountains (backdrop) ── */}
      {[
        [-80, 15, 110, 40, 30], [0, 20, 120, 50, 40], [80, 12, 115, 35, 25],
        [-80, 12, -120, 35, 25], [0, 18, -130, 50, 35], [80, 14, -125, 40, 28],
      ].map(([x, y, z, w, h], i) => (
        <mesh key={`mtn-${i}`} position={[x, y, z]}>
          <boxGeometry args={[w, h, 20]} />
          <meshStandardMaterial color="#7a6a5a" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

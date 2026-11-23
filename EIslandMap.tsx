import { RigidBody } from '@react-three/rapier';

const GRASS = '#4a8a3a';
const GRASS_DARK = '#3a7a2a';
const SAND = '#e8d8a8';
const WATER = '#1a6688';
const STONE = '#888';
const MANSION_WALL = '#f0e8d8';
const MANSION_ROOF = '#6a3a2a';
const RUNWAY = '#555';

export function EIslandMap() {
  return (
    <group>
      {/* ── OCEAN ── */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, -2, 0]}>
          <boxGeometry args={[500, 2, 500]} />
          <meshStandardMaterial color={WATER} roughness={0.15} metalness={0.3} transparent opacity={0.85} />
        </mesh>
      </RigidBody>
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#2288aa" roughness={0.1} metalness={0.4} transparent opacity={0.4} />
      </mesh>

      {/* ── ISLAND BASE ── */}
      {/* Main island ground */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[120, 2, 100]} />
          <meshStandardMaterial color={GRASS} roughness={0.9} />
        </mesh>
      </RigidBody>
      {/* Elevated center */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 1.5, -10]}>
          <boxGeometry args={[80, 3, 60]} />
          <meshStandardMaterial color={GRASS_DARK} roughness={0.9} />
        </mesh>
      </RigidBody>
      {/* Beach ring */}
      <mesh position={[0, 0.1, 55]}>
        <boxGeometry args={[130, 0.5, 15]} />
        <meshStandardMaterial color={SAND} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.1, -55]}>
        <boxGeometry args={[130, 0.5, 15]} />
        <meshStandardMaterial color={SAND} roughness={0.9} />
      </mesh>
      <mesh position={[65, 0.1, 0]}>
        <boxGeometry args={[15, 0.5, 110]} />
        <meshStandardMaterial color={SAND} roughness={0.9} />
      </mesh>
      <mesh position={[-65, 0.1, 0]}>
        <boxGeometry args={[15, 0.5, 110]} />
        <meshStandardMaterial color={SAND} roughness={0.9} />
      </mesh>

      {/* ── MANSION (player spawns on roof) ── */}
      {/* Main building */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 6, -25]}>
          <boxGeometry args={[24, 10, 18]} />
          <meshStandardMaterial color={MANSION_WALL} roughness={0.7} />
        </mesh>
      </RigidBody>
      {/* Roof / player platform */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 11.5, -25]}>
          <boxGeometry args={[26, 1, 20]} />
          <meshStandardMaterial color={MANSION_ROOF} roughness={0.8} />
        </mesh>
      </RigidBody>
      {/* Roof railing (low so player can see) */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 12.3, -15.5]}>
          <boxGeometry args={[26, 0.6, 0.5]} />
          <meshStandardMaterial color={STONE} roughness={0.7} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 12.3, -34.5]}>
          <boxGeometry args={[26, 2, 0.5]} />
          <meshStandardMaterial color={STONE} roughness={0.7} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-12.7, 12.3, -25]}>
          <boxGeometry args={[0.5, 0.6, 20]} />
          <meshStandardMaterial color={STONE} roughness={0.7} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[12.7, 12.3, -25]}>
          <boxGeometry args={[0.5, 0.6, 20]} />
          <meshStandardMaterial color={STONE} roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* Mansion windows */}
      {[-8, -2, 4, 10].map((x, i) => (
        <mesh key={`win-${i}`} position={[x, 6, -15.9]}>
          <boxGeometry args={[2, 3, 0.1]} />
          <meshStandardMaterial color="#88bbdd" roughness={0.2} metalness={0.4} />
        </mesh>
      ))}
      {/* Mansion door */}
      <mesh position={[0, 3, -15.9]}>
        <boxGeometry args={[3, 5, 0.1]} />
        <meshStandardMaterial color="#4a3020" roughness={0.8} />
      </mesh>
      {/* Columns at entrance */}
      {[-4, 4].map((x, i) => (
        <mesh key={`col-${i}`} position={[x, 4, -15.5]}>
          <cylinderGeometry args={[0.3, 0.3, 8, 6]} />
          <meshStandardMaterial color="#ddd" roughness={0.5} />
        </mesh>
      ))}

      {/* Left wing */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-18, 4, -25]}>
          <boxGeometry args={[12, 6, 14]} />
          <meshStandardMaterial color={MANSION_WALL} roughness={0.7} />
        </mesh>
      </RigidBody>
      <mesh position={[-18, 7.3, -25]}>
        <boxGeometry args={[14, 0.6, 16]} />
        <meshStandardMaterial color={MANSION_ROOF} roughness={0.8} />
      </mesh>
      {/* Right wing */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[18, 4, -25]}>
          <boxGeometry args={[12, 6, 14]} />
          <meshStandardMaterial color={MANSION_WALL} roughness={0.7} />
        </mesh>
      </RigidBody>
      <mesh position={[18, 7.3, -25]}>
        <boxGeometry args={[14, 0.6, 16]} />
        <meshStandardMaterial color={MANSION_ROOF} roughness={0.8} />
      </mesh>

      {/* ── POOL ── */}
      <mesh position={[0, 0.8, -8]}>
        <boxGeometry args={[10, 1, 6]} />
        <meshStandardMaterial color="#2299cc" roughness={0.1} metalness={0.3} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0, 0.5, -8]}>
        <boxGeometry args={[11, 0.6, 7]} />
        <meshStandardMaterial color="#ddd" roughness={0.5} />
      </mesh>

      {/* ── GARDEN / PATHS ── */}
      {/* Stone path from mansion to runway */}
      <mesh position={[0, 1.05, 10]}>
        <boxGeometry args={[3, 0.1, 30]} />
        <meshStandardMaterial color="#aaa" roughness={0.8} />
      </mesh>
      {/* Palm trees (simple) */}
      {[
        [-20, 5], [20, 8], [-30, 15], [30, 12], [-15, 30], [15, 25],
        [-40, 0], [40, -5], [-25, -5], [25, 0], [0, 35],
      ].map(([x, z], i) => (
        <group key={`palm-${i}`} position={[x, 1, z]}>
          {/* Trunk */}
          <mesh position={[0, 3, 0]} rotation={[0, 0, (i % 3 - 1) * 0.1]}>
            <cylinderGeometry args={[0.2, 0.3, 6, 6]} />
            <meshStandardMaterial color="#8a6a3a" roughness={0.9} />
          </mesh>
          {/* Leaves */}
          <mesh position={[0, 6.5, 0]}>
            <sphereGeometry args={[2, 6, 6]} />
            <meshStandardMaterial color="#2a7a2a" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* ── RUNWAY (for planes) ── */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 1.05, 30]}>
          <boxGeometry args={[10, 0.1, 40]} />
          <meshStandardMaterial color={RUNWAY} roughness={0.7} />
        </mesh>
      </RigidBody>
      {/* Runway stripes */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={`stripe-${i}`} position={[0, 1.11, 14 + i * 5]}>
          <boxGeometry args={[1, 0.02, 2.5]} />
          <meshStandardMaterial color="#ddd" roughness={0.7} />
        </mesh>
      ))}
      {/* Runway lights */}
      {Array.from({ length: 10 }).map((_, i) => (
        <group key={`rl-${i}`}>
          <mesh position={[-5.5, 1.2, 12 + i * 4]}>
            <sphereGeometry args={[0.15, 4, 4]} />
            <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={2} />
          </mesh>
          <mesh position={[5.5, 1.2, 12 + i * 4]}>
            <sphereGeometry args={[0.15, 4, 4]} />
            <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={2} />
          </mesh>
        </group>
      ))}

      {/* ── Small gazebo ── */}
      <group position={[30, 1, 5]}>
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[3, 3, 0.15, 8]} />
          <meshStandardMaterial color={MANSION_ROOF} roughness={0.8} />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={`gaz-${i}`} position={[Math.cos(i * Math.PI / 3) * 2.5, 0.7, Math.sin(i * Math.PI / 3) * 2.5]}>
            <cylinderGeometry args={[0.1, 0.1, 1.5, 4]} />
            <meshStandardMaterial color="#ddd" roughness={0.5} />
          </mesh>
        ))}
      </group>

      {/* ── Helipad ── */}
      <mesh position={[-30, 1.06, 10]}>
        <cylinderGeometry args={[4, 4, 0.1, 12]} />
        <meshStandardMaterial color="#666" roughness={0.7} />
      </mesh>
      <mesh position={[-30, 1.12, 10]}>
        <cylinderGeometry args={[3.5, 3.5, 0.02, 12]} />
        <meshStandardMaterial color="#ffcc00" roughness={0.7} />
      </mesh>

      {/* ── YACHTS (docked at shore) ── */}
      {[
        { pos: [55, 0, 20] as const, rot: 0.3 },
        { pos: [-50, 0, 30] as const, rot: -0.2 },
        { pos: [40, 0, -35] as const, rot: 1.2 },
      ].map((yacht, i) => (
        <group key={`yacht-${i}`} position={[yacht.pos[0], yacht.pos[1], yacht.pos[2]]} rotation={[0, yacht.rot, 0]}>
          {/* Hull */}
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[2.5, 1, 8]} />
            <meshStandardMaterial color="#fff" roughness={0.4} />
          </mesh>
          {/* Hull bottom (darker) */}
          <mesh position={[0, -0.2, 0]}>
            <boxGeometry args={[2.2, 0.5, 7.5]} />
            <meshStandardMaterial color="#1a3050" roughness={0.6} />
          </mesh>
          {/* Cabin */}
          <mesh position={[0, 1.2, -0.5]}>
            <boxGeometry args={[2, 1, 3]} />
            <meshStandardMaterial color="#fff" roughness={0.4} />
          </mesh>
          {/* Cabin windows */}
          <mesh position={[0, 1.3, 1.05]}>
            <boxGeometry args={[1.6, 0.4, 0.05]} />
            <meshStandardMaterial color="#88ccee" roughness={0.2} metalness={0.4} />
          </mesh>
          {/* Sun deck */}
          <mesh position={[0, 0.85, 2.5]}>
            <boxGeometry args={[2.2, 0.1, 2.5]} />
            <meshStandardMaterial color="#ddc890" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* ── GOLF GREEN (small) ── */}
      <mesh position={[35, 1.06, -5]}>
        <cylinderGeometry args={[5, 5, 0.1, 12]} />
        <meshStandardMaterial color="#2a8a2a" roughness={0.9} />
      </mesh>
      {/* Golf flag */}
      <mesh position={[35, 2, -5]}>
        <cylinderGeometry args={[0.02, 0.02, 2, 4]} />
        <meshStandardMaterial color="#ddd" roughness={0.5} />
      </mesh>
      <mesh position={[35.15, 2.8, -5]}>
        <boxGeometry args={[0.3, 0.2, 0.01]} />
        <meshStandardMaterial color="#cc2222" roughness={0.7} />
      </mesh>
    </group>
  );
}

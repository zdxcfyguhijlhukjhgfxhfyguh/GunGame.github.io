import { RigidBody } from '@react-three/rapier';
import { useMemo } from 'react';
import * as THREE from 'three';

// Nuketown BO2 faithful layout — properly scaled
// Player eye height ~1.7m, houses ~7m tall, bus ~3m tall, cars ~1.5m
// Teal house LEFT (X-), Yellow house RIGHT (X+)
// Cul-de-sac road through center

const WALL = { roughness: 0.85, metalness: 0.05 };
const CONCRETE = { roughness: 0.9, metalness: 0.1 };

export function NuketownMap() {
  return (
    <group>
      <DesertGround />
      <Road />
      <CulDeSac />

      <TealHouse />
      <YellowHouse />

      <BackGarage />
      <PinkBuilding />

      <SchoolBus />
      <MovingTruck />
      <RedTruck />
      <DrivewayCarLeft />
      <DrivewayCarRight />

      <GrassLawns />
      <Hedges />
      <Fences />

      <Barriers />
      <PowerPoles />
      <RadioTower />
      <SmallProps />

      <DesertRoads />
      <GrandStaircase />
    </group>
  );
}

// ─── TERRAIN ───────────────────────────────────────────

function DesertGround() {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh receiveShadow position={[0, -0.5, 0]}>
        <boxGeometry args={[600, 1, 600]} />
        <meshStandardMaterial color="#c4a86a" roughness={0.95} metalness={0.05} />
      </mesh>
    </RigidBody>
  );
}

function Road() {
  return (
    <group>
      {/* Main road surface */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[0, 0.02, 0]}>
          <boxGeometry args={[18, 0.04, 65]} />
          <meshStandardMaterial color="#555" roughness={0.92} metalness={0.08} />
        </mesh>
      </RigidBody>

      {/* Sidewalk left */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[-10.5, 0.08, 0]}>
          <boxGeometry args={[3, 0.16, 65]} />
          <meshStandardMaterial color="#aaa" {...CONCRETE} />
        </mesh>
      </RigidBody>

      {/* Sidewalk right */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[10.5, 0.08, 0]}>
          <boxGeometry args={[3, 0.16, 65]} />
          <meshStandardMaterial color="#aaa" {...CONCRETE} />
        </mesh>
      </RigidBody>

      {/* Center dashed line */}
      {[-24, -20, -16, -12, -8, -4, 0, 4, 8, 12, 16, 20, 24].map((z, i) => (
        <mesh key={`dash-${i}`} position={[0, 0.05, z]} receiveShadow>
          <boxGeometry args={[0.2, 0.01, 2.5]} />
          <meshStandardMaterial color="#ddd" roughness={0.8} />
        </mesh>
      ))}

      {/* Curbs */}
      <mesh position={[-9, 0.12, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.25, 0.24, 65]} />
        <meshStandardMaterial color="#bbb" {...CONCRETE} />
      </mesh>
      <mesh position={[9, 0.12, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.25, 0.24, 65]} />
        <meshStandardMaterial color="#bbb" {...CONCRETE} />
      </mesh>
    </group>
  );
}

function CulDeSac() {
  return (
    <group position={[0, 0.03, 0]}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[13, 48]} />
        <meshStandardMaterial color="#555" roughness={0.92} metalness={0.08} />
      </mesh>
      {/* Curb ring */}
      <mesh position={[0, 0.1, 0]} receiveShadow castShadow rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.5, 5, 48]} />
        <meshStandardMaterial color="#bbb" {...CONCRETE} />
      </mesh>
      {/* Center grass island */}
      <mesh position={[0, 0.06, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.5, 48]} />
        <meshStandardMaterial color="#4a8a3a" roughness={0.95} />
      </mesh>
    </group>
  );
}

// ─── TEAL HOUSE (LEFT SIDE) ────────────────────────────

function TealHouse() {
  const teal = '#3ab5a8';
  const white = '#e8e8e0';
  const roof = '#6a6a7a';
  const trim = '#2a8a80';

  // House: ~12m wide, 7m tall, 10m deep
  return (
    <group position={[-24, 0, -5]}>
      {/* Front wall (facing road) */}
      <Wall pos={[6, 3.5, 0]} size={[0.35, 7, 12]} color={teal} />
      {/* Back wall */}
      <Wall pos={[-6, 3.5, 0]} size={[0.35, 7, 12]} color={teal} />
      {/* Side walls */}
      <Wall pos={[0, 3.5, -6]} size={[12, 7, 0.35]} color={white} />
      <Wall pos={[0, 3.5, 6]} size={[12, 7, 0.35]} color={white} />

      {/* White upper / teal lower bands on front */}
      <mesh position={[6.19, 5.2, 0]}>
        <boxGeometry args={[0.02, 2, 12]} />
        <meshStandardMaterial color={white} roughness={0.8} />
      </mesh>
      <mesh position={[6.19, 2, 0]}>
        <boxGeometry args={[0.02, 4, 12]} />
        <meshStandardMaterial color={teal} roughness={0.8} />
      </mesh>

      {/* Roof base */}
      <Wall pos={[0, 7, 0]} size={[13, 0.35, 13]} color={roof} />
      {/* Roof peak */}
      <mesh position={[0, 8, 0]} castShadow>
        <boxGeometry args={[8, 0.35, 13]} />
        <meshStandardMaterial color={roof} roughness={0.8} metalness={0.1} />
      </mesh>
      {/* Roof slopes (visual) */}
      <mesh position={[4.5, 7.5, 0]} rotation={[0, 0, -0.35]} castShadow>
        <boxGeometry args={[5, 0.15, 13]} />
        <meshStandardMaterial color={roof} roughness={0.8} />
      </mesh>
      <mesh position={[-4.5, 7.5, 0]} rotation={[0, 0, 0.35]} castShadow>
        <boxGeometry args={[5, 0.15, 13]} />
        <meshStandardMaterial color={roof} roughness={0.8} />
      </mesh>

      {/* Front door */}
      <mesh position={[6.2, 1.3, 0]} castShadow>
        <boxGeometry args={[0.08, 2.5, 1.3]} />
        <meshStandardMaterial color={trim} roughness={0.6} />
      </mesh>
      {/* Door frame */}
      <mesh position={[6.22, 1.3, 0]}>
        <boxGeometry args={[0.04, 2.7, 1.5]} />
        <meshStandardMaterial color="#ddd" roughness={0.7} />
      </mesh>

      {/* Windows - front, ground floor */}
      <Window pos={[6.2, 1.5, -3]} size={[1.4, 1.2]} />
      <Window pos={[6.2, 1.5, 3]} size={[1.4, 1.2]} />
      {/* Windows - front, upper floor */}
      <Window pos={[6.2, 4.5, -3]} size={[1.4, 1.4]} />
      <Window pos={[6.2, 4.5, 0]} size={[1.2, 1.2]} />
      <Window pos={[6.2, 4.5, 3]} size={[1.4, 1.4]} />
      {/* Windows - sides */}
      <WindowSide pos={[0, 4.5, -6.2]} size={[1.4, 1.4]} />
      <WindowSide pos={[-3, 1.5, -6.2]} size={[1.2, 1.2]} />
      <WindowSide pos={[3, 1.5, 6.2]} size={[1.2, 1.2]} />

      {/* Front porch */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[8.5, 0.2, 0]} receiveShadow castShadow>
          <boxGeometry args={[5, 0.35, 8]} />
          <meshStandardMaterial color="#999" {...CONCRETE} />
        </mesh>
      </RigidBody>
      {/* Porch step */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[10.8, 0.1, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.8, 0.2, 4]} />
          <meshStandardMaterial color="#888" {...CONCRETE} />
        </mesh>
      </RigidBody>

      {/* Porch pillars */}
      {[-3.5, 3.5].map((z, i) => (
        <mesh key={`tp-${i}`} position={[10.5, 2.5, z]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 4.8, 8]} />
          <meshStandardMaterial color="#ddd" roughness={0.7} />
        </mesh>
      ))}
      {/* Porch roof */}
      <mesh position={[9, 5, 0]} castShadow>
        <boxGeometry args={[6, 0.18, 9]} />
        <meshStandardMaterial color={roof} roughness={0.8} />
      </mesh>

      {/* Chimney */}
      <mesh position={[-3, 9, 4]} castShadow>
        <boxGeometry args={[1.2, 2.5, 1]} />
        <meshStandardMaterial color="#7a5a4a" roughness={0.9} />
      </mesh>

      {/* Interior floor (second story) */}
      <mesh position={[0, 3.5, 0]}>
        <boxGeometry args={[11.6, 0.2, 11.6]} />
        <meshStandardMaterial color="#8a7a6a" roughness={0.9} />
      </mesh>

      {/* Gutters */}
      <mesh position={[6.3, 6.9, 0]} castShadow>
        <boxGeometry args={[0.08, 0.12, 12.5]} />
        <meshStandardMaterial color="#aaa" roughness={0.4} metalness={0.5} />
      </mesh>
    </group>
  );
}

// ─── YELLOW HOUSE (RIGHT SIDE) ─────────────────────────

function YellowHouse() {
  const yellow = '#d4c84a';
  const yellowLight = '#e8dc6a';
  const roof = '#6a6a7a';
  const trim = '#b8a830';

  return (
    <group position={[24, 0, -5]}>
      {/* Front wall (facing road) */}
      <Wall pos={[-6, 3.5, 0]} size={[0.35, 7, 12]} color={yellow} />
      {/* Back wall */}
      <Wall pos={[6, 3.5, 0]} size={[0.35, 7, 12]} color={yellow} />
      {/* Side walls */}
      <Wall pos={[0, 3.5, -6]} size={[12, 7, 0.35]} color={yellowLight} />
      <Wall pos={[0, 3.5, 6]} size={[12, 7, 0.35]} color={yellowLight} />

      {/* Roof */}
      <Wall pos={[0, 7, 0]} size={[13, 0.35, 13]} color={roof} />
      <mesh position={[0, 8, 0]} castShadow>
        <boxGeometry args={[8, 0.35, 13]} />
        <meshStandardMaterial color={roof} roughness={0.8} metalness={0.1} />
      </mesh>
      <mesh position={[4.5, 7.5, 0]} rotation={[0, 0, -0.35]} castShadow>
        <boxGeometry args={[5, 0.15, 13]} />
        <meshStandardMaterial color={roof} roughness={0.8} />
      </mesh>
      <mesh position={[-4.5, 7.5, 0]} rotation={[0, 0, 0.35]} castShadow>
        <boxGeometry args={[5, 0.15, 13]} />
        <meshStandardMaterial color={roof} roughness={0.8} />
      </mesh>

      {/* Front door */}
      <mesh position={[-6.2, 1.3, 1]}>
        <boxGeometry args={[0.08, 2.5, 1.3]} />
        <meshStandardMaterial color={trim} roughness={0.6} />
      </mesh>
      <mesh position={[-6.22, 1.3, 1]}>
        <boxGeometry args={[0.04, 2.7, 1.5]} />
        <meshStandardMaterial color="#ddd" roughness={0.7} />
      </mesh>

      {/* Windows - front */}
      <WindowFlip pos={[-6.2, 1.5, -3]} size={[1.4, 1.2]} />
      <WindowFlip pos={[-6.2, 4.5, -3]} size={[1.4, 1.4]} />
      <WindowFlip pos={[-6.2, 4.5, 1]} size={[1.2, 1.2]} />
      <WindowFlip pos={[-6.2, 4.5, 4]} size={[1.4, 1.4]} />
      {/* Side windows */}
      <WindowSide pos={[0, 4.5, -6.2]} size={[1.4, 1.4]} />
      <WindowSide pos={[3, 1.5, 6.2]} size={[1.2, 1.2]} />

      {/* Front porch */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-8.5, 0.2, 0.5]} receiveShadow castShadow>
          <boxGeometry args={[5, 0.35, 8]} />
          <meshStandardMaterial color="#999" {...CONCRETE} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-10.8, 0.1, 0.5]} receiveShadow castShadow>
          <boxGeometry args={[0.8, 0.2, 4]} />
          <meshStandardMaterial color="#888" {...CONCRETE} />
        </mesh>
      </RigidBody>
      {[-3, 4].map((z, i) => (
        <mesh key={`yp-${i}`} position={[-10.5, 2.5, z]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 4.8, 8]} />
          <meshStandardMaterial color="#ddd" roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[-9, 5, 0.5]} castShadow>
        <boxGeometry args={[6, 0.18, 9]} />
        <meshStandardMaterial color={roof} roughness={0.8} />
      </mesh>

      {/* Attached garage */}
      <Wall pos={[0, 2.5, 9]} size={[10, 5, 0.35]} color={yellowLight} />
      <Wall pos={[-4.5, 2.5, 12]} size={[0.35, 5, 6]} color={yellow} />
      <mesh position={[0, 5.1, 12]} castShadow>
        <boxGeometry args={[10, 0.25, 6]} />
        <meshStandardMaterial color={roof} roughness={0.8} />
      </mesh>
      {/* Garage door */}
      <mesh position={[-6.2, 1.8, 12]}>
        <boxGeometry args={[0.08, 3.2, 5]} />
        <meshStandardMaterial color="#ddc860" roughness={0.7} />
      </mesh>
      {/* Garage door lines */}
      {[0.6, 1.4, 2.2, 3].map((y, i) => (
        <mesh key={`gd-${i}`} position={[-6.25, y, 12]}>
          <boxGeometry args={[0.02, 0.03, 4.8]} />
          <meshStandardMaterial color="#c4b040" roughness={0.8} />
        </mesh>
      ))}

      {/* Chimney */}
      <mesh position={[3, 9, -3]} castShadow>
        <boxGeometry args={[1.2, 2.5, 1]} />
        <meshStandardMaterial color="#7a5a4a" roughness={0.9} />
      </mesh>

      {/* Interior floor */}
      <mesh position={[0, 3.5, 0]}>
        <boxGeometry args={[11.6, 0.2, 11.6]} />
        <meshStandardMaterial color="#8a7a6a" roughness={0.9} />
      </mesh>

      {/* Gutters */}
      <mesh position={[-6.3, 6.9, 0]} castShadow>
        <boxGeometry args={[0.08, 0.12, 12.5]} />
        <meshStandardMaterial color="#aaa" roughness={0.4} metalness={0.5} />
      </mesh>
    </group>
  );
}

// ─── WINDOWS ───────────────────────────────────────────

function Window({ pos, size }: { pos: [number, number, number]; size: [number, number] }) {
  return (
    <group>
      <mesh position={pos}>
        <boxGeometry args={[0.08, size[1], size[0]]} />
        <meshStandardMaterial color="#4a7aaa" roughness={0.05} metalness={0.3} transparent opacity={0.35} />
      </mesh>
      {/* Frame */}
      <mesh position={[pos[0] + 0.01, pos[1], pos[2]]}>
        <boxGeometry args={[0.04, size[1] + 0.12, size[0] + 0.12]} />
        <meshStandardMaterial color="#ddd" roughness={0.7} />
      </mesh>
      {/* Cross bars */}
      <mesh position={[pos[0] + 0.02, pos[1], pos[2]]}>
        <boxGeometry args={[0.03, size[1], 0.05]} />
        <meshStandardMaterial color="#ddd" roughness={0.7} />
      </mesh>
      <mesh position={[pos[0] + 0.02, pos[1], pos[2]]}>
        <boxGeometry args={[0.03, 0.05, size[0]]} />
        <meshStandardMaterial color="#ddd" roughness={0.7} />
      </mesh>
    </group>
  );
}

function WindowFlip({ pos, size }: { pos: [number, number, number]; size: [number, number] }) {
  return (
    <group>
      <mesh position={pos}>
        <boxGeometry args={[0.08, size[1], size[0]]} />
        <meshStandardMaterial color="#4a7aaa" roughness={0.05} metalness={0.3} transparent opacity={0.35} />
      </mesh>
      <mesh position={[pos[0] - 0.01, pos[1], pos[2]]}>
        <boxGeometry args={[0.04, size[1] + 0.12, size[0] + 0.12]} />
        <meshStandardMaterial color="#ddd" roughness={0.7} />
      </mesh>
      <mesh position={[pos[0] - 0.02, pos[1], pos[2]]}>
        <boxGeometry args={[0.03, size[1], 0.05]} />
        <meshStandardMaterial color="#ddd" roughness={0.7} />
      </mesh>
      <mesh position={[pos[0] - 0.02, pos[1], pos[2]]}>
        <boxGeometry args={[0.03, 0.05, size[0]]} />
        <meshStandardMaterial color="#ddd" roughness={0.7} />
      </mesh>
    </group>
  );
}

function WindowSide({ pos, size }: { pos: [number, number, number]; size: [number, number] }) {
  return (
    <group>
      <mesh position={pos}>
        <boxGeometry args={[size[0], size[1], 0.08]} />
        <meshStandardMaterial color="#4a7aaa" roughness={0.05} metalness={0.3} transparent opacity={0.35} />
      </mesh>
      <mesh position={[pos[0], pos[1], pos[2] + Math.sign(pos[2]) * 0.01]}>
        <boxGeometry args={[size[0] + 0.12, size[1] + 0.12, 0.04]} />
        <meshStandardMaterial color="#ddd" roughness={0.7} />
      </mesh>
    </group>
  );
}

// ─── BACK STRUCTURES ───────────────────────────────────

function BackGarage() {
  return (
    <group position={[14, 0, -26]}>
      <Wall pos={[0, 3.5, -4]} size={[14, 7, 0.35]} color="#8a8a7a" />
      <Wall pos={[-7, 3.5, 0]} size={[0.35, 7, 8]} color="#7a7a6a" />
      <Wall pos={[7, 3.5, 0]} size={[0.35, 7, 8]} color="#7a7a6a" />
      <mesh position={[0, 7, 0]} castShadow>
        <boxGeometry args={[14.5, 0.25, 8.5]} />
        <meshStandardMaterial color="#5a5a6a" roughness={0.8} metalness={0.15} />
      </mesh>
      {/* Corrugated roof lines */}
      {[-5, -3, -1, 1, 3, 5].map((x, i) => (
        <mesh key={`cr-${i}`} position={[x, 7.15, 0]} castShadow>
          <boxGeometry args={[0.15, 0.06, 8.5]} />
          <meshStandardMaterial color="#666" roughness={0.7} metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function PinkBuilding() {
  return (
    <group position={[-14, 0, -26]}>
      <Wall pos={[0, 3.5, 0]} size={[12, 7, 8]} color="#d4a0a0" />
      <mesh position={[0, 1.8, 4.03]} castShadow>
        <boxGeometry args={[5, 3.5, 0.08]} />
        <meshStandardMaterial color="#aa2222" roughness={0.6} />
      </mesh>
      {/* Garage door panel lines */}
      {[0.6, 1.4, 2.2, 3].map((y, i) => (
        <mesh key={`pd-${i}`} position={[0, y, 4.07]}>
          <boxGeometry args={[4.8, 0.04, 0.02]} />
          <meshStandardMaterial color="#881111" roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 7.15, 0]} castShadow>
        <boxGeometry args={[12.5, 0.2, 8.5]} />
        <meshStandardMaterial color="#6a6a7a" roughness={0.8} />
      </mesh>
    </group>
  );
}

// ─── VEHICLES ──────────────────────────────────────────

function SchoolBus() {
  return (
    <group position={[-4, 0, 3]} rotation={[0, 0.25, 0]}>
      {/* Main body */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[3, 3, 10]} />
          <meshStandardMaterial color="#e8b830" roughness={0.45} metalness={0.15} />
        </mesh>
      </RigidBody>

      {/* Roof */}
      <mesh position={[0, 3.2, 0]} castShadow>
        <boxGeometry args={[3.1, 0.15, 10.1]} />
        <meshStandardMaterial color="#d0a020" roughness={0.5} metalness={0.2} />
      </mesh>

      {/* Black stripe bands */}
      <mesh position={[1.52, 1.6, 0]}>
        <boxGeometry args={[0.02, 0.35, 10]} />
        <meshStandardMaterial color="#111" roughness={0.8} />
      </mesh>
      <mesh position={[-1.52, 1.6, 0]}>
        <boxGeometry args={[0.02, 0.35, 10]} />
        <meshStandardMaterial color="#111" roughness={0.8} />
      </mesh>

      {/* Windows — both sides, more segments */}
      {[-3.5, -2.2, -0.9, 0.4, 1.7, 3].map((z, i) => (
        <group key={`bw-${i}`}>
          <mesh position={[1.52, 2.2, z]}>
            <boxGeometry args={[0.03, 1.1, 1.1]} />
            <meshStandardMaterial color="#4a7a9a" roughness={0.05} metalness={0.2} transparent opacity={0.3} />
          </mesh>
          <mesh position={[-1.52, 2.2, z]}>
            <boxGeometry args={[0.03, 1.1, 1.1]} />
            <meshStandardMaterial color="#4a7a9a" roughness={0.05} metalness={0.2} transparent opacity={0.3} />
          </mesh>
          {/* Window frames */}
          <mesh position={[1.53, 2.2, z]}>
            <boxGeometry args={[0.02, 1.2, 0.06]} />
            <meshStandardMaterial color="#222" roughness={0.8} />
          </mesh>
          <mesh position={[-1.53, 2.2, z]}>
            <boxGeometry args={[0.02, 1.2, 0.06]} />
            <meshStandardMaterial color="#222" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Windshield */}
      <mesh position={[0, 2.2, -5.02]}>
        <boxGeometry args={[2.6, 1.5, 0.04]} />
        <meshStandardMaterial color="#6a9aba" roughness={0.05} metalness={0.2} transparent opacity={0.3} />
      </mesh>
      {/* Windshield frame */}
      <mesh position={[0, 2.2, -5.04]}>
        <boxGeometry args={[2.8, 1.7, 0.02]} />
        <meshStandardMaterial color="#222" roughness={0.8} />
      </mesh>

      {/* Front bumper */}
      <mesh position={[0, 0.4, -5.3]} castShadow>
        <boxGeometry args={[2.8, 0.5, 0.4]} />
        <meshStandardMaterial color="#333" roughness={0.6} metalness={0.5} />
      </mesh>
      {/* Grille */}
      <mesh position={[0, 0.9, -5.05]} castShadow>
        <boxGeometry args={[2.4, 0.6, 0.08]} />
        <meshStandardMaterial color="#444" roughness={0.5} metalness={0.6} />
      </mesh>

      {/* Headlights */}
      {[-1, 1].map((s, i) => (
        <mesh key={`hl-${i}`} position={[s, 0.9, -5.12]}>
          <cylinderGeometry args={[0.18, 0.18, 0.06, 12]} />
          <meshStandardMaterial color="#ffffcc" emissive="#ffff66" emissiveIntensity={0.15} roughness={0.1} />
        </mesh>
      ))}

      {/* Wheels — detailed */}
      {[-3.5, 3.5].map((z, i) => (
        <group key={`busw-${i}`}>
          {[-1.6, 1.6].map((x, j) => (
            <group key={`w-${j}`} position={[x, 0.5, z]}>
              <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.5, 0.5, 0.3, 16]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
              </mesh>
              {/* Hubcap */}
              <mesh position={[Math.sign(x) * 0.16, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.2, 0.2, 0.02, 12]} />
                <meshStandardMaterial color="#888" roughness={0.3} metalness={0.7} />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      {/* Stop sign arm */}
      <mesh position={[-1.55, 2.2, -2]} castShadow>
        <boxGeometry args={[0.6, 0.5, 0.04]} />
        <meshStandardMaterial color="#cc0000" roughness={0.5} />
      </mesh>

      {/* Rear lights */}
      {[-1, 1].map((s, i) => (
        <mesh key={`rl-${i}`} position={[s, 1.2, 5.02]}>
          <boxGeometry args={[0.4, 0.25, 0.04]} />
          <meshStandardMaterial color="#aa0000" roughness={0.4} emissive="#550000" emissiveIntensity={0.1} />
        </mesh>
      ))}

      {/* Mirror mounts */}
      {[-1.6, 1.6].map((x, i) => (
        <group key={`mir-${i}`} position={[x, 2.5, -4.5]}>
          <mesh castShadow>
            <boxGeometry args={[0.15, 0.3, 0.04]} />
            <meshStandardMaterial color="#222" roughness={0.5} metalness={0.6} />
          </mesh>
          <mesh position={[Math.sign(x) * 0.12, 0, 0]}>
            <boxGeometry args={[0.02, 0.2, 0.15]} />
            <meshStandardMaterial color="#aaa" roughness={0.2} metalness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function MovingTruck() {
  return (
    <group position={[12, 0, 6]} rotation={[0, -0.15, 0]}>
      {/* Cab */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 1.5, -4.5]} castShadow receiveShadow>
          <boxGeometry args={[3, 2.8, 4]} />
          <meshStandardMaterial color="#ddd" roughness={0.5} metalness={0.2} />
        </mesh>
      </RigidBody>
      {/* Cab windshield */}
      <mesh position={[0, 2, -6.52]}>
        <boxGeometry args={[2.4, 1.3, 0.04]} />
        <meshStandardMaterial color="#5a8aaa" roughness={0.05} metalness={0.2} transparent opacity={0.35} />
      </mesh>
      {/* Cab side windows */}
      {[-1.52, 1.52].map((x, i) => (
        <mesh key={`csw-${i}`} position={[x, 2, -4.5]}>
          <boxGeometry args={[0.04, 1, 2.5]} />
          <meshStandardMaterial color="#5a8aaa" roughness={0.05} transparent opacity={0.3} />
        </mesh>
      ))}

      {/* Box body */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 2.2, 0.5]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 4, 7]} />
          <meshStandardMaterial color="#eee" roughness={0.6} metalness={0.1} />
        </mesh>
      </RigidBody>
      {/* Box roof */}
      <mesh position={[0, 4.25, 0.5]} castShadow>
        <boxGeometry args={[3.3, 0.12, 7.1]} />
        <meshStandardMaterial color="#ddd" roughness={0.5} />
      </mesh>
      {/* Roll-up door */}
      <mesh position={[0, 1.8, 4.02]} castShadow>
        <boxGeometry args={[2.8, 3.2, 0.06]} />
        <meshStandardMaterial color="#ccc" roughness={0.7} metalness={0.3} />
      </mesh>
      {/* Door panel lines */}
      {[0.6, 1.2, 1.8, 2.4, 3].map((y, i) => (
        <mesh key={`tdl-${i}`} position={[0, y, 4.06]}>
          <boxGeometry args={[2.7, 0.03, 0.02]} />
          <meshStandardMaterial color="#bbb" roughness={0.7} />
        </mesh>
      ))}

      {/* Wheels */}
      {[-4.5, 1.5].map((z, i) => (
        <group key={`tw-${i}`}>
          {[-1.7, 1.7].map((x, j) => (
            <group key={`tww-${j}`} position={[x, 0.45, z]}>
              <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.45, 0.45, 0.25, 14]} />
                <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
              </mesh>
              <mesh position={[Math.sign(x) * 0.14, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.18, 0.18, 0.02, 10]} />
                <meshStandardMaterial color="#777" roughness={0.3} metalness={0.7} />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      {/* Headlights */}
      {[-1, 1].map((s, i) => (
        <mesh key={`thl-${i}`} position={[s, 1.3, -6.55]}>
          <cylinderGeometry args={[0.15, 0.15, 0.04, 10]} />
          <meshStandardMaterial color="#ffffcc" emissive="#ffff44" emissiveIntensity={0.1} />
        </mesh>
      ))}
    </group>
  );
}

function RedTruck() {
  return (
    <group position={[5, 0, -18]} rotation={[0, 0.5, 0]}>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 3, 6]} />
          <meshStandardMaterial color="#aa3322" roughness={0.45} metalness={0.3} />
        </mesh>
      </RigidBody>
      <mesh position={[0, 3.2, 0]} castShadow>
        <boxGeometry args={[3.3, 0.15, 6.1]} />
        <meshStandardMaterial color="#882211" roughness={0.6} />
      </mesh>
      <mesh position={[0, 2.2, -3.03]}>
        <boxGeometry args={[2.6, 1.2, 0.04]} />
        <meshStandardMaterial color="#5a7a9a" roughness={0.05} transparent opacity={0.35} />
      </mesh>
      <mesh position={[0, 0.6, -3.3]} castShadow>
        <boxGeometry args={[3, 0.7, 0.4]} />
        <meshStandardMaterial color="#555" roughness={0.6} metalness={0.5} />
      </mesh>
      {/* Exhaust stacks */}
      {[-1.5, 1.5].map((x, i) => (
        <mesh key={`ex-${i}`} position={[x, 3, 1]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 2, 8]} />
          <meshStandardMaterial color="#444" roughness={0.4} metalness={0.8} />
        </mesh>
      ))}
      {/* Grille */}
      <mesh position={[0, 1.2, -3.05]} castShadow>
        <boxGeometry args={[2.4, 1, 0.08]} />
        <meshStandardMaterial color="#555" roughness={0.5} metalness={0.6} />
      </mesh>
      {/* Grille slats */}
      {[-0.3, 0, 0.3].map((y, i) => (
        <mesh key={`gs-${i}`} position={[0, 1 + y, -3.1]}>
          <boxGeometry args={[2.2, 0.04, 0.02]} />
          <meshStandardMaterial color="#666" roughness={0.4} metalness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function DrivewayCarLeft() {
  return <Car pos={[-15, 0, 3]} rot={0.1} color="#8a8a7a" />;
}

function DrivewayCarRight() {
  return <Car pos={[15, 0, 4]} rot={-0.15} color="#4a5a6a" />;
}

function Car({ pos, rot, color }: { pos: [number, number, number]; rot: number; color: string }) {
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      <RigidBody type="fixed" colliders="cuboid">
        <group>
          {/* Body */}
          <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.2, 1, 5]} />
            <meshStandardMaterial color={color} roughness={0.35} metalness={0.45} />
          </mesh>
          {/* Cabin */}
          <mesh position={[0, 1.35, -0.3]} castShadow>
            <boxGeometry args={[2, 0.75, 2.6]} />
            <meshStandardMaterial color={color} roughness={0.3} metalness={0.45} />
          </mesh>
          {/* Windshield */}
          <mesh position={[0, 1.35, -1.62]}>
            <boxGeometry args={[1.7, 0.6, 0.04]} />
            <meshStandardMaterial color="#4a6a8a" roughness={0.05} transparent opacity={0.35} />
          </mesh>
          {/* Side windows */}
          {[-1.02, 1.02].map((x, i) => (
            <mesh key={`sw-${i}`} position={[x, 1.35, -0.3]}>
              <boxGeometry args={[0.03, 0.55, 2.2]} />
              <meshStandardMaterial color="#4a6a8a" roughness={0.05} transparent opacity={0.35} />
            </mesh>
          ))}
          {/* Rear window */}
          <mesh position={[0, 1.35, 0.92]}>
            <boxGeometry args={[1.7, 0.55, 0.04]} />
            <meshStandardMaterial color="#4a6a8a" roughness={0.05} transparent opacity={0.35} />
          </mesh>
          {/* Headlights */}
          {[-0.8, 0.8].map((x, i) => (
            <mesh key={`chl-${i}`} position={[x, 0.7, -2.52]}>
              <cylinderGeometry args={[0.12, 0.12, 0.03, 10]} />
              <meshStandardMaterial color="#ffffcc" emissive="#ffff66" emissiveIntensity={0.08} />
            </mesh>
          ))}
          {/* Taillights */}
          {[-0.8, 0.8].map((x, i) => (
            <mesh key={`ctl-${i}`} position={[x, 0.7, 2.52]}>
              <boxGeometry args={[0.3, 0.15, 0.03]} />
              <meshStandardMaterial color="#aa0000" roughness={0.4} />
            </mesh>
          ))}
          {/* Wheels */}
          {[-1.5, 1.5].map((z, i) => (
            <group key={`cw-${i}`}>
              {[-1.15, 1.15].map((x, j) => (
                <group key={`cww-${j}`} position={[x, 0.3, z]}>
                  <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                    <cylinderGeometry args={[0.35, 0.35, 0.2, 14]} />
                    <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
                  </mesh>
                  <mesh position={[Math.sign(x) * 0.11, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.14, 0.14, 0.02, 10]} />
                    <meshStandardMaterial color="#888" roughness={0.3} metalness={0.7} />
                  </mesh>
                </group>
              ))}
            </group>
          ))}
          {/* Bumpers */}
          <mesh position={[0, 0.3, -2.6]} castShadow>
            <boxGeometry args={[2, 0.2, 0.15]} />
            <meshStandardMaterial color="#555" roughness={0.5} metalness={0.5} />
          </mesh>
          <mesh position={[0, 0.3, 2.6]} castShadow>
            <boxGeometry args={[2, 0.2, 0.15]} />
            <meshStandardMaterial color="#555" roughness={0.5} metalness={0.5} />
          </mesh>
        </group>
      </RigidBody>
    </group>
  );
}

// ─── VEGETATION ────────────────────────────────────────

function GrassLawns() {
  return (
    <group>
      <Lawn pos={[-18, 0.02, 1]} size={[10, 18]} />
      <Lawn pos={[-26, 0.02, -15]} size={[12, 10]} />
      <Lawn pos={[18, 0.02, 1]} size={[10, 18]} />
      <Lawn pos={[26, 0.02, -15]} size={[12, 10]} />
      <Lawn pos={[-12, 0.015, 18]} size={[8, 10]} />
      <Lawn pos={[12, 0.015, 18]} size={[8, 10]} />
      <Lawn pos={[-12, 0.015, -20]} size={[6, 8]} />
      <Lawn pos={[12, 0.015, -20]} size={[6, 8]} />
    </group>
  );
}

function Lawn({ pos, size }: { pos: [number, number, number]; size: [number, number] }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(size[0], size[1], Math.round(size[0] * 2), Math.round(size[1] * 2));
    // Slightly perturb vertices for natural look
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      (p as THREE.BufferAttribute).setZ(i, (Math.random() - 0.5) * 0.04);
    }
    g.computeVertexNormals();
    return g;
  }, [size[0], size[1]]);

  return (
    <mesh position={pos} rotation={[-Math.PI / 2, 0, 0]} receiveShadow geometry={geo}>
      <meshStandardMaterial color="#4a8a3a" roughness={0.95} />
    </mesh>
  );
}

function Hedges() {
  return (
    <group>
      <Hedge pos={[-16, 0.7, -4]} size={[0.7, 1.4, 6]} />
      <Hedge pos={[-16, 0.7, 6]} size={[0.7, 1.4, 5]} />
      <Hedge pos={[16, 0.7, -4]} size={[0.7, 1.4, 6]} />
      <Hedge pos={[16, 0.7, 6]} size={[0.7, 1.4, 5]} />
      <Hedge pos={[-30, 0.7, -3]} size={[4, 1.4, 0.7]} />
      <Hedge pos={[30, 0.7, -3]} size={[4, 1.4, 0.7]} />
      <Hedge pos={[-30, 0.9, -12]} size={[0.7, 1.7, 10]} />
      <Hedge pos={[30, 0.9, -12]} size={[0.7, 1.7, 10]} />
    </group>
  );
}

function Hedge({ pos, size }: { pos: [number, number, number]; size: [number, number, number] }) {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh position={pos} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#2a6a22" roughness={0.95} />
      </mesh>
    </RigidBody>
  );
}

function Fences() {
  return (
    <group>
      <WoodFence pos={[-24, 0, 28]} size={[24, 2.5, 0.18]} />
      <WoodFence pos={[24, 0, 28]} size={[24, 2.5, 0.18]} />
      <WoodFence pos={[-38, 0, 6]} size={[0.18, 2.5, 40]} />
      <WoodFence pos={[38, 0, 6]} size={[0.18, 2.5, 40]} />
      <WoodFence pos={[-28, 0, -20]} size={[14, 2.5, 0.18]} />
      <WoodFence pos={[28, 0, -20]} size={[14, 2.5, 0.18]} />

      {/* Chain link fence in front center */}
      <mesh position={[0, 0.85, 22]} castShadow>
        <boxGeometry args={[16, 1.7, 0.06]} />
        <meshStandardMaterial color="#777" roughness={0.5} metalness={0.6} transparent opacity={0.35} />
      </mesh>
      {[-8, -4, 0, 4, 8].map((x, i) => (
        <mesh key={`cfp-${i}`} position={[x, 0.95, 22]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 1.9, 6]} />
          <meshStandardMaterial color="#555" roughness={0.4} metalness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function WoodFence({ pos, size }: { pos: [number, number, number]; size: [number, number, number] }) {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh position={[pos[0], pos[1] + size[1] / 2, pos[2]]} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#9a7a4a" roughness={0.9} metalness={0.05} />
      </mesh>
    </RigidBody>
  );
}

// ─── BARRIERS ──────────────────────────────────────────

function Barriers() {
  return (
    <group>
      <SandbagWall pos={[0, 0, 20]} rot={0} />
      <SandbagWall pos={[-6, 0, 17]} rot={0.3} />
      <SandbagWall pos={[6, 0, 17]} rot={-0.3} />
      <SandbagWall pos={[-7, 0, -10]} rot={0.5} />
      <SandbagWall pos={[7, 0, -10]} rot={-0.5} />
      <JerseyBarrier pos={[-6, 0, 10]} rot={0.2} />
      <JerseyBarrier pos={[6, 0, -15]} rot={-0.2} />
      <CrateStack pos={[-11, 0, -12]} rot={0.4} />
      <CrateStack pos={[11, 0, 12]} rot={-0.3} />
    </group>
  );
}

function SandbagWall({ pos, rot }: { pos: [number, number, number]; rot: number }) {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={pos} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 0.8, 0.9]} />
        <meshStandardMaterial color="#8a7a5a" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.95, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.4, 0.75]} />
        <meshStandardMaterial color="#7a6a4a" roughness={0.95} />
      </mesh>
    </RigidBody>
  );
}

function JerseyBarrier({ pos, rot }: { pos: [number, number, number]; rot: number }) {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={pos} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 1.1, 0.6]} />
        <meshStandardMaterial color="#888" {...CONCRETE} />
      </mesh>
    </RigidBody>
  );
}

function CrateStack({ pos, rot }: { pos: [number, number, number]; rot: number }) {
  return (
    <RigidBody type="fixed" colliders="cuboid" position={pos} rotation={[0, rot, 0]}>
      <group>
        <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.2, 1.2, 1.2]} />
          <meshStandardMaterial color="#8a6a3a" roughness={0.85} />
        </mesh>
        <mesh position={[1.1, 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#7a5a2a" roughness={0.85} />
        </mesh>
        <mesh position={[0.4, 1.55, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.9, 0.9, 0.9]} />
          <meshStandardMaterial color="#8a6a3a" roughness={0.85} />
        </mesh>
      </group>
    </RigidBody>
  );
}

// ─── INFRASTRUCTURE ────────────────────────────────────

function PowerPoles() {
  return (
    <group>
      <PowerPole pos={[-10, 0, -8]} />
      <PowerPole pos={[10, 0, 8]} />
      <PowerPole pos={[-10, 0, 15]} />
      <PowerPole pos={[10, 0, -18]} />
    </group>
  );
}

function PowerPole({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh position={[0, 5, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.15, 10, 8]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 9.5, 0]} castShadow>
        <boxGeometry args={[4, 0.14, 0.14]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.9} />
      </mesh>
      {[-1.5, 0, 1.5].map((x, i) => (
        <mesh key={`ins-${i}`} position={[x, 9.8, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.4, 6]} />
          <meshStandardMaterial color="#4a6a5a" roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function RadioTower() {
  return (
    <group position={[-32, 0, -24]}>
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([x, z], i) => (
        <mesh key={`rtl-${i}`} position={[x * 1.2, 13, z * 1.2]} castShadow>
          <cylinderGeometry args={[0.08, 0.14, 26, 8]} />
          <meshStandardMaterial color="#888" roughness={0.4} metalness={0.7} />
        </mesh>
      ))}
      {[4, 8, 12, 16, 20, 24].map((y, i) => (
        <group key={`rtb-${i}`}>
          {[[-1.2, 0], [1.2, 0], [0, -1.2], [0, 1.2]].map(([x, z], j) => (
            <mesh key={`b-${j}`} position={[x, y, z]} castShadow>
              <boxGeometry args={[x === 0 ? 0.08 : 2.6, 0.08, z === 0 ? 0.08 : 2.6]} />
              <meshStandardMaterial color="#777" roughness={0.4} metalness={0.7} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 27, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 4, 6]} />
        <meshStandardMaterial color="#cc0000" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0, 29, 0]}>
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// ─── SMALL PROPS ───────────────────────────────────────

function SmallProps() {
  return (
    <group>
      <StreetLamp pos={[-9, 0, 6]} />
      <StreetLamp pos={[9, 0, -6]} />

      <TrashCan pos={[-17, 0, 10]} />
      <TrashCan pos={[17, 0, -10]} />
      <TrashCan pos={[-12, 0, -19]} />

      <FireHydrant pos={[-10.5, 0, 10]} />
      <FireHydrant pos={[10.5, 0, -12]} />

      <Mailbox pos={[-16, 0, 9]} />
      <Mailbox pos={[16, 0, -2]} />

      <Dumpster pos={[-10, 0, -28]} rot={0.3} />
      <TireStack pos={[19, 0, -25]} />

      {/* Trees — higher poly */}
      <Tree pos={[-34, 0, 10]} s={1.3} />
      <Tree pos={[34, 0, -10]} s={1.1} />
      <Tree pos={[32, 0, 15]} s={1} />
      <Tree pos={[-22, 0, -28]} s={1.2} />
      <Tree pos={[0, 0, -28]} s={0.9} />

      {/* Bushes */}
      <Bush pos={[-20, 0, 22]} s={0.9} />
      <Bush pos={[20, 0, 22]} s={0.8} />
      <Bush pos={[-34, 0, -18]} s={1} />
      <Bush pos={[34, 0, -18]} s={0.7} />
      <Bush pos={[-28, 0, 4]} s={0.6} />
      <Bush pos={[28, 0, 4]} s={0.65} />
    </group>
  );
}

function StreetLamp({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh position={[0, 3.5, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 7, 8]} />
        <meshStandardMaterial color="#555" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[0.6, 7.2, 0]} rotation={[0, 0, -0.4]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 1.8, 8]} />
        <meshStandardMaterial color="#555" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[1.1, 7.4, 0]} castShadow>
        <boxGeometry args={[0.4, 0.15, 0.25]} />
        <meshStandardMaterial color="#444" roughness={0.3} metalness={0.8} />
      </mesh>
      <pointLight position={[1.1, 7.2, 0]} intensity={0.3} distance={12} color="#ffeecc" />
    </group>
  );
}

function TrashCan({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.26, 1, 10]} />
        <meshStandardMaterial color="#555" roughness={0.7} metalness={0.3} />
      </mesh>
      <mesh position={[0, 1.03, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.32, 0.06, 10]} />
        <meshStandardMaterial color="#666" roughness={0.6} metalness={0.4} />
      </mesh>
    </group>
  );
}

function FireHydrant({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, 0.7, 10]} />
        <meshStandardMaterial color="#cc2222" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.75, 0]} castShadow>
        <sphereGeometry args={[0.14, 10, 8]} />
        <meshStandardMaterial color="#cc2222" roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0.14, 0.5, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.1, 8]} />
        <meshStandardMaterial color="#aa1111" roughness={0.5} metalness={0.5} />
      </mesh>
    </group>
  );
}

function Mailbox({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 1.1, 8]} />
        <meshStandardMaterial color="#666" roughness={0.5} metalness={0.6} />
      </mesh>
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[0.3, 0.25, 0.4]} />
        <meshStandardMaterial color="#2244aa" roughness={0.4} metalness={0.3} />
      </mesh>
    </group>
  );
}

function Dumpster({ pos, rot }: { pos: [number, number, number]; rot: number }) {
  return (
    <group position={pos} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 1.6, 1.5]} />
        <meshStandardMaterial color="#2a5a2a" roughness={0.7} metalness={0.3} />
      </mesh>
      <mesh position={[0, 1.65, -0.7]} rotation={[-0.3, 0, 0]} castShadow>
        <boxGeometry args={[2.4, 0.06, 1.5]} />
        <meshStandardMaterial color="#1a4a1a" roughness={0.6} metalness={0.4} />
      </mesh>
    </group>
  );
}

function TireStack({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      {[0, 0.28, 0.56].map((y, i) => (
        <mesh key={`t-${i}`} position={[0, 0.35 + y, 0]} rotation={[Math.PI / 2, 0, i * 0.3]} castShadow>
          <torusGeometry args={[0.35, 0.15, 10, 16]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Tree({ pos, s }: { pos: [number, number, number]; s: number }) {
  return (
    <group position={pos}>
      {/* Trunk — higher poly */}
      <mesh position={[0, s * 2, 0]} castShadow>
        <cylinderGeometry args={[0.12 * s, 0.22 * s, s * 4, 10]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.9} />
      </mesh>
      {/* Canopy — multiple overlapping spheres for volume */}
      <mesh position={[0, s * 4.5, 0]} castShadow>
        <sphereGeometry args={[s * 2.2, 12, 12]} />
        <meshStandardMaterial color="#3a6a2a" roughness={0.92} />
      </mesh>
      <mesh position={[s * 0.6, s * 5, s * 0.3]} castShadow>
        <sphereGeometry args={[s * 1.6, 10, 10]} />
        <meshStandardMaterial color="#2a5a1a" roughness={0.92} />
      </mesh>
      <mesh position={[-s * 0.5, s * 4.2, -s * 0.4]} castShadow>
        <sphereGeometry args={[s * 1.4, 10, 10]} />
        <meshStandardMaterial color="#3a7a2a" roughness={0.92} />
      </mesh>
      <mesh position={[s * 0.2, s * 5.5, -s * 0.2]} castShadow>
        <sphereGeometry args={[s * 1.2, 10, 10]} />
        <meshStandardMaterial color="#2a6a1a" roughness={0.92} />
      </mesh>
    </group>
  );
}

function Bush({ pos, s }: { pos: [number, number, number]; s: number }) {
  return (
    <group position={pos}>
      <mesh position={[0, s * 0.5, 0]} castShadow>
        <sphereGeometry args={[s * 0.8, 10, 8]} />
        <meshStandardMaterial color="#3a6a2a" roughness={0.95} />
      </mesh>
      <mesh position={[s * 0.4, s * 0.4, s * 0.2]} castShadow>
        <sphereGeometry args={[s * 0.5, 8, 6]} />
        <meshStandardMaterial color="#2a5a1a" roughness={0.95} />
      </mesh>
    </group>
  );
}

// ─── DESERT ROADS ──────────────────────────────────────

function DesertRoads() {
  return (
    <group>
      {/* Long road extending north */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[0, 0.02, -150]}>
          <boxGeometry args={[12, 0.04, 250]} />
          <meshStandardMaterial color="#555" roughness={0.92} metalness={0.08} />
        </mesh>
      </RigidBody>
      {/* Road markings north */}
      {Array.from({ length: 30 }, (_, i) => (
        <mesh key={`dn-${i}`} position={[0, 0.05, -40 - i * 8]} receiveShadow>
          <boxGeometry args={[0.2, 0.01, 4]} />
          <meshStandardMaterial color="#ddd" roughness={0.8} />
        </mesh>
      ))}

      {/* Long road extending south */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[0, 0.02, 150]}>
          <boxGeometry args={[12, 0.04, 250]} />
          <meshStandardMaterial color="#555" roughness={0.92} metalness={0.08} />
        </mesh>
      </RigidBody>
      {Array.from({ length: 30 }, (_, i) => (
        <mesh key={`ds-${i}`} position={[0, 0.05, 40 + i * 8]} receiveShadow>
          <boxGeometry args={[0.2, 0.01, 4]} />
          <meshStandardMaterial color="#ddd" roughness={0.8} />
        </mesh>
      ))}

      {/* Cross road extending east */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[150, 0.02, 0]}>
          <boxGeometry args={[250, 0.04, 12]} />
          <meshStandardMaterial color="#555" roughness={0.92} metalness={0.08} />
        </mesh>
      </RigidBody>

      {/* Cross road extending west */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[-150, 0.02, 0]}>
          <boxGeometry args={[250, 0.04, 12]} />
          <meshStandardMaterial color="#555" roughness={0.92} metalness={0.08} />
        </mesh>
      </RigidBody>

      {/* Scattered desert props along the roads */}
      {/* Power poles along north road */}
      {Array.from({ length: 8 }, (_, i) => (
        <DesertPowerPole key={`dpn-${i}`} pos={[8, 0, -50 - i * 30]} />
      ))}
      {/* Power poles along south road */}
      {Array.from({ length: 8 }, (_, i) => (
        <DesertPowerPole key={`dps-${i}`} pos={[-8, 0, 50 + i * 30]} />
      ))}

      {/* Rocks scattered in desert */}
      <Rock pos={[40, 0, -60]} s={2.5} />
      <Rock pos={[-55, 0, 40]} s={3} />
      <Rock pos={[80, 0, 20]} s={1.8} />
      <Rock pos={[-30, 0, -90]} s={2.2} />
      <Rock pos={[60, 0, 80]} s={2} />
      <Rock pos={[-80, 0, -50]} s={3.5} />
      <Rock pos={[100, 0, -30]} s={1.5} />
      <Rock pos={[-45, 0, 100]} s={2.8} />
      <Rock pos={[25, 0, -130]} s={2} />
      <Rock pos={[-70, 0, -120]} s={3.2} />

      {/* Dead trees */}
      <DeadTree pos={[50, 0, -40]} />
      <DeadTree pos={[-60, 0, 70]} />
      <DeadTree pos={[90, 0, -80]} />
      <DeadTree pos={[-40, 0, -70]} />
      <DeadTree pos={[30, 0, 110]} />

      {/* Cacti */}
      <Cactus pos={[35, 0, 50]} s={1.2} />
      <Cactus pos={[-50, 0, -30]} s={1} />
      <Cactus pos={[70, 0, -10]} s={1.4} />
      <Cactus pos={[-25, 0, 80]} s={0.9} />
      <Cactus pos={[55, 0, -100]} s={1.1} />
      <Cactus pos={[-90, 0, 20]} s={1.3} />
    </group>
  );
}

function DesertPowerPole({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh position={[0, 5, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.15, 10, 8]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.9} />
      </mesh>
      <mesh position={[0, 9.5, 0]} castShadow>
        <boxGeometry args={[3.5, 0.12, 0.12]} />
        <meshStandardMaterial color="#5a4a3a" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Rock({ pos, s }: { pos: [number, number, number]; s: number }) {
  return (
    <group position={pos}>
      <mesh position={[0, s * 0.3, 0]} castShadow receiveShadow>
        <dodecahedronGeometry args={[s, 1]} />
        <meshStandardMaterial color="#8a7a6a" roughness={0.95} metalness={0.05} />
      </mesh>
      <mesh position={[s * 0.6, s * 0.15, s * 0.3]} castShadow receiveShadow>
        <dodecahedronGeometry args={[s * 0.5, 1]} />
        <meshStandardMaterial color="#7a6a5a" roughness={0.95} />
      </mesh>
    </group>
  );
}

function DeadTree({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.15, 4, 6]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.95} />
      </mesh>
      <mesh position={[0.3, 3.2, 0]} rotation={[0, 0, -0.6]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 1.5, 5]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.95} />
      </mesh>
      <mesh position={[-0.2, 2.8, 0.1]} rotation={[0.3, 0, 0.5]} castShadow>
        <cylinderGeometry args={[0.03, 0.05, 1.2, 5]} />
        <meshStandardMaterial color="#5a3a1a" roughness={0.95} />
      </mesh>
    </group>
  );
}

function Cactus({ pos, s }: { pos: [number, number, number]; s: number }) {
  return (
    <group position={pos}>
      {/* Main trunk */}
      <mesh position={[0, s * 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.15 * s, 0.18 * s, s * 2.4, 8]} />
        <meshStandardMaterial color="#3a6a2a" roughness={0.85} />
      </mesh>
      {/* Right arm */}
      <mesh position={[0.2 * s, s * 1.5, 0]} rotation={[0, 0, -0.3]} castShadow>
        <cylinderGeometry args={[0.1 * s, 0.12 * s, s * 1, 7]} />
        <meshStandardMaterial color="#3a6a2a" roughness={0.85} />
      </mesh>
      <mesh position={[0.35 * s, s * 2.1, 0]} castShadow>
        <cylinderGeometry args={[0.08 * s, 0.1 * s, s * 0.8, 7]} />
        <meshStandardMaterial color="#3a6a2a" roughness={0.85} />
      </mesh>
      {/* Left arm */}
      <mesh position={[-0.2 * s, s * 1, 0]} rotation={[0, 0, 0.4]} castShadow>
        <cylinderGeometry args={[0.1 * s, 0.12 * s, s * 0.8, 7]} />
        <meshStandardMaterial color="#3a6a2a" roughness={0.85} />
      </mesh>
      <mesh position={[-0.35 * s, s * 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.08 * s, 0.1 * s, s * 0.6, 7]} />
        <meshStandardMaterial color="#3a6a2a" roughness={0.85} />
      </mesh>
    </group>
  );
}

// ─── GRAND STAIRCASE — Player high ground spawn ───────

function GrandStaircase() {
  const platformY = 12;
  const platformZ = -45;
  const stairWidth = 8;
  const stairColor = '#b8a888';
  const pillarColor = '#d4c4a0';
  const railColor = '#8a7a5a';

  // 24 steps going from ground up to the platform
  const steps = [];
  const numSteps = 24;
  const stepHeight = platformY / numSteps;
  const stepDepth = 0.8;
  for (let i = 0; i < numSteps; i++) {
    steps.push(
      <RigidBody key={`step-${i}`} type="fixed" colliders="cuboid">
        <mesh
          position={[0, stepHeight * i + stepHeight / 2, platformZ + 12 + i * stepDepth]}
          castShadow receiveShadow
        >
          <boxGeometry args={[stairWidth, stepHeight, stepDepth]} />
          <meshStandardMaterial color={stairColor} roughness={0.85} />
        </mesh>
      </RigidBody>
    );
  }

  return (
    <group>
      {/* Main platform */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, platformY, platformZ]} castShadow receiveShadow>
          <boxGeometry args={[20, 0.6, 14]} />
          <meshStandardMaterial color={stairColor} roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* Platform floor trim */}
      <mesh position={[0, platformY + 0.35, platformZ]}>
        <boxGeometry args={[20.4, 0.1, 14.4]} />
        <meshStandardMaterial color={railColor} roughness={0.7} />
      </mesh>

      {/* Grand staircase steps */}
      {steps}

      {/* Left railing */}
      {Array.from({ length: 6 }, (_, i) => (
        <group key={`rail-l-${i}`}>
          <mesh position={[-stairWidth / 2 - 0.15, platformY * (i / 5) + 0.5, platformZ + 12 + i * 3.8]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 1.2, 8]} />
            <meshStandardMaterial color={pillarColor} roughness={0.6} />
          </mesh>
          <mesh position={[-stairWidth / 2 - 0.15, platformY * (i / 5) + 1.1, platformZ + 12 + i * 3.8]} castShadow>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshStandardMaterial color={pillarColor} roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Right railing */}
      {Array.from({ length: 6 }, (_, i) => (
        <group key={`rail-r-${i}`}>
          <mesh position={[stairWidth / 2 + 0.15, platformY * (i / 5) + 0.5, platformZ + 12 + i * 3.8]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 1.2, 8]} />
            <meshStandardMaterial color={pillarColor} roughness={0.6} />
          </mesh>
          <mesh position={[stairWidth / 2 + 0.15, platformY * (i / 5) + 1.1, platformZ + 12 + i * 3.8]} castShadow>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshStandardMaterial color={pillarColor} roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Grand pillars at the top — 4 big columns */}
      {[-8, -3, 3, 8].map((x, i) => (
        <group key={`pillar-${i}`}>
          <RigidBody type="fixed" colliders="cuboid">
            <mesh position={[x, platformY + 3, platformZ - 6.5]} castShadow>
              <cylinderGeometry args={[0.35, 0.4, 6, 12]} />
              <meshStandardMaterial color={pillarColor} roughness={0.55} />
            </mesh>
          </RigidBody>
          {/* Pillar base */}
          <mesh position={[x, platformY + 0.5, platformZ - 6.5]} castShadow>
            <boxGeometry args={[1, 0.5, 1]} />
            <meshStandardMaterial color={pillarColor} roughness={0.6} />
          </mesh>
          {/* Pillar capital */}
          <mesh position={[x, platformY + 6, platformZ - 6.5]} castShadow>
            <boxGeometry args={[1, 0.4, 1]} />
            <meshStandardMaterial color={pillarColor} roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Roof/canopy over the platform */}
      <mesh position={[0, platformY + 6.3, platformZ - 3]} castShadow receiveShadow>
        <boxGeometry args={[22, 0.3, 10]} />
        <meshStandardMaterial color={stairColor} roughness={0.75} />
      </mesh>

      {/* Back wall */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, platformY + 3, platformZ - 6.8]} castShadow receiveShadow>
          <boxGeometry args={[20, 6, 0.4]} />
          <meshStandardMaterial color="#c4b498" roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* Side walls (half-height for visibility) */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[-10, platformY + 1.5, platformZ - 2]} castShadow>
          <boxGeometry args={[0.3, 3, 10]} />
          <meshStandardMaterial color="#c4b498" roughness={0.8} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[10, platformY + 1.5, platformZ - 2]} castShadow>
          <boxGeometry args={[0.3, 3, 10]} />
          <meshStandardMaterial color="#c4b498" roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* Front railing on platform edge — so player doesn't fall off sides */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh position={[0, platformY + 0.7, platformZ + 6.8]}>
          <boxGeometry args={[20, 1.0, 0.15]} />
          <meshStandardMaterial color={railColor} roughness={0.7} />
        </mesh>
      </RigidBody>
    </group>
  );
}

// ─── HELPERS ───────────────────────────────────────────

function Wall({ pos, size, color }: { pos: [number, number, number]; size: [number, number, number]; color: string }) {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh position={pos} castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} {...WALL} />
      </mesh>
    </RigidBody>
  );
}

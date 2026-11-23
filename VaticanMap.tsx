import { RigidBody } from '@react-three/rapier';
import { useMemo } from 'react';
import * as THREE from 'three';

// Vatican City - St. Peter's Square (Piazza San Pietro)
// Player spawns on the Pope's balcony at [0, 22, -55]
// Enemies congregate in the square below
// Scale: 1 unit = 1 meter

const STONE = { roughness: 0.85, metalness: 0.05 };
const MARBLE = { roughness: 0.6, metalness: 0.1 };
const METAL = { roughness: 0.4, metalness: 0.7 };

export function VaticanMap() {
  return (
    <group>
      <Piazza />
      <GroundPattern />
      <BasilicaFacade />
      <PopeBalcony />
      <BasilicaDome />
      <FacadeColumns />
      <Pediment />
      <LeftColonnade />
      <RightColonnade />
      <ColonnadeStatues />
      <Obelisk />
      <LeftFountain />
      <RightFountain />
      <ViaDellaConcialiazione />
    </group>
  );
}

// ─── GROUND / PIAZZA ──────────────────────────────────

function Piazza() {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh receiveShadow position={[0, -0.5, 0]}>
        <boxGeometry args={[120, 1, 100]} />
        <meshStandardMaterial color="#d4c4a0" {...STONE} />
      </mesh>
    </RigidBody>
  );
}

function GroundPattern() {
  const lines = useMemo(() => {
    const result: { position: [number, number, number]; rotation: number; length: number }[] = [];
    const numLines = 16;
    for (let i = 0; i < numLines; i++) {
      const angle = (i / numLines) * Math.PI * 2;
      result.push({
        position: [Math.sin(angle) * 25, 0.02, Math.cos(angle) * 25 + 5],
        rotation: angle,
        length: 50,
      });
    }
    return result;
  }, []);

  return (
    <group>
      {lines.map((line, i) => (
        <mesh key={i} receiveShadow position={line.position} rotation={[0, line.rotation, 0]}>
          <boxGeometry args={[0.15, 0.04, line.length]} />
          <meshStandardMaterial color="#c8b890" {...STONE} />
        </mesh>
      ))}
    </group>
  );
}

// ─── ST. PETER'S BASILICA ─────────────────────────────

function BasilicaFacade() {
  return (
    <group>
      {/* Main facade wall */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[0, 15, -60]}>
          <boxGeometry args={[60, 30, 10]} />
          <meshStandardMaterial color="#e8dcc8" {...STONE} />
        </mesh>
      </RigidBody>

      {/* Central raised section */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[0, 32, -60]}>
          <boxGeometry args={[24, 4, 10]} />
          <meshStandardMaterial color="#e8dcc8" {...STONE} />
        </mesh>
      </RigidBody>

      {/* Left wing */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[-35, 10, -62]}>
          <boxGeometry args={[12, 20, 6]} />
          <meshStandardMaterial color="#ddd0bc" {...STONE} />
        </mesh>
      </RigidBody>

      {/* Right wing */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[35, 10, -62]}>
          <boxGeometry args={[12, 20, 6]} />
          <meshStandardMaterial color="#ddd0bc" {...STONE} />
        </mesh>
      </RigidBody>
    </group>
  );
}

function PopeBalcony() {
  return (
    <group>
      {/* Balcony platform - player stands here */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[0, 20, -54]}>
          <boxGeometry args={[10, 0.5, 4]} />
          <meshStandardMaterial color="#d8ccb8" {...MARBLE} />
        </mesh>
      </RigidBody>

      {/* Front railing — LOW so player can see down */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[0, 20.5, -52.2]}>
          <boxGeometry args={[10, 0.6, 0.3]} />
          <meshStandardMaterial color="#d0c4b0" {...MARBLE} />
        </mesh>
      </RigidBody>
      {/* Railing balusters */}
      {[-4, -2.5, -1, 0.5, 2, 3.5].map((x, i) => (
        <mesh key={`bal-${i}`} castShadow position={[x, 20.4, -52.2]}>
          <cylinderGeometry args={[0.06, 0.06, 0.5, 6]} />
          <meshStandardMaterial color="#d0c4b0" {...MARBLE} />
        </mesh>
      ))}

      {/* Left railing — low */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[-4.85, 20.5, -54]}>
          <boxGeometry args={[0.3, 0.6, 4]} />
          <meshStandardMaterial color="#d0c4b0" {...MARBLE} />
        </mesh>
      </RigidBody>

      {/* Right railing — low */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[4.85, 20.5, -54]}>
          <boxGeometry args={[0.3, 0.6, 4]} />
          <meshStandardMaterial color="#d0c4b0" {...MARBLE} />
        </mesh>
      </RigidBody>

      {/* Balcony support brackets */}
      <mesh castShadow receiveShadow position={[-3, 19.2, -54]}>
        <boxGeometry args={[1, 1.5, 3]} />
        <meshStandardMaterial color="#ccc0ac" {...STONE} />
      </mesh>
      <mesh castShadow receiveShadow position={[3, 19.2, -54]}>
        <boxGeometry args={[1, 1.5, 3]} />
        <meshStandardMaterial color="#ccc0ac" {...STONE} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 19.2, -54]}>
        <boxGeometry args={[1, 1.5, 3]} />
        <meshStandardMaterial color="#ccc0ac" {...STONE} />
      </mesh>

      {/* ── LUXURY PAPAL ROOM behind the balcony ── */}
      <PapalRoom />
    </group>
  );
}

function PapalRoom() {
  const roomY = 20.25;
  const roomZ = -58;
  const roomW = 14;
  const roomD = 8;
  const roomH = 5;
  const wallColor = '#f0e8d8';
  const floorColor = '#c8a868';
  const trimColor = '#c8a84c';

  return (
    <group>
      {/* Floor */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[0, roomY, roomZ]}>
          <boxGeometry args={[roomW, 0.3, roomD]} />
          <meshStandardMaterial color={floorColor} roughness={0.4} metalness={0.1} />
        </mesh>
      </RigidBody>

      {/* Floor pattern — marble tiles */}
      {[-4, -2, 0, 2, 4].map((x) =>
        [-2, 0, 2].map((z, j) => (
          <mesh key={`tile-${x}-${j}`} receiveShadow position={[x, roomY + 0.17, roomZ + z]}>
            <boxGeometry args={[1.8, 0.02, 1.8]} />
            <meshStandardMaterial
              color={((x + z) % 4 === 0) ? '#e8d8c0' : '#d0c0a0'}
              roughness={0.3} metalness={0.15}
            />
          </mesh>
        ))
      )}

      {/* Back wall */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[0, roomY + roomH / 2, roomZ - roomD / 2]}>
          <boxGeometry args={[roomW, roomH, 0.4]} />
          <meshStandardMaterial color={wallColor} roughness={0.75} />
        </mesh>
      </RigidBody>

      {/* Left wall */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[-roomW / 2, roomY + roomH / 2, roomZ]}>
          <boxGeometry args={[0.4, roomH, roomD]} />
          <meshStandardMaterial color={wallColor} roughness={0.75} />
        </mesh>
      </RigidBody>

      {/* Right wall */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[roomW / 2, roomY + roomH / 2, roomZ]}>
          <boxGeometry args={[0.4, roomH, roomD]} />
          <meshStandardMaterial color={wallColor} roughness={0.75} />
        </mesh>
      </RigidBody>

      {/* Ceiling */}
      <mesh receiveShadow position={[0, roomY + roomH, roomZ]}>
        <boxGeometry args={[roomW, 0.3, roomD]} />
        <meshStandardMaterial color="#f4eee0" roughness={0.7} />
      </mesh>

      {/* Ceiling ornamental border */}
      <mesh position={[0, roomY + roomH - 0.2, roomZ]}>
        <boxGeometry args={[roomW - 0.5, 0.15, roomD - 0.5]} />
        <meshStandardMaterial color={trimColor} roughness={0.3} metalness={0.5} />
      </mesh>

      {/* Gold trim along walls */}
      {/* Bottom trim */}
      <mesh position={[0, roomY + 0.35, roomZ - roomD / 2 + 0.25]}>
        <boxGeometry args={[roomW - 0.5, 0.15, 0.05]} />
        <meshStandardMaterial color={trimColor} roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0, roomY + 0.35, roomZ + roomD / 2 - 0.25]}>
        <boxGeometry args={[roomW - 0.5, 0.15, 0.05]} />
        <meshStandardMaterial color={trimColor} roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Chandelier */}
      <group position={[0, roomY + roomH - 0.5, roomZ]}>
        {/* Chain */}
        <mesh>
          <cylinderGeometry args={[0.02, 0.02, 0.8, 4]} />
          <meshStandardMaterial color="#aa8833" roughness={0.3} metalness={0.8} />
        </mesh>
        {/* Ring */}
        <mesh position={[0, -0.6, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.6, 0.04, 6, 12]} />
          <meshStandardMaterial color="#c8a84c" roughness={0.25} metalness={0.85} />
        </mesh>
        {/* Candle holders */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <group key={`candle-${i}`} position={[Math.cos(a) * 0.6, -0.6, Math.sin(a) * 0.6]}>
              <mesh>
                <cylinderGeometry args={[0.02, 0.02, 0.15, 4]} />
                <meshStandardMaterial color="#f0e8d0" roughness={0.6} />
              </mesh>
              <pointLight position={[0, 0.15, 0]} color="#ffe0a0" intensity={0.5} distance={4} />
            </group>
          );
        })}
      </group>

      {/* Red carpet runner */}
      <mesh receiveShadow position={[0, roomY + 0.18, roomZ]}>
        <boxGeometry args={[2.5, 0.03, roomD - 1]} />
        <meshStandardMaterial color="#8b1a1a" roughness={0.9} />
      </mesh>

      {/* Papal throne against back wall */}
      <group position={[0, roomY, roomZ - roomD / 2 + 1.5]}>
        {/* Seat */}
        <mesh castShadow position={[0, 0.55, 0]}>
          <boxGeometry args={[1.2, 0.15, 0.8]} />
          <meshStandardMaterial color="#8b1a1a" roughness={0.8} />
        </mesh>
        {/* Back */}
        <mesh castShadow position={[0, 1.3, -0.3]}>
          <boxGeometry args={[1.2, 1.6, 0.15]} />
          <meshStandardMaterial color="#8b1a1a" roughness={0.8} />
        </mesh>
        {/* Top of backrest — ornamental */}
        <mesh castShadow position={[0, 2.2, -0.3]}>
          <boxGeometry args={[1.4, 0.3, 0.2]} />
          <meshStandardMaterial color={trimColor} roughness={0.25} metalness={0.7} />
        </mesh>
        {/* Armrests */}
        <mesh castShadow position={[-0.55, 0.75, -0.05]}>
          <boxGeometry args={[0.1, 0.3, 0.7]} />
          <meshStandardMaterial color={trimColor} roughness={0.25} metalness={0.7} />
        </mesh>
        <mesh castShadow position={[0.55, 0.75, -0.05]}>
          <boxGeometry args={[0.1, 0.3, 0.7]} />
          <meshStandardMaterial color={trimColor} roughness={0.25} metalness={0.7} />
        </mesh>
        {/* Legs */}
        {[[-0.5, 0.3], [0.5, 0.3], [-0.5, -0.3], [0.5, -0.3]].map(([x, z], i) => (
          <mesh key={`leg-${i}`} castShadow position={[x, 0.25, z]}>
            <cylinderGeometry args={[0.04, 0.04, 0.5, 6]} />
            <meshStandardMaterial color={trimColor} roughness={0.25} metalness={0.7} />
          </mesh>
        ))}
      </group>

      {/* Paintings/frames on back wall */}
      {[-4, 4].map((x, i) => (
        <group key={`painting-${i}`} position={[x, roomY + 3, roomZ - roomD / 2 + 0.3]}>
          {/* Frame */}
          <mesh>
            <boxGeometry args={[2.2, 2.8, 0.1]} />
            <meshStandardMaterial color={trimColor} roughness={0.3} metalness={0.6} />
          </mesh>
          {/* Canvas */}
          <mesh position={[0, 0, 0.06]}>
            <boxGeometry args={[1.8, 2.4, 0.02]} />
            <meshStandardMaterial color={i === 0 ? '#2a3a4a' : '#3a2a1a'} roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Side tables */}
      {[-5, 5].map((x, i) => (
        <group key={`table-${i}`} position={[x, roomY, roomZ + 1]}>
          <mesh castShadow position={[0, 0.5, 0]}>
            <boxGeometry args={[0.8, 0.06, 0.5]} />
            <meshStandardMaterial color="#5a3a1a" roughness={0.6} />
          </mesh>
          {[[-0.35, -0.2], [0.35, -0.2], [-0.35, 0.2], [0.35, 0.2]].map(([lx, lz], j) => (
            <mesh key={j} castShadow position={[lx, 0.25, lz]}>
              <cylinderGeometry args={[0.03, 0.03, 0.5, 6]} />
              <meshStandardMaterial color="#5a3a1a" roughness={0.6} />
            </mesh>
          ))}
          {/* Vase on table */}
          <mesh castShadow position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.08, 0.1, 0.3, 8]} />
            <meshStandardMaterial color="#e8d8c0" roughness={0.4} metalness={0.1} />
          </mesh>
        </group>
      ))}

      {/* Room light */}
      <pointLight position={[0, roomY + roomH - 1, roomZ]} color="#fff5e0" intensity={2} distance={12} />
    </group>
  );
}

function BasilicaDome() {
  return (
    <group position={[0, 38, -65]}>
      {/* Dome drum (cylindrical base) */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[10, 10, 6, 16]} />
        <meshStandardMaterial color="#d8ccb8" {...STONE} />
      </mesh>

      {/* Main dome */}
      <mesh castShadow receiveShadow position={[0, 10, 0]}>
        <sphereGeometry args={[12, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#6b7d6b" {...METAL} />
      </mesh>

      {/* Lantern on top */}
      <mesh castShadow receiveShadow position={[0, 21, 0]}>
        <cylinderGeometry args={[1.5, 2, 5, 8]} />
        <meshStandardMaterial color="#d8ccb8" {...STONE} />
      </mesh>

      {/* Cross on top */}
      <mesh castShadow position={[0, 25, 0]}>
        <boxGeometry args={[0.3, 3, 0.3]} />
        <meshStandardMaterial color="#c8a84c" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[0, 25.5, 0]}>
        <boxGeometry args={[1.5, 0.3, 0.3]} />
        <meshStandardMaterial color="#c8a84c" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

function FacadeColumns() {
  const positions = [-12, -7, 7, 12];

  return (
    <group>
      {positions.map((x, i) => (
        <RigidBody key={i} type="fixed" colliders="cuboid">
          <mesh castShadow receiveShadow position={[x, 15, -55.5]}>
            <cylinderGeometry args={[0.8, 0.8, 25, 8]} />
            <meshStandardMaterial color="#d8ccb8" {...MARBLE} />
          </mesh>
        </RigidBody>
      ))}
      {/* Column capitals (simplified) */}
      {positions.map((x, i) => (
        <mesh key={`cap-${i}`} castShadow receiveShadow position={[x, 27.8, -55.5]}>
          <boxGeometry args={[2, 1, 2]} />
          <meshStandardMaterial color="#e0d4c0" {...MARBLE} />
        </mesh>
      ))}
    </group>
  );
}

function Pediment() {
  return (
    <group position={[0, 34, -57]}>
      {/* Triangular pediment - approximated with a wedge-like shape */}
      <mesh castShadow receiveShadow rotation={[0, 0, 0]}>
        <coneGeometry args={[15, 5, 4]} />
        <meshStandardMaterial color="#e0d4c0" {...STONE} />
      </mesh>
      {/* Entablature beam below the pediment */}
      <mesh castShadow receiveShadow position={[0, -3.5, 0]}>
        <boxGeometry args={[30, 2, 5]} />
        <meshStandardMaterial color="#e0d4c0" {...STONE} />
      </mesh>
    </group>
  );
}

// ─── BERNINI'S COLONNADE ──────────────────────────────

function LeftColonnade() {
  return <ColonnadeArm side="left" />;
}

function RightColonnade() {
  return <ColonnadeArm side="right" />;
}

function ColonnadeArm({ side }: { side: 'left' | 'right' }) {
  const sign = side === 'left' ? -1 : 1;

  const columns = useMemo(() => {
    const cols: { x: number; z: number }[] = [];
    const numColumns = 18;
    const centerX = sign * 30;
    const centerZ = 5;
    const radius = 35;
    // Arc from roughly -80deg to +80deg
    const startAngle = side === 'left' ? Math.PI * 0.55 : -Math.PI * 0.05;
    const endAngle = side === 'left' ? Math.PI * 1.05 : Math.PI * 0.45;

    for (let i = 0; i < numColumns; i++) {
      const t = i / (numColumns - 1);
      const angle = startAngle + t * (endAngle - startAngle);
      cols.push({
        x: centerX + Math.cos(angle) * radius,
        z: centerZ + Math.sin(angle) * radius,
      });
    }
    return cols;
  }, [sign, side]);

  // Entablature segments connecting column tops
  const entablatureSegments = useMemo(() => {
    const segs: { x: number; z: number; rotation: number; length: number }[] = [];
    for (let i = 0; i < columns.length - 1; i++) {
      const dx = columns[i + 1].x - columns[i].x;
      const dz = columns[i + 1].z - columns[i].z;
      const length = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dx, dz);
      segs.push({
        x: (columns[i].x + columns[i + 1].x) / 2,
        z: (columns[i].z + columns[i + 1].z) / 2,
        rotation: angle,
        length,
      });
    }
    return segs;
  }, [columns]);

  return (
    <group>
      {/* Columns */}
      {columns.map((col, i) => (
        <RigidBody key={i} type="fixed" colliders="cuboid">
          <mesh castShadow receiveShadow position={[col.x, 6, col.z]}>
            <cylinderGeometry args={[0.5, 0.5, 12, 8]} />
            <meshStandardMaterial color="#d8ccb8" {...MARBLE} />
          </mesh>
        </RigidBody>
      ))}

      {/* Entablature (top beam) */}
      {entablatureSegments.map((seg, i) => (
        <mesh
          key={`ent-${i}`}
          castShadow
          receiveShadow
          position={[seg.x, 13, seg.z]}
          rotation={[0, seg.rotation, 0]}
        >
          <boxGeometry args={[2, 2, seg.length + 0.5]} />
          <meshStandardMaterial color="#ddd0bc" {...STONE} />
        </mesh>
      ))}
    </group>
  );
}

function ColonnadeStatues() {
  const statues = useMemo(() => {
    const result: { x: number; z: number }[] = [];

    // Generate positions along both colonnades (on top of entablature)
    for (const side of ['left', 'right'] as const) {
      const sign = side === 'left' ? -1 : 1;
      const centerX = sign * 30;
      const centerZ = 5;
      const radius = 35;
      const startAngle = side === 'left' ? Math.PI * 0.55 : -Math.PI * 0.05;
      const endAngle = side === 'left' ? Math.PI * 1.05 : Math.PI * 0.45;
      const numStatues = 12;

      for (let i = 0; i < numStatues; i++) {
        const t = (i + 0.5) / numStatues;
        const angle = startAngle + t * (endAngle - startAngle);
        result.push({
          x: centerX + Math.cos(angle) * radius,
          z: centerZ + Math.sin(angle) * radius,
        });
      }
    }
    return result;
  }, []);

  return (
    <group>
      {statues.map((s, i) => (
        <group key={i} position={[s.x, 16, s.z]}>
          {/* Body */}
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[0.6, 2.5, 0.6]} />
            <meshStandardMaterial color="#ccc4b4" {...MARBLE} />
          </mesh>
          {/* Head */}
          <mesh castShadow receiveShadow position={[0, 1.6, 0]}>
            <sphereGeometry args={[0.3, 6, 6]} />
            <meshStandardMaterial color="#ccc4b4" {...MARBLE} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── OBELISK ──────────────────────────────────────────

function Obelisk() {
  return (
    <group position={[0, 0, 5]}>
      {/* Base pedestal */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[0, 1.5, 0]}>
          <boxGeometry args={[4, 3, 4]} />
          <meshStandardMaterial color="#bbb0a0" {...STONE} />
        </mesh>
      </RigidBody>

      {/* Obelisk shaft - tapered */}
      <mesh castShadow receiveShadow position={[0, 15.5, 0]}>
        <boxGeometry args={[1.8, 25, 1.8]} />
        <meshStandardMaterial color="#c8b898" {...STONE} />
      </mesh>

      {/* Obelisk tip taper */}
      <mesh castShadow receiveShadow position={[0, 28.5, 0]}>
        <coneGeometry args={[1, 2, 4]} />
        <meshStandardMaterial color="#c8b898" {...STONE} />
      </mesh>

      {/* Cross on top */}
      <mesh castShadow position={[0, 30.5, 0]}>
        <boxGeometry args={[0.2, 1.5, 0.2]} />
        <meshStandardMaterial color="#c8a84c" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[0, 31, 0]}>
        <boxGeometry args={[0.8, 0.2, 0.2]} />
        <meshStandardMaterial color="#c8a84c" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ─── FOUNTAINS ────────────────────────────────────────

function LeftFountain() {
  return <Fountain position={[-20, 0, 5]} />;
}

function RightFountain() {
  return <Fountain position={[20, 0, 5]} />;
}

function Fountain({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Base */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[0, 0.5, 0]}>
          <cylinderGeometry args={[3, 3.5, 1, 12]} />
          <meshStandardMaterial color="#c8bcac" {...STONE} />
        </mesh>
      </RigidBody>

      {/* Lower basin */}
      <mesh castShadow receiveShadow position={[0, 1.5, 0]}>
        <cylinderGeometry args={[2.8, 2.5, 1.5, 12]} />
        <meshStandardMaterial color="#d0c4b4" {...MARBLE} />
      </mesh>

      {/* Water in lower basin */}
      <mesh receiveShadow position={[0, 2.1, 0]}>
        <cylinderGeometry args={[2.5, 2.5, 0.3, 12]} />
        <meshStandardMaterial
          color="#4488aa"
          transparent
          opacity={0.6}
          roughness={0.1}
          metalness={0.2}
        />
      </mesh>

      {/* Center pillar */}
      <mesh castShadow receiveShadow position={[0, 3.5, 0]}>
        <cylinderGeometry args={[0.4, 0.5, 3, 8]} />
        <meshStandardMaterial color="#c8bcac" {...STONE} />
      </mesh>

      {/* Upper basin */}
      <mesh castShadow receiveShadow position={[0, 5, 0]}>
        <cylinderGeometry args={[1.5, 1.2, 1, 10]} />
        <meshStandardMaterial color="#d0c4b4" {...MARBLE} />
      </mesh>

      {/* Water in upper basin */}
      <mesh receiveShadow position={[0, 5.3, 0]}>
        <cylinderGeometry args={[1.3, 1.3, 0.2, 10]} />
        <meshStandardMaterial
          color="#4488aa"
          transparent
          opacity={0.6}
          roughness={0.1}
          metalness={0.2}
        />
      </mesh>
    </group>
  );
}

// ─── VIA DELLA CONCILIAZIONE ──────────────────────────

function ViaDellaConcialiazione() {
  return (
    <group>
      {/* Main avenue extending outward from the square */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh receiveShadow position={[0, 0.01, 120]}>
          <boxGeometry args={[30, 0.02, 150]} />
          <meshStandardMaterial color="#c0b090" {...STONE} />
        </mesh>
      </RigidBody>

      {/* Sidewalk borders - left */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[-16, 0.15, 120]}>
          <boxGeometry args={[2, 0.3, 150]} />
          <meshStandardMaterial color="#d4c4a8" {...STONE} />
        </mesh>
      </RigidBody>

      {/* Sidewalk borders - right */}
      <RigidBody type="fixed" colliders="cuboid">
        <mesh castShadow receiveShadow position={[16, 0.15, 120]}>
          <boxGeometry args={[2, 0.3, 150]} />
          <meshStandardMaterial color="#d4c4a8" {...STONE} />
        </mesh>
      </RigidBody>

      {/* Street lamps along the avenue */}
      {[-12, 12].map((x) =>
        [60, 90, 120, 150, 180].map((z, i) => (
          <group key={`lamp-${x}-${i}`} position={[x, 0, z]}>
            {/* Pole */}
            <mesh castShadow receiveShadow position={[0, 3, 0]}>
              <cylinderGeometry args={[0.15, 0.2, 6, 6]} />
              <meshStandardMaterial color="#444" {...METAL} />
            </mesh>
            {/* Lamp head */}
            <mesh castShadow position={[0, 6.2, 0]}>
              <sphereGeometry args={[0.4, 6, 6]} />
              <meshStandardMaterial color="#ffe8a0" emissive="#ffe8a0" emissiveIntensity={0.3} />
            </mesh>
          </group>
        ))
      )}

      {/* Buildings lining the avenue (simplified blocks) */}
      {[-24, 24].map((x, i) => (
        <RigidBody key={`bldg-${i}`} type="fixed" colliders="cuboid">
          <mesh castShadow receiveShadow position={[x, 10, 120]}>
            <boxGeometry args={[16, 20, 150]} />
            <meshStandardMaterial color={x < 0 ? '#d8c8a8' : '#dccca8'} {...STONE} />
          </mesh>
        </RigidBody>
      ))}
    </group>
  );
}

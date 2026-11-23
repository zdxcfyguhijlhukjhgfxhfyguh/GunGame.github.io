import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Shared state so Player.tsx can read the gunship position
export const gunshipState = {
  x: 0,
  y: 38,
  z: -55,
  angle: 0,
  bankAngle: 0,
};

const ORBIT_RADIUS = 55;
const ORBIT_HEIGHT = 38;
const ORBIT_SPEED = 0.15; // radians per second — slow menacing circle
const ORBIT_CENTER_X = 0;
const ORBIT_CENTER_Z = 0;

export function GunshipPlatform() {
  const modelRef = useRef<THREE.Group>(null);
  const angleRef = useRef(0);
  const propSpin = useRef(0);

  useFrame((_, delta) => {
    if (!modelRef.current) return;
    const dt = Math.min(delta, 0.05);

    angleRef.current += ORBIT_SPEED * dt;
    const a = angleRef.current;

    // Slight altitude variation for realism
    const altVar = Math.sin(a * 2) * 2;

    const x = ORBIT_CENTER_X + Math.cos(a) * ORBIT_RADIUS;
    const z = ORBIT_CENTER_Z + Math.sin(a) * ORBIT_RADIUS;
    const y = ORBIT_HEIGHT + altVar;

    gunshipState.x = x;
    gunshipState.y = y;
    gunshipState.z = z;
    gunshipState.angle = a;

    modelRef.current.position.set(x, y, z);

    // Face tangent direction (perpendicular to radius)
    const facing = a + Math.PI / 2;
    modelRef.current.rotation.y = facing;

    // Bank into the turn
    const bank = -0.12;
    modelRef.current.rotation.z = bank;
    gunshipState.bankAngle = bank;

    // Slight nose pitch
    modelRef.current.rotation.x = Math.sin(a * 3) * 0.03;

    propSpin.current += dt * 25;
  });

  return (
    <group ref={modelRef}>
      {/* === AC-130 GUNSHIP === */}

      {/* Fuselage — dark military gray */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.5, 2, 14]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.7} />
      </mesh>
      {/* Fuselage taper front */}
      <mesh position={[0, 0.1, 7.5]}>
        <boxGeometry args={[2, 1.6, 3]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.2, 9.5]}>
        <boxGeometry args={[1.4, 1.2, 2]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.7} />
      </mesh>
      {/* Nose cone */}
      <mesh position={[0, 0.3, 10.8]}>
        <boxGeometry args={[0.8, 0.8, 1]} />
        <meshStandardMaterial color="#444" roughness={0.6} />
      </mesh>

      {/* Cockpit glass */}
      <mesh position={[0, 0.8, 8.5]}>
        <boxGeometry args={[1.6, 0.6, 2]} />
        <meshStandardMaterial color="#446688" roughness={0.2} metalness={0.5} />
      </mesh>

      {/* Fuselage taper rear */}
      <mesh position={[0, 0.4, -7.5]}>
        <boxGeometry args={[1.8, 1.4, 3]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.7} />
      </mesh>

      {/* Cargo ramp (open, so player can see down) */}
      <mesh position={[0, -0.8, -8]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[2, 0.15, 3]} />
        <meshStandardMaterial color="#333" roughness={0.8} />
      </mesh>

      {/* Wings (high-mounted, swept) */}
      <mesh position={[0, 0.8, -1]}>
        <boxGeometry args={[22, 0.3, 4]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.7} />
      </mesh>

      {/* Wing stripes (military markings) */}
      <mesh position={[-8, 0.96, -1]}>
        <boxGeometry args={[3, 0.02, 1]} />
        <meshStandardMaterial color="#cc2200" roughness={0.7} />
      </mesh>
      <mesh position={[8, 0.96, -1]}>
        <boxGeometry args={[3, 0.02, 1]} />
        <meshStandardMaterial color="#cc2200" roughness={0.7} />
      </mesh>

      {/* 4 Turboprop engines on wings */}
      {[-7, -3.5, 3.5, 7].map((x, i) => (
        <group key={`engine-${i}`} position={[x, 0.3, 0]}>
          {/* Engine nacelle */}
          <mesh>
            <cylinderGeometry args={[0.4, 0.45, 2.5, 6]} />
            <meshStandardMaterial color="#555" roughness={0.6} />
          </mesh>
          {/* Propeller hub */}
          <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.3, 6]} />
            <meshStandardMaterial color="#222" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Tail fin (T-tail) */}
      <mesh position={[0, 2.5, -8]}>
        <boxGeometry args={[0.2, 4, 3.5]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.7} />
      </mesh>
      {/* Horizontal stabilizer */}
      <mesh position={[0, 4.2, -8.5]}>
        <boxGeometry args={[8, 0.2, 2]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.7} />
      </mesh>

      {/* USA star marking on fuselage */}
      <mesh position={[1.26, 0.5, 2]}>
        <boxGeometry args={[0.02, 1.2, 1.2]} />
        <meshStandardMaterial color="#fff" roughness={0.7} />
      </mesh>
      <mesh position={[-1.26, 0.5, 2]}>
        <boxGeometry args={[0.02, 1.2, 1.2]} />
        <meshStandardMaterial color="#fff" roughness={0.7} />
      </mesh>

      {/* Player standing platform on top */}
      <mesh position={[0, 1.15, 0]}>
        <boxGeometry args={[3, 0.15, 6]} />
        <meshStandardMaterial color="#444" roughness={0.8} />
      </mesh>
      {/* Safety rails (low) */}
      <mesh position={[-1.4, 1.5, 0]}>
        <boxGeometry args={[0.1, 0.6, 6]} />
        <meshStandardMaterial color="#666" roughness={0.7} />
      </mesh>
      <mesh position={[1.4, 1.5, 0]}>
        <boxGeometry args={[0.1, 0.6, 6]} />
        <meshStandardMaterial color="#666" roughness={0.7} />
      </mesh>

      {/* Belly guns (AC-130 style) */}
      <mesh position={[-0.8, -1.1, 2]} rotation={[0, 0, 0.1]}>
        <cylinderGeometry args={[0.08, 0.06, 2, 4]} />
        <meshStandardMaterial color="#222" roughness={0.5} />
      </mesh>
      <mesh position={[-0.8, -1.1, -1]} rotation={[0, 0, 0.1]}>
        <cylinderGeometry args={[0.12, 0.08, 2.5, 4]} />
        <meshStandardMaterial color="#222" roughness={0.5} />
      </mesh>
    </group>
  );
}

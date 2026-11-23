import { useRef, useState, useCallback, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameStore } from '../stores/gameStore';

// Ships travel from east (+X) to west (-X) through the strait
// Hull is built along X axis (bow at +X), so rotation.y = Math.PI faces -X

const PASS_X = -60;

type ShipSize = 'small' | 'medium' | 'large';

interface ShipConfig {
  size: ShipSize;
  health: number;
  speed: number;
  scale: number;
  damage: number;
}

const SHIP_CONFIGS: ShipConfig[] = [
  { size: 'small', health: 100, speed: 8, scale: 1, damage: 100 },
  { size: 'medium', health: 250, speed: 6, scale: 1.5, damage: 200 },
  { size: 'large', health: 500, speed: 4, scale: 2.2, damage: 400 },
];

function getShipConfig(id: number): ShipConfig {
  if (id % 8 === 0) return SHIP_CONFIGS[2];
  if (id % 3 === 0) return SHIP_CONFIGS[1];
  return SHIP_CONFIGS[0];
}

// Country flags
interface FlagColors { top: string; mid: string; bot: string; name: string }
const FLAGS: FlagColors[] = [
  { top: '#fff', mid: '#fff', bot: '#b22234', name: 'USA' },       // red/white stripes simplified
  { top: '#ff9933', mid: '#fff', bot: '#138808', name: 'India' },   // saffron/white/green
  { top: '#fff', mid: '#0039a6', bot: '#d52b1e', name: 'Russia' },  // white/blue/red
  { top: '#fff', mid: '#fff', bot: '#c8102e', name: 'England' },    // white + red cross
  { top: '#002395', mid: '#fff', bot: '#ed2939', name: 'France' },   // blue/white/red
  { top: '#000', mid: '#dd0000', bot: '#ffcc00', name: 'Germany' },  // black/red/gold
  { top: '#009b3a', mid: '#fedf00', bot: '#009b3a', name: 'Brazil' },
  { top: '#fff', mid: '#bc002d', bot: '#fff', name: 'Japan' },      // white + red circle
  { top: '#006233', mid: '#fff', bot: '#ce1126', name: 'Iran' },     // green/white/red
  { top: '#c60c30', mid: '#003478', bot: '#c60c30', name: 'S.Korea' },
  { top: '#de2910', mid: '#de2910', bot: '#de2910', name: 'China' }, // red
  { top: '#009639', mid: '#fff', bot: '#009639', name: 'Pakistan' },
  { top: '#00247d', mid: '#00247d', bot: '#cf142b', name: 'UK' },
  { top: '#f0f0f0', mid: '#0051a5', bot: '#ef4135', name: 'Netherlands' },
  { top: '#006847', mid: '#fff', bot: '#ce1126', name: 'Mexico' },
];

function getFlag(id: number): FlagColors {
  return FLAGS[id % FLAGS.length];
}

function getSpawnPos(id: number): [number, number, number] {
  const lane = ((id * 7) % 5) - 2;
  const z = -5 + lane * 7;
  const xOffset = (id * 17) % 40;
  return [80 + xOffset, 0.5, z];
}

export function Ship({ id }: { id: number }) {
  const rbRef = useRef<any>(null);
  const modelRef = useRef<THREE.Group>(null);
  const config = getShipConfig(id);
  const flag = getFlag(id);
  const healthRef = useRef(config.health);
  const isDeadRef = useRef(false);
  const [isDead, setIsDead] = useState(false);
  const respawnTimer = useRef(0);
  const bobPhase = useRef(Math.random() * Math.PI * 2);
  // Unpredictable weaving
  const weavePhase = useRef(Math.random() * Math.PI * 2);
  const weaveFreq = useRef(0.3 + Math.random() * 0.5);
  const weaveAmp = useRef(2 + Math.random() * 4);
  // Occasional speed changes
  const speedMult = useRef(1);
  const speedTimer = useRef(Math.random() * 3);

  const spawnPos = useMemo(() => getSpawnPos(id), [id]);

  const takeDamage = useCallback((damage: number) => {
    if (isDeadRef.current) return;
    healthRef.current -= damage;
    if (healthRef.current <= 0) {
      isDeadRef.current = true;
      setIsDead(true);
      respawnTimer.current = 5 + Math.random() * 5;
      useGameStore.getState().addPlayerKill();
      useGameStore.getState().flashHitMarker();
      useGameStore.getState().flashKillBanner();
    } else {
      useGameStore.getState().flashHitMarker();
    }
  }, []);

  const applyKnockback = useCallback(() => {}, []);

  useFrame((_, delta) => {
    if (!rbRef.current) return;
    const dt = Math.min(delta, 0.05);

    if (isDeadRef.current) {
      if (modelRef.current) {
        const pos = rbRef.current.translation();
        modelRef.current.position.set(pos.x, pos.y, pos.z);
        modelRef.current.position.y -= respawnTimer.current < 3 ? (3 - respawnTimer.current) * 0.5 : 0;
        modelRef.current.rotation.z += dt * 0.3;
        modelRef.current.visible = respawnTimer.current > 2;
      }
      respawnTimer.current -= dt;
      if (respawnTimer.current <= 0) {
        const sp = getSpawnPos(id);
        const newX = sp[0] + Math.random() * 20;
        rbRef.current.setNextKinematicTranslation({ x: newX, y: sp[1], z: sp[2] });
        healthRef.current = config.health;
        isDeadRef.current = false;
        setIsDead(false);
        weavePhase.current = Math.random() * Math.PI * 2;
        weaveFreq.current = 0.3 + Math.random() * 0.5;
        weaveAmp.current = 2 + Math.random() * 4;
        if (modelRef.current) {
          modelRef.current.visible = true;
          modelRef.current.rotation.set(0, 0, 0);
        }
      }
      return;
    }

    const pos = rbRef.current.translation();

    // Unpredictable speed changes
    speedTimer.current -= dt;
    if (speedTimer.current <= 0) {
      speedMult.current = 0.6 + Math.random() * 0.8;
      speedTimer.current = 1 + Math.random() * 3;
    }

    // Move ship westward with weaving
    const newX = pos.x - config.speed * speedMult.current * dt;
    weavePhase.current += dt * weaveFreq.current;
    const weaveZ = Math.sin(weavePhase.current) * weaveAmp.current * dt;
    const newZ = pos.z + weaveZ;

    // Bob on water
    bobPhase.current += dt * 2;
    const bobY = 0.5 + Math.sin(bobPhase.current) * 0.3;

    rbRef.current.setNextKinematicTranslation({ x: newX, y: bobY, z: newZ });

    if (modelRef.current) {
      modelRef.current.position.set(newX, bobY, newZ);
      modelRef.current.rotation.x = Math.sin(bobPhase.current * 0.7) * 0.03;
      // Face travel direction (-X) with slight turn from weaving
      const weaveAngle = Math.sin(weavePhase.current) * 0.08;
      modelRef.current.rotation.y = Math.PI + weaveAngle;
      modelRef.current.rotation.z = Math.sin(bobPhase.current * 1.3) * 0.02;
    }

    // Ship passed through
    if (newX < PASS_X) {
      useGameStore.getState().damageVatican(config.damage);
      const sp = getSpawnPos(id);
      rbRef.current.setNextKinematicTranslation({ x: sp[0] + Math.random() * 30, y: sp[1], z: sp[2] });
    }
  });

  const s = config.scale;
  const hullColor = isDead ? '#444' : id % 3 === 0 ? '#2a2a2a' : id % 3 === 1 ? '#3a2a1a' : '#2a3a4a';
  const deckColor = isDead ? '#333' : '#6a5a4a';

  return (
    <>
      <RigidBody
        ref={rbRef}
        type="kinematicPosition"
        colliders={false}
        position={spawnPos}
        userData={{ isEnemy: true, takeDamage, applyKnockback }}
      >
        <CuboidCollider args={[3 * s, 1.5 * s, 1 * s]} />
      </RigidBody>

      <group ref={modelRef} userData={{ isEnemy: true, takeDamage, applyKnockback }}>
        <group scale={[s, s, s]}>
          {/* Hull */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[6, 1.5, 2]} />
            <meshStandardMaterial color={hullColor} roughness={0.8} />
          </mesh>
          {/* Bow */}
          <mesh position={[3.2, 0.2, 0]} rotation={[0, 0, -0.15]}>
            <boxGeometry args={[1.5, 1, 1.4]} />
            <meshStandardMaterial color={hullColor} roughness={0.8} />
          </mesh>
          {/* Stern */}
          <mesh position={[-3, 0.3, 0]}>
            <boxGeometry args={[0.8, 1.8, 2.1]} />
            <meshStandardMaterial color={hullColor} roughness={0.8} />
          </mesh>
          {/* Deck */}
          <mesh position={[0, 0.9, 0]}>
            <boxGeometry args={[5.5, 0.15, 1.8]} />
            <meshStandardMaterial color={deckColor} roughness={0.9} />
          </mesh>
          {/* Bridge */}
          <mesh position={[-1, 1.6, 0]}>
            <boxGeometry args={[2, 1.2, 1.4]} />
            <meshStandardMaterial color={isDead ? '#333' : '#555'} roughness={0.7} />
          </mesh>
          {/* Bridge windows */}
          <mesh position={[-1, 1.7, 0.71]}>
            <boxGeometry args={[1.6, 0.4, 0.02]} />
            <meshStandardMaterial color="#88ccff" roughness={0.2} metalness={0.5} />
          </mesh>
          {/* Smokestack */}
          <mesh position={[-1.5, 2.5, 0]}>
            <cylinderGeometry args={[0.2, 0.25, 1.2, 6]} />
            <meshStandardMaterial color={isDead ? '#222' : '#333'} roughness={0.8} />
          </mesh>
          {!isDead && (
            <mesh position={[-1.5, 3.2, 0]}>
              <sphereGeometry args={[0.3, 6, 6]} />
              <meshStandardMaterial color="#666" transparent opacity={0.4} />
            </mesh>
          )}

          {/* ── FLAG on mast ── */}
          {/* Mast */}
          <mesh position={[1, 2.5, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 3, 4]} />
            <meshStandardMaterial color="#444" roughness={0.8} />
          </mesh>
          {/* Flag — 3 horizontal stripes */}
          <group position={[1, 3.6, 0.35]}>
            <mesh position={[0, 0.2, 0]}>
              <boxGeometry args={[0.05, 0.28, 0.5]} />
              <meshStandardMaterial color={isDead ? '#555' : flag.top} roughness={0.8} />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.05, 0.28, 0.5]} />
              <meshStandardMaterial color={isDead ? '#444' : flag.mid} roughness={0.8} />
            </mesh>
            <mesh position={[0, -0.2, 0]}>
              <boxGeometry args={[0.05, 0.28, 0.5]} />
              <meshStandardMaterial color={isDead ? '#333' : flag.bot} roughness={0.8} />
            </mesh>
          </group>

          {/* Containers/cargo */}
          {config.size !== 'small' && (
            <group>
              <mesh position={[1.5, 1.3, 0.3]}>
                <boxGeometry args={[1.2, 0.7, 0.7]} />
                <meshStandardMaterial color={isDead ? '#333' : '#cc3322'} roughness={0.7} />
              </mesh>
              <mesh position={[1.5, 1.3, -0.3]}>
                <boxGeometry args={[1.2, 0.7, 0.7]} />
                <meshStandardMaterial color={isDead ? '#333' : '#2266aa'} roughness={0.7} />
              </mesh>
            </group>
          )}
          {config.size === 'large' && (
            <group>
              <mesh position={[0, 1.3, 0.3]}>
                <boxGeometry args={[1.2, 0.7, 0.7]} />
                <meshStandardMaterial color={isDead ? '#333' : '#22aa44'} roughness={0.7} />
              </mesh>
              <mesh position={[0, 1.3, -0.3]}>
                <boxGeometry args={[1.2, 0.7, 0.7]} />
                <meshStandardMaterial color={isDead ? '#333' : '#ddaa22'} roughness={0.7} />
              </mesh>
              <mesh position={[1.5, 2, 0]}>
                <boxGeometry args={[1.2, 0.7, 0.7]} />
                <meshStandardMaterial color={isDead ? '#333' : '#cc3322'} roughness={0.7} />
              </mesh>
            </group>
          )}

          {/* Water line */}
          <mesh position={[0, -0.4, 0]}>
            <boxGeometry args={[5.8, 0.3, 2.1]} />
            <meshStandardMaterial color={isDead ? '#222' : '#8a2222'} roughness={0.8} />
          </mesh>
        </group>
      </group>
    </>
  );
}

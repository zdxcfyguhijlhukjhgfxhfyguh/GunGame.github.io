import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { enemyProjectiles } from '../systems/enemyProjectiles';
import { useGameStore } from '../stores/gameStore';

const HIT_RADIUS = 1.5;

export function EnemyProjectiles() {
  const { camera } = useThree();
  const meshRefs = useRef<(THREE.Group | null)[]>([]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    for (let i = 0; i < enemyProjectiles.length; i++) {
      const proj = enemyProjectiles[i];
      const mesh = meshRefs.current[i];
      if (!mesh) continue;

      if (!proj.active) {
        mesh.visible = false;
        continue;
      }

      mesh.visible = true;
      proj.life -= dt;
      if (proj.life <= 0 || proj.pos.y < -1) {
        proj.active = false;
        mesh.visible = false;
        continue;
      }

      // Move
      proj.pos.addScaledVector(proj.dir, proj.speed * dt);
      mesh.position.copy(proj.pos);

      // Check hit player
      const dist = proj.pos.distanceTo(camera.position);
      if (dist < HIT_RADIUS) {
        proj.active = false;
        mesh.visible = false;
        const gs = useGameStore.getState();
        if (gs.health > 0) gs.takeDamage(proj.damage);
      }
    }
  });

  return (
    <>
      {enemyProjectiles.map((proj, i) => (
        <group key={i} ref={el => { meshRefs.current[i] = el; }} visible={false}>
          {/* Fire projectile */}
          {i % 2 === 0 ? (
            <>
              <mesh>
                <sphereGeometry args={[0.2, 6, 6]} />
                <meshStandardMaterial
                  color="#ff4400"
                  emissive="#ff6600"
                  emissiveIntensity={3}
                  transparent
                  opacity={0.9}
                />
              </mesh>
              <mesh>
                <sphereGeometry args={[0.35, 6, 6]} />
                <meshStandardMaterial
                  color="#ff8800"
                  emissive="#ff4400"
                  emissiveIntensity={1.5}
                  transparent
                  opacity={0.4}
                />
              </mesh>
            </>
          ) : (
            <>
              {/* Lightning bolt */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 1.2, 4]} />
                <meshStandardMaterial
                  color="#88ccff"
                  emissive="#4488ff"
                  emissiveIntensity={4}
                  transparent
                  opacity={0.9}
                />
              </mesh>
              <mesh>
                <sphereGeometry args={[0.15, 6, 6]} />
                <meshStandardMaterial
                  color="#aaddff"
                  emissive="#4488ff"
                  emissiveIntensity={3}
                  transparent
                  opacity={0.7}
                />
              </mesh>
            </>
          )}
        </group>
      ))}
    </>
  );
}

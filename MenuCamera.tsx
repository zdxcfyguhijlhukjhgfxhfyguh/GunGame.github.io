import { useFrame, useThree } from '@react-three/fiber';
import { useGameStore } from '../stores/gameStore';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';

const lookTarget = new THREE.Vector3();

export function MenuCamera() {
  const { camera } = useThree();
  const angle = useRef(0);

  // Reset camera orientation when the menu camera unmounts (transitioning to gameplay)
  useEffect(() => {
    return () => {
      camera.up.set(0, 1, 0);
      camera.rotation.set(0, 0, 0);
      camera.quaternion.identity();
    };
  }, [camera]);

  useFrame((_, delta) => {
    angle.current += delta * 0.08;
    const radius = 45;
    const height = 18;
    const centerX = 14;
    const centerZ = 0;

    camera.position.set(
      centerX + Math.cos(angle.current) * radius,
      height,
      centerZ + Math.sin(angle.current) * radius
    );
    camera.up.set(0, 1, 0);
    lookTarget.set(centerX, 4, centerZ);
    camera.lookAt(lookTarget);
  });

  return null;
}

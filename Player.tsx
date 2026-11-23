import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, CapsuleCollider, useRapier } from '@react-three/rapier';
import { useInput } from '../hooks/useInput';
import { useGameStore, type MapId } from '../stores/gameStore';
import { gunshipState } from './GunshipPlatform';
import * as THREE from 'three';

const SPAWN_BY_MAP: Record<MapId, [number, number, number]> = {
  nuketown: [0, 14, -45],
  osaka: [0, 2, 10],
  vatican: [0, 22, -53],
  hormuz: [0, 25, -60],
  eisland: [55, 40, 0],
};

const SPEED = 11;
const SPRINT_MULT = 1.5;
const JUMP_FORCE = 7;

// Pre-allocated — zero per-frame GC
const _dir = new THREE.Vector3();
const _rot = new THREE.Vector3();

export function Player() {
  const rbRef = useRef<any>(null);
  const { world } = useRapier();
  const { camera, gl } = useThree();
  const ctrl = useRef<any>(null);
  const vel = useRef(0);
  const grounded = useRef(false);
  const camRot = useRef({ x: 0, y: 0 });
  const input = useInput();
  const prevMoving = useRef(false);
  const prevSprinting = useRef(false);
  const prevReload = useRef(false);
  const prevAiming = useRef(false);
  const fovRef = useRef(70);
  const prevShooting = useRef(false);
  const recoilX = useRef(0);  // vertical kick (pitch)
  const recoilY = useRef(0);  // horizontal kick (yaw)
  const recoilVelX = useRef(0);
  const recoilVelY = useRef(0);

  // Pointer lock
  useEffect(() => {
    const c = gl.domElement;
    const click = () => { if (!document.pointerLockElement) c.requestPointerLock(); };
    c.addEventListener('click', click);
    return () => c.removeEventListener('click', click);
  }, [gl]);

  // Mouse look
  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!document.pointerLockElement) return;
      const sens = useGameStore.getState().isAiming ? 0.0007 : 0.002;
      camRot.current.y -= e.movementX * sens;
      camRot.current.x -= e.movementY * sens;
      camRot.current.x = Math.max(-1.4, Math.min(1.4, camRot.current.x));
    };
    document.addEventListener('mousemove', move);
    return () => document.removeEventListener('mousemove', move);
  }, []);

  // Character controller
  useEffect(() => {
    ctrl.current = world.createCharacterController(0.01);
    ctrl.current.enableAutostep(0.4, 0.1, true);
    ctrl.current.enableSnapToGround(0.3);
    ctrl.current.setMaxSlopeClimbAngle((45 * Math.PI) / 180);
    ctrl.current.setMinSlopeSlideAngle((30 * Math.PI) / 180);
    return () => { if (ctrl.current) world.removeCharacterController(ctrl.current); };
  }, [world]);

  useFrame((_, delta) => {
    if (!rbRef.current || !ctrl.current) return;
    const dt = Math.min(delta, 0.05);

    // Movement
    _dir.set(0, 0, 0);
    if (input.forward) _dir.z -= 1;
    if (input.backward) _dir.z += 1;
    if (input.left) _dir.x -= 1;
    if (input.right) _dir.x += 1;
    _dir.normalize();

    const yaw = camRot.current.y;
    _rot.set(
      _dir.x * Math.cos(yaw) + _dir.z * Math.sin(yaw),
      0,
      -_dir.x * Math.sin(yaw) + _dir.z * Math.cos(yaw)
    );

    const moving = _dir.lengthSq() > 0;
    const sprinting = input.sprint && moving;

    if (moving !== prevMoving.current) {
      useGameStore.getState().setIsMoving(moving);
      prevMoving.current = moving;
    }
    if (sprinting !== prevSprinting.current) {
      useGameStore.getState().setIsSprinting(sprinting);
      prevSprinting.current = sprinting;
    }

    const spd = sprinting ? SPEED * SPRINT_MULT : SPEED;

    // Gravity
    if (!grounded.current) vel.current -= 25 * dt;
    else vel.current = -0.1;

    // Jump
    if (input.jump && grounded.current) {
      vel.current = JUMP_FORCE;
      grounded.current = false;
    }

    const collider = rbRef.current.collider(0);
    ctrl.current.computeColliderMovement(collider, {
      x: _rot.x * spd * dt,
      y: vel.current * dt,
      z: _rot.z * spd * dt,
    });

    const c = ctrl.current.computedMovement();
    grounded.current = ctrl.current.computedGrounded();

    const pos = rbRef.current.translation();
    const isEisland = useGameStore.getState().selectedMap === 'eisland';
    let nx: number, ny: number, nz: number;

    if (isEisland) {
      // Ride on top of the gunship — locked to platform
      nx = gunshipState.x;
      ny = gunshipState.y + 2.5;
      nz = gunshipState.z;
    } else {
      nx = pos.x + c.x;
      ny = pos.y + c.y;
      nz = pos.z + c.z;
    }
    rbRef.current.setNextKinematicTranslation({ x: nx, y: ny, z: nz });

    // Camera recoil
    const gs0 = useGameStore.getState();
    if (gs0.isShooting && !prevShooting.current) {
      const isScoped = gs0.isAiming;
      // Sniper kick — strong upward, slight random horizontal
      const kickUp = isScoped ? 0.035 : 0.02;
      const kickSide = (Math.random() - 0.5) * (isScoped ? 0.012 : 0.008);
      recoilVelX.current += kickUp;
      recoilVelY.current += kickSide;
    }
    prevShooting.current = gs0.isShooting;

    // Apply recoil velocity to recoil offset
    recoilX.current += recoilVelX.current;
    recoilY.current += recoilVelY.current;

    // Decay recoil back to center (spring recovery)
    const recovery = 1 - Math.exp(-6 * dt);
    recoilX.current -= recoilX.current * recovery;
    recoilY.current -= recoilY.current * recovery;
    recoilVelX.current *= Math.exp(-10 * dt);
    recoilVelY.current *= Math.exp(-10 * dt);

    // Camera
    camera.position.set(nx, ny + 1.6, nz);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = camRot.current.y + recoilY.current;
    camera.rotation.x = camRot.current.x + recoilX.current;

    // ADS
    const aiming = input.aim;
    if (aiming !== prevAiming.current) {
      useGameStore.getState().setIsAiming(aiming);
      prevAiming.current = aiming;
    }

    // Smooth FOV for scope zoom
    const tgtFov = aiming ? 25 : 70;
    fovRef.current += (tgtFov - fovRef.current) * Math.min(1, 12 * dt);
    (camera as THREE.PerspectiveCamera).fov = fovRef.current;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();

    // Weapon switching
    if (input.weapon1) useGameStore.getState().setCurrentWeapon('sniper');
    if (input.weapon2) useGameStore.getState().setCurrentWeapon('rocket');

    // Reload
    const gs = useGameStore.getState();
    if (input.reload && !prevReload.current && !gs.isReloading) {
      gs.reload();
      gs.setIsReloading(true);
      setTimeout(() => useGameStore.getState().setIsReloading(false), 2000);
    }
    prevReload.current = input.reload;
  });

  return (
    <RigidBody
      ref={rbRef}
      type="kinematicPosition"
      colliders={false}
      position={SPAWN_BY_MAP[useGameStore.getState().selectedMap]}
      userData={{ isPlayer: true }}
    >
      <CapsuleCollider args={[0.5, 0.3]} />
    </RigidBody>
  );
}

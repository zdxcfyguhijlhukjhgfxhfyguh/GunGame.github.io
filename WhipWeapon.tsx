import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useInput } from '../hooks/useInput';
import { useGameStore } from '../stores/gameStore';

const WHIP_SEGMENTS = 16;
const WHIP_DAMAGE = 40;
const WHIP_RANGE = 10;
const WHIP_CONE = Math.PI * 0.7; // wide ~126° sweep
const WHIP_COOLDOWN = 0.9;
const KNOCKBACK_FORCE = 15;
const LASSO_RADIUS = 0.5; // radius of the lasso loop at rest
const SWING_SPEED = 2.8; // how fast the full swing plays

const _basePos = new THREE.Vector3();
const _baseEuler = new THREE.Euler();
const _localQ = new THREE.Quaternion();
const _enemyPos = new THREE.Vector3();
const _toEnemy = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _knockDir = new THREE.Vector3();

const HIP_POS = new THREE.Vector3(0.28, -0.18, -0.25);

export function WhipWeapon() {
  const grp = useRef<THREE.Group>(null);
  const ropeGrp = useRef<THREE.Group>(null);
  const segRefs = useRef<(THREE.Mesh | null)[]>([]);
  const loopRefs = useRef<(THREE.Mesh | null)[]>([]);
  const { camera, scene } = useThree();
  const input = useInput();

  const swingPhase = useRef(0); // 0 = idle, 0->1 = swinging outward
  const isSwinging = useRef(false);
  const lastSwing = useRef(0);
  const prevWhip = useRef(false);
  const hasHit = useRef(false);

  // Rope segments (handle to loop)
  const ROPE_SEGS = 8;
  const LOOP_SEGS = 12; // segments forming the lasso loop

  const ropeData = useMemo(() => {
    const segs = [];
    for (let i = 0; i < ROPE_SEGS; i++) {
      const t = i / (ROPE_SEGS - 1);
      segs.push({
        thickness: 0.007 * (1 - t * 0.3),
      });
    }
    return segs;
  }, []);

  useFrame((_, delta) => {
    if (!grp.current) return;
    const dt = Math.min(delta, 0.05);
    const gs = useGameStore.getState();
    const now = Date.now() / 1000;

    // Detect Q press
    if (input.whip && !prevWhip.current && !isSwinging.current && now - lastSwing.current > WHIP_COOLDOWN) {
      isSwinging.current = true;
      swingPhase.current = 0;
      lastSwing.current = now;
      hasHit.current = false;
      gs.setIsWhipping(true);
    }
    prevWhip.current = input.whip;

    // Advance swing
    if (isSwinging.current) {
      swingPhase.current += dt * SWING_SPEED;
      if (swingPhase.current >= 1) {
        swingPhase.current = 0;
        isSwinging.current = false;
        useGameStore.getState().setIsWhipping(false);
      }
    }

    // Hide when scoped
    grp.current.visible = !gs.isAiming;

    // Position group on camera
    _basePos.copy(HIP_POS);
    _baseEuler.set(0, 0, 0);
    _localQ.setFromEuler(_baseEuler);
    grp.current.position.copy(_basePos).applyQuaternion(camera.quaternion).add(camera.position);
    grp.current.quaternion.copy(camera.quaternion).multiply(_localQ);

    const phase = swingPhase.current;
    // Swing easing: fast out, slower at peak, fast return
    // 0-0.5 = throw outward, 0.5-1.0 = pull back
    const throwT = phase < 0.5 ? phase * 2 : 1 - (phase - 0.5) * 2; // 0->1->0
    const eased = Math.sin(throwT * Math.PI * 0.5); // ease out

    // Wide horizontal sweep angle for the lasso
    // Sweeps from right to left across the screen
    const sweepAngle = isSwinging.current
      ? -1.2 + phase * 2.4 // sweep from -1.2 to +1.2 rad (~140° arc)
      : 0;

    // ── ROPE SEGMENTS (handle to loop) ──
    for (let i = 0; i < ROPE_SEGS; i++) {
      const seg = segRefs.current[i];
      if (!seg) continue;
      const t = (i + 1) / ROPE_SEGS; // 0=handle end, 1=loop start

      if (isSwinging.current) {
        // Rope extends outward and sweeps horizontally
        const extend = eased * 0.6 * t; // how far forward
        const sideSwing = Math.sin(sweepAngle) * t * 0.3;
        seg.position.set(
          sideSwing,
          -0.06 - t * 0.04 + eased * t * 0.08, // lift up during throw
          -t * 0.2 - extend
        );
        seg.rotation.set(-eased * 0.5 * t, sweepAngle * t * 0.5, 0);
      } else {
        // Idle: rope hangs down with gentle sway
        const sway = Math.sin(now * 1.5 + t * 2) * 0.015;
        seg.position.set(sway, -0.06 - t * 0.18, -t * 0.08);
        seg.rotation.set(t * 0.8, 0, sway * 2);
      }
    }

    // ── LASSO LOOP SEGMENTS ──
    for (let i = 0; i < LOOP_SEGS; i++) {
      const seg = loopRefs.current[i];
      if (!seg) continue;
      const angle = (i / LOOP_SEGS) * Math.PI * 2;

      if (isSwinging.current) {
        // Loop expands outward and sweeps wide
        const loopR = LASSO_RADIUS * (0.3 + eased * 0.7); // expand from small to full
        const extend = eased * 0.8; // how far the loop is thrown
        const sideOffset = Math.sin(sweepAngle) * 0.4;

        // Loop is roughly horizontal when thrown, tilted toward camera when idle
        seg.position.set(
          Math.cos(angle) * loopR + sideOffset,
          Math.sin(angle) * loopR * 0.3 + eased * 0.1, // flatten vertically when thrown
          -0.25 - extend + Math.sin(angle) * loopR * 0.15
        );
        seg.rotation.set(0, angle, Math.PI / 2);
      } else {
        // Idle: small coiled loop hanging at the side
        const idleR = 0.06;
        seg.position.set(
          Math.cos(angle) * idleR + Math.sin(now * 1.5) * 0.01,
          -0.28 + Math.sin(angle) * idleR,
          -0.1
        );
        seg.rotation.set(0, angle, Math.PI / 2);
      }
    }

    // ── HIT DETECTION at peak of throw (40-65% through) ──
    if (isSwinging.current && phase > 0.3 && phase < 0.6 && !hasHit.current) {
      hasHit.current = true;

      _forward.set(0, 0, -1).applyQuaternion(camera.quaternion);

      scene.traverse((obj) => {
        if (!obj.userData?.isEnemy || !obj.userData?.takeDamage) return;

        obj.getWorldPosition(_enemyPos);
        _toEnemy.subVectors(_enemyPos, camera.position);
        const dist = _toEnemy.length();
        if (dist > WHIP_RANGE) return;

        // Wide cone check for lasso sweep
        _toEnemy.normalize();
        const angle = Math.acos(Math.max(-1, Math.min(1, _forward.dot(_toEnemy))));
        if (angle > WHIP_CONE) return;

        // Hit!
        obj.userData.takeDamage(WHIP_DAMAGE);

        // Knockback — push directly away from player
        if (obj.userData.applyKnockback) {
          _knockDir.copy(_toEnemy);
          _knockDir.y = 0.25;
          _knockDir.normalize();
          obj.userData.applyKnockback(_knockDir, KNOCKBACK_FORCE);
        }
      });
    }
  });

  const ropeColor1 = '#5a3a1a';
  const ropeColor2 = '#4a2a10';
  const loopColor = '#6a4422';

  return (
    <group ref={grp}>
      {/* Handle — thick wooden grip */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.014, 0.018, 0.14, 8]} />
        <meshStandardMaterial color="#3d2b1f" roughness={0.75} />
      </mesh>
      {/* Handle leather wrap */}
      <mesh position={[0, 0.01, 0]} castShadow>
        <cylinderGeometry args={[0.016, 0.016, 0.06, 8]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
      </mesh>
      {/* Handle bottom cap */}
      <mesh position={[0, 0.075, 0]} castShadow>
        <sphereGeometry args={[0.016, 6, 6]} />
        <meshStandardMaterial color="#555" roughness={0.3} metalness={0.6} />
      </mesh>

      <group ref={ropeGrp}>
        {/* Rope segments from handle to loop */}
        {ropeData.map((rd, i) => (
          <mesh
            key={`rope-${i}`}
            ref={(el) => { segRefs.current[i] = el; }}
            castShadow
          >
            <cylinderGeometry args={[rd.thickness, rd.thickness * 0.9, 0.06, 6]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? ropeColor1 : ropeColor2}
              roughness={0.85}
            />
          </mesh>
        ))}

        {/* Lasso loop segments — form the circular loop */}
        {Array.from({ length: LOOP_SEGS }, (_, i) => {
          const t = i / LOOP_SEGS;
          const thickness = 0.006;
          return (
            <mesh
              key={`loop-${i}`}
              ref={(el) => { loopRefs.current[i] = el; }}
              castShadow
            >
              <cylinderGeometry args={[thickness, thickness, 0.08, 5]} />
              <meshStandardMaterial
                color={t < 0.5 ? loopColor : ropeColor1}
                roughness={0.8}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Sky, Stats, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ChromaticAberration, ToneMapping } from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';
import * as THREE from 'three';
import { Player } from './components/Player';
import { NuketownMap } from './components/NuketownMap';
import { OsakaMap } from './components/OsakaMap';
import { VaticanMap } from './components/VaticanMap';
import { HormuzMap } from './components/HormuzMap';
import { EIslandMap } from './components/EIslandMap';
import { Enemy } from './components/Enemy';
import { Ship } from './components/Ship';
import { MiniPerson, IslandPlane } from './components/MiniPerson';
import { GunshipPlatform } from './components/GunshipPlatform';
import { SniperWeapon } from './components/SniperWeapon';
import { RocketLauncher } from './components/RocketLauncher';
import { WhipWeapon } from './components/WhipWeapon';
import { Shooting } from './components/Shooting';
import { Rockets } from './components/Rockets';
import { EnemyProjectiles } from './components/EnemyProjectiles';
import { HUD } from './components/HUD';
import { MainMenu } from './components/MainMenu';
import { MenuCamera } from './components/MenuCamera';
import { useGameStore } from './stores/gameStore';

function App() {
  const [isLocked, setIsLocked] = useState(false);
  const screen = useGameStore((s) => s.screen);
  const selectedMap = useGameStore((s) => s.selectedMap);
  const gameOver = useGameStore((s) => s.gameOver);
  const winner = useGameStore((s) => s.winner);
  const resetGame = useGameStore((s) => s.resetGame);

  useEffect(() => {
    const onChange = () => setIsLocked(!!document.pointerLockElement);
    document.addEventListener('pointerlockchange', onChange);
    return () => document.removeEventListener('pointerlockchange', onChange);
  }, []);

  return (
    <>
      {/* Main Menu */}
      {screen === 'menu' && <MainMenu />}

      {/* Paused overlay (playing but pointer unlocked) */}
      {screen === 'playing' && !isLocked && !gameOver && (
        <div
          className="overlay"
          onClick={() => {
            const canvas = document.querySelector('canvas');
            if (canvas) canvas.requestPointerLock();
          }}
        >
          <h1>PAUSED</h1>
          <p>Click to resume</p>
        </div>
      )}

      {/* HUD */}
      {screen === 'playing' && isLocked && !gameOver && <HUD />}

      {/* Game over screen */}
      {gameOver && (
        <div className="game-over">
          <h1>GAME OVER</h1>
          <div className={`result ${winner === 'player' ? 'win' : 'lose'}`}>
            {winner === 'player' ? 'VICTORY' : 'DEFEAT'}
          </div>
          <button onClick={() => { resetGame(); window.location.reload(); }}>
            PLAY AGAIN
          </button>
        </div>
      )}

      {/* 3D Scene */}
      <Canvas
        shadows
        frameloop="always"
        camera={{ fov: 70, near: 0.1, far: 1000 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.0;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        <Stats />

        <Suspense fallback={null}>
          <Physics gravity={[0, -20, 0]}>
            {screen === 'playing' && <Player />}
            {selectedMap === 'nuketown' && <NuketownMap />}
            {selectedMap === 'osaka' && <OsakaMap />}
            {selectedMap === 'vatican' && <VaticanMap />}
            {selectedMap === 'hormuz' && <HormuzMap />}
            {selectedMap === 'eisland' && <EIslandMap />}
            {screen === 'playing' && !['hormuz', 'eisland'].includes(selectedMap) && Array.from({ length: selectedMap === 'vatican' ? 100 : 20 }, (_, i) => (
              <Enemy key={i} id={i} />
            ))}
            {screen === 'playing' && selectedMap === 'hormuz' && Array.from({ length: 15 }, (_, i) => (
              <Ship key={`ship-${i}`} id={i} />
            ))}
            {screen === 'playing' && selectedMap === 'eisland' && Array.from({ length: 25 }, (_, i) => (
              <MiniPerson key={`mini-${i}`} id={i} />
            ))}
          </Physics>

          {/* Gunship platform for E Island (player rides on top) */}
          {screen === 'playing' && selectedMap === 'eisland' && <GunshipPlatform />}

          {/* Supply planes for E Island (outside physics) */}
          {screen === 'playing' && selectedMap === 'eisland' && Array.from({ length: 3 }, (_, i) => (
            <IslandPlane key={`plane-${i}`} id={i} />
          ))}

          {/* Menu camera orbit */}
          {screen === 'menu' && <MenuCamera />}

          {/* Weapon & shooting (only during gameplay) */}
          {screen === 'playing' && <SniperWeapon />}
          {screen === 'playing' && <RocketLauncher />}
          {screen === 'playing' && <WhipWeapon />}
          {screen === 'playing' && <Shooting />}
          {screen === 'playing' && <Rockets />}
          {screen === 'playing' && <EnemyProjectiles />}

          {/* ── Nuketown lighting (daytime desert) ── */}
          {selectedMap === 'nuketown' && (
            <>
              <ambientLight intensity={0.3} color="#f5e6d3" />
              <hemisphereLight color="#87ceeb" groundColor="#c4a86a" intensity={0.4} />
              <directionalLight
                position={[40, 60, 30]}
                intensity={2.8}
                color="#fff5e0"
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-far={200}
                shadow-camera-left={-60}
                shadow-camera-right={60}
                shadow-camera-top={60}
                shadow-camera-bottom={-60}
                shadow-bias={-0.0003}
                shadow-normalBias={0.02}
              />
              <directionalLight position={[-30, 20, -20]} intensity={0.4} color="#8ab4d4" />
              <directionalLight position={[0, 10, -50]} intensity={0.3} color="#ffd4a0" />
              <Environment preset="sunset" background={false} />
              <Sky
                distance={450000}
                sunPosition={[100, 40, 60]}
                inclination={0.5}
                azimuth={0.25}
                rayleigh={1.5}
                turbidity={8}
                mieCoefficient={0.005}
                mieDirectionalG={0.8}
              />
              <fog attach="fog" args={['#d4c4a0', 80, 350]} />
            </>
          )}

          {/* ── Vatican lighting (warm Mediterranean sun) ── */}
          {selectedMap === 'vatican' && (
            <>
              <ambientLight intensity={0.35} color="#fff5e8" />
              <hemisphereLight color="#87ceeb" groundColor="#d4c4a0" intensity={0.5} />
              <directionalLight
                position={[50, 70, 40]}
                intensity={2.5}
                color="#fff8e0"
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-far={250}
                shadow-camera-left={-80}
                shadow-camera-right={80}
                shadow-camera-top={80}
                shadow-camera-bottom={-80}
                shadow-bias={-0.0003}
                shadow-normalBias={0.02}
              />
              <directionalLight position={[-40, 30, -30]} intensity={0.3} color="#8ab4d4" />
              <Environment preset="sunset" background={false} />
              <Sky
                distance={450000}
                sunPosition={[100, 50, 60]}
                inclination={0.5}
                azimuth={0.25}
                rayleigh={1.2}
                turbidity={6}
                mieCoefficient={0.003}
                mieDirectionalG={0.8}
              />
              <fog attach="fog" args={['#d8d0c0', 100, 400]} />
            </>
          )}

          {/* ── Hormuz lighting (harsh Middle Eastern sun over ocean) ── */}
          {selectedMap === 'hormuz' && (
            <>
              <ambientLight intensity={0.4} color="#e8e0d0" />
              <hemisphereLight color="#88bbdd" groundColor="#a09070" intensity={0.5} />
              <directionalLight
                position={[60, 80, -30]}
                intensity={3}
                color="#fff8e0"
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-far={300}
                shadow-camera-left={-100}
                shadow-camera-right={100}
                shadow-camera-top={100}
                shadow-camera-bottom={-100}
                shadow-bias={-0.0003}
                shadow-normalBias={0.02}
              />
              <directionalLight position={[-40, 30, 20]} intensity={0.3} color="#88aacc" />
              <Environment preset="sunset" background={false} />
              <Sky
                distance={450000}
                sunPosition={[120, 60, -50]}
                inclination={0.5}
                azimuth={0.3}
                rayleigh={1.8}
                turbidity={10}
                mieCoefficient={0.005}
                mieDirectionalG={0.8}
              />
              <fog attach="fog" args={['#b8c8d8', 80, 350]} />
            </>
          )}

          {/* ── E Island lighting (bright tropical paradise) ── */}
          {selectedMap === 'eisland' && (
            <>
              <ambientLight intensity={0.6} color="#fff8f0" />
              <hemisphereLight color="#88ddff" groundColor="#66aa44" intensity={0.7} />
              <directionalLight
                position={[40, 70, 40]}
                intensity={2.8}
                color="#fffae0"
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-far={200}
                shadow-camera-left={-80}
                shadow-camera-right={80}
                shadow-camera-top={80}
                shadow-camera-bottom={-80}
                shadow-bias={-0.0003}
                shadow-normalBias={0.02}
              />
              <directionalLight position={[-30, 20, -20]} intensity={0.4} color="#88ccdd" />
              <Environment preset="sunset" background />
              <Sky
                distance={450000}
                sunPosition={[80, 50, 60]}
                inclination={0.5}
                azimuth={0.25}
                rayleigh={1}
                turbidity={4}
                mieCoefficient={0.003}
                mieDirectionalG={0.8}
              />
              <fog attach="fog" args={['#c8e8f8', 120, 450]} />
            </>
          )}

          {/* ── Osaka lighting (nighttime neon) ── */}
          {selectedMap === 'osaka' && (
            <>
              <Environment preset="night" background={false} />
              <Sky
                distance={450000}
                sunPosition={[0, -10, 0]}
                inclination={0}
                azimuth={0.25}
                rayleigh={0}
                turbidity={10}
              />
              <fog attach="fog" args={['#0a0a18', 40, 120]} />
            </>
          )}

          {/* Post-processing */}
          <EffectComposer multisampling={0}>
            <Bloom
              intensity={0.15}
              luminanceThreshold={0.8}
              luminanceSmoothing={0.08}
              mipmapBlur
            />
            <ChromaticAberration
              offset={new THREE.Vector2(0.0004, 0.0004)}
              radialModulation
              modulationOffset={0.5}
              blendFunction={BlendFunction.NORMAL}
            />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            <Vignette
              offset={0.25}
              darkness={0.55}
              blendFunction={BlendFunction.NORMAL}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </>
  );
}

export default App;

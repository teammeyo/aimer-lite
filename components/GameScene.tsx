
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Grid, Line, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { TargetData, GameState, GameSettings, GameMode } from '../types';
import { playShootSound, playHitSound, playHeadshotSound, playBodyHitSound } from '../utils/audio';

// Fix: Augment JSX.IntrinsicElements to include Three.js primitives
declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any;
      group: any;
      icosahedronGeometry: any;
      meshBasicMaterial: any;
      boxGeometry: any;
      capsuleGeometry: any;
      sphereGeometry: any;
      meshStandardMaterial: any;
      planeGeometry: any;
      cylinderGeometry: any;
      hemisphereLight: any;
      directionalLight: any;
      ambientLight: any;
      color: any;
      [elemName: string]: any;
    }
  }
}

interface GameSceneProps {
  gameState: GameState;
  gameMode: GameMode;
  settings: GameSettings;
  onHit: (points?: number) => void;
  onMiss: () => void;
  setGameState: (state: GameState) => void;
}

// Camera Controller to update FOV dynamically
const CameraController = ({ fov }: { fov: number }) => {
  const { camera } = useThree();
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }, [fov, camera]);
  return null;
};

// Custom FPS Controls to handle sensitivity and Raw Input
const FPSControls = ({ sensitivity, isPlaying }: { sensitivity: number, isPlaying: boolean }) => {
  const { camera, gl } = useThree();
  
  useEffect(() => {
    const requestLock = async () => {
      if (isPlaying) {
         try {
           // @ts-ignore: unadjustedMovement is a newer API option for Raw Input
           const promise = gl.domElement.requestPointerLock({ unadjustedMovement: true });
           if (promise) {
             await promise.catch(() => {
                // Fallback if unadjustedMovement is not supported
                gl.domElement.requestPointerLock();
             });
           }
         } catch (e) {
           gl.domElement.requestPointerLock();
         }
      }
    };

    if (isPlaying) {
       requestLock();
    }

    const handleClick = () => {
      if (document.pointerLockElement !== gl.domElement && isPlaying) {
        requestLock();
      }
    };

    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
      document.exitPointerLock();
    };
  }, [gl, isPlaying]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === gl.domElement && isPlaying) {
        // Prevent camera jumps/glitches:
        // Lowered threshold to 600 to catch smaller re-centering spikes while allowing fast flicks.
        // Also verify valid numbers.
        if (Math.abs(e.movementX) > 600 || Math.abs(e.movementY) > 600) return;

        camera.rotation.order = 'YXZ';
        const scale = 0.002 * sensitivity;
        camera.rotation.y -= e.movementX * scale;
        camera.rotation.x -= e.movementY * scale;
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    return () => document.removeEventListener('mousemove', onMouseMove);
  }, [camera, gl, isPlaying, sensitivity]);

  return null;
};

// --- Visual Effects Components ---

interface FloatingItemProps {
  position: [number, number, number];
  scale: number;
  rotationSpeed: [number, number, number];
  color: string;
}

const FloatingItem: React.FC<FloatingItemProps> = ({ position, scale, rotationSpeed, color }) => {
  const ref = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.x += rotationSpeed[0];
      ref.current.rotation.y += rotationSpeed[1];
      ref.current.rotation.z += rotationSpeed[2];
    }
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <icosahedronGeometry args={[1, 0]} />
      <meshBasicMaterial color={color} wireframe transparent opacity={0.2} />
    </mesh>
  );
};

// Background floating geometric shapes to fill the void
const Decorations = React.memo(({ color }: { color: string }) => {
  const items = useMemo(() => {
    return new Array(20).fill(0).map(() => ({
      position: [
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 40,
        -15 - Math.random() * 30
      ] as [number, number, number],
      scale: 0.5 + Math.random() * 1.5,
      rotationSpeed: [
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01
      ] as [number, number, number]
    }));
  }, []);

  return (
    <group>
      {items.map((item, i) => (
        <FloatingItem key={i} {...item} color={color} />
      ))}
    </group>
  );
});

interface ExplosionProps {
  position: [number, number, number];
  color: string;
  onComplete: () => void;
}

// Particle Explosion Effect
const Explosion: React.FC<ExplosionProps> = ({ position, color, onComplete }) => {
  const group = useRef<THREE.Group>(null);
  const particles = useMemo(() => {
    return new Array(8).fill(0).map(() => ({
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      ),
      scale: 0.2 + Math.random() * 0.3
    }));
  }, []);

  useFrame((state, delta) => {
    if (group.current) {
      let active = false;
      group.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const p = particles[i];
        
        // Move
        mesh.position.addScaledVector(p.velocity, delta);
        
        // Rotate
        mesh.rotation.x += delta * 5;
        mesh.rotation.y += delta * 5;
        
        // Shrink
        mesh.scale.multiplyScalar(0.92);
        
        if (mesh.scale.x > 0.01) active = true;
      });

      if (!active) {
        onComplete();
      }
    }
  });

  return (
    <group ref={group} position={position}>
      {particles.map((p, i) => (
        <mesh key={i} scale={p.scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color={color} transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
});

// Teleport Trail Effect (Ghost + Beam)
interface TeleportTrailProps {
    start: [number, number, number];
    end: [number, number, number];
    color: string;
    onComplete: () => void;
    targetSize: number;
}

const TeleportTrail: React.FC<TeleportTrailProps> = ({ start, end, color, onComplete, targetSize }) => {
    const [opacity, setOpacity] = useState(0.6);
    const bodyHeight = 1.4;
    const bodyRadius = 0.45;
    const headRadius = 0.3;

    useFrame((_, delta) => {
        setOpacity(prev => prev - delta * 2.5); // Fade out fast
        if (opacity <= 0) onComplete();
    });

    if (opacity <= 0) return null;

    return (
        <group>
            {/* Ghost at Start Position */}
            <group position={start} scale={targetSize}>
                 {/* Head Ghost - use updated Y offset 0.25 */}
                 <group position={[0, bodyHeight / 2 + headRadius + 0.25, 0]}>
                    <mesh>
                        <sphereGeometry args={[headRadius, 8, 8]} />
                        <meshBasicMaterial color={color} wireframe transparent opacity={opacity} />
                    </mesh>
                </group>
                <group position={[0, 0, 0]}>
                    <mesh>
                        <capsuleGeometry args={[bodyRadius, bodyHeight, 4, 8]} />
                        <meshBasicMaterial color={color} wireframe transparent opacity={opacity} />
                    </mesh>
                </group>
            </group>

            {/* Connecting Beam */}
            <Line 
                points={[start, end]}
                color={color}
                lineWidth={2}
                transparent
                opacity={opacity * 0.8}
            />
        </group>
    );
};

// --- Game Object Components ---

interface TargetProps {
  id: number;
  position: [number, number, number];
  color: string;
  outlineColor: string;
  gameMode: GameMode;
  onExpired: (id: number) => void;
  hp: number;
  maxHp: number;
  velocity?: [number, number, number]; // For tracking mode
  targetSize: number;
  trackingJump?: boolean;
}

// Tracking Target: Strafe & Jump Physics with Human Model
const TrackingTarget = React.memo(({ id, position, color, outlineColor, hp, maxHp, targetSize, trackingJump }: TargetProps) => {
  const meshRef = useRef<THREE.Group>(null);
  const [flash, setFlash] = useState(0);

  // Physics State
  // We use refs for physics to avoid React render loop overhead
  const velocity = useRef(new THREE.Vector3(
      (Math.random() > 0.5 ? 1 : -1) * 8, // Initial X speed (Strafe)
      0, 
      0
  ));
  const gravity = 35;
  const jumpForce = 14;
  const groundLevel = -2; // Virtual floor height
  const moveSpeed = 10;
  const nextDirChange = useRef(0);

  // Update visual flash when damaged
  useEffect(() => {
     if (hp < maxHp) { 
        setFlash(1); 
     }
  }, [hp, maxHp]);

  useFrame((state, delta) => {
      if (!meshRef.current) return;
      
      const time = state.clock.elapsedTime;

      // Reduce flash
      if (flash > 0) setFlash(f => Math.max(0, f - delta * 10));

      // 1. Gravity
      velocity.current.y -= gravity * delta;

      // 2. Apply Velocity
      const currentPos = meshRef.current.position;
      const moveStep = velocity.current.clone().multiplyScalar(delta);
      currentPos.add(moveStep);

      // 3. Ground Collision
      let isGrounded = false;
      if (currentPos.y <= groundLevel) {
          currentPos.y = groundLevel;
          velocity.current.y = 0;
          isGrounded = true;
      }

      // 4. Wall Collision (Bounds)
      const xLimit = 16;
      if (currentPos.x > xLimit) {
          currentPos.x = xLimit;
          velocity.current.x = -Math.abs(velocity.current.x);
      } else if (currentPos.x < -xLimit) {
          currentPos.x = -xLimit;
          velocity.current.x = Math.abs(velocity.current.x);
      }

      // 5. AI Logic: Jump
      // Chance to jump if grounded AND jumping is enabled
      if (isGrounded && trackingJump) {
          // reduced jump probability (0.3%)
          if (Math.random() < 0.003) {
              velocity.current.y = jumpForce;
              isGrounded = false;
          }
      }

      // 6. AI Logic: Change Direction (Strafe)
      if (time > nextDirChange.current) {
          // Set next change time (random 0.5s - 2.0s)
          nextDirChange.current = time + 0.5 + Math.random() * 1.5;
          
          // Pick new direction or stop briefly
          const r = Math.random();
          if (r < 0.2) {
              // Stop briefly
              velocity.current.x = 0;
          } else {
              // Move Left or Right
              velocity.current.x = (Math.random() > 0.5 ? 1 : -1) * (moveSpeed * (0.8 + Math.random() * 0.4));
          }
      } else {
           // Accelerate back to speed if we were stopped and need to move (simple inertia)
           if (Math.abs(velocity.current.x) < 0.1 && Math.random() < 0.05) {
                velocity.current.x = (Math.random() > 0.5 ? 1 : -1) * moveSpeed;
           }
      }
  });

  const displayColor = new THREE.Color(color).lerp(new THREE.Color('white'), flash);
  const bodyHeight = 1.4;
  const bodyRadius = 0.45;
  const headRadius = 0.3;
  
  // HP Bar Logic
  const hpPct = Math.max(0, hp / maxHp);
  const barWidth = 1.2;
  const barHeight = 0.15;
  const currentBarWidth = barWidth * hpPct;
  const hpBarColor = hpPct > 0.5 ? '#22c55e' : '#ef4444'; // Green to Red

  return (
    <group ref={meshRef} position={position} scale={targetSize}>
        {/* HP Bar - Always face camera */}
        <Billboard position={[0, bodyHeight / 2 + headRadius + 0.8, 0]}>
             {/* Background */}
             <mesh position={[0, 0, -0.01]}>
                 <planeGeometry args={[barWidth + 0.04, barHeight + 0.04]} />
                 <meshBasicMaterial color="#000000" transparent opacity={0.6} />
             </mesh>
             {/* Fill - Offset x to align left */}
             <mesh position={[(currentBarWidth - barWidth) / 2, 0, 0]}>
                 <planeGeometry args={[currentBarWidth, barHeight]} />
                 <meshBasicMaterial color={hpBarColor} />
             </mesh>
        </Billboard>

        {/* Reuse Human Geometry for Tracking */}
        {/* HEAD */}
        <group position={[0, bodyHeight / 2 + headRadius + 0.25, 0]}>
            {/* Hitbox */}
            <mesh name="human-head" userData={{ id, type: 'head' }}>
                <sphereGeometry args={[headRadius * 1.2, 12, 12]} />
                <meshBasicMaterial visible={false} />
            </mesh>
            {/* Visual */}
            <mesh>
                <sphereGeometry args={[headRadius, 16, 16]} />
                <meshStandardMaterial color={displayColor} roughness={0.3} metalness={0.2} />
            </mesh>
            {/* Outline */}
            <mesh>
                <sphereGeometry args={[headRadius * 1.05, 16, 16]} />
                <meshBasicMaterial color={outlineColor} side={THREE.BackSide} toneMapped={false} />
            </mesh>
        </group>

        {/* BODY */}
        <group position={[0, 0, 0]}>
             {/* Hitbox */}
            <mesh name="human-body" userData={{ id, type: 'body' }}>
                <cylinderGeometry args={[bodyRadius * 1.1, bodyRadius * 1.1, bodyHeight, 8]} />
                <meshBasicMaterial visible={false} />
            </mesh>
            {/* Visual */}
            <mesh>
                <capsuleGeometry args={[bodyRadius, bodyHeight, 4, 8]} />
                <meshStandardMaterial color={displayColor} roughness={0.3} metalness={0.2} />
            </mesh>
            {/* Outline */}
            <mesh>
                <capsuleGeometry args={[bodyRadius * 1.05, bodyHeight * 1.02, 4, 8]} />
                <meshBasicMaterial color={outlineColor} side={THREE.BackSide} toneMapped={false} />
            </mesh>
        </group>
    </group>
  );
});

// Human Target: Capsule Body + Sphere Head
const HumanTarget = React.memo(({ id, position, color, outlineColor, hp, maxHp, targetSize }: TargetProps) => {
    const groupRef = useRef<THREE.Group>(null);
    const [flash, setFlash] = useState(0);

    // Flash effect on damage (when HP < max)
    useEffect(() => {
        if (hp < maxHp) {
            setFlash(1); // Full flash intensity
        }
    }, [hp, maxHp]);

    useFrame((state, delta) => {
        if (flash > 0) {
            setFlash(f => Math.max(0, f - delta * 5));
        }
        if (groupRef.current) {
            // Gentle bobbing
            groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3 + id) * 0.05;
        }
    });

    const bodyHeight = 1.4;
    const bodyRadius = 0.45;
    const headRadius = 0.3;

    // Mix color with white based on flash
    const displayColor = new THREE.Color(color).lerp(new THREE.Color('white'), flash);

    return (
        <group ref={groupRef} position={position} scale={targetSize}>
            {/* HEAD - Moved up slightly for better separation */}
            <group position={[0, bodyHeight / 2 + headRadius + 0.25, 0]}>
                {/* Hitbox */}
                <mesh name="human-head" userData={{ id, type: 'head' }}>
                    <sphereGeometry args={[headRadius * 1.2, 12, 12]} />
                    <meshBasicMaterial visible={false} />
                </mesh>
                {/* Visual */}
                <mesh>
                    <sphereGeometry args={[headRadius, 16, 16]} />
                    <meshStandardMaterial color={displayColor} roughness={0.3} metalness={0.2} />
                </mesh>
                {/* Outline */}
                <mesh>
                    <sphereGeometry args={[headRadius * 1.05, 16, 16]} />
                    <meshBasicMaterial color={outlineColor} side={THREE.BackSide} toneMapped={false} />
                </mesh>
            </group>

            {/* BODY */}
            <group position={[0, 0, 0]}>
                 {/* Hitbox */}
                <mesh name="human-body" userData={{ id, type: 'body' }}>
                     {/* Capsule represented as cylinder for hit detection simplicity */}
                    <cylinderGeometry args={[bodyRadius * 1.1, bodyRadius * 1.1, bodyHeight, 8]} />
                    <meshBasicMaterial visible={false} />
                </mesh>
                {/* Visual */}
                <mesh>
                    <capsuleGeometry args={[bodyRadius, bodyHeight, 4, 8]} />
                    <meshStandardMaterial color={displayColor} roughness={0.3} metalness={0.2} />
                </mesh>
                {/* Outline */}
                <mesh>
                    <capsuleGeometry args={[bodyRadius * 1.05, bodyHeight * 1.02, 4, 8]} />
                    <meshBasicMaterial color={outlineColor} side={THREE.BackSide} toneMapped={false} />
                </mesh>
            </group>
        </group>
    );
});

// Standard Sphere Target
const SphereTarget = React.memo(({ id, position, color, outlineColor, gameMode, onExpired, targetSize }: TargetProps) => {
  const meshRef = useRef<THREE.Group>(null);
  const [scale, setScale] = useState(0);
  const [spawnTime] = useState(Date.now());
  const hasExpired = useRef(false);

  // Blinkshot Lifetime (ms)
  const LIFETIME = 1100; 

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    if (gameMode === GameMode.BLINK_SHOT && !hasExpired.current) {
        const elapsed = Date.now() - spawnTime;
        if (elapsed > LIFETIME) {
            hasExpired.current = true;
            onExpired(id);
        }
        if (elapsed > LIFETIME - 200) {
             const remaining = LIFETIME - elapsed;
             // Shrink animation: scale down from targetSize
             const shrinkFactor = Math.max(0, remaining / 200);
             meshRef.current.scale.setScalar(shrinkFactor * targetSize);
        } else if (scale < 1) {
             setScale(s => Math.min(s + delta * 15, 1));
             meshRef.current.scale.setScalar(Math.min(scale + delta * 15, 1) * targetSize);
        }
    } else {
        if (scale < 1) {
            setScale(s => Math.min(s + delta * 12, 1));
            // Apply scale multiplier
            meshRef.current.scale.setScalar(scale * targetSize);
        }
    }

    meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + id) * 0.1;
  });

  return (
    <group ref={meshRef} position={position}>
      <mesh name="target-mesh" userData={{ id, type: 'sphere' }}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={new THREE.Color(color).multiplyScalar(0.2)}
          emissiveIntensity={0.5}
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.53, 32, 32]} />
        <meshBasicMaterial color={outlineColor} side={THREE.BackSide} toneMapped={false} />
      </mesh>
    </group>
  );
});

const Room = ({ gridColor, groundColor }: { gridColor: string, groundColor: string }) => (
  <group>
    {/* Ground Plane: Rendered first with polygonOffset to push it back in depth buffer, preventing Z-fighting with Grid */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10.1, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial 
          color={groundColor} 
          toneMapped={false} 
          polygonOffset={true}
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
    </mesh>
    
    <Grid
      position={[0, -10, 0]}
      args={[60, 60]}
      cellSize={2}
      cellThickness={1}
      cellColor={gridColor}
      sectionSize={10}
      sectionThickness={1.5}
      sectionColor={gridColor}
      fadeDistance={80}
      infiniteGrid
    />
    
    <Grid
      position={[0, 15, 0]}
      args={[60, 60]}
      cellSize={4}
      cellThickness={1}
      cellColor={gridColor}
      sectionSize={20}
      sectionThickness={1}
      sectionColor={gridColor}
      fadeDistance={80}
      infiniteGrid
      visible={false} 
    />
  </group>
);

const RaycastHandler = ({ 
  gameState, 
  gameMode,
  onTargetHit, 
  onMiss,
  volume 
}: { 
  gameState: GameState;
  gameMode: GameMode;
  onTargetHit: (id: number, position: THREE.Vector3, part: 'head' | 'body' | 'sphere') => void;
  onMiss: () => void;
  volume: number;
}) => {
  const { camera, scene } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const isMouseDown = useRef(false);
  const lastTickTime = useRef(0);

  // Mousedown listener for single-click modes AND start of hold for tracking
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (gameState !== GameState.PLAYING) return;
      if (e.button !== 0) return; 

      isMouseDown.current = true;

      // In tracking mode, shooting is handled in useFrame loop
      if (gameMode === GameMode.TRACKING) return;

      // Standard single shot logic
      playShootSound(volume);

      raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera);
      const intersects = raycaster.current.intersectObjects(scene.children, true);

      let hitTarget = false;

      for (const intersect of intersects) {
        const name = intersect.object.name;
        if (name === 'target-mesh' || name === 'human-head' || name === 'human-body') {
          const id = intersect.object.userData.id;
          const type = intersect.object.userData.type || 'sphere';
          const targetPos = new THREE.Vector3();
          intersect.object.getWorldPosition(targetPos);
          onTargetHit(id, targetPos, type as any);
          hitTarget = true;
          break;
        }
      }

      if (!hitTarget) {
        onMiss();
      }
    };

    const handleMouseUp = () => {
        isMouseDown.current = false;
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
        document.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [gameState, gameMode, camera, scene, onTargetHit, onMiss, volume]);

  // Tracking Mode Loop (Continuous Fire)
  useFrame((state) => {
      if (gameState !== GameState.PLAYING || gameMode !== GameMode.TRACKING) return;
      
      if (isMouseDown.current) {
          const now = state.clock.elapsedTime * 1000;
          // Fire rate: every 60ms (~16 shots/sec)
          if (now - lastTickTime.current > 60) {
              lastTickTime.current = now;
              
              // Shoot ray
              raycaster.current.setFromCamera(new THREE.Vector2(0, 0), camera);
              const intersects = raycaster.current.intersectObjects(scene.children, true);
              
              let hitTarget = false;
              for (const intersect of intersects) {
                const name = intersect.object.name;
                // Accept human parts as valid targets in tracking mode
                if (name === 'target-mesh' || name === 'human-head' || name === 'human-body') {
                  const id = intersect.object.userData.id;
                  const type = intersect.object.userData.type || 'sphere'; // 'head', 'body', 'sphere'
                  const targetPos = new THREE.Vector3();
                  intersect.object.getWorldPosition(targetPos);
                  onTargetHit(id, targetPos, type as any);
                  hitTarget = true;
                  break;
                }
              }

              if (hitTarget) {
                 // Play a quieter hit sound for tracking tick
                 playBodyHitSound(volume * 0.5); 
              } else {
                 onMiss();
              }
          }
      }
  });

  return null;
};

const GameScene: React.FC<GameSceneProps> = ({ gameState, gameMode, settings, onHit, onMiss }) => {
  const [targets, setTargets] = useState<TargetData[]>([]);
  const targetsRef = useRef<TargetData[]>([]);
  const [explosions, setExplosions] = useState<{id: number, pos: [number, number, number], color: string}[]>([]);
  const [teleportTrails, setTeleportTrails] = useState<{id: number, start: [number, number, number], end: [number, number, number], color: string}[]>([]);
  
  const nextId = useRef(0);
  const explosionId = useRef(0);
  const trailId = useRef(0);
  const lastTargetPos = useRef<[number, number]>([0, 0]);
  const isSpiderCenter = useRef(true);
  const blinkClusterOrigin = useRef<[number, number]>([0, 0]);
  const prevGameMode = useRef<GameMode>(gameMode);

  useEffect(() => {
    targetsRef.current = [...targets];
  }, [targets]);

  const randomizeBlinkCluster = useCallback(() => {
      blinkClusterOrigin.current = [
          (Math.random() - 0.5) * 16,
          (Math.random() * 8) - 4
      ];
  }, []);

  const spawnTarget = useCallback((originPos?: [number, number, number]) => {
    const z = -12;
    let x = 0;
    let y = 0;
    let maxHp = 1;
    let velocity: [number, number, number] | undefined = undefined;
    
    let attempts = 0;
    let validPosition = false;
    
    // Adjust collision distance based on target size
    // Base distance ~1.3 for size 1.0. Scale linearly.
    const minDistance = 1.3 * settings.targetSize; 

    if (gameMode === GameMode.HUMAN_STRAFE) {
        maxHp = 2; // Humans have 2 HP
    } else if (gameMode === GameMode.TRACKING) {
        maxHp = 50; // Tracking target has high HP
    }

    while (!validPosition && attempts < 150) {
      switch (gameMode) {
        case GameMode.GRID_SHOT: {
          const cols = [-6, -3, 0, 3, 6];
          const rows = [-3, 0, 3];
          x = cols[Math.floor(Math.random() * cols.length)] + (Math.random() - 0.5) * 0.2;
          y = rows[Math.floor(Math.random() * rows.length)] + (Math.random() - 0.5) * 0.2;
          break;
        }
        case GameMode.SPIDER_SHOT: {
          if (isSpiderCenter.current) {
             x = 0; y = 0;
          } else {
             const angle = Math.random() * Math.PI * 2;
             const dist = 4 + Math.random() * 5; 
             x = Math.cos(angle) * dist; y = Math.sin(angle) * (dist * 0.6); 
          }
          break;
        }
        case GameMode.MICRO_SHOT: {
          const [lx, ly] = lastTargetPos.current;
          
          if (attempts < 60) {
              // Tighter micro range: +/- 1.5 X, +/- 1.0 Y. Scaled by target size to maintain relative difficulty.
              const range = Math.max(1, settings.targetSize);
              x = lx + (Math.random() - 0.5) * (3.0 * range); 
              y = ly + (Math.random() - 0.5) * (2.0 * range);
          } else if (attempts < 120) {
              // Relaxed range: +/- 3.0 X, +/- 2.0 Y. Scaled by target size.
              const range = Math.max(1, settings.targetSize);
              x = lx + (Math.random() - 0.5) * (6.0 * range);
              y = ly + (Math.random() - 0.5) * (4.0 * range);
          } else {
              // Full screen fallback
              x = (Math.random() - 0.5) * 18; 
              y = (Math.random() * 8) - 4;
          }

          x = Math.max(-10, Math.min(10, x)); 
          y = Math.max(-5, Math.min(5, y));
          break;
        }
        case GameMode.BLINK_SHOT: {
           const [cx, cy] = blinkClusterOrigin.current;

           if (attempts < 60) {
               // Stage 1: Tight Cluster
               // Scale spread by targetSize to ensure big targets can fit in the "tight" concept without overlapping immediately
               const spread = 3.0 * Math.max(1, settings.targetSize * 0.8);
               x = cx + (Math.random() - 0.5) * spread; 
               y = cy + (Math.random() - 0.5) * spread;
           } else if (attempts < 120) {
               // Stage 2: Expanded Cluster (Intermediate Fallback)
               // Instead of jumping to full screen, try a wider area around the cluster center
               x = cx + (Math.random() - 0.5) * 10.0;
               y = cy + (Math.random() - 0.5) * 8.0;
           } else {
               // Stage 3: Full Screen Fallback (Last resort)
               x = (Math.random() - 0.5) * 28; 
               y = (Math.random() * 8) - 4;
           }

           x = Math.max(-14, Math.min(14, x)); 
           y = Math.max(-7, Math.min(7, y));
           break;
        }
        case GameMode.HUMAN_STRAFE: {
            x = (Math.random() - 0.5) * 16;
            y = -1; 
            break;
        }
        case GameMode.TRACKING: {
            // Random start position near "ground"
            x = (Math.random() - 0.5) * 12;
            y = -1; // Start slightly above ground
            velocity = [0, 0, 0]; // Velocity managed by component now
            break;
        }
        case GameMode.STANDARD:
        default: {
          x = (Math.random() - 0.5) * 18; y = (Math.random() * 8) - 4; 
          break;
        }
      }

      validPosition = true;
      for (const t of targetsRef.current) {
          const dx = t.position[0] - x;
          const dy = t.position[1] - y;
          const distSq = dx*dx + dy*dy;
          if (distSq < minDistance * minDistance) {
              validPosition = false;
              break;
          }
      }
      attempts++;
    }

    // Only spawn if we found a valid non-overlapping position
    if (validPosition) {
      if (gameMode === GameMode.SPIDER_SHOT) isSpiderCenter.current = !isSpiderCenter.current;
      lastTargetPos.current = [x, y];
      
      const newTarget: TargetData = { 
          id: nextId.current++, 
          position: [x, y, z], 
          spawnTime: performance.now(),
          hp: maxHp,
          maxHp: maxHp,
          velocity: velocity
      };

      if (originPos) {
          const tId = trailId.current++;
          setTeleportTrails(prev => [...prev, {
              id: tId,
              start: originPos,
              end: [x, y, z],
              color: settings.enemyOutlineColor
          }]);
      }

      targetsRef.current.push(newTarget);
      setTargets(prev => [...prev, newTarget]);
    }
  }, [gameMode, settings.enemyOutlineColor, settings.targetSize]);

  const handleTargetHit = useCallback((id: number, pos: THREE.Vector3, part: 'head' | 'body' | 'sphere') => {
    // Find target
    const targetIndex = targetsRef.current.findIndex(t => t.id === id);
    if (targetIndex === -1) return;

    const target = targetsRef.current[targetIndex];
    
    let damage = 1;
    let isDead = false;

    // Damage Logic
    if (gameMode === GameMode.TRACKING) {
        // Tracking Mode Logic
        // Headshots deal 2x damage, bodyshots deal 1x
        damage = part === 'head' ? 2 : 1;

        if (part === 'head') {
            playHeadshotSound(settings.volume * 0.5); // Lower volume feedback
            onHit(100); // 100 points for head tracking tick
        } else {
            onHit(50); // 50 points for body tracking tick
        }

        if (target.hp - damage <= 0) {
            playHitSound(settings.volume);
            isDead = true;
        }
    } else {
        // Standard Modes (Human Strafe, etc.)
        if (part === 'head') {
            damage = 100; // Instakill
            playHeadshotSound(settings.volume);
            isDead = true;
        } else if (part === 'body') {
            damage = 1;
            if (target.hp - damage <= 0) {
                playHitSound(settings.volume); // Kill sound
                isDead = true;
            } else {
                playBodyHitSound(settings.volume); // Dull thud
                isDead = false;
            }
        } else {
            // Sphere
            playHitSound(settings.volume);
            isDead = true;
        }
    }

    if (isDead) {
        // Only award kill points for non-tracking modes (tracking awards points per tick)
        if (gameMode !== GameMode.TRACKING) {
            onHit(100);
        }
        
        // Explosion
        const exId = explosionId.current++;
        const exColor = part === 'head' ? '#fbbf24' : settings.targetColor;
        setExplosions(prev => [...prev, { id: exId, pos: pos.toArray() as [number, number, number], color: exColor }]);
        
        // Remove
        targetsRef.current = targetsRef.current.filter(t => t.id !== id);
        setTargets(prev => prev.filter(t => t.id !== id));
        
        // Respawn Logic
        if (gameMode === GameMode.BLINK_SHOT) {
            if (targetsRef.current.length === 0) {
                randomizeBlinkCluster();
                spawnTarget(); spawnTarget(); spawnTarget();
            }
        } else if (gameMode === GameMode.HUMAN_STRAFE) {
            spawnTarget(target.position);
        } else if (gameMode === GameMode.TRACKING) {
            // Respawn instantly for tracking
            spawnTarget();
        } else {
            spawnTarget();
        }
    } else {
        // Just Update HP
        const updatedTarget = { ...target, hp: target.hp - damage };
        targetsRef.current[targetIndex] = updatedTarget;
        setTargets(prev => prev.map(t => t.id === id ? updatedTarget : t));
    }

  }, [onHit, spawnTarget, settings.targetColor, settings.volume, gameMode, randomizeBlinkCluster]);

  const handleTargetExpired = useCallback((id: number) => {
      onMiss(); 
      targetsRef.current = targetsRef.current.filter(t => t.id !== id);
      setTargets(prev => prev.filter(t => t.id !== id));
      
      if (gameMode === GameMode.BLINK_SHOT) {
          if (targetsRef.current.length === 0) {
              randomizeBlinkCluster();
              spawnTarget(); spawnTarget(); spawnTarget();
          }
      } else {
          spawnTarget();
      }
  }, [onMiss, spawnTarget, gameMode, randomizeBlinkCluster]);

  const removeExplosion = useCallback((id: number) => {
      setExplosions(prev => prev.filter(e => e.id !== id));
  }, []);

  const removeTrail = useCallback((id: number) => {
      setTeleportTrails(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
     // Prepare Scene on Countdown or Menu
     if (gameState === GameState.COUNTDOWN || gameState === GameState.MENU) {
         setTargets([]);
         targetsRef.current = [];
         setExplosions([]);
         setTeleportTrails([]);
         isSpiderCenter.current = true;
         prevGameMode.current = gameMode;
     }

     // Initialize targets when switching to PLAYING (after countdown)
     if (gameState === GameState.PLAYING && targetsRef.current.length === 0) {
         setTargets([]);
         targetsRef.current = [];
         isSpiderCenter.current = true; 
         
         const count = (gameMode === GameMode.SPIDER_SHOT) ? 1 : (gameMode === GameMode.HUMAN_STRAFE ? 1 : (gameMode === GameMode.TRACKING ? 1 : 4)); 
         
         if (gameMode === GameMode.BLINK_SHOT) {
             randomizeBlinkCluster();
             spawnTarget(); spawnTarget(); spawnTarget();
         } else {
             for(let i=0; i<count; i++) spawnTarget();
         }
     }

     // Detect Dynamic Mode Switching (Marathon)
     if (gameState === GameState.PLAYING && prevGameMode.current !== gameMode) {
         // Reset targets for new mode
         setTargets([]);
         targetsRef.current = [];
         setExplosions([]);
         setTeleportTrails([]);
         isSpiderCenter.current = true;

         const count = (gameMode === GameMode.SPIDER_SHOT) ? 1 : (gameMode === GameMode.HUMAN_STRAFE ? 1 : (gameMode === GameMode.TRACKING ? 1 : 4)); 
         
         if (gameMode === GameMode.BLINK_SHOT) {
             randomizeBlinkCluster();
             spawnTarget(); spawnTarget(); spawnTarget();
         } else {
             for(let i=0; i<count; i++) spawnTarget();
         }
         prevGameMode.current = gameMode;
     }

  }, [gameMode, gameState, spawnTarget, randomizeBlinkCluster]);

  return (
    <Canvas
      dpr={[1, 2]}
      className="w-full h-full"
      shadows={false}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
    >
      <color attach="background" args={[settings.skyColor]} />
      <CameraController fov={settings.fov} />
      
      <FPSControls 
        sensitivity={settings.sensitivity} 
        isPlaying={gameState === GameState.PLAYING || gameState === GameState.COUNTDOWN} 
      />
      
      <RaycastHandler 
        gameState={gameState} 
        gameMode={gameMode}
        onTargetHit={handleTargetHit} 
        onMiss={onMiss} 
        volume={settings.volume}
      />
      
      <hemisphereLight intensity={0.6} groundColor={settings.skyColor} skyColor="#ffffff" />
      <directionalLight position={[10, 20, 10]} intensity={0.8} />
      <ambientLight intensity={0.4} />

      <Room gridColor={settings.gridColor} groundColor={settings.groundColor} />
      <Decorations color={settings.gridColor} />

      {targets.map(target => (
        gameMode === GameMode.HUMAN_STRAFE ? (
            <HumanTarget
                key={target.id}
                id={target.id}
                position={target.position}
                color={settings.targetColor}
                outlineColor={settings.enemyOutlineColor}
                gameMode={gameMode}
                onExpired={handleTargetExpired}
                hp={target.hp}
                maxHp={target.maxHp}
                targetSize={settings.targetSize}
            />
        ) : gameMode === GameMode.TRACKING ? (
             <TrackingTarget
                key={target.id}
                id={target.id}
                position={target.position}
                velocity={target.velocity}
                color={settings.targetColor}
                outlineColor={settings.enemyOutlineColor}
                gameMode={gameMode}
                onExpired={handleTargetExpired}
                hp={target.hp}
                maxHp={target.maxHp}
                targetSize={settings.targetSize}
                trackingJump={settings.trackingJump}
            />
        ) : (
            <SphereTarget
                key={target.id}
                id={target.id}
                position={target.position}
                color={settings.targetColor}
                outlineColor={settings.enemyOutlineColor}
                gameMode={gameMode}
                onExpired={handleTargetExpired}
                hp={target.hp}
                maxHp={target.maxHp}
                targetSize={settings.targetSize}
            />
        )
      ))}
      
      {explosions.map(ex => (
        <Explosion 
            key={ex.id} 
            position={ex.pos} 
            color={ex.color} 
            onComplete={() => removeExplosion(ex.id)}
        />
      ))}

      {teleportTrails.map(trail => (
          <TeleportTrail 
             key={trail.id}
             start={trail.start}
             end={trail.end}
             color={trail.color}
             onComplete={() => removeTrail(trail.id)}
             targetSize={settings.targetSize}
          />
      ))}
    </Canvas>
  );
};

export default GameScene;

"use client";

import { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, MeshDistortMaterial, Float } from "@react-three/drei";
import * as THREE from "three";
import { motion } from "framer-motion";

interface Avatar3DProps {
  level?: number;
  className?: string;
}

/**
 * 3D Character Avatar Component using Three.js
 * Features:
 * - Animated energy orb that evolves with level
 * - Neon glow effects using shaders
 * - Floating animation
 * - Interactive rotation
 */
function EnergyCore({ level = 1 }: { level?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Custom shader for neon glow effect
  const shaderData = useMemo(() => ({
    uniforms: {
      uTime: { value: 0 },
      uLevel: { value: level },
      uColor1: { value: new THREE.Color("#a855f7") }, // Purple
      uColor2: { value: new THREE.Color("#06b6d4") }, // Cyan
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      uniform float uTime;
      
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        
        vec3 pos = position;
        float wave = sin(pos.x * 3.0 + uTime) * 0.1;
        wave += sin(pos.y * 2.0 + uTime * 0.8) * 0.1;
        pos += normal * wave;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uLevel;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      varying vec2 vUv;
      varying vec3 vNormal;
      
      void main() {
        float noise = sin(vUv.x * 10.0 + uTime) * sin(vUv.y * 10.0 + uTime * 0.7);
        vec3 color = mix(uColor1, uColor2, vUv.y + noise * 0.2);
        
        // Fresnel effect for edge glow
        vec3 viewDirection = normalize(cameraPosition - vNormal);
        float fresnel = pow(1.0 - abs(dot(viewDirection, vNormal)), 3.0);
        color += vec3(0.3, 0.8, 1.0) * fresnel * 0.5;
        
        gl_FragColor = vec4(color, 0.9);
      }
    `,
  }), [level]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 64, 64]} />
        <shaderMaterial
          ref={materialRef}
          {...shaderData}
          transparent
          side={THREE.DoubleSide}
        />
      </mesh>
    </Float>
  );
}

/**
 * Orbiting particles around the core
 */
function OrbitingParticles({ count = 8 }: { count?: number }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.3;
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const radius = 1.8 + Math.random() * 0.3;
      return {
        position: [
          Math.cos(angle) * radius,
          Math.sin(angle * 2) * 0.5,
          Math.sin(angle) * radius,
        ] as [number, number, number],
        scale: 0.1 + Math.random() * 0.1,
      };
    });
  }, [count]);

  return (
    <group ref={groupRef}>
      {particles.map((particle, i) => (
        <Sphere key={i} position={particle.position} args={[particle.scale]}>
          <meshBasicMaterial color="#2de2e6" transparent opacity={0.8} />
        </Sphere>
      ))}
    </group>
  );
}

/**
 * Energy rings around the core
 */
function ConnectionLines() {
  const ref = useRef<THREE.LineSegments>(null);
  
  const points = useMemo(() => {
    const p: THREE.Vector3[] = [];
    const connections = [
      [0, 0, 0, 3, 0, 0],
      [0, 0, 0, 1.5, 2, 0],
      [0, 0, 0, -1.5, 2, 0],
      [0, 0, 0, -3, 0, 0],
      [0, 0, 0, -1.5, -2, 0],
      [0, 0, 0, 1.5, -2, 0],
    ];
    connections.forEach(([x1, y1, z1, x2, y2, z2]) => {
      p.push(new THREE.Vector3(x1, y1, z1));
      p.push(new THREE.Vector3(x2, y2, z2));
    });
    return p;
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);

  return (
    <lineSegments ref={ref} geometry={geometry}>
      <lineBasicMaterial color="#2de2e6" transparent opacity={0.3} />
    </lineSegments>
  );
}

function EnergyRings() {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = Math.PI / 2 + Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
      ring1Ref.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = Math.PI / 2 + Math.cos(state.clock.elapsedTime * 0.3) * 0.3;
      ring2Ref.current.rotation.y = -state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[2.2, 0.02, 16, 100]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.6} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[2.5, 0.015, 16, 100]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.4} />
      </mesh>
    </>
  );
}

/**
 * Main Avatar Scene
 */
function AvatarScene({ level = 1 }: { level?: number }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#a855f7" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#06b6d4" />
      
      <EnergyCore level={level} />
      <OrbitingParticles count={8 + level} />
      <EnergyRings />
      
      <OrbitControls 
        enableZoom={false} 
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  );
}

/**
 * Exported Avatar Component
 */
export function Avatar3D({ level = 1, className = "" }: Avatar3DProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative ${className}`}
    >
      <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-b from-gray-900 to-black">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 45 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <AvatarScene level={level} />
          </Suspense>
        </Canvas>
      </div>
      
      {/* Glow effect overlay */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-purple-500/10 via-transparent to-cyan-500/10 pointer-events-none" />
      
      {/* Level badge */}
      <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/30">
        {level}
      </div>
      
      {/* 3D indicator */}
      <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-black/50 text-xs text-cyan font-mono border border-cyan/30">
        3D
      </div>
    </motion.div>
  );
}

/**
 * Skill Tree 3D Visualization
 * Interactive 3D node graph for skills
 */
export function SkillTree3D() {
  return (
    <div className="relative w-full h-96 glass-card rounded-2xl overflow-hidden">
      <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.8} color="#a855f7" />
        
        {/* Central node */}
        <Float speed={1} rotationIntensity={0.2}>
          <Sphere args={[0.5]} position={[0, 0, 0]}>
            <MeshDistortMaterial
              color="#a855f7"
              emissive="#a855f7"
              emissiveIntensity={0.5}
              distort={0.3}
              speed={2}
            />
          </Sphere>
        </Float>
        
        {/* Orbital skill nodes */}
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i / 6) * Math.PI * 2;
          const x = Math.cos(angle) * 3;
          const y = Math.sin(angle) * 2;
          return (
            <Float key={i} speed={1.5} rotationIntensity={0.3}>
              <Sphere args={[0.3]} position={[x, y, 0]}>
                <meshStandardMaterial
                  color="#06b6d4"
                  emissive="#06b6d4"
                  emissiveIntensity={0.3}
                />
              </Sphere>
            </Float>
          );
        })}
        
        {/* Connection lines */}
        <ConnectionLines />
        
        <OrbitControls enableZoom={true} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
      
      <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/50 text-xs text-cyan font-mono border border-cyan/30">
        Interactive 3D
      </div>
    </div>
  );
}

/**
 * Cyberpunk Background with WebGL Shader
 * Animated grid floor with neon effects
 */
export function CyberpunkBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050712] via-[#0d1327] to-[#04050d]" />
      
      {/* Animated grid lines using CSS (WebGL shader placeholder) */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(45, 226, 230, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(45, 226, 230, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          perspective: '500px',
          transform: 'rotateX(60deg) translateY(-100px) scale(2)',
          animation: 'grid-move 20s linear infinite',
        }}
      />
      
      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
      
      {/* Scanlines */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
        }}
      />
      
      <style jsx>{`
        @keyframes grid-move {
          0% { transform: rotateX(60deg) translateY(-100px) scale(2); }
          100% { transform: rotateX(60deg) translateY(-160px) scale(2); }
        }
      `}</style>
    </div>
  );
}

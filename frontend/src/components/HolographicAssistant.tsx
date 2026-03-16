"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial, Environment, Sphere } from "@react-three/drei";
import * as THREE from "three";

/* ══════════ Holographic body — stylized human silhouette ══════════ */
function HolographicBody() {
  const groupRef = useRef<THREE.Group>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  const time = useRef(0);

  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor1: { value: new THREE.Color("#8B5CF6") },
          uColor2: { value: new THREE.Color("#D946EF") },
          uColor3: { value: new THREE.Color("#06B6D4") },
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vPosition;
          varying vec3 vNormal;
          uniform float uTime;
          void main() {
            vUv = uv;
            vPosition = position;
            vNormal = normal;
            vec3 pos = position;
            pos += normal * sin(pos.y * 4.0 + uTime * 2.0) * 0.015;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uColor1;
          uniform vec3 uColor2;
          uniform vec3 uColor3;
          varying vec2 vUv;
          varying vec3 vPosition;
          varying vec3 vNormal;

          void main() {
            // Scan lines
            float scanLine = sin(vPosition.y * 60.0 + uTime * 3.0) * 0.5 + 0.5;
            scanLine = pow(scanLine, 8.0);

            // Fresnel edge glow
            vec3 viewDir = normalize(cameraPosition - vPosition);
            float fresnel = 1.0 - abs(dot(viewDir, vNormal));
            fresnel = pow(fresnel, 2.5);

            // Color gradient along Y
            float t = (vPosition.y + 1.5) / 3.0;
            vec3 color = mix(uColor1, uColor2, t);
            color = mix(color, uColor3, fresnel * 0.5);

            // Combine
            float alpha = 0.15 + fresnel * 0.7 + scanLine * 0.12;
            alpha = clamp(alpha, 0.0, 0.95);

            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    []
  );

  useFrame((_, delta) => {
    time.current += delta;
    shaderMaterial.uniforms.uTime.value = time.current;
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(time.current * 0.3) * 0.15;
    }
  });

  materialRef.current = shaderMaterial as unknown as THREE.ShaderMaterial;

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group ref={groupRef} position={[0, -0.5, 0]}>
        {/* Head */}
        <mesh position={[0, 1.7, 0]} material={shaderMaterial}>
          <sphereGeometry args={[0.28, 32, 32]} />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 1.35, 0]} material={shaderMaterial}>
          <cylinderGeometry args={[0.08, 0.1, 0.15, 16]} />
        </mesh>

        {/* Torso — upper */}
        <mesh position={[0, 1.0, 0]} material={shaderMaterial}>
          <cylinderGeometry args={[0.35, 0.28, 0.55, 16]} />
        </mesh>

        {/* Torso — lower */}
        <mesh position={[0, 0.55, 0]} material={shaderMaterial}>
          <cylinderGeometry args={[0.28, 0.22, 0.4, 16]} />
        </mesh>

        {/* Left arm */}
        <group position={[0.42, 1.05, 0]} rotation={[0, 0, -0.2]}>
          <mesh material={shaderMaterial}>
            <cylinderGeometry args={[0.06, 0.05, 0.5, 12]} />
          </mesh>
          <mesh position={[0, -0.32, 0]} material={shaderMaterial}>
            <cylinderGeometry args={[0.05, 0.04, 0.45, 12]} />
          </mesh>
        </group>

        {/* Right arm — slightly raised */}
        <group position={[-0.42, 1.05, 0]} rotation={[0.3, 0, 0.5]}>
          <mesh material={shaderMaterial}>
            <cylinderGeometry args={[0.06, 0.05, 0.5, 12]} />
          </mesh>
          <mesh position={[0, -0.32, 0.05]} material={shaderMaterial}>
            <cylinderGeometry args={[0.05, 0.04, 0.45, 12]} />
          </mesh>
          {/* Hand sphere */}
          <mesh position={[0, -0.58, 0.1]} material={shaderMaterial}>
            <sphereGeometry args={[0.06, 12, 12]} />
          </mesh>
        </group>

        {/* Left leg */}
        <group position={[0.12, 0.1, 0]}>
          <mesh material={shaderMaterial}>
            <cylinderGeometry args={[0.09, 0.07, 0.5, 12]} />
          </mesh>
          <mesh position={[0, -0.35, 0]} material={shaderMaterial}>
            <cylinderGeometry args={[0.07, 0.06, 0.4, 12]} />
          </mesh>
        </group>

        {/* Right leg */}
        <group position={[-0.12, 0.1, 0]}>
          <mesh material={shaderMaterial}>
            <cylinderGeometry args={[0.09, 0.07, 0.5, 12]} />
          </mesh>
          <mesh position={[0, -0.35, 0]} material={shaderMaterial}>
            <cylinderGeometry args={[0.07, 0.06, 0.4, 12]} />
          </mesh>
        </group>
      </group>
    </Float>
  );
}

/* ══════════ Floating data particles ══════════ */
function DataParticles({ count = 80 }: { count?: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        position: [
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 5,
          (Math.random() - 0.5) * 3,
        ] as [number, number, number],
        speed: 0.2 + Math.random() * 0.8,
        offset: Math.random() * Math.PI * 2,
        scale: 0.01 + Math.random() * 0.025,
      });
    }
    return arr;
  }, [count]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    particles.forEach((p, i) => {
      dummy.position.set(
        p.position[0] + Math.sin(t * p.speed + p.offset) * 0.3,
        p.position[1] + Math.cos(t * p.speed * 0.7 + p.offset) * 0.5,
        p.position[2] + Math.sin(t * p.speed * 0.5 + p.offset) * 0.2
      );
      dummy.scale.setScalar(p.scale * (0.8 + Math.sin(t * 2 + p.offset) * 0.3));
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#8B5CF6" transparent opacity={0.6} />
    </instancedMesh>
  );
}

/* ══════════ Orbiting rings ══════════ */
function HolographicRings() {
  const ring1Ref = useRef<THREE.Mesh>(null!);
  const ring2Ref = useRef<THREE.Mesh>(null!);
  const ring3Ref = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.5) * 0.1;
      ring1Ref.current.rotation.z = t * 0.2;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = Math.PI / 3 + Math.cos(t * 0.3) * 0.15;
      ring2Ref.current.rotation.y = t * 0.15;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.x = Math.PI / 4;
      ring3Ref.current.rotation.z = -t * 0.1;
    }
  });

  return (
    <group position={[0, 0.3, 0]}>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.2, 0.008, 16, 100]} />
        <meshBasicMaterial color="#8B5CF6" transparent opacity={0.3} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[1.5, 0.006, 16, 100]} />
        <meshBasicMaterial color="#D946EF" transparent opacity={0.2} />
      </mesh>
      <mesh ref={ring3Ref}>
        <torusGeometry args={[1.8, 0.005, 16, 100]} />
        <meshBasicMaterial color="#06B6D4" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

/* ══════════ Ground glow disc ══════════ */
function GroundGlow() {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.12 + Math.sin(clock.getElapsedTime() * 1.5) * 0.05;
    }
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]}>
      <circleGeometry args={[1.5, 64]} />
      <meshBasicMaterial color="#8B5CF6" transparent opacity={0.15} />
    </mesh>
  );
}

/* ══════════ Main export ══════════ */
export default function HolographicAssistant({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full h-full min-h-[500px] ${className}`}>
      <Canvas
        camera={{ position: [0, 0.5, 4], fov: 40 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[3, 3, 3]} intensity={0.5} color="#8B5CF6" />
        <pointLight position={[-3, 2, -2]} intensity={0.3} color="#D946EF" />
        <pointLight position={[0, -2, 3]} intensity={0.2} color="#06B6D4" />

        <HolographicBody />
        <HolographicRings />
        <DataParticles />
        <GroundGlow />
      </Canvas>
    </div>
  );
}

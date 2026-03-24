"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Html,
  Environment,
  ContactShadows,
} from "@react-three/drei";
import * as THREE from "three";

function Model({ url, autoRotate }: { url: string; autoRotate: boolean }) {
  const { scene } = useGLTF(url);
  const ref = useRef<THREE.Group>(null);

  // Clone scene and apply grey resin material to all meshes
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0.18431, 0.20000, 0.25098),
      roughness: 0.8,
      metalness: 0.0,
      clearcoat: 0.05,
      clearcoatRoughness: 0.4,
      sheen: 0.05,
      sheenColor: new THREE.Color(0.4, 0.42, 0.5),
    });
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = mat;
      }
    });
    return clone;
  }, [scene]);

  useFrame((_, delta) => {
    if (autoRotate && ref.current) {
      ref.current.rotation.y += delta * 0.4;
    }
  });

  return <primitive ref={ref} object={clonedScene} />;
}

function Loader() {
  return (
    <Html center>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        color: "#888",
        fontFamily: "system-ui, sans-serif",
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: "3px solid #e0e0e0",
          borderTopColor: "#f97316",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <span style={{ fontSize: 14 }}>Loading 3D model...</span>
      </div>
    </Html>
  );
}

type Props = {
  modelUrl: string;
  posterUrl?: string | null;
  petName?: string;
};

export default function ModelViewer3D({ modelUrl, petName }: Props) {
  const [autoRotate, setAutoRotate] = useState(true);

  return (
    <div className="kw-3d-viewer-wrap">
      <Canvas
        shadows
        camera={{ position: [0, 0.5, 2.5], fov: 35 }}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "20px",
        }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      >
        <color attach="background" args={["#f0f0f0"]} />
        <fog attach="fog" args={["#f0f0f0", 8, 20]} />

        {/* Key light — strong top-down to cast deep shadows */}
        <directionalLight
          castShadow
          position={[0, 8, 2]}
          intensity={2.5}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.001}
        />
        {/* Soft fill from front-left */}
        <directionalLight position={[-3, 3, 4]} intensity={0.6} />
        {/* Subtle rim light from behind */}
        <directionalLight position={[2, 2, -3]} intensity={0.3} />
        {/* Low ambient so shadows stay deep */}
        <ambientLight intensity={0.15} />

        <Suspense fallback={<Loader />}>
          <Model url={modelUrl} autoRotate={autoRotate} />
          <ContactShadows
            position={[0, -0.5, 0]}
            opacity={0.6}
            scale={5}
            blur={2}
            far={2}
          />
          <Environment preset="city" environmentIntensity={0.3} />
        </Suspense>

        <OrbitControls
          makeDefault
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minPolarAngle={Math.PI * 0.1}
          maxPolarAngle={Math.PI * 0.85}
          minDistance={1}
          maxDistance={6}
          dampingFactor={0.05}
          enableDamping={true}
          onStart={() => setAutoRotate(false)}
        />
      </Canvas>

      <div className="kw-viewer-toolbar">
        <button
          type="button"
          className={`kw-toolbar-btn${autoRotate ? " active" : ""}`}
          onClick={() => setAutoRotate(!autoRotate)}
          title="Toggle auto-rotate"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
        </button>
      </div>

      <div className="kw-viewer-controls-hint">
        <span>Drag to rotate</span>
        <span>Scroll to zoom</span>
        <span>Right-click to pan</span>
      </div>

      {petName && (
        <div className="kw-viewer-label">
          {petName}&apos;s Keychain
        </div>
      )}
    </div>
  );
}

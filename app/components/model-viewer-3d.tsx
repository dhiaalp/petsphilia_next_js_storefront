"use client";

import { Suspense, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Stage,
  useGLTF,
  Html,
  Environment,
} from "@react-three/drei";
import * as THREE from "three";

const greyMaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color(0.45, 0.45, 0.47),
  roughness: 0.55,
  metalness: 0.05,
});

function Model({ url, autoRotate }: { url: string; autoRotate: boolean }) {
  const { scene } = useGLTF(url);
  const ref = useRef<THREE.Group>(null);

  // Apply grey resin material to all meshes
  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      (child as THREE.Mesh).material = greyMaterial;
    }
  });

  useFrame((_, delta) => {
    if (autoRotate && ref.current) {
      ref.current.rotation.y += delta * 0.4;
    }
  });

  return <primitive ref={ref} object={scene} />;
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

        <Suspense fallback={<Loader />}>
          <Stage
            intensity={0.6}
            shadows={{ type: "contact", opacity: 0.4, blur: 2.5 }}
            adjustCamera={1.5}
            environment="city"
          >
            <Model url={modelUrl} autoRotate={autoRotate} />
          </Stage>
          <Environment preset="city" />
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

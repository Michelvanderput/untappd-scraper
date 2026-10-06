import { useEffect, useMemo, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const TEETH = 21;

/** Crown cap: lathe profile (plate + flared skirt), then crimped with a triangle wave per tooth. */
function buildCapGeometry() {
  const profile: [number, number][] = [
    [0, 0.15],
    [0.78, 0.15],
    [0.84, 0.135],
    [0.88, 0.1],
    [0.92, 0.0],
    [1.0, -0.12],
    [1.06, -0.2],
    [1.085, -0.24],
  ];
  const pts = profile.map(([r, y]) => new THREE.Vector2(r, y));
  let geo: THREE.BufferGeometry = new THREE.LatheGeometry(pts, TEETH * 10);

  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const weight = Math.pow(THREE.MathUtils.clamp((0.02 - y) / 0.22, 0, 1), 1.4);
    if (weight === 0) continue;
    const theta = Math.atan2(z, x);
    const phase = (theta / (Math.PI * 2)) * TEETH;
    const tri = Math.abs((((phase % 1) + 1) % 1) * 2 - 1); // 0..1 triangle wave
    const k = 1 + 0.075 * weight * (tri - 0.5) * 2;
    pos.setXYZ(i, x * k, y, z * k);
  }

  // Weld the lathe seam so the shading has no visible line, then rebuild normals
  geo.deleteAttribute('normal');
  geo.deleteAttribute('uv');
  geo = mergeVertices(geo, 1e-4);
  geo.computeVertexNormals();
  return geo;
}

function useLetterTexture() {
  return useMemo(() => {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = '#3a2406';
      ctx.font = `italic 800 ${size * 0.62}px Migra, Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('B', size / 2, size / 2 + size * 0.04);
    };
    draw();
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    // Redraw once the display font is actually available
    document.fonts?.load('italic 800 64px Migra').then(() => {
      draw();
      tex.needsUpdate = true;
    });
    return tex;
  }, []);
}

/** Procedural studio lighting for the metal: no HDR file to download */
function Studio() {
  const { gl, scene, invalidate } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    // The scene is an external three.js object, assigning its environment is the intended API
    // eslint-disable-next-line react-hooks/immutability
    scene.environment = env;
    invalidate();
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene, invalidate]);
  return null;
}

interface CapProps {
  progress: MutableRefObject<number>;
  animate: boolean;
}

function Cap({ progress, animate }: CapProps) {
  const outer = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const geometry = useMemo(() => buildCapGeometry(), []);
  const letter = useLetterTexture();
  const spin = useRef(0);

  useEffect(() => () => geometry.dispose(), [geometry]);

  // Imperative scene-graph updates every frame: this is exactly what useFrame is for
  useFrame((state, dt) => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const p = progress.current;
    const t = state.clock.elapsedTime;

    // Gentle sway keeps the B readable at rest; scrolling rolls the cap all the way around
    if (animate) spin.current += dt;
    i.rotation.y = Math.sin(spin.current * 0.7) * 0.45 + p * Math.PI * 2.2;

    // Lean toward the pointer, damped
    const tx = animate ? state.pointer.x : 0;
    const ty = animate ? state.pointer.y : 0;
    o.rotation.x = THREE.MathUtils.damp(o.rotation.x, 1.0 - ty * 0.28 + p * 0.5, 4, dt);
    o.rotation.z = THREE.MathUtils.damp(o.rotation.z, -tx * 0.3, 4, dt);
    o.position.y = (animate ? Math.sin(t * 1.1) * 0.06 : 0) - p * 0.4;
    o.scale.setScalar(1 - p * 0.28);
  });

  return (
    <group ref={outer} rotation={[1.0, 0, 0]}>
      <group ref={inner}>
        <mesh geometry={geometry}>
          <meshStandardMaterial color="#f2b33d" metalness={0.95} roughness={0.3} envMapIntensity={1.25} side={THREE.DoubleSide} />
        </mesh>
        {/* Pressed ring on the plate */}
        <mesh position={[0, 0.152, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.7, 0.014, 10, 120]} />
          <meshStandardMaterial color="#b97c14" metalness={0.9} roughness={0.35} />
        </mesh>
        {/* Printed B */}
        <mesh position={[0, 0.156, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.62, 64]} />
          <meshStandardMaterial map={letter} transparent roughness={0.5} metalness={0.4} polygonOffset polygonOffsetFactor={-2} />
        </mesh>
      </group>
    </group>
  );
}

interface HeroCap3DProps {
  progress: MutableRefObject<number>;
  /** false → render a single still frame (reduced motion) or pause (off screen) */
  active: boolean;
  animate: boolean;
}

export default function HeroCap3D({ progress, active, animate }: HeroCap3DProps) {
  return (
    <Canvas
      dpr={[1, 2]}
      frameloop={active && animate ? 'always' : 'demand'}
      camera={{ position: [0, 0, 4.4], fov: 32 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      aria-hidden
    >
      <Studio />
      <ambientLight intensity={0.25} />
      <directionalLight position={[-3, 4, 4]} intensity={2.2} color="#ffe2b0" />
      <pointLight position={[3, -1, 2]} intensity={14} color="#ff9a3c" distance={9} />
      <Cap progress={progress} animate={animate} />
    </Canvas>
  );
}

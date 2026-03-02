import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

const VERTEX_SHADER = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = `
uniform float uTime;
uniform vec2 uResolution;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  vec2 uv = vUv;
  vec2 centered = uv - 0.5;

  float pulse = 0.5 + 0.5 * sin(uTime * 0.3);
  float drift = noise(uv * 3.2 + vec2(uTime * 0.04, -uTime * 0.03));
  float streak = smoothstep(0.45, 0.0, abs(centered.y + sin((uv.x + uTime * 0.08) * 14.0) * 0.08));

  vec3 base = vec3(0.02, 0.04, 0.10);
  vec3 cyan = vec3(0.03, 0.85, 1.00) * (0.18 + drift * 0.3);
  vec3 magenta = vec3(1.00, 0.12, 0.62) * (0.12 + pulse * 0.2);
  vec3 violet = vec3(0.58, 0.22, 1.00) * (0.16 + drift * 0.25);

  float radial = 1.0 - smoothstep(0.1, 0.9, length(centered) * 1.3);
  vec3 color = base + cyan + magenta * radial + violet * streak;

  // Mild scanlines for cyberpunk texture.
  float scanline = sin(uv.y * uResolution.y * 0.7) * 0.02;
  color += scanline;

  gl_FragColor = vec4(color, 0.9);
}
`;

export function CyberpunkBackground() {
  const mountRef = useRef<HTMLDivElement>(null);
  const useStaticFallback = useMemo(() => {
    if (typeof window === 'undefined') return true;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;
    return prefersReducedMotion || isMobile;
  }, []);

  useEffect(() => {
    if (useStaticFallback) return;

    const mount = mountRef.current;
    if (!mount) return;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 0, 7);

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    };

    const shaderPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20),
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
      })
    );
    shaderPlane.position.z = -10;
    scene.add(shaderPlane);

    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 1400;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const colorA = new THREE.Color('#2de2e6');
    const colorB = new THREE.Color('#ff2a6d');
    const colorC = new THREE.Color('#8a2be2');

    for (let i = 0; i < starCount; i += 1) {
      const index = i * 3;
      positions[index] = (Math.random() - 0.5) * 38;
      positions[index + 1] = (Math.random() - 0.5) * 24;
      positions[index + 2] = (Math.random() - 0.5) * 20;

      const palettePick = Math.random();
      const color = palettePick < 0.34 ? colorA : palettePick < 0.67 ? colorB : colorC;
      colors[index] = color.r;
      colors[index + 1] = color.g;
      colors[index + 2] = color.b;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const starsMaterial = new THREE.PointsMaterial({
      size: 0.07,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    stars.position.z = -2;
    scene.add(stars);

    const grid = new THREE.GridHelper(120, 90, 0x2de2e6, 0x1c2f4a);
    const gridMaterial = grid.material as THREE.Material;
    gridMaterial.transparent = true;
    gridMaterial.opacity = 0.24;
    grid.rotation.x = Math.PI / 2.05;
    grid.position.y = -8;
    grid.position.z = -18;
    scene.add(grid);

    const startTime = performance.now();
    let frameId = 0;

    const animate = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      uniforms.uTime.value = elapsed;
      stars.rotation.y = elapsed * 0.015;
      stars.rotation.x = Math.sin(elapsed * 0.1) * 0.02;
      grid.position.z = -18 + ((elapsed * 3.5) % 6);
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      scene.remove(shaderPlane);
      scene.remove(stars);
      scene.remove(grid);
      (shaderPlane.geometry as THREE.BufferGeometry).dispose();
      (shaderPlane.material as THREE.Material).dispose();
      starsGeometry.dispose();
      starsMaterial.dispose();
      grid.geometry.dispose();
      gridMaterial.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [useStaticFallback]);

  if (useStaticFallback) {
    return (
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(1200px 600px at 15% 20%, rgba(45, 226, 230, 0.22), transparent 65%), radial-gradient(900px 540px at 82% 76%, rgba(255, 42, 109, 0.20), transparent 65%), linear-gradient(180deg, #04060f 0%, #090d1b 55%, #04050d 100%)',
        }}
      />
    );
  }

  return <div ref={mountRef} className="fixed inset-0 pointer-events-none z-0" />;
}

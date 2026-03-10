
import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';
import { useCosmicStore } from '../../store/useCosmicStore';
import { NEO } from '../../types';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';
import { motion, AnimatePresence } from 'framer-motion';

// --- SHADERS ---

const atmosphereVertexShader = `
varying vec3 vNormal;
void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const atmosphereFragmentShader = `
varying vec3 vNormal;
void main() {
    float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
    gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity * 1.5;
}
`;

const starVertexShader = `
attribute float size;
varying vec3 vColor;
void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
}
`;

const starFragmentShader = `
varying vec3 vColor;
void main() {
    if (length(gl_PointCoord - vec2(0.5, 0.5)) > 0.475) discard;
    gl_FragColor = vec4(vColor, 1.0);
}
`;

// --- TYPES ---

interface SimulationState {
    isPlaying: boolean;
    speed: number;
    date: number; // timestamp
    showHazardousOnly: boolean;
    followObject: string | null;
}

interface AsteroidData {
    neo: NEO;
    orbitRadius: number;
    angle: number;
    speed: number;
    inclination: number;
    rotationMatrix: THREE.Matrix4;
}

export const OrbitalObservatory: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { neos, selectedNeo, setSelectedNeo } = useCosmicStore();
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [collisionMsg, setCollisionMsg] = useState<string | null>(null);
  const [simState, setSimState] = useState<SimulationState>({
      isPlaying: true,
      speed: 1,
      date: Date.now(),
      showHazardousOnly: false,
      followObject: selectedNeo?.id || null
  });
  
  const [hoveredNeo, setHoveredNeo] = useState<NEO | null>(null);
  const [hudPosition, setHudPosition] = useState<{x: number, y: number} | null>(null);
  const [fps, setFps] = useState(0);

  // Refs for Three.js objects to avoid re-renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null); // Post-processing
  const asteroidsInstancedRef = useRef<THREE.InstancedMesh | null>(null);
  const asteroidDataRef = useRef<AsteroidData[]>([]);
  const earthRef = useRef<THREE.Group | null>(null);
  const cloudsRef = useRef<THREE.Mesh | null>(null);
  const starFieldRef = useRef<THREE.Points | null>(null);
  const selectedOrbitLineRef = useRef<THREE.Line | null>(null);
  
  // Mouse Raycasting Refs
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2(0, 0)); 

  // --- INITIALIZATION ---
  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020408);
    // Reduced fog density to let bloom shine through distantly
    scene.fog = new THREE.FogExp2(0x020408, 0.0002);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100000);
    camera.position.set(0, 30, 100);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, logarithmicDepthBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x020408, 1);
    // Enable tone mapping for realistic lighting range with bloom
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.5;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Post-Processing (Bloom)
    const renderScene = new RenderPass(scene, camera);
    
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.5, // strength
        0.4, // radius
        0.85 // threshold
    );
    // Tweaked parameters for "Cosmic" feel
    bloomPass.threshold = 0.2;
    bloomPass.strength = 1.2;
    bloomPass.radius = 0.5;

    const composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);
    composerRef.current = composer;

    // 5. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 12; // Don't clip into Earth
    controls.maxDistance = 1000;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.2;
    controlsRef.current = controls;

    // 6. Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Soft white light
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
    sunLight.position.set(100, 50, 50);
    scene.add(sunLight);

    const backLight = new THREE.DirectionalLight(0x002288, 1.0); // Stronger blue rim light for bloom
    backLight.position.set(-100, 0, -50);
    scene.add(backLight);

    // 7. Earth System
    const earthGroup = new THREE.Group();
    scene.add(earthGroup);
    earthRef.current = earthGroup;

    // Loading Manager to track texture loading
    const manager = new THREE.LoadingManager();
    manager.onLoad = () => {
        // Smooth transition out of loading
        setTimeout(() => setIsLoading(false), 500);
    };

    const textureLoader = new THREE.TextureLoader(manager);
    const earthRadius = 10;

    // Surface
    const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 64);
    const earthMat = new THREE.MeshPhongMaterial({
        map: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg'),
        specularMap: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_specular_2048.jpg'),
        normalMap: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_normal_2048.jpg'),
        shininess: 15
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);

    // Clouds
    const cloudGeo = new THREE.SphereGeometry(earthRadius + 0.1, 64, 64);
    const cloudMat = new THREE.MeshPhongMaterial({
        map: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png'),
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    earthGroup.add(cloudMesh);
    cloudsRef.current = cloudMesh;

    // Atmosphere Halo
    const atmosGeo = new THREE.SphereGeometry(earthRadius + 1.5, 64, 64);
    const atmosMat = new THREE.ShaderMaterial({
        vertexShader: atmosphereVertexShader,
        fragmentShader: atmosphereFragmentShader,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false // Fix z-fighting with bloom
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    earthGroup.add(atmosMesh);

    // Moon
    const moonGeo = new THREE.SphereGeometry(2.7, 32, 32);
    const moonMat = new THREE.MeshPhongMaterial({
        map: textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/moon_1024.jpg')
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.set(60, 0, 0); // Scaled down distance
    scene.add(moonMesh);

    // Moon Orbit Line
    const moonOrbitGeo = new THREE.RingGeometry(59.8, 60.2, 128);
    const moonOrbitMat = new THREE.MeshBasicMaterial({ color: 0x444444, side: THREE.DoubleSide, transparent: true, opacity: 0.3 });
    const moonOrbit = new THREE.Mesh(moonOrbitGeo, moonOrbitMat);
    moonOrbit.rotation.x = Math.PI / 2;
    scene.add(moonOrbit);

    // 8. Optimized Starfield (BufferGeometry)
    // Using BufferGeometry is efficient for large numbers of points (stars).
    const starCount = 5000;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
        const r = 200 + Math.random() * 2000; // Distance range
        const theta = 2 * Math.PI * Math.random();
        const phi = Math.acos(2 * Math.random() - 1);
        
        starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        starPositions[i * 3 + 2] = r * Math.cos(phi);

        // Color variance (White, Blue, Yellowish)
        const colorType = Math.random();
        const color = new THREE.Color();
        if (colorType > 0.8) color.setHex(0xaaaaaa); // Dim white
        else if (colorType > 0.5) color.setHex(0x88ccff); // Blue-ish
        else color.setHex(0xffddaa); // Yellow-ish

        starColors[i * 3] = color.r;
        starColors[i * 3 + 1] = color.g;
        starColors[i * 3 + 2] = color.b;

        starSizes[i] = Math.random() * 2.0;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    starGeo.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

    const starMat = new THREE.ShaderMaterial({
        uniforms: {},
        vertexShader: starVertexShader,
        fragmentShader: starFragmentShader,
        transparent: true,
        vertexColors: true
    });

    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);
    starFieldRef.current = starField;

    // --- CLEANUP ---
    const handleResize = () => {
        if (!cameraRef.current || !rendererRef.current || !composerRef.current) return;
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        
        rendererRef.current.setSize(width, height);
        composerRef.current.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        if (mountRef.current) mountRef.current.innerHTML = '';
        renderer.dispose();
        composer.dispose();
    };
  }, []);

  // --- ASTEROID UPDATES ---
  useEffect(() => {
      if (!sceneRef.current || neos.length === 0) return;

      // Limit to 200 asteroids for performance + visual clarity
      const displayNeos = neos.slice(0, 200);
      const count = displayNeos.length;

      // Clean up previous
      if (asteroidsInstancedRef.current) {
          sceneRef.current.remove(asteroidsInstancedRef.current);
          asteroidsInstancedRef.current.dispose();
      }

      // Geometry & Material
      const geometry = new THREE.IcosahedronGeometry(0.3, 1);
      const material = new THREE.MeshStandardMaterial({
          roughness: 0.6,
          metalness: 0.3,
          color: 0xffffff,
          emissive: 0x111111, // Base glow
          emissiveIntensity: 0.5
      });

      const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
      instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      sceneRef.current.add(instancedMesh);
      asteroidsInstancedRef.current = instancedMesh;

      // Pre-calculate orbits
      const asteroidData: AsteroidData[] = [];
      const color = new THREE.Color();

      displayNeos.forEach((neo, i) => {
          // Orbital Params (Simulated)
          const missDist = parseFloat(neo.close_approach_data?.[0]?.miss_distance?.lunar || '20');
          const velocity = parseFloat(neo.close_approach_data?.[0]?.relative_velocity?.kilometers_per_hour || '20000');
          const isHaz = neo.is_potentially_hazardous_asteroid;

          // Scale distance logarithmically for viewing
          const radius = 15 + Math.log(missDist + 1) * 10;
          const angle = Math.random() * Math.PI * 2;
          const inclination = (Math.random() - 0.5) * 1.5; // Radians tilt
          
          // Store data
          asteroidData.push({
              neo,
              orbitRadius: radius,
              angle,
              speed: (velocity / 1000000) * (Math.random() > 0.5 ? 1 : -1), // Normalized speed
              inclination,
              rotationMatrix: new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize(), inclination)
          });

          // Initial Color - Brighter for Bloom
          if (isHaz) color.setHex(0xFF3D00); // Red
          else color.setHex(0x00F0FF); // Cyan
          
          instancedMesh.setColorAt(i, color);
      });
      
      instancedMesh.instanceColor!.needsUpdate = true;
      asteroidDataRef.current = asteroidData;

  }, [neos]);

  // --- CAMERA TRANSITION EFFECT ---
  useEffect(() => {
      if (!cameraRef.current || !controlsRef.current) return;

      if (simState.followObject) {
          // Find the object
          const data = asteroidDataRef.current.find(d => d.neo.id === simState.followObject);
          if (data) {
              // Calculate rough position to tween towards
              const x = Math.cos(data.angle) * data.orbitRadius;
              const z = Math.sin(data.angle) * data.orbitRadius;
              const y = Math.sin(data.angle * 2) * (data.inclination * 5);
              
              // Tween Controls Target to the object
              gsap.to(controlsRef.current.target, {
                  x: x,
                  y: y,
                  z: z,
                  duration: 1.5,
                  ease: "power2.inOut"
              });

              // Tween Camera Position closer (Zoom In)
              // We maintain the vector direction but shorten distance
              const currentPos = cameraRef.current.position.clone();
              const targetPos = new THREE.Vector3(x, y, z);
              const direction = currentPos.sub(targetPos).normalize();
              const zoomDist = 20; // Close up distance
              const newCamPos = targetPos.clone().add(direction.multiplyScalar(zoomDist));

              gsap.to(cameraRef.current.position, {
                  x: newCamPos.x + 5, // Slight offset for framing
                  y: newCamPos.y + 5,
                  z: newCamPos.z + 5,
                  duration: 1.5,
                  ease: "power2.inOut"
              });
          }
      } else {
          // Reset View
          gsap.to(controlsRef.current.target, {
              x: 0,
              y: 0,
              z: 0,
              duration: 2.0,
              ease: "power3.inOut"
          });

          gsap.to(cameraRef.current.position, {
              x: 0,
              y: 30,
              z: 100,
              duration: 2.0,
              ease: "power3.inOut"
          });
      }
  }, [simState.followObject]);

  // --- DRAW ORBIT PATH ---
  useEffect(() => {
      const scene = sceneRef.current;
      if (!scene) return;

      // Remove old line
      if (selectedOrbitLineRef.current) {
          scene.remove(selectedOrbitLineRef.current);
          selectedOrbitLineRef.current.geometry.dispose();
          (selectedOrbitLineRef.current.material as THREE.Material).dispose();
          selectedOrbitLineRef.current = null;
      }

      if (selectedNeo) {
          const data = asteroidDataRef.current.find(d => d.neo.id === selectedNeo.id);
          if (data) {
              const points = [];
              const segments = 256;
              for (let i = 0; i <= segments; i++) {
                  const angle = (i / segments) * Math.PI * 2;
                  const x = Math.cos(angle) * data.orbitRadius;
                  const z = Math.sin(angle) * data.orbitRadius;
                  const y = Math.sin(angle * 2) * (data.inclination * 5);
                  points.push(new THREE.Vector3(x, y, z));
              }
              const geometry = new THREE.BufferGeometry().setFromPoints(points);
              const material = new THREE.LineBasicMaterial({ 
                  color: selectedNeo.is_potentially_hazardous_asteroid ? 0xFF3D00 : 0x00F0FF,
                  transparent: true,
                  opacity: 0.6,
              });
              const line = new THREE.Line(geometry, material);
              scene.add(line);
              selectedOrbitLineRef.current = line;
          }
      }
  }, [selectedNeo]);

  // --- ANIMATION LOOP ---
  useEffect(() => {
      const scene = sceneRef.current;
      const camera = cameraRef.current;
      
      let reqId: number;
      let lastTime = performance.now();
      let frameCount = 0;
      let lastFpsTime = lastTime;

      const dummy = new THREE.Object3D();
      
      // Setup Raycasting Config
      raycasterRef.current.params.Points.threshold = 1.0; 
      
      // Mouse handler
      const onMouseMove = (e: MouseEvent) => {
          mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
          mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
      };
      
      const onClick = (e: MouseEvent) => {
          if (!camera || !asteroidsInstancedRef.current) return;
          
          raycasterRef.current.setFromCamera(mouseRef.current, camera);
          const intersections = raycasterRef.current.intersectObject(asteroidsInstancedRef.current);
          
          if (intersections.length > 0) {
              const instanceId = intersections[0].instanceId;
              if (instanceId !== undefined && asteroidDataRef.current[instanceId]) {
                  const neo = asteroidDataRef.current[instanceId].neo;
                  setSelectedNeo(neo);
                  // Update state to trigger GSAP transition
                  setSimState(prev => ({ ...prev, followObject: neo.id }));
                  navigate(`/asteroid/${neo.id}`);
              }
          }
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('click', onClick);

      const render = (time: number) => {
          reqId = requestAnimationFrame(render);
          
          // FPS Counter
          frameCount++;
          if (time - lastFpsTime >= 1000) {
              setFps(frameCount);
              frameCount = 0;
              lastFpsTime = time;
          }

          if (!scene || !camera || !controlsRef.current) return;

          const delta = (time - lastTime) * 0.001;
          lastTime = time;

          // 1. Controls
          controlsRef.current.update();

          // 2. Starfield Parallax (Interaction)
          if (starFieldRef.current) {
              const targetRotX = mouseRef.current.y * 0.05;
              const targetRotY = mouseRef.current.x * 0.05;
              
              starFieldRef.current.rotation.x += (targetRotX - starFieldRef.current.rotation.x) * 0.05;
              starFieldRef.current.rotation.y += (targetRotY - starFieldRef.current.rotation.y) * 0.05;
          }

          // 3. Earth Rotation
          if (simState.isPlaying && earthRef.current && cloudsRef.current) {
              const rotSpeed = 0.05 * simState.speed * delta;
              earthRef.current.rotation.y += rotSpeed;
              cloudsRef.current.rotation.y += rotSpeed * 1.2; // Clouds move faster
          }

          // 4. Asteroid Orbits & Raycasting
          if (asteroidsInstancedRef.current && asteroidDataRef.current.length > 0) {
              
              // --- Interaction Check ---
              raycasterRef.current.setFromCamera(mouseRef.current, camera);
              const intersections = raycasterRef.current.intersectObject(asteroidsInstancedRef.current);
              let hoveredInstanceId = -1;
              
              if (intersections.length > 0) {
                  hoveredInstanceId = intersections[0].instanceId ?? -1;
                  document.body.style.cursor = 'pointer';
              } else {
                  document.body.style.cursor = 'default';
              }

              if (hoveredInstanceId !== -1) {
                  const vec = intersections[0].point.clone().project(camera);
                  setHudPosition({
                      x: (vec.x * 0.5 + 0.5) * window.innerWidth,
                      y: (-(vec.y * 0.5) + 0.5) * window.innerHeight
                  });
                  setHoveredNeo(asteroidDataRef.current[hoveredInstanceId].neo);
              } else {
                  setHoveredNeo(null);
                  setHudPosition(null);
              }

              // --- Orbit Updates ---
              let collisionDetected = false;

              asteroidDataRef.current.forEach((data, i) => {
                  if (simState.isPlaying) {
                      data.angle += data.speed * simState.speed * delta * 50; // Speed multiplier
                  }

                  const x = Math.cos(data.angle) * data.orbitRadius;
                  const z = Math.sin(data.angle) * data.orbitRadius;
                  const y = Math.sin(data.angle * 2) * (data.inclination * 5); // Some vertical variance

                  dummy.position.set(x, y, z);
                  dummy.rotation.x += delta;
                  dummy.rotation.y += delta;
                  
                  // Collision Check (Earth radius approx 10)
                  // If distance < 10.5, we consider it an impact event for visualization
                  if (dummy.position.length() < 10.5) {
                      collisionDetected = true;
                  }

                  // Highlight Logic
                  const isHovered = i === hoveredInstanceId;
                  const isSelected = selectedNeo?.id === data.neo.id;
                  const isFollowed = simState.followObject === data.neo.id;

                  const scale = isHovered || isSelected ? 3.0 : 1.0;
                  dummy.scale.setScalar(scale);
                  dummy.updateMatrix();
                  asteroidsInstancedRef.current!.setMatrixAt(i, dummy.matrix);

                  // Continuous Tracking (Soft Lock)
                  // Use lerp for smooth tracking of moving object after initial GSAP transition
                  if (isFollowed) {
                      const targetPos = dummy.position.clone();
                      // Only lerp target, leave camera position relative (OrbitControls handles orbit)
                      controlsRef.current!.target.lerp(targetPos, 0.1); 
                  }
              });
              asteroidsInstancedRef.current.instanceMatrix.needsUpdate = true;

              if (collisionDetected) {
                  setCollisionMsg("IMPACT TRAJECTORY DETECTED");
              } else {
                  setCollisionMsg(null);
              }
          }

          // Render via Composer (Bloom)
          if (composerRef.current) {
              composerRef.current.render();
          } else if (rendererRef.current) {
              rendererRef.current.render(scene, camera);
          }
      };

      render(performance.now());

      return () => {
          cancelAnimationFrame(reqId);
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('click', onClick);
      };
  }, [simState, selectedNeo]); 

  const togglePlay = () => setSimState(s => ({ ...s, isPlaying: !s.isPlaying }));
  const resetCamera = () => {
      setSimState(s => ({ ...s, followObject: null }));
      // GSAP transition handled in useEffect based on followObject change
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black z-50 overflow-hidden font-sans">
        <AnimatePresence>
            {isLoading && (
                <motion.div 
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute inset-0 z-[100] bg-black flex items-center justify-center"
                >
                    <div className="text-electric font-mono text-lg tracking-widest animate-pulse flex flex-col items-center gap-4">
                        <div className="w-16 h-16 border-4 border-electric/30 border-t-electric rounded-full animate-spin"></div>
                        INITIALIZING TELESCOPE...
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Impact Warning Overlay */}
        <AnimatePresence>
            {collisionMsg && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-24 left-1/2 -translate-x-1/2 z-[90] pointer-events-none"
                >
                    <div className="bg-molten/20 border border-molten px-6 py-3 rounded-lg shadow-[0_0_50px_#FF3D00] backdrop-blur-md animate-pulse flex items-center gap-4">
                        <svg className="w-8 h-8 text-molten" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <span className="text-molten font-display font-bold text-xl tracking-wider">{collisionMsg}</span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        <div ref={mountRef} className="absolute inset-0 z-0" />

        {/* --- UI OVERLAY --- */}
        
        {/* Top Bar */}
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none z-10">
            <div>
                <h1 className="text-4xl font-hero font-bold text-white tracking-widest drop-shadow-lg">ORBITAL <span className="text-electric">OBSERVATORY</span></h1>
                <div className="flex items-center gap-4 mt-2">
                    <div className="text-xs font-mono text-electric bg-electric/10 px-2 py-1 rounded border border-electric/30">
                        LIVE TELEMETRY
                    </div>
                    <div className="text-xs font-mono text-gray-400">
                        {neos.length} OBJECTS TRACKED
                    </div>
                </div>
            </div>
            
            <div className="flex gap-2 pointer-events-auto">
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="backdrop-blur-md bg-black/40 border-white/10">
                    EXIT VIEW
                </Button>
            </div>
        </div>

        {/* Left Control Panel */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2 w-64 pointer-events-auto space-y-4">
            <div className="glass-panel p-4 rounded-xl border border-white/10 bg-void-950/80 backdrop-blur-md">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono text-gray-400 uppercase">Simulation Control</span>
                    <div className="flex gap-2">
                        <button onClick={togglePlay} className="p-2 hover:text-electric text-white transition-colors">
                            {simState.isPlaying ? 
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg> : 
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                            }
                        </button>
                        <button onClick={resetCamera} className="p-2 hover:text-electric text-white transition-colors" title="Reset View">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                            <span>TIME SCALE</span>
                            <span>{simState.speed}x</span>
                        </div>
                        <input 
                            type="range" min="0" max="10" step="0.5" 
                            value={simState.speed} 
                            onChange={(e) => setSimState(s => ({ ...s, speed: parseFloat(e.target.value) }))}
                            className="w-full h-1 bg-void-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-electric [&::-webkit-slider-thumb]:rounded-full"
                        />
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">Hazardous Only</span>
                        <div 
                            className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${simState.showHazardousOnly ? 'bg-molten' : 'bg-void-700'}`}
                            onClick={() => setSimState(s => ({ ...s, showHazardousOnly: !s.showHazardousOnly }))}
                        >
                            <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${simState.showHazardousOnly ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-panel p-4 rounded-xl border border-white/10 bg-void-950/80 backdrop-blur-md max-h-64 overflow-y-auto custom-scrollbar">
                <div className="text-xs font-mono text-gray-400 mb-2 uppercase sticky top-0 bg-void-950/90 pb-2 z-10">Visible Objects</div>
                <div className="space-y-1">
                    {neos.slice(0, 20).map(neo => (
                        <div 
                            key={neo.id} 
                            onClick={() => {
                                setSelectedNeo(neo);
                                setSimState(s => ({ ...s, followObject: neo.id }));
                            }}
                            className={`p-2 rounded cursor-pointer flex justify-between items-center text-xs transition-colors ${selectedNeo?.id === neo.id ? 'bg-electric/20 text-electric' : 'hover:bg-white/5 text-gray-300'}`}
                        >
                            <span className="truncate max-w-[120px]">{neo.name.replace(/[()]/g, '')}</span>
                            {neo.is_potentially_hazardous_asteroid && <span className="w-1.5 h-1.5 rounded-full bg-molten animate-pulse" />}
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Floating HUD Label for Hovered Object */}
        {hoveredNeo && hudPosition && (
            <div 
                className="absolute pointer-events-none z-20"
                style={{ left: hudPosition.x, top: hudPosition.y, transform: 'translate(20px, -50%)' }}
            >
                <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-panel p-3 rounded-lg border-l-2 border-electric bg-void-950/90 shadow-[0_0_20px_rgba(0,240,255,0.2)]"
                >
                    <h3 className="text-sm font-bold text-white mb-1 font-display">{hoveredNeo.name}</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-mono text-gray-400">
                        <span>DIST:</span> <span className="text-white">{parseFloat(hoveredNeo.close_approach_data[0].miss_distance.lunar).toFixed(1)} LD</span>
                        <span>VEL:</span> <span className="text-white">{parseFloat(hoveredNeo.close_approach_data[0].relative_velocity.kilometers_per_hour).toLocaleString()} km/h</span>
                        <span>TYPE:</span> <span className={hoveredNeo.is_potentially_hazardous_asteroid ? 'text-molten' : 'text-emerald-400'}>{hoveredNeo.is_potentially_hazardous_asteroid ? 'PHA' : 'NEO'}</span>
                    </div>
                </motion.div>
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-5 h-[1px] bg-electric/50 -translate-x-full"></div>
                <div className="absolute top-1/2 left-0 w-1 h-1 bg-electric rounded-full -translate-x-full -translate-y-1/2"></div>
            </div>
        )}

        {/* Selected Object Details Panel (Bottom Center/Right) */}
        <AnimatePresence>
            {selectedNeo && (
                <motion.div 
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="absolute bottom-12 right-6 w-80 glass-panel p-5 rounded-xl border border-white/10 bg-void-950/90 backdrop-blur-xl z-20 pointer-events-auto"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-display font-bold text-white">{selectedNeo.name.replace(/[()]/g, '')}</h2>
                            <div className="text-xs font-mono text-gray-500">{selectedNeo.id}</div>
                        </div>
                        <button onClick={() => setSelectedNeo(null)} className="text-gray-500 hover:text-white">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm border-b border-white/5 pb-1">
                            <span className="text-gray-400">Miss Distance</span>
                            <span className="font-mono text-white">{parseFloat(selectedNeo.close_approach_data[0].miss_distance.astronomical).toFixed(4)} AU</span>
                        </div>
                        <div className="flex justify-between text-sm border-b border-white/5 pb-1">
                            <span className="text-gray-400">Diameter</span>
                            <span className="font-mono text-white">{Math.round(selectedNeo.estimated_diameter.meters.estimated_diameter_max)} m</span>
                        </div>
                        <div className="flex justify-between text-sm border-b border-white/5 pb-1">
                            <span className="text-gray-400">Classification</span>
                            <Badge 
                                label={selectedNeo.is_potentially_hazardous_asteroid ? 'HAZARDOUS' : 'SAFE'} 
                                type={selectedNeo.is_potentially_hazardous_asteroid ? 'danger' : 'safe'} 
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button size="sm" variant="plasma" onClick={() => navigate(`/asteroid/${selectedNeo.id}`)} className="flex-1">
                            FULL ANALYSIS
                        </Button>
                        <Button size="sm" variant="void" onClick={() => setSimState(s => ({...s, followObject: selectedNeo.id}))} className="flex-1">
                            {simState.followObject === selectedNeo.id ? 'FOLLOWING' : 'TRACK'}
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Bottom Bar */}
        <div className="absolute bottom-0 left-0 w-full h-8 bg-void-950/80 border-t border-white/5 flex items-center justify-between px-4 text-[10px] font-mono text-gray-500 pointer-events-none z-10">
            <div>
                SYSTEM STATUS: <span className="text-emerald-400">ONLINE</span>
            </div>
            <div className="flex gap-4">
                <span>FPS: {fps}</span>
                <span>COORD: 34.05°N, 118.24°W</span>
            </div>
        </div>
    </div>
  );
};

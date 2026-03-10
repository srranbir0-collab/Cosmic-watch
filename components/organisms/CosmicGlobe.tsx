
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useNavigate } from 'react-router-dom';
import { useCosmicStore } from '../../store/useCosmicStore';
import { NEO } from '../../types';
import { Modal } from '../molecules/Modal';
import { Button } from '../atoms/Button';
import { Badge } from '../atoms/Badge';

// ... (Shaders and Interface definitions remain the same) ...
// --- Custom Shaders ---

const planetVertexShader = `
varying vec3 vNormal;
varying vec3 vPosition;
varying vec2 vUv;
void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const planetFragmentShader = `
uniform vec3 uSunDirection;
uniform vec3 uAtmosphereColor;
uniform vec3 uGroundColor;

varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    vec3 viewDir = normalize(-vPosition);
    vec3 normal = normalize(vNormal);
    vec3 sunDir = normalize(uSunDirection);

    // Dynamic Rim Lighting (Eclipse effect)
    float diff = max(dot(normal, sunDir), 0.0);
    float fresnel = pow(1.0 - dot(viewDir, normal), 2.0); 
    float rimMix = smoothstep(-0.4, 0.8, dot(viewDir, sunDir)); 
    float rim = fresnel * rimMix * 3.5; 

    // Mix base ground with atmosphere
    vec3 color = mix(uGroundColor, uAtmosphereColor, rim);
    
    // Add subtle noise/texture to ground (simulated)
    float noise = sin(vPosition.y * 10.0) * 0.05;
    color += noise * 0.1;

    gl_FragColor = vec4(color, 1.0);
}
`;

const ringVertexShader = `
varying vec2 vUv;
varying vec3 vPos;
void main() {
    vUv = uv;
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const ringFragmentShader = `
varying vec2 vUv;
uniform vec3 uColor;

void main() {
    float bands = sin(vUv.y * 60.0) * 0.5 + 0.5;
    float alpha = smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
    vec3 color = uColor * (0.8 + 0.2 * bands); 
    gl_FragColor = vec4(color, alpha * 0.7);
}
`;

const trailVertexShader = `
attribute float aAngle;
varying float vAngle;
void main() {
    vAngle = aAngle;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const trailFragmentShader = `
uniform float uCurrentAngle;
uniform vec3 uColor;
uniform float uOpacity;
uniform float uTrailLength;
uniform float uTime;
uniform bool uIsHovered;

varying float vAngle;

void main() {
    float diff = uCurrentAngle - vAngle;
    if (diff < 0.0) diff += 6.28318530718;
    
    float baseAlpha = 0.05; 
    float trailAlpha = 0.0;
    if (diff < uTrailLength) {
        float pct = 1.0 - (diff / uTrailLength);
        trailAlpha = pow(pct, 2.5);
    }
    
    float alpha = max(baseAlpha, trailAlpha * 1.5);
    
    if (uIsHovered) {
        float pulse = 0.5 + 0.5 * sin(uTime * 15.0);
        alpha = max(alpha, 0.8 + 0.2 * pulse);
        gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
    } else {
        gl_FragColor = vec4(uColor, alpha * uOpacity);
    }
}
`;

// --- Twinkling Star Shaders ---
const twinkleStarVertexShader = `
attribute float aSize;
attribute float aPhase;
attribute float aSpeed;
varying vec3 vColor;
varying float vPhase;
varying float vSpeed;

void main() {
    vColor = color;
    vPhase = aPhase;
    vSpeed = aSpeed;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (500.0 / -mvPosition.z); // Size attenuation
    gl_Position = projectionMatrix * mvPosition;
}
`;

const twinkleStarFragmentShader = `
uniform float uTime;
uniform sampler2D uTexture;
varying vec3 vColor;
varying float vPhase;
varying float vSpeed;

void main() {
    // Sine wave for blinking: modulates alpha between 0.3 and 1.0
    float blink = 0.3 + 0.7 * (0.5 + 0.5 * sin(uTime * vSpeed + vPhase));
    
    vec4 tex = texture2D(uTexture, gl_PointCoord);
    if (tex.a < 0.1) discard; 
    
    gl_FragColor = vec4(vColor, blink * tex.a);
}
`;

interface OrbitData {
    index: number;
    angle: number;
    speed: number;
    radius: number;
    rotationMatrix: THREE.Matrix4;
    neo: NEO;
    isHazardous: boolean;
    originalColor: THREE.Color;
    orbitMaterial: THREE.ShaderMaterial;
    orbitLine: THREE.LineLoop;
}

interface CosmicGlobeProps {
    starDensity?: number;
}

export const CosmicGlobe: React.FC<CosmicGlobeProps> = ({ starDensity = 1.0 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { neos, setSelectedNeo } = useCosmicStore();
  const navigate = useNavigate();
  const [hoveredNeo, setHoveredNeo] = useState<NEO | null>(null);
  const [detailNeo, setDetailNeo] = useState<NEO | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleFullAnalysis = () => {
    if (detailNeo) {
        setSelectedNeo(detailNeo);
        navigate('/analyzer');
        setDetailNeo(null);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    // Deep dark blue fog to blend distant stars
    scene.fog = new THREE.FogExp2(0x020208, 0.0008); 
    
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 4000);
    // Position camera slightly lower to look up at the planet/nebula
    camera.position.set(0, 20, 120);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Dark Void Background
    renderer.setClearColor(0x020205, 1); 
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 40;
    controls.maxDistance = 500;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3;

    const clock = new THREE.Clock();
    const sharedStarTexture = getStarTexture();

    // --- 1. Background Starfield (Distant, Static) ---
    const bgStarGeo = new THREE.BufferGeometry();
    const bgStarCount = Math.floor(4000 * starDensity); 
    const bgPos = new Float32Array(bgStarCount * 3);
    const bgColor = new Float32Array(bgStarCount * 3);
    
    for(let i = 0; i < bgStarCount * 3; i+=3) {
      // Large sphere distribution
      const r = 800 + Math.random() * 1500; 
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      
      bgPos[i] = r * Math.sin(phi) * Math.cos(theta);
      bgPos[i+1] = r * Math.sin(phi) * Math.sin(theta);
      bgPos[i+2] = r * Math.cos(phi);
      
      // Mostly white/blue/dim
      const color = new THREE.Color();
      if (Math.random() > 0.8) color.setHex(0x3B82F6); // Blue
      else color.setHex(0x555555); // Dim White
      
      bgColor[i] = color.r;
      bgColor[i+1] = color.g;
      bgColor[i+2] = color.b;
    }
    bgStarGeo.setAttribute('position', new THREE.BufferAttribute(bgPos, 3));
    bgStarGeo.setAttribute('color', new THREE.BufferAttribute(bgColor, 3));
    const bgStarMat = new THREE.PointsMaterial({ size: 1.5, vertexColors: true, transparent: true, opacity: 0.4 });
    const bgStarMesh = new THREE.Points(bgStarGeo, bgStarMat);
    scene.add(bgStarMesh);


    // --- 2. Twinkling Starfield (Dynamic Blinking) ---
    const twinkleGeo = new THREE.BufferGeometry();
    const twinkleCount = Math.floor(2000 * starDensity);
    const tPos = new Float32Array(twinkleCount * 3);
    const tCol = new Float32Array(twinkleCount * 3);
    const tSize = new Float32Array(twinkleCount);
    const tPhase = new Float32Array(twinkleCount);
    const tSpeed = new Float32Array(twinkleCount);

    for(let i=0; i<twinkleCount; i++) {
        const r = 600 + Math.random() * 1200;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        
        tPos[i*3] = r * Math.sin(phi) * Math.cos(theta);
        tPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        tPos[i*3+2] = r * Math.cos(phi);

        // Vibrant colors for twinkling stars
        const color = new THREE.Color();
        const rnd = Math.random();
        if(rnd > 0.7) color.setHex(0xFFFFFF); // White
        else if(rnd > 0.4) color.setHex(0x00F0FF); // Cyan
        else if(rnd > 0.2) color.setHex(0xFFD700); // Gold
        else color.setHex(0xFF3D00); // Molten

        tCol[i*3] = color.r;
        tCol[i*3+1] = color.g;
        tCol[i*3+2] = color.b;

        tSize[i] = 1.5 + Math.random() * 2.5; // Size variation
        tPhase[i] = Math.random() * Math.PI * 2; // Random starting phase
        tSpeed[i] = 2.0 + Math.random() * 4.0; // Blink speed
    }

    twinkleGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3));
    twinkleGeo.setAttribute('color', new THREE.BufferAttribute(tCol, 3));
    twinkleGeo.setAttribute('aSize', new THREE.BufferAttribute(tSize, 1));
    twinkleGeo.setAttribute('aPhase', new THREE.BufferAttribute(tPhase, 1));
    twinkleGeo.setAttribute('aSpeed', new THREE.BufferAttribute(tSpeed, 1));

    const twinkleMat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uTexture: { value: sharedStarTexture }
        },
        vertexShader: twinkleStarVertexShader,
        fragmentShader: twinkleStarFragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true // Added to enable color attribute
    });

    const twinkleMesh = new THREE.Points(twinkleGeo, twinkleMat);
    scene.add(twinkleMesh);


    // --- 3. The Golden Rift (Nebula) ---
    const nebulaGroup = new THREE.Group();
    scene.add(nebulaGroup);

    const createRiftParticles = () => {
        const pCount = Math.floor(2500 * starDensity);
        const pPos = new Float32Array(pCount * 3);
        const pCol = new Float32Array(pCount * 3);
        const pSizes = new Float32Array(pCount);

        const colorCore = new THREE.Color(0xffaa33); // Bright Gold
        const colorMid = new THREE.Color(0xff4400); // Molten Orange
        const colorEdge = new THREE.Color(0x3300ff); // Deep Purple
        const colorDark = new THREE.Color(0x0a0020); // Dark Void

        for(let i=0; i<pCount; i++) {
            // Create a diagonal band distribution
            // Line equation roughly: y = x + offset
            
            const range = 1000;
            const x = (Math.random() - 0.5) * range * 1.5;
            // The diagonal slope
            const slope = 0.6;
            const yBase = x * slope;
            
            // Distance from the core line
            const dist = Math.abs((Math.random() - 0.5) * 600); // spread width
            const angle = Math.random() * Math.PI * 2;
            
            // Position
            const xPos = x + Math.cos(angle) * dist;
            const yPos = yBase + Math.sin(angle) * dist;
            const zPos = (Math.random() - 0.5) * 600 - 300; // Push back behind planet

            pPos[i*3] = xPos;
            pPos[i*3+1] = yPos;
            pPos[i*3+2] = zPos;

            // Coloring based on distance from core line
            // Calculate normalized distance (0 = on line, 1 = far)
            const dNorm = Math.min(dist / 300, 1.0);
            
            const c = colorCore.clone();
            if (dNorm < 0.3) {
                // Core: Gold -> Orange
                c.lerp(colorMid, dNorm * 3.3); 
            } else {
                // Edge: Orange -> Purple -> Dark
                c.copy(colorMid).lerp(colorEdge, (dNorm - 0.3) * 1.4);
            }
            
            // Random variation
            c.offsetHSL(0, 0, (Math.random() - 0.5) * 0.1);

            pCol[i*3] = c.r;
            pCol[i*3+1] = c.g;
            pCol[i*3+2] = c.b;

            // Size variation: Core particles smaller/denser visually, Edges large and smoke-like
            pSizes[i] = 200 + Math.random() * 400; 
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
        
        const mat = new THREE.PointsMaterial({
            size: 350,
            vertexColors: true,
            map: getCloudTexture(),
            transparent: true,
            opacity: 0.08, // Very faint, additive stacking creates brightness
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        return new THREE.Points(geo, mat);
    };

    nebulaGroup.add(createRiftParticles());


    // --- 4. Hero Stars (Foreground Bright Stars) ---
    const heroStarGeo = new THREE.BufferGeometry();
    const heroStarCount = 150;
    const heroPos = new Float32Array(heroStarCount * 3);
    const heroCol = new Float32Array(heroStarCount * 3);

    for(let i=0; i<heroStarCount * 3; i+=3) {
        // Spread these more widely
        const r = 400 + Math.random() * 600;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);

        heroPos[i] = r * Math.sin(phi) * Math.cos(theta);
        heroPos[i+1] = r * Math.sin(phi) * Math.sin(theta);
        heroPos[i+2] = r * Math.cos(phi);

        const color = new THREE.Color();
        const rand = Math.random();
        if (rand > 0.7) color.setHex(0xFFFFFF); // White
        else if (rand > 0.4) color.setHex(0x00F0FF); // Cyan
        else color.setHex(0xFFaa00); // Gold

        heroCol[i] = color.r;
        heroCol[i+1] = color.g;
        heroCol[i+2] = color.b;
    }
    heroStarGeo.setAttribute('position', new THREE.BufferAttribute(heroPos, 3));
    heroStarGeo.setAttribute('color', new THREE.BufferAttribute(heroCol, 3));
    
    // Using a different texture for hero stars (sharper)
    const heroStarMat = new THREE.PointsMaterial({
        size: 5,
        vertexColors: true,
        map: sharedStarTexture,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const heroStars = new THREE.Points(heroStarGeo, heroStarMat);
    scene.add(heroStars);


    // --- 5. Planet (Lit by the nebula) ---
    const planetGroup = new THREE.Group();
    scene.add(planetGroup);

    const planetRadius = 18;
    const planetGeometry = new THREE.SphereGeometry(planetRadius, 64, 64);
    const planetMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uSunDirection: { value: new THREE.Vector3(0.8, 0.5, -0.5).normalize() }, // Light from the rift direction
            uAtmosphereColor: { value: new THREE.Color(0xFF8F00) }, // Golden atmosphere match
            uGroundColor: { value: new THREE.Color(0x050505) },
        },
        vertexShader: planetVertexShader,
        fragmentShader: planetFragmentShader,
    });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    planetGroup.add(planet);

    // Rings
    const ringGeometry = new THREE.RingGeometry(24, 45, 128);
    const ringMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uColor: { value: new THREE.Color(0xC7A289) }, // Warm dust color
        },
        vertexShader: ringVertexShader,
        fragmentShader: ringFragmentShader,
        side: THREE.DoubleSide,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    const rings = new THREE.Mesh(ringGeometry, ringMaterial);
    rings.rotation.x = Math.PI / 2 + 0.4;
    rings.rotation.y = 0.2;
    planetGroup.add(rings);


    // --- 6. NEOs System ---
    const neoGroup = new THREE.Group();
    scene.add(neoGroup);

    const orbitObjects: OrbitData[] = [];
    const dummy = new THREE.Object3D();

    const asteroidGeo = new THREE.DodecahedronGeometry(0.4, 0); 
    const asteroidMat = new THREE.MeshStandardMaterial({ 
        color: 0xAAAAAA,
        roughness: 0.6,
        metalness: 0.3,
        emissive: 0x111111
    });
    const instancedNeoMesh = new THREE.InstancedMesh(asteroidGeo, asteroidMat, neos.length);
    instancedNeoMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    neoGroup.add(instancedNeoMesh);
    
    // --- Lighting Setup (Dramatic) ---
    // 1. Main warm light from the Rift
    const sunLight = new THREE.DirectionalLight(0xffaa33, 2.0);
    sunLight.position.set(80, 50, -50);
    scene.add(sunLight);
    
    // 2. Cool rim light from the deep space side
    const rimLight = new THREE.DirectionalLight(0x3300ff, 1.0);
    rimLight.position.set(-80, -20, 50);
    scene.add(rimLight);
    
    // 3. Ambient
    const ambientLight = new THREE.AmbientLight(0x111122, 0.5); 
    scene.add(ambientLight);

    // --- Orbit Logic ---
    if (neos.length > 0) {
        neos.forEach((neo, i) => {
            const missDistLD = parseFloat(neo.close_approach_data[0]?.miss_distance?.lunar || "10");
            const distance = 50 + (Math.log(missDistLD + 1) * 8); 
            
            const rotationMatrix = new THREE.Matrix4();
            const axis = new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize();
            rotationMatrix.makeRotationAxis(axis, Math.random() * Math.PI * 2);

            const segments = 128;
            const pts = [];
            const angles = [];
            for(let j=0; j<=segments; j++) {
                const angle = (j / segments) * Math.PI * 2;
                pts.push(Math.cos(angle) * distance, 0, Math.sin(angle) * distance);
                angles.push(angle);
            }
            const orbitGeo = new THREE.BufferGeometry();
            orbitGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
            orbitGeo.setAttribute('aAngle', new THREE.Float32BufferAttribute(angles, 1));
            orbitGeo.applyMatrix4(rotationMatrix);

            const isHazardous = neo.is_potentially_hazardous_asteroid;
            const color = isHazardous ? new THREE.Color(0xFF3D00) : new THREE.Color(0x00F0FF);
            
            const velocity = parseFloat(neo.close_approach_data[0].relative_velocity.kilometers_per_hour);
            const speed = (velocity / 1000000) * (Math.random() > 0.5 ? 1 : -1);

            const material = new THREE.ShaderMaterial({
                uniforms: {
                    uCurrentAngle: { value: 0 },
                    uColor: { value: color },
                    uOpacity: { value: 1.0 },
                    uTrailLength: { value: 2.0 }, 
                    uTime: { value: 0 },
                    uIsHovered: { value: false }
                },
                vertexShader: trailVertexShader,
                fragmentShader: trailFragmentShader,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });

            const line = new THREE.LineLoop(orbitGeo, material);
            neoGroup.add(line);
            
            orbitObjects.push({
                index: i,
                angle: Math.random() * Math.PI * 2,
                speed,
                radius: distance,
                rotationMatrix,
                neo,
                isHazardous,
                originalColor: color,
                orbitMaterial: material,
                orbitLine: line
            });
            
            dummy.position.set(0,0,0);
            dummy.updateMatrix();
            instancedNeoMesh.setMatrixAt(i, dummy.matrix);
        });
        instancedNeoMesh.instanceMatrix.needsUpdate = true;
    }

    // --- Interaction ---
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 1.0;
    const mouse = new THREE.Vector2();
    let currentHoverIndex = -1;

    const onMouseMove = (event: MouseEvent) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    const onClick = (event: MouseEvent) => {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(instancedNeoMesh);
        if (intersects.length > 0 && intersects[0].instanceId !== undefined) {
            const obj = orbitObjects.find(o => o.index === intersects[0].instanceId);
            if (obj) setDetailNeo(obj.neo);
        }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);

    // --- Animate ---
    const animate = () => {
        requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();
        const scrollY = window.scrollY;

        // Update Shader Time for Twinkling
        twinkleMat.uniforms.uTime.value = elapsed;

        // Parallax Effects
        nebulaGroup.position.y = scrollY * 0.15;
        bgStarMesh.position.y = scrollY * 0.05;
        twinkleMesh.position.y = scrollY * 0.08;
        heroStars.position.y = scrollY * 0.2;
        
        // Gentle rotation of the whole universe
        nebulaGroup.rotation.z = elapsed * 0.01;
        bgStarMesh.rotation.y = elapsed * 0.005;
        twinkleMesh.rotation.y = elapsed * 0.005;

        // Planet
        planetGroup.position.y = scrollY * 0.05;
        planetGroup.rotation.y += 0.0005;

        controls.update();

        // Update Orbits
        orbitObjects.forEach(obj => {
            obj.angle += obj.speed; 
            const x = Math.cos(obj.angle) * obj.radius;
            const z = Math.sin(obj.angle) * obj.radius;
            const position = new THREE.Vector3(x, 0, z).applyMatrix4(obj.rotationMatrix);
            
            const isHovered = (obj.index === currentHoverIndex);
            const scale = isHovered ? 2.5 : (obj.isHazardous ? 1.5 : 1.0);

            dummy.position.copy(position);
            dummy.scale.setScalar(scale);
            dummy.updateMatrix();
            instancedNeoMesh.setMatrixAt(obj.index, dummy.matrix);

            if (obj.orbitMaterial) {
                obj.orbitMaterial.uniforms.uCurrentAngle.value = obj.angle;
                obj.orbitMaterial.uniforms.uTime.value = elapsed;
                obj.orbitMaterial.uniforms.uIsHovered.value = isHovered;
            }
        });
        instancedNeoMesh.instanceMatrix.needsUpdate = true;

        // Interaction
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(instancedNeoMesh);
        let newHoverIndex = -1;
        if (intersects.length > 0) newHoverIndex = intersects[0].instanceId ?? -1;

        if (newHoverIndex !== currentHoverIndex) {
            document.body.style.cursor = 'default';
            setHoveredNeo(null);
            
            if (newHoverIndex !== -1) {
                const obj = orbitObjects.find(o => o.index === newHoverIndex);
                if (obj) {
                    setHoveredNeo(obj.neo);
                    const point = intersects[0].point.clone().project(camera);
                    setTooltipPos({ 
                        x: (point.x * .5 + .5) * window.innerWidth, 
                        y: (-(point.y * .5) + .5) * window.innerHeight 
                    });
                }
                document.body.style.cursor = 'pointer';
            }
            currentHoverIndex = newHoverIndex;
        }

        renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('click', onClick);
        controls.dispose();
        if (containerRef.current) containerRef.current.removeChild(renderer.domElement);
        renderer.dispose();
    };
  }, [neos, starDensity]);

  return (
    <div className="absolute inset-0 z-0">
        <div ref={containerRef} className="w-full h-full" />
        
        {hoveredNeo && !detailNeo && (
            <div className="absolute z-50 pointer-events-none" style={{ left: tooltipPos.x + 20, top: tooltipPos.y - 20 }}>
                <div className={`glass-panel p-3 rounded-lg border-l-4 ${hoveredNeo.is_potentially_hazardous_asteroid ? 'border-l-molten shadow-glow-molten' : 'border-l-electric shadow-glow-electric'} animate-fade-in`}>
                    <h4 className="text-xs font-display font-bold text-white mb-1">{hoveredNeo.name.replace(/[()]/g, '')}</h4>
                    <div className="text-[10px] font-mono text-gray-400">
                         <div>TYPE: <span className="text-white">{hoveredNeo.is_potentially_hazardous_asteroid ? 'PHA' : 'NEO'}</span></div>
                        <div>DIST: <span className="text-white">{parseFloat(hoveredNeo.close_approach_data[0].miss_distance.lunar).toFixed(1)} LD</span></div>
                    </div>
                </div>
            </div>
        )}

        <Modal 
            isOpen={!!detailNeo} 
            onClose={() => setDetailNeo(null)} 
            title={detailNeo ? `Telemetry: ${detailNeo.name.replace(/[()]/g, '')}` : 'Object Details'}
        >
             {detailNeo && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-void-950/50 p-4 rounded-lg border border-white/5">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Diameter (Max)</div>
                            <div className="font-mono text-xl text-white">{Math.round(detailNeo.estimated_diameter.meters.estimated_diameter_max)} <span className="text-sm text-gray-600">m</span></div>
                        </div>
                        <div className="bg-void-950/50 p-4 rounded-lg border border-white/5">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Velocity</div>
                            <div className="font-mono text-xl text-white">{parseFloat(detailNeo.close_approach_data[0].relative_velocity.kilometers_per_hour).toLocaleString()} <span className="text-sm text-gray-600">km/h</span></div>
                        </div>
                        <div className="bg-void-950/50 p-4 rounded-lg border border-white/5">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Miss Distance</div>
                            <div className="font-mono text-xl text-white">{parseFloat(detailNeo.close_approach_data[0].miss_distance.lunar).toFixed(1)} <span className="text-sm text-gray-600">LD</span></div>
                        </div>
                        <div className="bg-void-950/50 p-4 rounded-lg border border-white/5">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Absolute Mag</div>
                            <div className="font-mono text-xl text-white">{detailNeo.absolute_magnitude_h} <span className="text-sm text-gray-600">H</span></div>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-void-800 rounded-lg border border-white/5">
                        <span className="text-sm text-gray-400">Hazard Classification</span>
                        {detailNeo.is_potentially_hazardous_asteroid ? 
                            <Badge label="HAZARDOUS" type="danger" /> : 
                            <Badge label="NON-THREATENING" type="safe" />
                        }
                    </div>

                    <div className="pt-4 border-t border-white/10 flex gap-4">
                        <Button variant="ghost" onClick={() => setDetailNeo(null)} className="flex-1">Dismiss</Button>
                        <Button variant="plasma" onClick={handleFullAnalysis} className="flex-1">Run Risk Analysis</Button>
                    </div>
                </div>
            )}
        </Modal>
    </div>
  );
};

// Cloud texture (soft alpha)
function getCloudTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.4)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
  }
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Star texture (hard core, soft edge)
function getStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.1, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
    }
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
}

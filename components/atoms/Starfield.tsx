
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

export const Starfield: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050A14, 0.0005); // Fade stars into the deep void color
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Optimize performance
    containerRef.current.appendChild(renderer.domElement);

    camera.position.z = 1000;

    // --- Stars Geometry ---
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 4000;
    const posArray = new Float32Array(starCount * 3);
    const sizeArray = new Float32Array(starCount);
    const colorArray = new Float32Array(starCount * 3);

    const colors = [
      new THREE.Color('#FFFFFF'), // White
      new THREE.Color('#00F0FF'), // Electric Cyan
      new THREE.Color('#FF3D00'), // Molten Red
      new THREE.Color('#7C3AED')  // Gravity Purple
    ];

    for(let i = 0; i < starCount * 3; i+=3) {
      // Position
      posArray[i] = (Math.random() - 0.5) * 3000;     // x
      posArray[i+1] = (Math.random() - 0.5) * 3000;   // y
      posArray[i+2] = (Math.random() - 0.5) * 3000;   // z

      // Size
      sizeArray[i/3] = Math.random() * 2;

      // Color
      const color = colors[Math.floor(Math.random() * colors.length)];
      colorArray[i] = color.r;
      colorArray[i+1] = color.g;
      colorArray[i+2] = color.b;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(sizeArray, 1));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

    // Custom Shader Material for glowing stars
    const starMaterial = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      map: getStarTexture(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.8
    });

    const starMesh = new THREE.Points(starGeometry, starMaterial);
    scene.add(starMesh);

    // --- Nebula Clouds (Simplified as large soft particles) ---
    const nebulaGeometry = new THREE.BufferGeometry();
    const nebulaCount = 15;
    const nebulaPos = new Float32Array(nebulaCount * 3);
    
    for(let i=0; i < nebulaCount * 3; i+=3) {
      nebulaPos[i] = (Math.random() - 0.5) * 1500;
      nebulaPos[i+1] = (Math.random() - 0.5) * 1000;
      nebulaPos[i+2] = (Math.random() - 0.5) * 1000 - 500;
    }
    nebulaGeometry.setAttribute('position', new THREE.BufferAttribute(nebulaPos, 3));
    
    const nebulaMaterial = new THREE.PointsMaterial({
      size: 800,
      color: 0x7C3AED, // Base gravity color
      map: getStarTexture(), // Reuse texture for soft radial
      transparent: true,
      opacity: 0.05,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    const nebulaMesh = new THREE.Points(nebulaGeometry, nebulaMaterial);
    scene.add(nebulaMesh);

    // --- Shooting Stars ---
    const shootingStars: { mesh: THREE.Mesh, speed: number }[] = [];
    const createShootingStar = () => {
      const geometry = new THREE.CylinderGeometry(0, 2, 80, 4);
      const material = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 1 });
      const star = new THREE.Mesh(geometry, material);
      
      star.position.x = (Math.random() - 0.5) * 2000;
      star.position.y = Math.random() * 1000;
      star.position.z = Math.random() * 500;
      
      star.rotation.z = Math.PI / 3;
      star.rotation.x = Math.PI / 2;
      
      scene.add(star);
      shootingStars.push({ mesh: star, speed: 10 + Math.random() * 10 });
    };

    // --- Interaction ---
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX - window.innerWidth / 2) * 0.5;
      mouseY = (event.clientY - window.innerHeight / 2) * 0.5;
    };

    document.addEventListener('mousemove', handleMouseMove);

    // --- Animation Loop ---
    const clock = new THREE.Clock();

    const animate = () => {
      requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera parallax
      targetX = mouseX * 0.5;
      targetY = mouseY * 0.5;
      starMesh.rotation.y += 0.0005;
      starMesh.rotation.x += 0.0002;
      
      // Parallax effect on whole group
      starMesh.position.x += (mouseX * 0.05 - starMesh.position.x) * 0.05;
      starMesh.position.y += (-mouseY * 0.05 - starMesh.position.y) * 0.05;

      nebulaMesh.rotation.z = elapsedTime * 0.02;

      // Shooting Stars logic
      if (Math.random() < 0.01) createShootingStar();
      
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        s.mesh.position.x -= s.speed * 2;
        s.mesh.position.y -= s.speed;
        s.mesh.scale.y = 1 + Math.random(); // Flicker length
        
        // Safely handle opacity on Material
        const mat = s.mesh.material as THREE.MeshBasicMaterial;
        if (mat) {
            mat.opacity -= 0.01;
        }
        
        if (s.mesh.position.y < -1000 || s.mesh.position.x < -1500) {
          scene.remove(s.mesh);
          shootingStars.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // --- Cleanup ---
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousemove', handleMouseMove);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none" />;
};

// Helper for soft particle texture
function getStarTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (ctx) {
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
  }
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  return texture;
}

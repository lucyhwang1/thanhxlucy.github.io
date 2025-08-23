import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// ----- Scene Setup -----
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.05);

// Camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(3, 6, 9);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lights (less bright)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(5, 10, 7);
scene.add(dirLight);

// Ground plane
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -2;
scene.add(ground);

// GLTF Loader
const loader = new GLTFLoader();
loader.load(
  'model.glb',
  (gltf) => {
    scene.add(gltf.scene);
  },
  undefined,
  (error) => {
    console.error(error);
  }
);

// Postprocessing
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.6, // reduced strength
  0.4,
  0.85
);
composer.addPass(bloomPass);

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// ----- Idle Camera Behavior -----
let idleTimeout;
let isAnimating = false;
let idleTime = 10000; // 10s

function resetIdleTimer() {
  clearTimeout(idleTimeout);
  idleTimeout = setTimeout(startIdleAnimation, idleTime);
}
function startIdleAnimation() {
  if (isAnimating) return;
  isAnimating = true;

  const startPos = camera.position.clone();
  const endPos = startPos.clone().multiplyScalar(1.2); // zoom out by 20%
  const duration = 4000; // 4s
  let startTime = performance.now();

  function animateZoom(time) {
    if (!isAnimating) return;
    const elapsed = time - startTime;
    const t = Math.min(elapsed / duration, 1);
    camera.position.lerpVectors(startPos, endPos, t);
    camera.lookAt(0, 0, 0);

    if (t < 1) {
      requestAnimationFrame(animateZoom);
    } else {
      // After zoom, start slow auto-rotate
      autoRotate = true;
    }
  }
  requestAnimationFrame(animateZoom);
}

// Stop animation if user interacts
['mousemove', 'mousedown', 'wheel', 'touchstart', 'keydown'].forEach((event) => {
  window.addEventListener(event, () => {
    isAnimating = false;
    autoRotate = false;
    resetIdleTimer();
  });
});

resetIdleTimer();

// ----- Auto Rotate -----
let autoRotate = false;
let rotateSpeed = 0.002;

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  if (autoRotate && !isAnimating) {
    camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotateSpeed);
    camera.lookAt(0, 0, 0);
  }

  controls.update();
  composer.render();
}

animate();

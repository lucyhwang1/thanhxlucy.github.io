import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// ===== Scene, Camera, Renderer =====
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x000000, 0.02);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 1, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

// ===== Controls =====
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// ===== Lights (your original setup restored) =====
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 7.5);
scene.add(dirLight);

// ===== Model Loader =====
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

loader.load('model.glb', gltf => {
  scene.add(gltf.scene);
});

// ===== Composer + Bloom =====
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.6, // strength
  0.4, // radius
  0.85 // threshold
);
composer.addPass(bloomPass);

// ===== Idle Camera Controls =====
let cameraAnimating = false;
let cancelCameraAnimation = false;
let idleTimeout;
let autoRotate = false;

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function resetIdleTimer() {
  clearTimeout(idleTimeout);

  if (cameraAnimating) {
    cancelCameraAnimation = true;
    cameraAnimating = false;
  }

  autoRotate = false;

  idleTimeout = setTimeout(() => {
    autoRotate = true;
    idleTimeout = setTimeout(startCameraZoomOut, 7000); // 3s + 7s = 10s
  }, 3000);
}

['mousemove', 'mousedown', 'wheel', 'keydown', 'touchstart'].forEach(evt =>
  window.addEventListener(evt, resetIdleTimer)
);

function updateAutoRotate() {
  if (autoRotate && !cameraAnimating) {
    const radius = camera.position.length();
    const angle = 0.002;
    const x = camera.position.x * Math.cos(angle) - camera.position.z * Math.sin(angle);
    const z = camera.position.x * Math.sin(angle) + camera.position.z * Math.cos(angle);
    camera.position.set(x, camera.position.y, z).setLength(radius);
    camera.lookAt(0, 0, 0);
  }
}

function startCameraZoomOut() {
  const startPos = camera.position.clone();
  const endPos = startPos.clone().multiplyScalar(1.3);

  const duration = 4000;
  let startTime = null;

  cameraAnimating = true;
  cancelCameraAnimation = false;

  function animateCamera(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const linearT = Math.min(elapsed / duration, 1);
    const t = easeInOutQuad(linearT);

    if (!cancelCameraAnimation) {
      camera.position.lerpVectors(startPos, endPos, t);
      camera.lookAt(0, 0, 0);

      if (linearT < 1) {
        requestAnimationFrame(animateCamera);
      } else {
        cameraAnimating = false;
        resetIdleTimer();
      }
    }
  }

  requestAnimationFrame(animateCamera);
}

// ===== Dynamic Fog + Bloom =====
function updateEffects() {
  const distance = camera.position.length();
  scene.fog.density = THREE.MathUtils.clamp(distance * 0.005, 0.02, 0.08);
  bloomPass.strength = THREE.MathUtils.clamp(distance * 0.05, 0.3, 1.0);
}

// ===== Animate =====
function animate() {
  requestAnimationFrame(animate);

  updateAutoRotate();
  updateEffects();

  controls.update();
  composer.render();
}

resetIdleTimer();
animate();

// ===== Resize =====
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

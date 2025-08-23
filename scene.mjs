import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
scene.fog = new THREE.Fog(0xffffff, 2, 15);

// Camera
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 4);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.12;
controls.zoomSpeed = 0.4;
controls.rotateSpeed = 0.4;
controls.panSpeed = 0.6;
controls.enableZoom = true;
controls.enablePan = true;
controls.minDistance = 0.5;
controls.maxDistance = 50;

controls.mouseButtons = {
  LEFT: THREE.MOUSE.ROTATE,
  MIDDLE: THREE.MOUSE.PAN,
  RIGHT: THREE.MOUSE.PAN
};

controls.touches = {
  ONE: THREE.TOUCH.ROTATE,
  TWO: THREE.TOUCH.DOLLY_PAN
};

// Shift + Left = pan
window.addEventListener('keydown', (e) => {
  if (e.key === 'Shift') {
    controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
  }
});
window.addEventListener('keyup', (e) => {
  controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
});

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 1.0));
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xcccccc, 1.0);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);
const fillLight = new THREE.PointLight(0xffffff, 0.2, 50);
fillLight.position.set(-10, 5, -10);
scene.add(fillLight);

// GLTF loading
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

let modelToSpin = null;

loader.load('test.glb', (gltf) => {
  const model1 = gltf.scene;
  model1.position.set(-1, 0, 0);
  scene.add(model1);
  modelToSpin = model1;
});

loader.load('test2.glb', (gltf) => {
  const model2 = gltf.scene;
  model2.position.set(1, 0, 0);
  scene.add(model2);
});

// Bokeh effect
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bokehPass = new BokehPass(scene, camera, {
  focus: 4.0,
  aperture: 0.003,
  maxblur: 0.002,
  width: window.innerWidth,
  height: window.innerHeight
});
composer.addPass(bokehPass);

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// Inertia on rotate (mouse + touch)
let isDragging = false;
let lastX = 0;
let velocity = 0;
const inertiaDecay = 0.94;

function startDrag(x) {
  isDragging = true;
  lastX = x;
  controls.enabled = false;
}
function updateDrag(x) {
  const delta = x - lastX;
  lastX = x;
  velocity = delta * 0.005;
}
function endDrag() {
  isDragging = false;
  controls.enabled = true;
}

// Mouse events
renderer.domElement.addEventListener('mousedown', (e) => {
  if (e.button === 0 && !e.shiftKey) startDrag(e.clientX);
});
renderer.domElement.addEventListener('mousemove', (e) => {
  if (isDragging) updateDrag(e.clientX);
});
renderer.domElement.addEventListener('mouseup', endDrag);

// Touch events
renderer.domElement.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) startDrag(e.touches[0].clientX);
});
renderer.domElement.addEventListener('touchmove', (e) => {
  if (isDragging && e.touches.length === 1) updateDrag(e.touches[0].clientX);
});
renderer.domElement.addEventListener('touchend', () => {
  if (isDragging) endDrag();
});

// Optional: double-tap to reset
let lastTap = 0;
renderer.domElement.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTap < 300) controls.reset();
  lastTap = now;
});

// Auto-rotate after idle
let idleTimer = Date.now();
const autoRotateDelay = 3000;

['pointerdown', 'wheel', 'keydown', 'touchstart'].forEach((eventName) => {
  window.addEventListener(eventName, () => {
    idleTimer = Date.now();
    controls.autoRotate = false;
  });
});

// Animate
function animate() {
  requestAnimationFrame(animate);

  if (Date.now() - idleTimer > autoRotateDelay) {
    controls.autoRotate = true;
  }

  // Inertia rotation
  if (!isDragging && modelToSpin && Math.abs(velocity) > 0.0001) {
    modelToSpin.rotation.y += velocity;
    velocity *= inertiaDecay;
  }

  controls.update();
  composer.render();
}

animate();

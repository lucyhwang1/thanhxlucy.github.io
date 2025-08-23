import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

// ----- Scene Setup -----
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
scene.fog = new THREE.Fog(0xffffff, 2, 15);

// ----- Camera -----
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 4);

// ----- Renderer -----
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

// ----- OrbitControls -----
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.15;
controls.zoomSpeed = 1.0;
controls.rotateSpeed = 0.6;
controls.panSpeed = 0.6;
controls.enableZoom = true;
controls.enablePan = true;
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

// Shift + Left drag pans
window.addEventListener('keydown', (e) => {
  if (e.key === 'Shift') controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
});
window.addEventListener('keyup', (e) => {
  controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
});

// ----- Lighting -----
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

// ----- GLTF Loader -----
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

loader.load('test.glb', (gltf) => {
  const model1 = gltf.scene;
  model1.position.set(-1, 0, 0);
  scene.add(model1);
});

loader.load('test2.glb', (gltf) => {
  const model2 = gltf.scene;
  model2.position.set(1, 0, 0);
  scene.add(model2);
});

// ----- Postprocessing -----
const composer = new EffectComposer(renderer);
composer.setPixelRatio(window.devicePixelRatio);

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// BokehPass (keep soft blur)
const bokehPass = new BokehPass(scene, camera, {
  focus: 4.0,
  aperture: 0.003,
  maxblur: 0.002,
  width: window.innerWidth,
  height: window.innerHeight
});
composer.addPass(bokehPass);

// FXAA Pass for smooth edges
const fxaaPass = new ShaderPass(FXAAShader);
fxaaPass.material.uniforms['resolution'].value.set(
  1 / (window.innerWidth * window.devicePixelRatio),
  1 / (window.innerHeight * window.devicePixelRatio)
);
composer.addPass(fxaaPass);

// ----- Resize Handler -----
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  composer.setSize(window.innerWidth, window.innerHeight);
  fxaaPass.material.uniforms['resolution'].value.set(
    1 / (window.innerWidth * window.devicePixelRatio),
    1 / (window.innerHeight * window.devicePixelRatio)
  );
});

// ----- Double-tap Reset -----
let lastTap = 0;
renderer.domElement.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTap < 300) controls.reset();
  lastTap = now;
});

// ----- Auto-Rotate After Idle -----
let idleTimer = Date.now();
const autoRotateDelay = 3000;
controls.autoRotate = false;
controls.autoRotateSpeed = 1.0;

['pointerdown', 'wheel', 'keydown', 'touchstart'].forEach((eventName) => {
  window.addEventListener(eventName, () => {
    idleTimer = Date.now();
    controls.autoRotate = false;
  });
});

// ----- Animate Loop -----
function animate() {
  requestAnimationFrame(animate);

  if (Date.now() - idleTimer > autoRotateDelay) {
    controls.autoRotate = true;
  }

  controls.update();
  composer.render();
}

animate();

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';

// Scene
const scene = new THREE.Scene();

// 🌫️ Linear fog with white background
scene.background = new THREE.Color(0xffffff);
scene.fog = new THREE.Fog(0xffffff, 2, 15); // near, far control object fade

// Camera
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 1.5, 4);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.setClearColor(scene.fog.color);
document.body.appendChild(renderer.domElement);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 0.5;   // allow zoom very close
controls.maxDistance = 50;    // allow zoom very far
controls.target.set(0, 0, 0);
controls.update();

// 🌙 Brighter soft lighting setup
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xcccccc, 1.0);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(5, 10, 5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.radius = 3;
scene.add(dirLight);

// Optional subtle fill light for extra depth
const fillLight = new THREE.PointLight(0xffffff, 0.2, 50);
fillLight.position.set(-10, 5, -10);
scene.add(fillLight);

// ✅ GLTFLoader with DRACOLoader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

// Load test.glb
loader.load(
  'test.glb',
  (gltf) => {
    gltf.scene.position.set(-1, 0, 0);
    scene.add(gltf.scene);
  },
  undefined,
  (err) => console.error('Error loading test.glb:', err)
);

// Load test2.glb
loader.load(
  'test2.glb',
  (gltf) => {
    gltf.scene.position.set(1, 0, 0);
    scene.add(gltf.scene);
  },
  undefined,
  (err) => console.error('Error loading test2.glb:', err)
);

// Postprocessing with BokehPass (soft DoF)
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bokehPass = new BokehPass(scene, camera, {
  focus: 4.0,       // focus near red table
  aperture: 0.003,  // subtle blur
  maxblur: 0.002,   // very soft
  width: window.innerWidth,
  height: window.innerHeight
});
composer.addPass(bokehPass);

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// Animate
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  composer.render();
}
animate();

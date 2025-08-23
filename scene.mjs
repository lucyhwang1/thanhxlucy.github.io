import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';

// Scene
const scene = new THREE.Scene();

// 🌫️ Soft mist fog
scene.fog = new THREE.FogExp2(0x222233, 0.01);
scene.background = scene.fog.color;

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

// 🌙 Soft lighting setup
const ambientLight = new THREE.AmbientLight(0x8888aa, 0.3); // cool ambient
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xaaaaee, 0x444444, 0.6);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xccccff, 0.4);
dirLight.position.set(5, 10, 5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.radius = 4;
scene.add(dirLight);

// Optional subtle fill light
const fillLight = new THREE.PointLight(0x666688, 0.2, 50);
fillLight.position.set(-10, 5, -10);
scene.add(fillLight);

// ✅ GLTFLoader with DRACOLoader
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

loader.load(
  'test.glb',
  (gltf) => {
    gltf.scene.position.set(-1, 0, 0);
    scene.add(gltf.scene);
  },
  undefined,
  (err) => console.error('Error loading test.glb:', err)
);

loader.load(
  'test2.glb',
  (gltf) => {
    gltf.scene.position.set(1, 0, 0);
    scene.add(gltf.scene);
  },
  undefined,
  (err) => console.error('Error loading test2.glb:', err)
);

// Postprocessing with BokehPass
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bokehPass = new BokehPass(scene, camera, {
  focus: 15.0,
  aperture: 0.004,   // subtle blur
  maxblur: 0.003,    // very soft
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

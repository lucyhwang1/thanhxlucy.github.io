import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer, RenderPass, EffectPass, DepthOfFieldEffect } from 'https://cdn.jsdelivr.net/npm/postprocessing@6.30.3/build/postprocessing.esm.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(2, 4, 2);
scene.add(dirLight);

// GLTF loading
const loader = new GLTFLoader();

loader.load('test.glb', (gltf) => {
  gltf.scene.position.set(-1, 0, 0);
  scene.add(gltf.scene);
});

loader.load('test2.glb', (gltf) => {
  gltf.scene.position.set(1, 0, 0);
  scene.add(gltf.scene);
});

// ✅ Depth of Field setup
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const dofEffect = new DepthOfFieldEffect(camera, {
  focusDistance: 0.025,
  focalLength: 0.05,
  bokehScale: 2.0,
  height: 480,
});

const effectPass = new EffectPass(camera, dofEffect);
effectPass.renderToScreen = true;
composer.addPass(effectPass);

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

// Animate
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  composer.render();
}
animate();

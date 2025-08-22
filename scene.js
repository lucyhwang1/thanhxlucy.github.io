import * as THREE from 'https://cdn.skypack.dev/three@0.150.1';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.150.1/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.150.1/examples/jsm/controls/OrbitControls.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff); // white background

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(2, 4, 2);
scene.add(light);

scene.add(new THREE.AmbientLight(0xffffff, 0.5));

// GLTF Loader
const loader = new GLTFLoader();

loader.load('test.glb', (gltf) => {
  gltf.scene.position.set(-1, 0, 0); // Position model 1
  scene.add(gltf.scene);
});

loader.load('test2.glb', (gltf) => {
  gltf.scene.position.set(1, 0, 0); // Position model 2
  scene.add(gltf.scene);
});

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animate
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

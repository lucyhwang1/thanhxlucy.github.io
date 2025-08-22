import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  EffectComposer,
  RenderPass,
  DepthOfFieldEffect,
  EffectPass
} from 'https://unpkg.com/postprocessing@6.6.0/build/postprocessing.esm.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

scene.add(new THREE.AmbientLight(0xffffff, 0.5));
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(2, 4, 2);
scene.add(dirLight);

const loader = new GLTFLoader();

// Load models as before
loader.load('test.glb', gltf => {
  gltf.scene.position.set(-1, 0, 0);
  scene.add(gltf.scene);
}, undefined, console.error);

loader.load('test2.glb', gltf => {
  gltf.scene.position.set(1, 0, 0);
  scene.add(gltf.scene);
}, undefined, console.error);

// Set up Depth of Field effect
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const dof = new DepthOfFieldEffect(camera, {
  focusDistance: 0.03,
  focalLength: 0.05,
  bokehScale: 2.0,
  height: innerHeight
});

const effectPass = new EffectPass(camera, dof);
effectPass.renderToScreen = true;
composer.addPass(effectPass);

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  composer.render();
}

animate();

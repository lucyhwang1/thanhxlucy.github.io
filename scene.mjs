import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { BokehShader } from 'three/examples/jsm/shaders/BokehShader.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

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
document.body.appendChild(renderer.domElement);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// 🌙 Simple, soft lighting setup

// Very soft base light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);

// Skylight (soft global, sky vs ground)
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

// Gentle sunlight for shading
const dirLight = new THREE.DirectionalLight(0xffffff, 0.3);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// ✅ GLTFLoader with DRACOLoader support
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

// Load test.glb (with built-in light possibly)
loader.load(
  'test.glb',
  (gltf) => {
    gltf.scene.position.set(-1, 0, 0);
    scene.add(gltf.scene);
  },
  undefined,
  (err) => console.error('Error loading test.glb:', err)
);

// Load test2.glb (no internal lights)
loader.load(
  'test2.glb',
  (gltf) => {
    gltf.scene.position.set(1, 0, 0);
    scene.add(gltf.scene);
  },
  undefined,
  (err) => console.error('Error loading test2.glb:', err)
);

// Postprocessing with BokehShader (Depth of Field)
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bokehPass = new ShaderPass(BokehShader);
bokehPass.uniforms['focus'].value = 1.0;
bokehPass.uniforms['aperture'].value = 0.02;
bokehPass.uniforms['maxblur'].value = 0.005;
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








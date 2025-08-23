import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// ----- Scene Setup -----
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);
scene.fog = new THREE.FogExp2(0xffffff, 0.02); // exponential fog for smoother feel

// ----- Camera -----
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(3, 6, 6); // start a bit away

// ----- Renderer -----
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

// ----- Controls -----
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.15;
controls.zoomSpeed = 1.0;
controls.rotateSpeed = 0.6;
controls.panSpeed = 0.6;
controls.enableZoom = true;
controls.enablePan = true;
controls.maxDistance = 50;

// ----- Lighting -----
scene.add(new THREE.AmbientLight(0xffffff, 1.0));

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xcccccc, 0.5);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

// ----- Load Models -----
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);

const models = ['test.glb', 'test2.glb'];
models.forEach((url, i) => {
  loader.load(url, (gltf) => {
    const model = gltf.scene;
    model.position.x = i === 0 ? -1 : 1;
    scene.add(model);

    // Create ground plane below first model
    if (i === 0) {
      const box = new THREE.Box3().setFromObject(model);
      const minY = box.min.y;
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(50, 50),
        new THREE.MeshStandardMaterial({ color: 0xaaaaaa })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = minY - 0.01;
      scene.add(ground);
    }
  });
});

// ----- Postprocessing -----
const composer = new EffectComposer(renderer);
composer.setPixelRatio(window.devicePixelRatio);

const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Soft Bokeh
const bokehPass = new BokehPass(scene, camera, {
  focus: 4.0,
  aperture: 0.01,
  maxblur: 0.01,
  width: window.innerWidth,
  height: window.innerHeight
});
composer.addPass(bokehPass);

// Bloom
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.3, 0.3, 0.5
);
composer.addPass(bloomPass);

// FXAA
const fxaaPass = new ShaderPass(FXAAShader);
fxaaPass.material.uniforms['resolution'].value.set(
  1 / (window.innerWidth * window.devicePixelRatio),
  1 / (window.innerHeight * window.devicePixelRatio)
);
composer.addPass(fxaaPass);

// ----- Resize -----
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

// ===== Idle Camera Transition =====
let cameraAnimating = false;
let cancelCameraAnimation = false;
let idleTimeout;

// Easing
function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// Reset idle timer
function resetIdleTimer() {
  clearTimeout(idleTimeout);

  if (cameraAnimating) {
    cancelCameraAnimation = true;
    cameraAnimating = false;
  }

  idleTimeout = setTimeout(startCameraTransition, 10000); // 10s idle
}

// Watch user interactions
['mousemove', 'mousedown', 'wheel', 'keydown', 'touchstart'].forEach(evt =>
  window.addEventListener(evt, resetIdleTimer)
);

// Camera transition
function startCameraTransition() {
  const startPos = camera.position.clone();

  // Random position on sphere
  const radius = 10;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.random() * (Math.PI / 3) + Math.PI / 6;

  const endPos = new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );

  const duration = 5000; // 5 sec
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
        resetIdleTimer(); // restart idle cycle
      }
    }
  }

  requestAnimationFrame(animateCamera);
}

// Start idle timer
resetIdleTimer();

// ===== Dynamic Fog + Bloom =====
function updateEffects() {
  const distance = camera.position.length();

  // Fog density (smooth scale)
  const fogDensity = THREE.MathUtils.clamp(distance * 0.005, 0.01, 0.08);
  scene.fog.density = fogDensity;

  // Bloom strength (smooth scale)
  const bloomStrength = THREE.MathUtils.clamp(distance * 0.05, 0.3, 1.2);
  bloomPass.strength = bloomStrength;
}

// ----- Animation Loop -----
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  updateEffects();
  composer.render();
}
animate();


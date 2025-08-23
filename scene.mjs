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
scene.fog = new THREE.FogExp2(0xffffff, 0.1); // denser even up close

// ----- Camera -----
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(3, 6, 6);

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
controls.autoRotate = false;
controls.autoRotateSpeed = 0.8;

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

    // Ground under first model
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
let autoRotateTimeout;

// Easing
function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// Reset idle timer
function resetIdleTimer() {
  clearTimeout(idleTimeout);
  clearTimeout(autoRotateTimeout);

  controls.autoRotate = false;

  if (cameraAnimating) {
    cancelCameraAnimation = true;
    cameraAnimating = false;
  }

  autoRotateTimeout = setTimeout(() => {
    controls.autoRotate = true;
  }, 3000); // 3s idle → autorotate

  idleTimeout = setTimeout(startCameraZoomOut, 10000); // 10s idle → zoom out
}

// Watch user interactions
['mousemove', 'mousedown', 'wheel', 'keydown', 'touchstart'].forEach(evt =>
  window.addEventListener(evt, resetIdleTimer)
);

// Camera zoom out transition
function startCameraZoomOut() {
  const startPos = camera.position.clone();
  const dir = startPos.clone().normalize();
  const endPos = startPos.clone().add(dir.multiplyScalar(3)); // zoom out 3 units further

  const duration = 4000; // 4 sec
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
        resetIdleTimer(); // chain another idle cycle
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

  function updateEffectsBasedOnDistance() {
  const distance = camera.position.length();

  // Fog density: strong baseline + slightly increases with distance
  const fogDensity = THREE.MathUtils.clamp(0.15 + distance * 0.003, 0.15, 0.25);
  scene.fog.density = fogDensity;

  // Bloom: softer up close, stronger when farther away
  const bloomStrength = THREE.MathUtils.clamp(0.15 + distance * 0.02, 0.15, 0.7);
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



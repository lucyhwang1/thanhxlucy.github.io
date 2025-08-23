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
scene.fog = new THREE.FogExp2(0xffffff, 0.1); // stronger fog overall

// ----- Camera -----
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(4, 4, 4);

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
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xcccccc, 0.3);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.3);
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

composer.addPass(new RenderPass(scene, camera));

const bokehPass = new BokehPass(scene, camera, {
  focus: 4.0,
  aperture: 0.01,
  maxblur: 0.01,
  width: window.innerWidth,
  height: window.innerHeight
});
composer.addPass(bokehPass);

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.3, 0.3, 0.5
);
composer.addPass(bloomPass);

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

// ===== Idle Camera + Zoom Out =====
let cameraAnimating = false;
let cancelCameraAnimation = false;
let idleTimeout;
let autoRotateTimeout;

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function resetIdleTimer() {
  clearTimeout(idleTimeout);
  clearTimeout(autoRotateTimeout);

  controls.autoRotate = false;

  if (cameraAnimating) {
    cancelCameraAnimation = true;
    cameraAnimating = false;
  }

  // Enable auto-rotate after 3s idle
  autoRotateTimeout = setTimeout(() => {
    controls.autoRotate = true;
  }, 3000);

  // Zoom out every 10s idle
  idleTimeout = setTimeout(startCameraZoomOut, 10000);
}

['mousemove', 'mousedown', 'wheel', 'keydown', 'touchstart'].forEach(evt =>
  window.addEventListener(evt, resetIdleTimer)
);

function startCameraZoomOut() {
  const startPos = camera.position.clone();
  const dir = startPos.clone().normalize();
  const endPos = startPos.clone().add(dir.multiplyScalar(3)); // zoom out 3 units
  const duration = 4000;
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
        resetIdleTimer();
      }
    }
  }

  requestAnimationFrame(animateCamera);
}

// Start idle timers
resetIdleTimer();

// ===== Dynamic Fog + Bloom =====
function updateEffects() {
  const distance = camera.position.length();

  // Fog: stronger baseline + increases slightly with distance
  scene.fog.density = THREE.MathUtils.clamp(0.1 + distance * 0.002, 0.2, 0.3);

  // Bloom: softer up close, stronger with distance
  bloomPass.strength = THREE.MathUtils.clamp(0.05 + distance * 0.02, 0.15, 0.7);
}

// ----- Animation Loop -----
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  updateEffects();
  composer.render();
}

animate();



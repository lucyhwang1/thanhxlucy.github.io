// ----- Your Lights (unchanged) -----
const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
directionalLight.position.set(5, 10, 7);
directionalLight.castShadow = true;
scene.add(directionalLight);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.5);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

const pointLight = new THREE.PointLight(0xffffff, 2, 100);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

const rectLight = new THREE.RectAreaLight(0xffffff, 5, 15, 15);
rectLight.position.set(5, 5, 5);
rectLight.lookAt(0, 0, 0);
scene.add(rectLight);

// ----- Bloom (less bright now) -----
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.6, // lower strength
  0.4,
  0.85
);
composer.addPass(bloomPass);

// ----- Orbit Controls -----
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = true;     // autorotate
controls.autoRotateSpeed = 0.5; // slow & smooth
let autoRotateTimeout;

controls.addEventListener("start", () => {
  controls.autoRotate = false;
});
controls.addEventListener("end", () => {
  clearTimeout(autoRotateTimeout);
  autoRotateTimeout = setTimeout(() => {
    controls.autoRotate = true;
  }, 8000); // restart after 8s idle
});

// ----- Idle Zoom Out -----
let idleTimeout, zooming = false;

function startIdleTimer() {
  clearTimeout(idleTimeout);
  if (!zooming) {
    idleTimeout = setTimeout(() => zoomOutCamera(), 10000); // 10s idle
  }
}

function zoomOutCamera() {
  zooming = true;
  const startPos = camera.position.clone();
  const endPos = startPos.clone().multiplyScalar(1.2); // zoom out 20%
  const duration = 3000;
  let startTime = null;

  function animateZoom(time) {
    if (!startTime) startTime = time;
    const t = Math.min((time - startTime) / duration, 1);
    camera.position.lerpVectors(startPos, endPos, t);
    camera.lookAt(0, 0, 0);
    if (t < 1 && zooming) {
      requestAnimationFrame(animateZoom);
    } else {
      zooming = false;
      startIdleTimer();
    }
  }
  requestAnimationFrame(animateZoom);
}

// Reset idle timer on interaction
["pointerdown", "wheel", "keydown"].forEach(evt =>
  window.addEventListener(evt, () => {
    zooming = false;
    startIdleTimer();
  })
);

startIdleTimer();

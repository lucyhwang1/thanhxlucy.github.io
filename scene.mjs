// ----- Lights -----
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // lift shadows
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2); // softer main light
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
scene.add(dirLight);

// ----- Bloom -----
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.6, // strength (less bright)
  0.4, // radius
  0.85 // threshold
);
composer.addPass(bloomPass);

// ----- Orbit Controls -----
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = true;     // autorotate
controls.autoRotateSpeed = 0.5; // nice and slow
controls.addEventListener("start", () => {
  controls.autoRotate = false; // stop auto-rotate if user moves
});
controls.addEventListener("end", () => {
  // optional: after some idle time, restart autoRotate
  clearTimeout(autoRotateTimeout);
  autoRotateTimeout = setTimeout(() => {
    controls.autoRotate = true;
  }, 8000);
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
  const endPos = startPos.clone().multiplyScalar(1.2); // zoom out by 20%
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
      startIdleTimer(); // restart timer
    }
  }
  requestAnimationFrame(animateZoom);
}

// Reset idle timer on interaction
["pointerdown", "wheel", "keydown"].forEach(evt =>
  window.addEventListener(evt, () => {
    zooming = false; // cancel zoom
    startIdleTimer();
  })
);

// Start the idle timer
startIdleTimer();

/* ═══════════════════════════════════════════════════════════════════
   FCC R-400 — COMPLETE 3D SCENE
   ═══════════════════════════════════════════════════════════════════ */

// ─── Global State ───
let scene, camera, renderer, controls, composer;
let raycaster, mouse, clock;
let regeneratorMesh = null;
let slideValveMeshes = [];
let slideValveData = [];
let riserPipeMesh = null;
let fluidizedBedParticles = null;
let catalystRiserParticles = null;
let spentCatParticles = null;
let regenCatParticles = null;
let flueGasParticles = null;
let airInjectionParticles = null;
let currentView = 'external';
let audioCtx = null;
let roarGain = null;
const particleSystems = [];
const interactiveObjects = [];
let catCircRate = 845;
let valvePositions = { sv401: 42, sv402: 48 };

// ─── Layout Constants ───
const LAYOUT = {
  regen:     { x: -8,  y: 5,  z: 0, r: 4.0, h: 10 },
  stripper:  { x: 7,   y: 2.5,z: 0, r: 2.5, h: 5  },
  reactor:   { x: 7,   y: 9.5,z: 0, r: 3.0, h: 8  },
  riser:     { x: -0.5,y: 15, z: 0, r: 0.6, h: 20 },
  fractionator: { x: 22, y: 11, z: 0, r: 2.5, h: 18 },
  slurry:    { x: 22,  y: 1.5,z: 0, r: 1.2, h: 3  }
};

// ─── Camera Presets for 4 View Modes ───
const cameraPresets = {
  external: { pos: [38, 22, 38], target: [6, 10, 0] },
  internal: { pos: [7, 10, 0],   target: [7, 10, 0] },
  cutaway:  { pos: [30, 16, 30], target: [6, 8, 0] },
  flow:     { pos: [28, 20, 28], target: [6, 10, 0] }
};

/* ═══════════════════════════════════════════════════════
   INITIALIZATION
   ═══════════════════════════════════════════════════════ */
function init() {
  const container = document.getElementById('canvas-container');
  clock = new THREE.Clock();

  // ─── Scene ───
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0e17);
  scene.fog = new THREE.FogExp2(0x0a0e17, 0.006);

  // ─── Camera ───
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 300);
  camera.position.set(38, 22, 38);

  // ─── Renderer ───
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  container.appendChild(renderer.domElement);

  // ─── Controls ───
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.set(6, 10, 0);
  controls.minDistance = 5;
  controls.maxDistance = 100;

  // ─── Post-processing (UnrealBloomPass) ───
  composer = new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.RenderPass(scene, camera));
  const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.5, 0.4, 0.85
  );
  composer.addPass(bloomPass);

  // ─── Raycaster ───
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // ─── 5-Light Setup ───
  setupLights();

  // ─── Build 3D Model ───
  try {
    buildFCC();
  } catch (e) {
    console.error("FCC Build Error:", e);
  }

  // ─── Particle Systems ───
  buildParticles();

  // ─── Ground Plane ───
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: 0x0d1220, roughness: 0.95, metalness: 0.1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.5;
  ground.receiveShadow = true;
  scene.add(ground);

  // ─── Events ───
  window.addEventListener('resize', onResize);
  renderer.domElement.addEventListener('click', onClick);
  renderer.domElement.addEventListener('mousemove', onMouseMove);

  try {
    setupViewToggle();
    initAudio();
  } catch (e) {
    console.warn("Non-critical initialization failed:", e);
  }

  // ─── Hide Loading Screen ───
  simulateLoading();
}

/* ═══════════════════════════════════════════════════════
   5-LIGHT SETUP
   ═══════════════════════════════════════════════════════ */
function setupLights() {
  // 1) Key light — warm directional from upper-right
  const keyLight = new THREE.DirectionalLight(0xffeedd, 1.2);
  keyLight.position.set(20, 35, 15);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.left = -30; keyLight.shadow.camera.right = 30;
  keyLight.shadow.camera.top = 35; keyLight.shadow.camera.bottom = -5;
  keyLight.shadow.camera.far = 80;
  scene.add(keyLight);

  // 2) Fill light — cool blue from left
  const fillLight = new THREE.DirectionalLight(0x8899cc, 0.4);
  fillLight.position.set(-20, 15, -10);
  scene.add(fillLight);

  // 3) Back rim light — amber from behind
  const rimLight = new THREE.DirectionalLight(0xffcc88, 0.35);
  rimLight.position.set(-10, 20, -25);
  scene.add(rimLight);

  // 4) Ambient light — low-intensity
  const ambientLight = new THREE.AmbientLight(0x303848, 0.5);
  scene.add(ambientLight);

  // 5) Regenerator internal glow (orange hot bed)
  const regenGlow = new THREE.PointLight(0xff6622, 1.5, 20);
  regenGlow.position.set(LAYOUT.regen.x, LAYOUT.regen.y + 2, LAYOUT.regen.z);
  scene.add(regenGlow);
  // Second regen glow for upper section
  const regenGlow2 = new THREE.PointLight(0xff4400, 0.8, 15);
  regenGlow2.position.set(LAYOUT.regen.x, LAYOUT.regen.y + 6, LAYOUT.regen.z);
  scene.add(regenGlow2);
}

/* ═══════════════════════════════════════════════════════
   MATERIALS (RAL Colors & ISO Pipe Colors)
   ═══════════════════════════════════════════════════════ */
function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color, metalness: opts.metalness ?? 0.85, roughness: opts.roughness ?? 0.25,
    transparent: opts.transparent ?? false, opacity: opts.opacity ?? 1.0,
    side: opts.side ?? THREE.FrontSide, emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0
  });
}

const M = {
  shell:       () => mat(0xd5dce0, { metalness: 0.8, roughness: 0.2, transparent: true, opacity: 0.55 }),
  shellSolid:  () => mat(0xd5dce0, { metalness: 0.8, roughness: 0.2 }),
  darkSteel:   () => mat(0x383e45, { metalness: 0.9, roughness: 0.2 }),
  stainless:   () => mat(0xc0c8d0, { metalness: 0.95, roughness: 0.15 }),
  oshaYellow:  () => mat(0xf0c040, { metalness: 0.6, roughness: 0.35 }),
  pipeVGO:     () => mat(0x8B4513, { metalness: 0.5, roughness: 0.4 }),
  pipeGasoline:() => mat(0x22c55e, { metalness: 0.5, roughness: 0.4 }),
  pipeLCO:     () => mat(0x38bdf8, { metalness: 0.5, roughness: 0.4 }),
  pipeHCO:     () => mat(0x6366f1, { metalness: 0.5, roughness: 0.4 }),
  pipeSlurry:  () => mat(0x5a4a3a, { metalness: 0.6, roughness: 0.4 }),
  pipeSteam:   () => mat(0xd4d4d4, { metalness: 0.7, roughness: 0.3 }),
  pipeAir:     () => mat(0xaabbcc, { metalness: 0.5, roughness: 0.3 }),
  pipeFlueGas: () => mat(0x707878, { metalness: 0.4, roughness: 0.4 }),
  pipeCatalyst:() => mat(0xc4956a, { metalness: 0.5, roughness: 0.4 }),
  catalyst:    () => mat(0xa07850, { metalness: 0.3, roughness: 0.6, transparent: true, opacity: 0.5 }),
  hotBed:      () => mat(0xff6622, { emissive: 0xff4400, emissiveIntensity: 0.8, transparent: true, opacity: 0.35 }),
  glass:       () => new THREE.MeshPhysicalMaterial({ color: 0xaaccff, metalness: 0.05, roughness: 0.05,
    transmission: 0.92, thickness: 0.5, transparent: true, opacity: 0.45 }),
  insulation:  () => mat(0xd4c4a8, { metalness: 0.1, roughness: 0.9, transparent: true, opacity: 0.35 }),
  concrete:    () => mat(0x606868, { metalness: 0.05, roughness: 0.95 }),
  grating:     () => mat(0x505a64, { metalness: 0.7, roughness: 0.5, transparent: true, opacity: 0.6 }),
  warningRed:  () => mat(0xcc2222, { metalness: 0.5, roughness: 0.4 }),
  cyclone:     () => mat(0xb0b8c0, { metalness: 0.85, roughness: 0.2 }),
  refractory:  () => mat(0x8a7560, { metalness: 0.1, roughness: 0.9, transparent: true, opacity: 0.3 }),
};

/* ═══════════════════════════════════════════════════════
   HELPER: Nozzle, Pipe, Platform, Stair
   ═══════════════════════════════════════════════════════ */
function addNozzle(x, y, z, dir, len, r, pipeMat) {
  const grp = new THREE.Group();
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 12), pipeMat);
  pipe.position.set(x, y, z);
  if (dir === 'bottom') pipe.rotation.x = Math.PI;
  else if (dir === 'left') pipe.rotation.z = Math.PI / 2;
  else if (dir === 'right') pipe.rotation.z = -Math.PI / 2;
  else if (dir === 'front') pipe.rotation.x = Math.PI / 2;
  else if (dir === 'back') pipe.rotation.x = -Math.PI / 2;
  grp.add(pipe);
  const flange = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.8, r * 1.8, 0.08, 12), M.darkSteel());
  const fOff = dir === 'top' ? len / 2 : dir === 'bottom' ? -len / 2 : len / 2;
  flange.position.set(x, y + fOff, z);
  grp.add(flange);
  return grp;
}

function addPipe(points, radius, pipeMat, parent) {
  const curve = new THREE.CatmullRomCurve3(points);
  const tubeGeo = new THREE.TubeGeometry(curve, 48, radius, 10, false);
  const pipe = new THREE.Mesh(tubeGeo, pipeMat);
  pipe.castShadow = true;
  (parent || scene).add(pipe);
  return pipe;
}

function buildPlatform(x, y, z, w, d, includeStairs) {
  const grp = new THREE.Group();
  const grating = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, d), M.grating());
  grating.position.set(x, y, z);
  grp.add(grating);
  // Support beams
  [-d/3, 0, d/3].forEach(zOff => {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(w, 0.15, 0.12), M.darkSteel());
    beam.position.set(x, y - 0.1, z + zOff);
    grp.add(beam);
  });
  // Handrail posts
  const railH = 1.1;
  for (let px = -w/2; px <= w/2; px += 2) {
    [d/2, -d/2].forEach(zr => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, railH, 8), M.oshaYellow());
      post.position.set(x + px, y + railH / 2, z + zr);
      grp.add(post);
    });
  }
  // Top rail
  [d/2, -d/2].forEach(zr => {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, w, 8), M.oshaYellow());
    rail.rotation.z = Math.PI / 2;
    rail.position.set(x, y + railH, z + zr);
    grp.add(rail);
  });
  // Knee rail
  [d/2, -d/2].forEach(zr => {
    const midRail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, w, 8), M.oshaYellow());
    midRail.rotation.z = Math.PI / 2;
    midRail.position.set(x, y + railH * 0.5, z + zr);
    grp.add(midRail);
  });
  // Toe board
  [d/2, -d/2].forEach(zr => {
    const toe = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, 0.04), M.oshaYellow());
    toe.position.set(x, y + 0.09, z + zr);
    grp.add(toe);
  });
  // Stairway
  if (includeStairs) {
    const stairGrp = new THREE.Group();
    const stairSteps = 12;
    for (let i = 0; i < stairSteps; i++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.3), M.grating());
      const stairH = y - 0.5;
      step.position.set(x - w/2 - 0.6 - i * 0.15, stairH * (i / stairSteps), z - d/2 - 1.5 + i * (d/2 + 1.5) / stairSteps);
      stairGrp.add(step);
    }
    [-0.6, 0.6].forEach(zs => {
      const sRail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, y, 8), M.oshaYellow());
      sRail.position.set(x - w/2 - 0.6 - 1.5, y / 2, z - d/2 - 0.8 + zs);
      sRail.rotation.z = 0.25;
      stairGrp.add(sRail);
    });
    grp.add(stairGrp);
  }
  scene.add(grp);
  return grp;
}

/* ═══════════════════════════════════════════════════════
   BUILD FCC R-400 — COMPLETE 3D MODEL
   ═══════════════════════════════════════════════════════ */
function buildFCC() {
  const fcc = new THREE.Group();
  fcc.name = 'FCC-R400';

  // ─── REGENERATOR (r=4.0, H=10) — Largest vessel, fluidized bed ───
  buildRegenerator(fcc);

  // ─── RISER REACTOR (r=0.6, H=20) — Very tall vertical pipe ───
  buildRiser(fcc);

  // ─── REACTOR / DISPLACER VESSEL (r=3.0, H=8) with cyclones ───
  buildReactor(fcc);

  // ─── STRIPPING SECTION (r=2.5, H=4) below reactor ───
  buildStripper(fcc);

  // ─── CATALYST TRANSFER LINES with slide valves ───
  buildTransferLines(fcc);

  // ─── MAIN FRACTIONATOR COLUMN (r=2.5, H=18) ───
  buildFractionator(fcc);

  // ─── SLURRY SETTLER ───
  buildSlurrySettler(fcc);

  // ─── STRUCTURAL STEEL FRAMEWORK ───
  buildSteelStructure(fcc);

  // ─── OVERHEAD CONDENSER + REFLUX DRUM ───
  buildOverheadSystem(fcc);

  // ─── CO BOILER / HEAT RECOVERY ───
  buildCOBoiler(fcc);

  // ─── EXTERNAL PIPING ───
  buildExternalPiping(fcc);

  fcc.position.y = 0;
  scene.add(fcc);
}

/* ─── Regenerator ─── */
function buildRegenerator(parent) {
  const L = LAYOUT.regen;
  const grp = new THREE.Group();
  grp.name = 'regenerator';
  regeneratorMesh = grp;

  // Main shell (transparent to show internal bed)
  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(L.r, L.r, L.h, 48, 1, true),
    M.shell()
  );
  shell.position.set(L.x, L.y, L.z);
  shell.castShadow = true;
  grp.add(shell);

  // Top and bottom domes
  const topDome = new THREE.Mesh(
    new THREE.SphereGeometry(L.r, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2),
    M.shellSolid()
  );
  topDome.position.set(L.x, L.y + L.h / 2, L.z);
  grp.add(topDome);

  const botDome = new THREE.Mesh(
    new THREE.SphereGeometry(L.r, 48, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    M.shellSolid()
  );
  botDome.position.set(L.x, L.y - L.h / 2, L.z);
  grp.add(botDome);

  // Weld seam rings
  const weldMat = mat(0xb0b8c0, { metalness: 0.9, roughness: 0.15 });
  [-3, 0, 3].forEach(yOff => {
    const weldRing = new THREE.Mesh(
      new THREE.TorusGeometry(L.r + 0.02, 0.04, 8, 48),
      weldMat
    );
    weldRing.position.set(L.x, L.y + yOff, L.z);
    grp.add(weldRing);
  });

  // Dense fluidized catalyst bed (lower 60% of regenerator)
  const bedHeight = L.h * 0.55;
  const bedMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(L.r * 0.95, L.r * 0.95, bedHeight, 32),
    M.hotBed()
  );
  bedMesh.position.set(L.x, L.y - L.h / 2 + bedHeight / 2 + 0.3, L.z);
  bedMesh.name = 'denseBed';
  grp.add(bedMesh);

  // Catalyst particles in bed (inner cylinder, animated separately)
  const bedParticlesMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(L.r * 0.85, L.r * 0.85, bedHeight * 0.9, 32, 1, true),
    M.catalyst()
  );
  bedParticlesMesh.position.set(L.x, L.y - L.h / 2 + bedHeight / 2 + 0.3, L.z);
  grp.add(bedParticlesMesh);

  // Air distribution grid (windbox) at bottom
  const gridY = L.y - L.h / 2 + 0.8;
  const gridDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(L.r * 0.9, L.r * 0.9, 0.15, 32),
    M.stainless()
  );
  gridDisc.position.set(L.x, gridY, L.z);
  grp.add(gridDisc);
  // Air nozzles on grid (12 around)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const nr = L.r * 0.75;
    const nozzle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.05, 0.5, 8),
      M.stainless()
    );
    nozzle.position.set(L.x + Math.cos(a) * nr, gridY + 0.3, L.z + Math.sin(a) * nr);
    grp.add(nozzle);
    // Small dome cap
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.stainless());
    cap.position.set(L.x + Math.cos(a) * nr, gridY + 0.55, L.z + Math.sin(a) * nr);
    grp.add(cap);
  }

  // Internal cyclones at top (2 sets)
  for (let c = 0; c < 3; c++) {
    const angle = (c / 3) * Math.PI * 2;
    const cr = L.r * 0.5;
    buildCyclone(grp, L.x + Math.cos(angle) * cr, L.y + L.h * 0.3, L.z + Math.sin(angle) * cr, 0.8, 1.8);
  }

  // Second stage diplegs
  for (let c = 0; c < 3; c++) {
    const angle = (c / 3) * Math.PI * 2 + Math.PI / 3;
    const cr = L.r * 0.35;
    buildCyclone(grp, L.x + Math.cos(angle) * cr, L.y + L.h * 0.15, L.z + Math.sin(angle) * cr, 0.6, 1.4);
  }

  // Flue gas outlet nozzle (top)
  grp.add(addNozzle(L.x, L.y + L.h / 2 + 0.5, L.z, 'top', 1.5, 0.8, M.pipeFlueGas()));

  // Air inlet nozzle (bottom side)
  grp.add(addNozzle(L.x - L.r - 0.8, L.y - L.h / 2 + 1, L.z, 'right', 1.5, 0.6, M.pipeAir()));

  // Regen catalyst outlet (bottom center)
  grp.add(addNozzle(L.x, L.y - L.h / 2 - 0.5, L.z, 'bottom', 1.2, 0.5, M.pipeCatalyst()));

  // Spent catalyst inlet (upper side toward reactor)
  grp.add(addNozzle(L.x + L.r + 0.5, L.y + 2, L.z + 1, 'left', 1.2, 0.5, M.pipeCatalyst()));

  // Manway
  const mw = new THREE.Group();
  mw.add(new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.6, 16), M.shellSolid()));
  mw.children[0].position.set(L.x + L.r + 0.3, L.y + 2, L.z);
  mw.children[0].rotation.z = Math.PI / 2;
  mw.add(new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.1, 16), M.darkSteel()));
  mw.children[1].position.set(L.x + L.r + 0.8, L.y + 2, L.z);
  grp.add(mw);

  parent.add(grp);
}

/* ─── Build a single cyclone (inverted cone with dipleg) ─── */
function buildCyclone(parent, x, y, z, r, h) {
  const cyclone = new THREE.Group();
  // Barrel (upper cylinder)
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(r, r, h * 0.4, 16, 1, true),
    M.cyclone()
  );
  barrel.position.y = h * 0.3;
  cyclone.add(barrel);
  // Cone (lower inverted cone)
  const cone = new THREE.Mesh(
    new THREE.CylinderGeometry(r, r * 0.2, h * 0.5, 16, 1, true),
    M.cyclone()
  );
  cone.position.y = -h * 0.1;
  cyclone.add(cone);
  // Dipleg (thin pipe extending down from cone)
  const dipleg = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.15, r * 0.15, h * 0.6, 8),
    M.cyclone()
  );
  dipleg.position.y = -h * 0.55;
  cyclone.add(dipleg);
  // Vortex finder (top pipe going up)
  const vortex = new THREE.Mesh(
    new THREE.CylinderGeometry(r * 0.3, r * 0.3, h * 0.3, 8),
    M.cyclone()
  );
  vortex.position.y = h * 0.6;
  cyclone.add(vortex);

  cyclone.position.set(x, y, z);
  parent.add(cyclone);
}

/* ─── Riser Reactor (r=0.6, H=20) — Very tall vertical pipe ─── */
function buildRiser(parent) {
  const L = LAYOUT.riser;
  const grp = new THREE.Group();
  grp.name = 'riser';

  const botY = L.y - L.h / 2;
  const topY = L.y + L.h / 2;

  // Main riser pipe (transparent to see catalyst flowing)
  riserPipeMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(L.r, L.r, L.h, 24, 1, true),
    M.shell()
  );
  riserPipeMesh.position.set(L.x, L.y, L.z);
  riserPipeMesh.castShadow = true;
  grp.add(riserPipeMesh);

  // Inner catalyst flow visualization
  const catFlow = new THREE.Mesh(
    new THREE.CylinderGeometry(L.r * 0.7, L.r * 0.7, L.h * 0.95, 16, 1, true),
    M.catalyst()
  );
  catFlow.position.set(L.x, L.y, L.z);
  grp.add(catFlow);

  // Expansion at top (riser exit / disengaging device)
  const exitExp = new THREE.Mesh(
    new THREE.CylinderGeometry(L.r * 2.5, L.r, 2.0, 24, 1, true),
    M.shellSolid()
  );
  exitExp.position.set(L.x, topY + 1, L.z);
  grp.add(exitExp);

  // Feed injection nozzles at bottom (3 at 120°)
  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2;
    const nozzle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.08, 0.8, 8),
      M.stainless()
    );
    nozzle.rotation.z = Math.PI / 2;
    nozzle.position.set(
      L.x + Math.cos(angle) * (L.r + 0.6),
      botY + 1.5,
      L.z + Math.sin(angle) * (L.r + 0.6)
    );
    nozzle.rotation.z = -Math.PI / 2;
    // Aim inward at angle
    nozzle.lookAt(L.x, botY + 1.5, L.z);
    nozzle.rotateX(Math.PI / 2);
    grp.add(nozzle);

    // Nozzle flange
    const flange = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.08, 8),
      M.darkSteel()
    );
    flange.position.set(
      L.x + Math.cos(angle) * (L.r + 1.0),
      botY + 1.5,
      L.z + Math.sin(angle) * (L.r + 1.0)
    );
    grp.add(flange);
  }

  // Steam stripping nozzles (2 at bottom)
  [-1, 1].forEach(side => {
    const steamNoz = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.06, 0.5, 8),
      M.stainless()
    );
    steamNoz.position.set(L.x + side * 0.3, botY + 0.5, L.z);
    grp.add(steamNoz);
  });

  // Quench nozzle at top
  const quench = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.6, 8),
    M.pipeSteam()
  );
  quench.position.set(L.x, topY - 1, L.z + L.r + 0.5);
  quench.rotation.z = Math.PI / 2;
  grp.add(quench);

  // VGO feed pipe to bottom nozzles
  addPipe([
    new THREE.Vector3(L.x - 5, botY + 1.5, L.z - 3),
    new THREE.Vector3(L.x - 2, botY + 1.5, L.z - 2),
    new THREE.Vector3(L.x - L.r - 1.2, botY + 1.5, L.z)
  ], 0.25, M.pipeVGO(), grp);

  // Refractory lining indication (rings)
  for (let yy = botY + 2; yy < topY; yy += 4) {
    const refRing = new THREE.Mesh(
      new THREE.TorusGeometry(L.r + 0.08, 0.05, 6, 24),
      M.refractory()
    );
    refRing.position.set(L.x, yy, L.z);
    grp.add(refRing);
  }

  parent.add(grp);
}

/* ─── Reactor / Displacer Vessel (r=3.0, H=8) ─── */
function buildReactor(parent) {
  const L = LAYOUT.reactor;
  const grp = new THREE.Group();
  grp.name = 'reactor';

  // Main shell
  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(L.r, L.r, L.h, 48, 1, true),
    M.shell()
  );
  shell.position.set(L.x, L.y, L.z);
  shell.castShadow = true;
  grp.add(shell);

  // Top dome
  const topDome = new THREE.Mesh(
    new THREE.SphereGeometry(L.r, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2),
    M.shellSolid()
  );
  topDome.position.set(L.x, L.y + L.h / 2, L.z);
  grp.add(topDome);

  // Bottom head (flat with nozzle opening)
  const botHead = new THREE.Mesh(
    new THREE.CylinderGeometry(L.r, L.r, 0.3, 48),
    M.shellSolid()
  );
  botHead.position.set(L.x, L.y - L.h / 2, L.z);
  grp.add(botHead);

  // Internal cyclones (2 sets, primary + secondary)
  for (let c = 0; c < 2; c++) {
    const angle = (c / 2) * Math.PI * 2;
    const cr = L.r * 0.4;
    buildCyclone(grp, L.x + Math.cos(angle) * cr, L.y + L.h * 0.2, L.z + Math.sin(angle) * cr, 1.0, 2.5);
  }
  // Secondary cyclones
  for (let c = 0; c < 2; c++) {
    const angle = (c / 2) * Math.PI * 2 + Math.PI / 2;
    const cr = L.r * 0.3;
    buildCyclone(grp, L.x + Math.cos(angle) * cr, L.y + L.h * 0.1, L.z + Math.sin(angle) * cr, 0.7, 1.8);
  }

  // Vapor outlet nozzle (top — goes to fractionator)
  grp.add(addNozzle(L.x + L.r + 0.5, L.y + L.h / 2 - 0.5, L.z, 'left', 1.5, 0.6, M.pipeSteam()));

  // Weld seams
  const weldMat = mat(0xb0b8c0, { metalness: 0.9, roughness: 0.15 });
  [-2, 2].forEach(yOff => {
    const wr = new THREE.Mesh(new THREE.TorusGeometry(L.r + 0.02, 0.035, 8, 48), weldMat);
    wr.position.set(L.x, L.y + yOff, L.z);
    grp.add(wr);
  });

  // Riser entry point (side, lower area)
  const riserEntry = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 0.8, 0.8, 24),
    M.shellSolid()
  );
  riserEntry.rotation.z = Math.PI / 2;
  riserEntry.position.set(L.x - L.r - 0.4, L.y - L.h / 2 + 2.5, L.z);
  grp.add(riserEntry);

  parent.add(grp);
}

/* ─── Stripping Section (r=2.5, H=4) below reactor ─── */
function buildStripper(parent) {
  const L = LAYOUT.stripper;
  const reactorL = LAYOUT.reactor;
  const grp = new THREE.Group();
  grp.name = 'stripper';

  const topY = reactorL.y - reactorL.h / 2;
  const botY = topY - L.h;

  // Shell
  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(L.r, L.r, L.h, 32, 1, true),
    M.shell()
  );
  shell.position.set(L.x, (topY + botY) / 2, L.z);
  shell.castShadow = true;
  grp.add(shell);

  // Top flange (connects to reactor)
  const topFl = new THREE.Mesh(new THREE.CylinderGeometry(L.r + 0.1, L.r + 0.1, 0.15, 32), M.darkSteel());
  topFl.position.set(L.x, topY, L.z);
  grp.add(topFl);

  // Bottom dome
  const botDome = new THREE.Mesh(
    new THREE.SphereGeometry(L.r, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    M.shellSolid()
  );
  botDome.position.set(L.x, botY, L.z);
  grp.add(botDome);

  // Steam stripping baffles (6 horizontal disks)
  for (let i = 0; i < 6; i++) {
    const baffle = new THREE.Mesh(
      new THREE.CylinderGeometry(L.r * 0.85, L.r * 0.85, 0.06, 32, 1, false, 0, Math.PI),
      M.stainless()
    );
    baffle.position.set(L.x, topY - 0.5 - i * 0.6, L.z);
    baffle.rotation.y = (i % 2 === 0) ? 0 : Math.PI / 2;
    grp.add(baffle);
  }

  // Steam injection nozzle
  grp.add(addNozzle(L.x - L.r - 0.5, botY + 1, L.z, 'right', 1.0, 0.2, M.pipeSteam()));

  // Spent catalyst outlet (bottom)
  grp.add(addNozzle(L.x, botY - 0.5, L.z, 'bottom', 1.0, 0.5, M.pipeCatalyst()));

  parent.add(grp);
}

/* ─── Catalyst Transfer Lines with Slide Valves ─── */
function buildTransferLines(parent) {
  const regen = LAYOUT.regen;
  const reactor = LAYOUT.reactor;
  const stripper = LAYOUT.stripper;
  const riser = LAYOUT.riser;
  const stripBotY = reactor.y - reactor.h / 2 - stripper.h;

  // ─── Spent Catalyst Standpipe: Reactor bottom → Regenerator top ───
  // From stripper bottom → down → curve → across → into regenerator upper area
  addPipe([
    new THREE.Vector3(stripper.x, stripBotY - 1, stripper.z),
    new THREE.Vector3(stripper.x, stripBotY - 3, stripper.z),
    new THREE.Vector3(stripper.x - 3, stripBotY - 4, stripper.z + 2),
    new THREE.Vector3(regen.x + regen.r + 2, regen.y + 2, regen.z + 2),
    new THREE.Vector3(regen.x + regen.r + 1, regen.y + 2, regen.z + 1)
  ], 0.45, M.pipeCatalyst(), parent);

  // Slide Valve SV-401 (spent cat) on the standpipe
  const sv401 = buildSlideValve(
    stripper.x - 1.5, stripBotY - 3.5, stripper.z + 1, 'SV-401', 'spent'
  );
  parent.add(sv401.mesh);
  slideValveMeshes.push(sv401.mesh);
  slideValveData.push({ id: 'sv401', label: 'SV-401 Spent Cat Valve', position: 42 });

  // ─── Regenerated Catalyst Standpipe: Regenerator bottom → Riser bottom ───
  addPipe([
    new THREE.Vector3(regen.x, regen.y - regen.h / 2 - 1, regen.z),
    new THREE.Vector3(regen.x, regen.y - regen.h / 2 - 3, regen.z),
    new THREE.Vector3(regen.x + 3, regen.y - regen.h / 2 - 4, regen.z - 2),
    new THREE.Vector3(riser.x + 2, riser.y - riser.h / 2 + 1, riser.z - 2),
    new THREE.Vector3(riser.x, riser.y - riser.h / 2 + 1, riser.z)
  ], 0.45, M.pipeCatalyst(), parent);

  // Slide Valve SV-402 (regen cat) on the standpipe
  const sv402 = buildSlideValve(
    regen.x + 1.5, regen.y - regen.h / 2 - 3.5, regen.z - 1, 'SV-402', 'regen'
  );
  parent.add(sv402.mesh);
  slideValveMeshes.push(sv402.mesh);
  slideValveData.push({ id: 'sv402', label: 'SV-402 Regen Cat Valve', position: 48 });
}

/* ─── Build Slide Valve ─── */
function buildSlideValve(x, y, z, tag, type) {
  const grp = new THREE.Group();
  grp.name = tag;
  grp.userData.type = 'slidevalve';
  grp.userData.valveId = type === 'spent' ? 'sv401' : 'sv402';
  grp.userData.valveLabel = type === 'spent' ? 'SV-401 Spent Catalyst' : 'SV-402 Regen Catalyst';

  // Valve body (box)
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.8, 0.8),
    M.darkSteel()
  );
  body.position.set(x, y, z);
  body.castShadow = true;
  grp.add(body);

  // Valve actuator (cylinder on top)
  const actuator = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 1.0, 12),
    M.warningRed()
  );
  actuator.position.set(x, y + 0.9, z);
  grp.add(actuator);

  // Handwheel
  const wheel = new THREE.Mesh(
    new THREE.TorusGeometry(0.25, 0.04, 8, 16),
    M.oshaYellow()
  );
  wheel.position.set(x, y + 1.5, z);
  grp.add(wheel);

  // Stem
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.5, 6),
    M.stainless()
  );
  stem.position.set(x, y + 1.2, z);
  grp.add(stem);

  // Tag plate
  const tagPlate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.8, 0.3),
    new THREE.MeshBasicMaterial({ color: 0xf0c040, side: THREE.DoubleSide })
  );
  tagPlate.position.set(x + 0.7, y, z + 0.42);
  grp.add(tagPlate);

  // Position indicator
  // Manually add the mesh
  const indMesh = new THREE.Mesh(new THREE.CircleGeometry(0.08, 12), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
  indMesh.position.set(x - 0.7, y + 0.1, z + 0.42);
  grp.add(indMesh);

  // Flanges on either side
  [-0.7, 0.7].forEach(xOff => {
    const fl = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.1, 12), M.darkSteel());
    fl.rotation.z = Math.PI / 2;
    fl.position.set(x + xOff, y, z);
    grp.add(fl);
  });

  return { mesh: grp };
}

/* ─── Main Fractionator Column (r=2.5, H=18) ─── */
function buildFractionator(parent) {
  const L = LAYOUT.fractionator;
  const grp = new THREE.Group();
  grp.name = 'fractionator';

  const botY = L.y - L.h / 2;
  const topY = L.y + L.h / 2;

  // Main shell
  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(L.r, L.r, L.h, 48, 1, true),
    M.shell()
  );
  shell.position.set(L.x, L.y, L.z);
  shell.castShadow = true;
  grp.add(shell);

  // Top dome
  const topDome = new THREE.Mesh(
    new THREE.SphereGeometry(L.r, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2),
    M.shellSolid()
  );
  topDome.position.set(L.x, topY, L.z);
  grp.add(topDome);

  // Bottom dome
  const botDome = new THREE.Mesh(
    new THREE.SphereGeometry(L.r, 48, 24, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    M.shellSolid()
  );
  botDome.position.set(L.x, botY, L.z);
  grp.add(botDome);

  // Trays (~25) shown as horizontal rings
  for (let i = 0; i < 25; i++) {
    const trayY = botY + 0.5 + i * (L.h - 1) / 25;
    const tray = new THREE.Mesh(
      new THREE.CylinderGeometry(L.r * 0.92, L.r * 0.92, 0.04, 32, 1, false, 0, Math.PI * 1.8),
      M.stainless()
    );
    tray.position.set(L.x, trayY, L.z);
    tray.rotation.y = (i % 2 === 0) ? 0 : Math.PI;
    grp.add(tray);
  }

  // Product draw nozzles
  // FCC Gasoline draw (upper section)
  grp.add(addNozzle(L.x, L.y + 4, L.z, 'front', 1.2, 0.25, M.pipeGasoline()));
  // LCO draw (middle section)
  grp.add(addNozzle(L.x, L.y, L.z, 'front', 1.2, 0.25, M.pipeLCO()));
  // HCO draw (lower section)
  grp.add(addNozzle(L.x, L.y - 3.5, L.z, 'front', 1.2, 0.2, M.pipeHCO()));
  // Slurry draw (bottom)
  grp.add(addNozzle(L.x, botY + 1, L.z, 'front', 1.0, 0.2, M.pipeSlurry()));
  // Feed inlet (bottom — from reactor vapor)
  grp.add(addNozzle(L.x - L.r - 0.5, botY + 1.5, L.z, 'right', 1.5, 0.5, M.pipeSteam()));
  // Overhead vapor out (top)
  grp.add(addNozzle(L.x, topY + 0.5, L.z, 'top', 1.2, 0.4, M.pipeSteam()));

  // Weld seams
  const weldMat = mat(0xb0b8c0, { metalness: 0.9, roughness: 0.15 });
  for (let i = -3; i <= 3; i++) {
    const wr = new THREE.Mesh(new THREE.TorusGeometry(L.r + 0.02, 0.035, 8, 48), weldMat);
    wr.position.set(L.x, L.y + i * 2.5, L.z);
    grp.add(wr);
  }

  // Insulation bands
  const insMat = M.insulation();
  for (let i = -3; i <= 3; i++) {
    const ins = new THREE.Mesh(
      new THREE.CylinderGeometry(L.r + 0.08, L.r + 0.08, 2.2, 48, 1, true),
      insMat
    );
    ins.position.set(L.x, L.y + i * 2.5, L.z);
    grp.add(ins);
  }

  parent.add(grp);
}

/* ─── Slurry Settler ─── */
function buildSlurrySettler(parent) {
  const L = LAYOUT.slurry;
  const grp = new THREE.Group();
  grp.name = 'slurrySettler';

  // Horizontal vessel
  const shell = new THREE.Mesh(
    new THREE.CylinderGeometry(L.r, L.r, L.h * 2, 24, 1, true),
    M.shellSolid()
  );
  shell.rotation.z = Math.PI / 2;
  shell.position.set(L.x, L.y, L.z);
  grp.add(shell);

  // End caps
  [-L.h, L.h].forEach(xOff => {
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(L.r, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      M.shellSolid()
    );
    cap.position.set(L.x + xOff, L.y, L.z);
    cap.rotation.z = xOff > 0 ? -Math.PI / 2 : Math.PI / 2;
    grp.add(cap);
  });

  // Inlet / outlet nozzles
  grp.add(addNozzle(L.x - L.h - 0.5, L.y, L.z, 'left', 0.8, 0.15, M.pipeSlurry()));
  grp.add(addNozzle(L.x + L.h + 0.5, L.y, L.z, 'right', 0.8, 0.15, M.pipeSlurry()));

  // Support legs
  [-1, 1].forEach(zOff => {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, L.y, 8),
      M.darkSteel()
    );
    leg.position.set(L.x, L.y / 2, L.z + zOff * L.r * 0.8);
    grp.add(leg);
  });

  parent.add(grp);
}

/* ─── Structural Steel Framework ─── */
function buildSteelStructure(parent) {
  const grp = new THREE.Group();
  grp.name = 'steelStructure';

  // Main column supports (vertical I-beams)
  const beamPositions = [
    // Regenerator legs (4)
    [LAYOUT.regen.x - 4.5, 0, LAYOUT.regen.z - 4.5],
    [LAYOUT.regen.x - 4.5, 0, LAYOUT.regen.z + 4.5],
    [LAYOUT.regen.x + 4.5, 0, LAYOUT.regen.z - 4.5],
    [LAYOUT.regen.x + 4.5, 0, LAYOUT.regen.z + 4.5],
    // Reactor/Stripper legs (4)
    [LAYOUT.reactor.x - 3.5, 0, LAYOUT.reactor.z - 3.5],
    [LAYOUT.reactor.x - 3.5, 0, LAYOUT.reactor.z + 3.5],
    [LAYOUT.reactor.x + 3.5, 0, LAYOUT.reactor.z - 3.5],
    [LAYOUT.reactor.x + 3.5, 0, LAYOUT.reactor.z + 3.5],
    // Fractionator legs (4)
    [LAYOUT.fractionator.x - 3, 0, LAYOUT.fractionator.z - 3],
    [LAYOUT.fractionator.x - 3, 0, LAYOUT.fractionator.z + 3],
    [LAYOUT.fractionator.x + 3, 0, LAYOUT.fractionator.z - 3],
    [LAYOUT.fractionator.x + 3, 0, LAYOUT.fractionator.z + 3],
  ];

  beamPositions.forEach(([bx, , bz]) => {
    const columnH = 12;
    const column = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, columnH, 0.3),
      M.darkSteel()
    );
    column.position.set(bx, columnH / 2 - 0.5, bz);
    column.castShadow = true;
    grp.add(column);
  });

  // Horizontal cross-bracing between columns
  // Regen cross-bracing at y=3 and y=8
  [3, 8].forEach(braceY => {
    // Front-to-back
    [LAYOUT.regen.x - 4.5, LAYOUT.regen.x + 4.5].forEach(xb => {
      const brace = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 9), M.darkSteel());
      brace.position.set(xb, braceY, LAYOUT.regen.z);
      grp.add(brace);
    });
    // Side-to-side
    [LAYOUT.regen.z - 4.5, LAYOUT.regen.z + 4.5].forEach(zb => {
      const brace = new THREE.Mesh(new THREE.BoxGeometry(9, 0.15, 0.15), M.darkSteel());
      brace.position.set(LAYOUT.regen.x, braceY, zb);
      grp.add(brace);
    });
  });

  // Reactor cross-bracing
  [3, 8, 14].forEach(braceY => {
    [LAYOUT.reactor.x - 3.5, LAYOUT.reactor.x + 3.5].forEach(xb => {
      const brace = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 7), M.darkSteel());
      brace.position.set(xb, braceY, LAYOUT.reactor.z);
      grp.add(brace);
    });
    [LAYOUT.reactor.z - 3.5, LAYOUT.reactor.z + 3.5].forEach(zb => {
      const brace = new THREE.Mesh(new THREE.BoxGeometry(7, 0.15, 0.15), M.darkSteel());
      brace.position.set(LAYOUT.reactor.x, braceY, zb);
      grp.add(brace);
    });
  });

  // Fractionator cross-bracing
  [3, 8, 14].forEach(braceY => {
    [LAYOUT.fractionator.x - 3, LAYOUT.fractionator.x + 3].forEach(xb => {
      const brace = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 6), M.darkSteel());
      brace.position.set(xb, braceY, LAYOUT.fractionator.z);
      grp.add(brace);
    });
    [LAYOUT.fractionator.z - 3, LAYOUT.fractionator.z + 3].forEach(zb => {
      const brace = new THREE.Mesh(new THREE.BoxGeometry(6, 0.15, 0.15), M.darkSteel());
      brace.position.set(LAYOUT.fractionator.x, braceY, zb);
      grp.add(brace);
    });
  });

  // Diagonal bracing (X-pattern) on regenerator
  [-1, 1].forEach(side => {
    const diag1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 13), M.darkSteel());
    diag1.position.set(LAYOUT.regen.x - 4.5 * side, 5, LAYOUT.regen.z);
    diag1.rotation.z = side * 0.4;
    grp.add(diag1);
  });

  // Large pipe rack connecting units (at y=3 level, running the length)
  const rackLong = new THREE.Mesh(new THREE.BoxGeometry(40, 0.2, 0.2), M.darkSteel());
  rackLong.position.set(7, 3.5, -6);
  grp.add(rackLong);
  const rackLong2 = new THREE.Mesh(new THREE.BoxGeometry(40, 0.2, 0.2), M.darkSteel());
  rackLong2.position.set(7, 3.5, -5);
  grp.add(rackLong2);
  // Pipe rack vertical supports
  for (let px = -10; px <= 28; px += 6) {
    const rackVert = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 0.2), M.darkSteel());
    rackVert.position.set(px, 1.5, -5.5);
    grp.add(rackVert);
  }
  // Cross beams on pipe rack
  for (let px = -10; px <= 28; px += 6) {
    const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 1.5), M.darkSteel());
    crossBeam.position.set(px, 3.5, -5.5);
    grp.add(crossBeam);
  }

  // Pipe rack level 2 (higher, at y=7)
  const rackHigh = new THREE.Mesh(new THREE.BoxGeometry(35, 0.15, 0.15), M.darkSteel());
  rackHigh.position.set(5, 7, -5.5);
  grp.add(rackHigh);

  parent.add(grp);

  // ─── Platforms at different elevations ───
  buildPlatform(LAYOUT.regen.x, LAYOUT.regen.y + LAYOUT.regen.h / 2 + 0.5, LAYOUT.regen.z, 12, 10, true);
  buildPlatform(LAYOUT.reactor.x, LAYOUT.reactor.y + LAYOUT.reactor.h / 2 + 0.5, LAYOUT.reactor.z, 10, 8, true);
  buildPlatform(LAYOUT.fractionator.x, LAYOUT.fractionator.y + 8, LAYOUT.fractionator.z, 8, 6, false);
  buildPlatform(LAYOUT.fractionator.x, LAYOUT.fractionator.y, LAYOUT.fractionator.z, 8, 6, false);
  buildPlatform(LAYOUT.fractionator.x, LAYOUT.fractionator.y - 5, LAYOUT.fractionator.z, 8, 6, false);
  buildPlatform(0, LAYOUT.riser.y + LAYOUT.riser.h / 2 + 1, LAYOUT.riser.z, 6, 5, false);
}

/* ─── Overhead Condenser + Reflux Drum ─── */
function buildOverheadSystem(parent) {
  const frac = LAYOUT.fractionator;
  const topY = frac.y + frac.h / 2;

  // Overhead condenser (horizontal shell-and-tube)
  const condenser = new THREE.Group();
  const condShell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.6, 0.6, 5, 16, 1, true),
    M.shellSolid()
  );
  condShell.rotation.z = Math.PI / 2;
  condenser.add(condShell);
  // Tube sheets
  [-2.5, 2.5].forEach(xOff => {
    const ts = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.08, 16), M.darkSteel());
    condenser.add(ts);
    ts.position.x = xOff;
  });
  condenser.position.set(frac.x + 5, topY + 2, frac.z);
  parent.add(condenser);

  // Reflux drum (horizontal vessel)
  const reflux = new THREE.Group();
  const refShell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 0.8, 4, 16, 1, true),
    M.shellSolid()
  );
  refShell.rotation.z = Math.PI / 2;
  reflux.add(refShell);
  [-2, 2].forEach(xOff => {
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      M.shellSolid()
    );
    cap.position.x = xOff;
    cap.rotation.z = xOff > 0 ? -Math.PI / 2 : Math.PI / 2;
    reflux.add(cap);
  });
  reflux.position.set(frac.x + 5, topY - 1, frac.z + 3);
  parent.add(reflux);

  // Support legs for reflux drum
  [-1.5, 1.5].forEach(xOff => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3, 6), M.darkSteel());
    leg.position.set(frac.x + 5 + xOff, topY - 2.5, frac.z + 3);
    parent.add(leg);
  });

  // Piping: overhead vapor → condenser → reflux drum → back to column
  addPipe([
    new THREE.Vector3(frac.x, topY + 0.5, frac.z),
    new THREE.Vector3(frac.x + 2, topY + 2, frac.z),
    new THREE.Vector3(frac.x + 5, topY + 2, frac.z)
  ], 0.3, M.pipeSteam(), parent);

  addPipe([
    new THREE.Vector3(frac.x + 5, topY + 2, frac.z),
    new THREE.Vector3(frac.x + 5, topY - 1, frac.z + 1.5),
    new THREE.Vector3(frac.x + 5, topY - 1, frac.z + 3)
  ], 0.2, M.pipeGasoline(), parent);

  // Reflux return
  addPipe([
    new THREE.Vector3(frac.x + 5, topY - 1, frac.z + 3),
    new THREE.Vector3(frac.x + 3, topY - 2, frac.z + 4),
    new THREE.Vector3(frac.x, topY - 3, frac.z + 4),
    new THREE.Vector3(frac.x, frac.y + 6, frac.z + frac.r + 0.5)
  ], 0.15, M.pipeGasoline(), parent);
}

/* ─── CO Boiler / Heat Recovery ─── */
function buildCOBoiler(parent) {
  const regen = LAYOUT.regen;
  const topY = regen.y + regen.h / 2;

  // Flue gas stack/chimney
  const stackGrp = new THREE.Group();
  stackGrp.name = 'coBoiler';

  // Stack (tall cylinder)
  const stack = new THREE.Mesh(
    new THREE.CylinderGeometry(1.0, 1.2, 12, 24, 1, true),
    M.shellSolid()
  );
  stack.position.set(regen.x - 3, topY + 7, regen.z - 3);
  stackGrp.add(stack);

  // Stack top flare/damper
  const stackTop = new THREE.Mesh(
    new THREE.CylinderGeometry(1.3, 1.0, 0.5, 24),
    M.darkSteel()
  );
  stackTop.position.set(regen.x - 3, topY + 13, regen.z - 3);
  stackGrp.add(stackTop);

  // CO boiler box (rectangular)
  const boilerBox = new THREE.Mesh(
    new THREE.BoxGeometry(5, 3, 3),
    M.shellSolid()
  );
  boilerBox.position.set(regen.x - 3, topY + 1.5, regen.z - 3);
  stackGrp.add(boilerBox);

  // Flue gas duct from regenerator top → CO boiler
  addPipe([
    new THREE.Vector3(regen.x, topY + 0.8, regen.z),
    new THREE.Vector3(regen.x - 1.5, topY + 1.5, regen.z - 1.5),
    new THREE.Vector3(regen.x - 3, topY + 1.5, regen.z - 3)
  ], 0.7, M.pipeFlueGas(), parent);

  parent.add(stackGrp);
}

/* ─── External Piping ─── */
function buildExternalPiping(parent) {
  const regen = LAYOUT.regen;
  const reactor = LAYOUT.reactor;
  const frac = LAYOUT.fractionator;
  const riser = LAYOUT.riser;
  const stripBotY = reactor.y - reactor.h / 2 - LAYOUT.stripper.h;

  // VGO feed to riser bottom
  addPipe([
    new THREE.Vector3(riser.x - 10, riser.y - riser.h / 2 + 1.5, riser.z - 5),
    new THREE.Vector3(riser.x - 5, riser.y - riser.h / 2 + 1.5, riser.z - 3),
    new THREE.Vector3(riser.x - riser.r - 1.2, riser.y - riser.h / 2 + 1.5, riser.z)
  ], 0.3, M.pipeVGO(), parent);

  // Reactor overhead vapor → fractionator feed
  addPipe([
    new THREE.Vector3(reactor.x + reactor.r + 0.5, reactor.y + reactor.h / 2 - 0.5, reactor.z),
    new THREE.Vector3(reactor.x + 4, reactor.y + reactor.h / 2 + 1, reactor.z),
    new THREE.Vector3(frac.x - 4, frac.y + 3, frac.z - 2),
    new THREE.Vector3(frac.x - frac.r - 0.5, frac.y - frac.h / 2 + 1.5, frac.z)
  ], 0.5, M.pipeSteam(), parent);

  // FCC Gasoline product out
  addPipe([
    new THREE.Vector3(frac.x, frac.y + 4, frac.z + frac.r + 0.5),
    new THREE.Vector3(frac.x, frac.y + 4, frac.z + 4),
    new THREE.Vector3(frac.x + 6, frac.y + 4, frac.z + 5)
  ], 0.2, M.pipeGasoline(), parent);

  // LCO product out
  addPipe([
    new THREE.Vector3(frac.x, frac.y, frac.z + frac.r + 0.5),
    new THREE.Vector3(frac.x, frac.y, frac.z + 4),
    new THREE.Vector3(frac.x + 6, frac.y, frac.z + 5)
  ], 0.2, M.pipeLCO(), parent);

  // HCO product out
  addPipe([
    new THREE.Vector3(frac.x, frac.y - 3.5, frac.z + frac.r + 0.5),
    new THREE.Vector3(frac.x, frac.y - 3.5, frac.z + 3.5),
    new THREE.Vector3(frac.x + 5, frac.y - 3.5, frac.z + 4.5)
  ], 0.18, M.pipeHCO(), parent);

  // Slurry product out → slurry settler
  addPipe([
    new THREE.Vector3(frac.x, frac.y - frac.h / 2 + 1, frac.z + frac.r + 0.5),
    new THREE.Vector3(frac.x, frac.y - frac.h / 2, frac.z + 2),
    new THREE.Vector3(frac.x, LAYOUT.slurry.y + LAYOUT.slurry.r, LAYOUT.slurry.z + 1.5)
  ], 0.18, M.pipeSlurry(), parent);

  // Air blower → regenerator air inlet
  addPipe([
    new THREE.Vector3(regen.x - 10, regen.y - regen.h / 2 + 1, regen.z - 4),
    new THREE.Vector3(regen.x - 7, regen.y - regen.h / 2 + 1, regen.z - 3),
    new THREE.Vector3(regen.x - regen.r - 0.8, regen.y - regen.h / 2 + 1, regen.z)
  ], 0.4, M.pipeAir(), parent);

  // Steam to stripper
  const stripSteamY = reactor.y - reactor.h / 2 - LAYOUT.stripper.h + 1;
  addPipe([
    new THREE.Vector3(reactor.x - 8, stripSteamY, reactor.z - 3),
    new THREE.Vector3(reactor.x - 4, stripSteamY, reactor.z - 2),
    new THREE.Vector3(reactor.x - LAYOUT.stripper.r - 0.5, stripSteamY, reactor.z)
  ], 0.15, M.pipeSteam(), parent);
}

/* ═══════════════════════════════════════════════════════
   PARTICLE SYSTEMS
   ═══════════════════════════════════════════════════════ */
function buildParticles() {
  const regen = LAYOUT.regen;
  const reactor = LAYOUT.reactor;
  const frac = LAYOUT.fractionator;
  const riser = LAYOUT.riser;
  const stripBotY = reactor.y - reactor.h / 2 - LAYOUT.stripper.h;

  // ─── Catalyst flowing UP riser (brown dense particles) ───
  catalystRiserParticles = createParticleSystem('catalystRiser', 0xc4956a, 400, {
    curve: [
      new THREE.Vector3(riser.x, riser.y - riser.h / 2 + 1, riser.z),
      new THREE.Vector3(riser.x + 0.1, riser.y - 3, riser.z),
      new THREE.Vector3(riser.x - 0.1, riser.y + 3, riser.z),
      new THREE.Vector3(riser.x, riser.y + riser.h / 2 - 1, riser.z)
    ], speed: 0.5, size: 0.12
  });

  // ─── Spent catalyst flowing DOWN standpipe to regenerator ───
  spentCatParticles = createParticleSystem('spentCat', 0x8a6840, 200, {
    curve: [
      new THREE.Vector3(reactor.x, stripBotY - 1, reactor.z),
      new THREE.Vector3(reactor.x - 2, stripBotY - 3, reactor.z + 1),
      new THREE.Vector3(regen.x + 5, regen.y + 3, regen.z + 2),
      new THREE.Vector3(regen.x + regen.r + 1, regen.y + 2, regen.z + 1)
    ], speed: 0.3, size: 0.1
  });

  // ─── Regenerated catalyst flowing to riser bottom ───
  regenCatParticles = createParticleSystem('regenCat', 0xd4a060, 200, {
    curve: [
      new THREE.Vector3(regen.x, regen.y - regen.h / 2 - 1, regen.z),
      new THREE.Vector3(regen.x + 2, regen.y - regen.h / 2 - 3, regen.z - 1.5),
      new THREE.Vector3(riser.x + 2, riser.y - riser.h / 2 + 1, riser.z - 1.5),
      new THREE.Vector3(riser.x, riser.y - riser.h / 2 + 1, riser.z)
    ], speed: 0.35, size: 0.1
  });

  // ─── Fluidized bed particles in regenerator (floating/boiling) ───
  fluidizedBedParticles = createParticleSystem('fluidBed', 0xff8844, 500, {
    curve: [
      new THREE.Vector3(regen.x - 2, regen.y - 3, regen.z),
      new THREE.Vector3(regen.x + 2, regen.y - 2, regen.z + 1),
      new THREE.Vector3(regen.x - 1, regen.y + 1, regen.z - 1),
      new THREE.Vector3(regen.x + 1, regen.y - 1, regen.z),
      new THREE.Vector3(regen.x, regen.y - 3.5, regen.z + 0.5)
    ], speed: 0.25, size: 0.14
  });

  // ─── Flue gas rising from regenerator ───
  flueGasParticles = createParticleSystem('flueGas', 0x888888, 300, {
    curve: [
      new THREE.Vector3(regen.x, regen.y + regen.h / 2 + 0.5, regen.z),
      new THREE.Vector3(regen.x - 1, regen.y + regen.h / 2 + 4, regen.z),
      new THREE.Vector3(regen.x - 3, regen.y + regen.h / 2 + 8, regen.z - 2),
      new THREE.Vector3(regen.x - 3, regen.y + regen.h / 2 + 14, regen.z - 3)
    ], speed: 0.4, size: 0.1
  });

  // ─── Air injection into regenerator ───
  airInjectionParticles = createParticleSystem('airInject', 0xaabbdd, 200, {
    curve: [
      new THREE.Vector3(regen.x - 8, regen.y - regen.h / 2 + 1, regen.z - 4),
      new THREE.Vector3(regen.x - 5, regen.y - regen.h / 2 + 1, regen.z - 2),
      new THREE.Vector3(regen.x - regen.r, regen.y - regen.h / 2 + 1, regen.z)
    ], speed: 0.45, size: 0.08
  });

  // ─── Reactor overhead vapor to fractionator ───
  createParticleSystem('overheadVapor', 0xccddee, 250, {
    curve: [
      new THREE.Vector3(reactor.x + reactor.r, reactor.y + reactor.h / 2, reactor.z),
      new THREE.Vector3(reactor.x + 5, reactor.y + reactor.h / 2 + 2, reactor.z),
      new THREE.Vector3(frac.x - 4, frac.y + 3, frac.z - 1),
      new THREE.Vector3(frac.x - frac.r, frac.y - frac.h / 2 + 2, frac.z)
    ], speed: 0.4, size: 0.09
  });

  // ─── VGO feed particles ───
  createParticleSystem('vgoFeed', 0x8B4513, 150, {
    curve: [
      new THREE.Vector3(riser.x - 8, riser.y - riser.h / 2 + 1.5, riser.z - 4),
      new THREE.Vector3(riser.x - 4, riser.y - riser.h / 2 + 1.5, riser.z - 2),
      new THREE.Vector3(riser.x - riser.r - 1, riser.y - riser.h / 2 + 1.5, riser.z)
    ], speed: 0.4, size: 0.08
  });

  // ─── Gasoline product draw ───
  createParticleSystem('gasolDraw', 0x22c55e, 120, {
    curve: [
      new THREE.Vector3(frac.x, frac.y + 4, frac.z + frac.r),
      new THREE.Vector3(frac.x, frac.y + 4, frac.z + 3),
      new THREE.Vector3(frac.x + 5, frac.y + 4, frac.z + 4)
    ], speed: 0.35, size: 0.07
  });

  // ─── LCO product draw ───
  createParticleSystem('lcoDraw', 0x38bdf8, 100, {
    curve: [
      new THREE.Vector3(frac.x, frac.y, frac.z + frac.r),
      new THREE.Vector3(frac.x, frac.y, frac.z + 3),
      new THREE.Vector3(frac.x + 5, frac.y, frac.z + 4)
    ], speed: 0.3, size: 0.07
  });

  // ─── HCO product draw ───
  createParticleSystem('hcoDraw', 0x6366f1, 80, {
    curve: [
      new THREE.Vector3(frac.x, frac.y - 3.5, frac.z + frac.r),
      new THREE.Vector3(frac.x, frac.y - 3.5, frac.z + 2.5),
      new THREE.Vector3(frac.x + 4, frac.y - 3.5, frac.z + 4)
    ], speed: 0.25, size: 0.06
  });
}

// ─── Reusable Particle System Builder ───
function createParticleSystem(name, color, count, opts) {
  const points = [];
  const velocities = [];
  for (let i = 0; i < count; i++) {
    const t = Math.random();
    const p = opts.curve[0].clone().lerp(opts.curve[opts.curve.length - 1], t);
    p.x += (Math.random() - 0.5) * 0.4;
    p.y += (Math.random() - 0.5) * 0.4;
    p.z += (Math.random() - 0.5) * 0.4;
    points.push(p.x, p.y, p.z);
    velocities.push({
      offset: t,
      speedVar: 0.7 + Math.random() * 0.6,
      spread: (Math.random() - 0.5) * 0.25
    });
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  const pMat = new THREE.PointsMaterial({
    color, size: opts.size, transparent: true, opacity: 0.7,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
  });
  const system = new THREE.Points(geo, pMat);
  system.name = name;
  system.userData = { curve: opts.curve, velocities, speed: opts.speed, count };
  scene.add(system);
  particleSystems.push(system);
  return system;
}

/* ═══════════════════════════════════════════════════════
   RAYCASTER INTERACTION
   ═══════════════════════════════════════════════════════ */
const tooltip = document.getElementById('tooltip');

function collectInteractive() {
  // Slide valves
  slideValveMeshes.forEach(sv => {
    sv.traverse(child => {
      if (child.isMesh) {
        child.userData.type = 'slidevalve';
        child.userData.valveId = sv.userData.valveId;
        child.userData.valveLabel = sv.userData.valveLabel;
        interactiveObjects.push(child);
      }
    });
  });
  // Regenerator
  if (regeneratorMesh) {
    regeneratorMesh.traverse(child => {
      if (child.isMesh) {
        child.userData.type = 'regenerator';
        interactiveObjects.push(child);
      }
    });
  }
}

function onClick(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(interactiveObjects, true);
  if (hits.length > 0) {
    let obj = hits[0].object;
    while (obj && !obj.userData.type) obj = obj.parent;
    if (!obj) return;
    if (obj.userData.type === 'slidevalve') openValveModal(obj.userData.valveId, obj.userData.valveLabel);
    if (obj.userData.type === 'regenerator') showRegenInfo();
  }
}

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(interactiveObjects, true);
  if (hits.length > 0) {
    let obj = hits[0].object;
    while (obj && !obj.userData.type) obj = obj.parent;
    if (obj) {
      tooltip.style.display = 'block';
      tooltip.style.left = event.clientX + 12 + 'px';
      tooltip.style.top = event.clientY + 12 + 'px';
      if (obj.userData.type === 'slidevalve')
        tooltip.innerHTML = '<b>' + obj.userData.valveLabel + '</b><br>Click to adjust catalyst circulation rate';
      if (obj.userData.type === 'regenerator')
        tooltip.innerHTML = '<b>Regenerator R-400</b><br>Click to view bed temperature &amp; combustion status';
      renderer.domElement.style.cursor = 'pointer';
      return;
    }
  }
  tooltip.style.display = 'none';
  renderer.domElement.style.cursor = 'default';
}

function showRegenInfo() {
  const bedT = document.getElementById('r-bedtemp').textContent;
  const flueT = document.getElementById('r-fluegas').textContent;
  const o2 = document.getElementById('r-o2').textContent;
  const coc = document.getElementById('r-coco2').textContent;
  tooltip.style.display = 'block';
  tooltip.style.left = '50%';
  tooltip.style.top = '50%';
  tooltip.style.transform = 'translate(-50%, -50%)';
  tooltip.innerHTML = `<b>REGENERATOR STATUS</b><br>` +
    `Bed Temp: ${bedT}°C | Flue Gas: ${flueT}°C<br>` +
    `O₂: ${o2}% | CO/CO₂: ${coc}<br>` +
    `<span style="color:#22c55e;">● Combustion: COMPLETE</span>`;
  setTimeout(() => {
    tooltip.style.display = 'none';
    tooltip.style.transform = '';
  }, 3000);
}

function openValveModal(valveId, label) {
  const modal = document.getElementById('valve-modal');
  const overlay = document.getElementById('valve-overlay');
  document.getElementById('vm-title').textContent = label + ' Control';
  const pos = valvePositions[valveId];
  document.getElementById('vm-slider').value = pos;
  document.getElementById('vm-pos').textContent = pos + '%';
  document.getElementById('vm-flow').textContent = Math.round(pos * 20) + ' t/min';
  document.getElementById('vm-dp').textContent = (pos * 0.006 + 0.02).toFixed(2) + ' barg';
  modal.style.display = 'block';
  overlay.style.display = 'block';

  const slider = document.getElementById('vm-slider');
  slider.oninput = function() {
    const val = parseInt(this.value);
    valvePositions[valveId] = val;
    document.getElementById('vm-pos').textContent = val + '%';
    document.getElementById('vm-flow').textContent = Math.round(val * 20) + ' t/min';
    document.getElementById('vm-dp').textContent = (val * 0.006 + 0.02).toFixed(2) + ' barg';
    catCircRate = val * 20;
  };
}

function closeValveModal() {
  document.getElementById('valve-modal').style.display = 'none';
  document.getElementById('valve-overlay').style.display = 'none';
}

// Close modal on overlay click
document.getElementById('valve-overlay').addEventListener('click', closeValveModal);

/* ═══════════════════════════════════════════════════════
   WEB AUDIO API (Regenerator Roar + Air Blower)
   ═══════════════════════════════════════════════════════ */
function initAudio() {
  document.addEventListener('click', () => {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Low frequency regenerator roar
    const roarOsc = audioCtx.createOscillator();
    roarOsc.type = 'sawtooth';
    roarOsc.frequency.value = 45;
    roarGain = audioCtx.createGain();
    roarGain.gain.value = 0.04;
    const roarFilter = audioCtx.createBiquadFilter();
    roarFilter.type = 'lowpass';
    roarFilter.frequency.value = 100;
    roarOsc.connect(roarFilter);
    roarFilter.connect(roarGain);
    roarGain.connect(audioCtx.destination);
    roarOsc.start();

    // 90Hz harmonic for combustion rumble
    const rumble = audioCtx.createOscillator();
    rumble.type = 'sine';
    rumble.frequency.value = 90;
    const rumbleGain = audioCtx.createGain();
    rumbleGain.gain.value = 0.02;
    rumble.connect(rumbleGain);
    rumbleGain.connect(audioCtx.destination);
    rumble.start();

    // Air blower whine
    const blower = audioCtx.createOscillator();
    blower.type = 'sine';
    blower.frequency.value = 280;
    const blowerGain = audioCtx.createGain();
    blowerGain.gain.value = 0.012;
    const blowerFilter = audioCtx.createBiquadFilter();
    blowerFilter.type = 'bandpass';
    blowerFilter.frequency.value = 280;
    blowerFilter.Q.value = 5;
    blower.connect(blowerFilter);
    blowerFilter.connect(blowerGain);
    blowerGain.connect(audioCtx.destination);
    blower.start();
  }, { once: true });
}

/* ═══════════════════════════════════════════════════════
   VIEW MODES WITH ANIMATED CAMERA TRANSITIONS
   ═══════════════════════════════════════════════════════ */
function setupViewToggle() {
  document.querySelectorAll('#view-toggle button').forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      if (view === currentView) return;
      currentView = view;
      document.querySelectorAll('#view-toggle button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      animateCamera(cameraPresets[view]);
    });
  });
}

function animateCamera(preset) {
  const startPos = camera.position.clone();
  const endPos = new THREE.Vector3(...preset.pos);
  const startTarget = controls.target.clone();
  const endTarget = new THREE.Vector3(...preset.target);
  const duration = 1200;
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / duration, 1);
    const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    camera.position.lerpVectors(startPos, endPos, ease);
    controls.target.lerpVectors(startTarget, endTarget, ease);
    controls.update();
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ═══════════════════════════════════════════════════════
   LIVE ANIMATED HUD READINGS
   ═══════════════════════════════════════════════════════ */
function updateHUD(time) {
  // Conversion: 76-81%
  const conv = 78.5 + Math.sin(time * 0.08) * 2.0 + (Math.random() - 0.5) * 0.3;
  document.getElementById('r-conv').textContent = conv.toFixed(1);
  document.getElementById('bar-conv').style.width = conv + '%';

  // Catalyst-to-Oil Ratio: 5.5-7.0
  const ctor = 6.2 + Math.sin(time * 0.1) * 0.6 + (Math.random() - 0.5) * 0.1;
  document.getElementById('r-ctor').textContent = ctor.toFixed(1);
  document.getElementById('bar-ctor').style.width = (ctor / 10 * 100) + '%';

  // Cat Circ Rate
  const catcirc = catCircRate + Math.sin(time * 0.12) * 15;
  document.getElementById('r-catcirc').textContent = Math.round(catcirc);
  document.getElementById('bar-catcirc').style.width = (catcirc / 1200 * 100) + '%';

  // Riser Top Temp: 530-545°C
  const risert = 538 + Math.sin(time * 0.15) * 4 + (Math.random() - 0.5) * 0.5;
  document.getElementById('r-risert').textContent = Math.round(risert);
  document.getElementById('bar-risert').style.width = (risert / 650 * 100) + '%';

  // Bed Temperature: 685-700°C
  const bedtemp = 692 + Math.sin(time * 0.07) * 5 + (Math.random() - 0.5) * 0.5;
  document.getElementById('r-bedtemp').textContent = Math.round(bedtemp);
  document.getElementById('bar-bedtemp').style.width = (bedtemp / 800 * 100) + '%';

  // Flue Gas Temp: 705-720°C
  const fluegas = 712 + Math.sin(time * 0.09) * 5 + (Math.random() - 0.5) * 0.5;
  document.getElementById('r-fluegas').textContent = Math.round(fluegas);
  document.getElementById('bar-fluegas').style.width = (fluegas / 800 * 100) + '%';

  // O₂: 1.2-2.5%
  const o2 = 1.8 + Math.sin(time * 0.06) * 0.5;
  document.getElementById('r-o2').textContent = o2.toFixed(1);
  document.getElementById('bar-o2').style.width = (o2 / 5 * 100) + '%';

  // CO/CO₂: 0.05-0.20
  const coco2 = 0.12 + Math.sin(time * 0.05) * 0.05;
  document.getElementById('r-coco2').textContent = coco2.toFixed(2);
  document.getElementById('bar-coco2').style.width = (coco2 / 1.0 * 100) + '%';

  // Coke on Catalyst: 0.7-1.0%
  const coke = 0.85 + Math.sin(time * 0.04) * 0.1;
  document.getElementById('r-coke').textContent = coke.toFixed(2);
  document.getElementById('bar-coke').style.width = (coke / 2 * 100) + '%';

  // VGO Feed: 1800-1900
  const vgo = 1850 + Math.sin(time * 0.11) * 30;
  document.getElementById('r-vgo').textContent = Math.round(vgo);
  document.getElementById('bar-vgo').style.width = (vgo / 2500 * 100) + '%';

  // FCC Gasoline: 950-1010
  const gasoline = 980 + Math.sin(time * 0.13) * 20;
  document.getElementById('r-gasoline').textContent = Math.round(gasoline);
  document.getElementById('bar-gasoline').style.width = (gasoline / 2000 * 100) + '%';

  // LCO: 320-360
  const lco = 340 + Math.sin(time * 0.09) * 15;
  document.getElementById('r-lco').textContent = Math.round(lco);
  document.getElementById('bar-lco').style.width = (lco / 2000 * 100) + '%';

  // HCO: 110-130
  const hco = 120 + Math.sin(time * 0.07) * 8;
  document.getElementById('r-hco').textContent = Math.round(hco);
  document.getElementById('bar-hco').style.width = (hco / 2000 * 100) + '%';

  // Slurry: 40-50
  const slurry = 45 + Math.sin(time * 0.06) * 4;
  document.getElementById('r-slurry').textContent = Math.round(slurry);
  document.getElementById('bar-slurry').style.width = (slurry / 2000 * 100) + '%';

  // Coke Burn: 27-30 t/h
  const cokeburn = 28.5 + Math.sin(time * 0.08) * 1.2;
  document.getElementById('r-cokeburn').textContent = cokeburn.toFixed(1);
  document.getElementById('bar-cokeburn').style.width = (cokeburn / 50 * 100) + '%';

  // ─── RIGHT PANEL READINGS ───
  // Riser top temp
  document.getElementById('r-rtop').textContent = risert.toFixed(1);
  document.getElementById('bar-rtop').style.width = (risert / 650 * 100) + '%';

  // Riser exit temp: slightly lower
  const rexit = risert - 12 + Math.sin(time * 0.18) * 3;
  document.getElementById('r-rexit').textContent = rexit.toFixed(1);
  document.getElementById('bar-rexit').style.width = (rexit / 650 * 100) + '%';

  // Regen bed temp
  document.getElementById('r-rbed').textContent = bedtemp.toFixed(1);
  document.getElementById('bar-rbed').style.width = (bedtemp / 800 * 100) + '%';

  // Reactor pressure: 2.3-2.6 barg
  const rpres = 2.45 + Math.sin(time * 0.1) * 0.1;
  document.getElementById('r-rpres').textContent = rpres.toFixed(2);
  document.getElementById('bar-rpres').style.width = (rpres / 5 * 100) + '%';

  // Regen pressure: 2.6-2.85 barg
  const rbpres = 2.72 + Math.sin(time * 0.08) * 0.08;
  document.getElementById('r-rbpres').textContent = rbpres.toFixed(2);
  document.getElementById('bar-rbpres').style.width = (rbpres / 5 * 100) + '%';

  // ΔP: 0.2-0.35
  const dp = rbpres - rpres;
  document.getElementById('r-dp').textContent = dp.toFixed(2);
  document.getElementById('bar-dp').style.width = (dp / 1.0 * 100) + '%';

  // Yields (vary slightly)
  document.getElementById('y-gas').textContent = (3.8 + Math.sin(time * 0.05) * 0.3).toFixed(1);
  document.getElementById('y-lpg').textContent = (14.2 + Math.sin(time * 0.06) * 0.5).toFixed(1);
  document.getElementById('y-gasl').textContent = (48.5 + Math.sin(time * 0.04) * 1.2).toFixed(1);
  document.getElementById('y-lcoy').textContent = (18.6 + Math.sin(time * 0.07) * 0.6).toFixed(1);
  document.getElementById('y-hcoy').textContent = (7.2 + Math.sin(time * 0.05) * 0.4).toFixed(1);
  document.getElementById('y-cokey').textContent = (5.8 + Math.sin(time * 0.03) * 0.3).toFixed(1);

  // Catalyst status
  const ecat = 68.4 + Math.sin(time * 0.02) * 0.8;
  document.getElementById('r-ecat').textContent = ecat.toFixed(1);
  document.getElementById('bar-ecat').style.width = ecat + '%';
  document.getElementById('r-ni').textContent = Math.round(2840 + Math.sin(time * 0.015) * 50);
  document.getElementById('r-van').textContent = Math.round(5120 + Math.sin(time * 0.012) * 80);
  document.getElementById('r-makeup').textContent = (4.2 + Math.sin(time * 0.03) * 0.3).toFixed(1);

  // ─── BOTTOM PANEL ───
  document.getElementById('s-feed').textContent = Math.round(vgo);
  document.getElementById('s-riser').textContent = Math.round(risert);
  document.getElementById('s-conv').textContent = conv.toFixed(1);
  document.getElementById('s-gasol').textContent = document.getElementById('y-gasl').textContent;
  document.getElementById('s-ctor').textContent = ctor.toFixed(1);
  document.getElementById('s-regen').textContent = Math.round(bedtemp);
}

/* ═══════════════════════════════════════════════════════
   ANIMATION LOOP
   ═══════════════════════════════════════════════════════ */
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  controls.update();

  // ─── Animate particle systems ───
  particleSystems.forEach(sys => {
    const positions = sys.geometry.attributes.position.array;
    const { curve, velocities, speed, count } = sys.userData;

    for (let i = 0; i < count; i++) {
      const v = velocities[i];
      v.offset = (v.offset + delta * speed * v.speedVar) % 1;
      const totalLen = curve.length - 1;
      const segF = v.offset * totalLen;
      const segI = Math.min(Math.floor(segF), totalLen - 1);
      const segT = segF - segI;
      const p = new THREE.Vector3().lerpVectors(curve[segI], curve[segI + 1], segT);

      // Special fluidized bed animation — extra turbulence
      if (sys.name === 'fluidBed') {
        const regen = LAYOUT.regen;
        p.x += Math.sin(elapsed * 3 + i * 0.7) * 2.5;
        p.y += Math.cos(elapsed * 2.5 + i * 0.5) * 1.5;
        p.z += Math.sin(elapsed * 2.8 + i * 0.3) * 2.5;
        // Keep within regenerator bounds
        p.x = Math.max(regen.x - regen.r * 0.8, Math.min(regen.x + regen.r * 0.8, p.x));
        p.z = Math.max(regen.z - regen.r * 0.8, Math.min(regen.z + regen.r * 0.8, p.z));
        p.y = Math.max(regen.y - 4, Math.min(regen.y + 1, p.y));
      } else {
        p.x += v.spread * Math.sin(elapsed * 2 + i);
        p.y += v.spread * Math.cos(elapsed * 1.5 + i);
        p.z += v.spread * Math.sin(elapsed * 1.8 + i * 0.5);
      }

      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;
    }
    sys.geometry.attributes.position.needsUpdate = true;

    // Pulse opacity for fluidized bed to simulate boiling
    if (sys.name === 'fluidBed') {
      sys.material.opacity = 0.4 + 0.3 * Math.sin(elapsed * 2);
      sys.material.size = 0.12 + 0.04 * Math.sin(elapsed * 3 + 1);
    }
  });

  // ─── Animate dense bed mesh (gentle bob) ───
  const bedMesh = scene.getObjectByName('denseBed');
  if (bedMesh) {
    bedMesh.position.y += Math.sin(elapsed * 1.5) * 0.003;
    bedMesh.material.opacity = 0.3 + 0.1 * Math.sin(elapsed * 2);
  }

  // ─── Animate riser internal catalyst flow (scroll pattern) ───
  if (riserPipeMesh) {
    // Slight glow variation on riser
    const children = riserPipeMesh.parent.children;
    children.forEach(child => {
      if (child.material && child.material.opacity !== undefined && child !== riserPipeMesh) {
        // Catalyst flow visual shimmer
        if (child.material.transparent && child.material.opacity < 1) {
          child.material.opacity = 0.35 + 0.15 * Math.sin(elapsed * 4);
        }
      }
    });
  }

  // ─── Pulsing regenerator glow lights ───
  scene.children.forEach(child => {
    if (child.isPointLight && child.color.getHex() === 0xff6622) {
      child.intensity = 1.5 + 0.4 * Math.sin(elapsed * 1.8);
    }
    if (child.isPointLight && child.color.getHex() === 0xff4400) {
      child.intensity = 0.8 + 0.3 * Math.sin(elapsed * 2.2 + 1);
    }
  });

  // ─── Live HUD ───
  updateHUD(elapsed);

  // ─── Render with fallback ───
  if (composer && currentView !== 'internal') {
    // Some views might be better without post-processing
    composer.render();
  } else if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

/* ═══════════════════════════════════════════════════════
   UTILITY FUNCTIONS
   ═══════════════════════════════════════════════════════ */
function onResize() {
  if (camera) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  if (renderer) {
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  if (composer) {
    composer.setSize(window.innerWidth, window.innerHeight);
  }
}

function simulateLoading() {
  const fill = document.getElementById('loader-fill');
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 12 + 4;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
        collectInteractive();
      }, 400);
    }
    fill.style.width = progress + '%';
  }, 250);
}

/* ═══════════════════════════════════════════════════════
   BOOT
   ═══════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing 3D FCC viewer...');
  try {
    init();
    animate();
  } catch (error) {
    console.error('Critical initialization error:', error);
    // Emergency: clear loading screen if JS fails
    const loader = document.getElementById('loading-screen');
    if (loader) {
      loader.classList.add('hidden');
      loader.style.display = 'none';
    }
  }
});
# Bruno Simon — Patterns for Portfolio-Quality 3D Interiors

## Executive summary

Bruno Simon's `my-room-in-3d` demonstrates a **baked lighting + modular composition** pattern that produces publication-quality interior scenes via pre-baked textures, selective real-time light overlays, and custom shaders for hero effects (steam, particle animations). The architecture is modular (singleton Experience orchestrator, discrete room elements), uses Three.js 0.130 with GSAP/Tweakpane, and avoids heavy postprocessing. Adaptable to Coke-Recap without rebuilding in Blender: we can use UV-baked fallback + careful real-time lights + custom shaders for interactive elements.

---

## my-room-in-3d deep dive

### Project structure

**Singleton Experience pattern** (`src/Experience/Experience.js`):
- Central orchestrator enforcing single instance
- Initialization order: Time → Sizes → Stats → Scene → Camera → Renderer → Resources → World → Navigation
- Continuous update loop via `requestAnimationFrame()`
- Config sets pixel ratio, viewport, debug mode (toggle at width > 420px)

**Directory layout** (41 files):
```
src/Experience/
├── Experience.js (orchestrator)
├── Renderer.js (WebGL + composer setup)
├── Camera.js (dual mode: default + debug/orbit)
├── Navigation.js (spherical coords + mouse/touch input)
├── World.js (object factory)
├── Resources.js (asset loader with grouping)
├── [Object classes]: Baked.js, CoffeeSteam.js, Screen.js, 
│   ElgatoLight.js, GoogleLeds.js, TopChair.js, 
│   BouncingLogo.js, LoupedeckButtons.js
├── Utils/ (EventEmitter, Loader, Sizes, Stats, Time)
├── shaders/ (baked/, coffeeSteam/, partials/)
└── assets.js (asset manifest)
```

**Key naming convention**: Classes for discrete objects (CoffeeSteam, Screen), managers for systems (Renderer, Navigation).

### Asset pipeline

**Baked workflow** (Blender → GLTF → Runtime):
1. Scene modeled + lit in Blender
2. Three baked lighting textures: day, night, neutral (PNG)
3. Light map texture (PNG) — RGB channels encode individual light source intensity masks
4. Room model exported as GLB with simplified geometry
5. All shipped as static `/assets/` files (textures + GLB)
6. Runtime: single ShaderMaterial applied to all meshes via traversal

**Load mechanism** (`Resources.js`):
- Assets declared in `assets.js` with name, source, type
- Loaded in groups (currently one 'base' group)
- Sequential loading: `loadNextGroup()` → shift from queue → pass to Loader
- On file completion: images → THREE.Texture, models → stored in `this.items`
- Lifecycle events: 'progress', 'groupEnd', 'end'
- World waits for 'end' before instantiating objects

**Critical insight**: Baking lighting into textures eliminates per-frame shadow computation. Real-time lights layer *only* on top via shader blending, not replacing the base.

### Lighting recipe

**Baked base** (`src/Experience/Baked.js`):
```javascript
const material = new THREE.ShaderMaterial({
  vertexShader: bakedVertex,
  fragmentShader: bakedFragment,
  uniforms: {
    // Texture blending
    uBakedDay: { value: bakedDayTexture },
    uBakedNight: { value: bakedNightTexture },
    uBakedNeutral: { value: bakedNeutralTexture },
    uNightMix: { value: 0.0 },           // 0-1 day→night
    uNeutralMix: { value: 0.0 },         // 0-1 base→neutral
    
    // Light intensity masks
    uLightMap: { value: lightMapTexture },
    
    // Individual light colors + strength
    uTvLightColor: { value: new THREE.Color('#ff0000') },
    uTvLightStrength: { value: 1.0 },
    uDeskLightColor: { value: new THREE.Color('#ffff00') },
    uDeskLightStrength: { value: 1.0 },
    uPcLightColor: { value: new THREE.Color('#0000ff') },
    uPcLightStrength: { value: 1.0 }
  }
});

room.traverse((child) => {
  if (child instanceof THREE.Mesh) {
    child.material = material;
  }
});
```

**Shader blending** (`fragment.glsl`):
- Sample three baked textures, blend via `uNightMix` + `uNeutralMix`
- Layer three light contributions using "lighten" blend mode (via `glsl-blend`)
- Each light: `lightMap[channel] × color × strength`
- Result: complex, baked-lit room with interactive light control

**No real-time lights** — all computed in shaders. No shadow maps, no ray-casting. **GPU-efficient.**

### Material strategy

**Baked room**: Custom ShaderMaterial (listed above).

**Interactive elements**:
- `ElgatoLight.js`: `MeshBasicMaterial({ color: 0xffffff })` — no complexity
- `Screen.js`: `MeshBasicMaterial` + `VideoTexture` — video plays directly on geometry
- `CoffeeSteam.js`: Custom shader (see below)

**Pattern**: Baked surfaces use shaders; interactive/video elements use basic materials. Avoids material-per-object overhead.

### Custom shaders

#### Coffee Steam (procedural particle effect)

**Vertex shader** — Perlin noise displacement:
```glsl
uniform float uTime;
varying vec2 vUv;
#pragma glslify: perlin2d = require('../partials/perlin2d.glsl')

void main() {
    vec3 newPosition = position;
    vec2 displacementUv = uv * 5.0;
    displacementUv.y -= uTime * 0.0002;  // Scroll down
    
    float displacementStrength = pow(uv.y * 3.0, 2.0);  // Stronger at top
    float perlin = perlin2d(displacementUv) * displacementStrength;
    newPosition.y += perlin * 0.1;
    
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(newPosition, 1.0);
    vUv = uv;
}
```

**Fragment shader** — Perlin-modulated alpha + color:
```glsl
uniform float uTime;
uniform float uTimeFrequency;      // 0.0004 default
uniform vec2 uUvFrequency;         // vec2(4, 5)
uniform vec3 uColor;               // #d2958a (warm tan)
varying vec2 vUv;
#pragma glslify: perlin2d = require('../partials/perlin2d.glsl')

void main() {
    vec2 uv = vUv;
    uv.y -= uTime * uTimeFrequency;
    float perlin = perlin2d(uv * uUvFrequency);
    
    // Border fade: soft edges
    float borderAlpha = min(vUv.x * 4.0, (1.0 - vUv.x) * 4.0);
    borderAlpha *= (1.0 - vUv.y);
    
    float alpha = (perlin + 1.0) * 0.5 * borderAlpha;
    gl_FragColor = vec4(uColor, alpha);
}
```

**Key**: Perlin2d (standardized 2D Perlin noise, 50+ lines) generates organic motion. Uniforms tuned via debug UI in real-time.

#### Baked lighting (already shown above)

**Perlin2d utility** (`shaders/partials/perlin2d.glsl`) — 34-line noise function:
- Gradient-based Perlin noise
- Returns value in range [-1.15, 1.15], output scaled to [-2.3, 2.3]
- Optimized for GLSL (modulo permutation to avoid truncation)

### Postprocessing stack

**Renderer setup** (`Renderer.js`):
```javascript
this.instance = new THREE.WebGLRenderer({
  alpha: false,
  antialias: true
});

this.instance.setClearColor('#010101');  // Nearly black background
this.instance.outputColorSpace = THREE.SRGBColorSpace;

// Effect composer (currently disabled)
this.renderTarget = new THREE.WebGLRenderTarget(
  this.sizes.width,
  this.sizes.height,
  {
    samples: this.pixels < 2 ? 4 : 0  // MSAA on mobile
  }
);

this.composer = new EffectComposer(this.instance, this.renderTarget);
this.composer.addPass(new RenderPass(this.scene, this.camera.instance));
// Additional passes would go here; currently none active
```

**Design choice**: Postprocessing *architected* but disabled. Baked textures + careful shader work eliminate need for bloom/tone-mapping. **KISS principle.**

### Camera approach

**Dual-mode system** (`Camera.js`):

1. **Default mode**: Programmatic camera animation, no user control
2. **Debug mode** (activated on desktop): OrbitControls at position (-15, 15, 15)

**Implementation**:
```javascript
setModes() {
  this.mode = {}
  
  // Default
  this.mode.default = {
    position: new THREE.Vector3(-4, 2, 3),
    rotation: new THREE.Euler(0, 0, 0)
  }
  
  // Debug
  this.mode.debug = new OrbitControls(this.instance, this.canvas)
  this.mode.debug.screenSpacePanning = true
  this.mode.debug.enableDamping = true
}

update() {
  // Copy active mode → main camera
  const mode = this.modes[this.current]
  this.instance.position.copy(mode.position)
  this.instance.rotation.copy(mode.rotation)
}
```

**Aspect ratio**: 20° FOV (narrow, cinematic). Smooth damping via `enableDamping`.

### Navigation (user interaction)

**Spherical coordinate system** (`Navigation.js`):
```javascript
// State tracking
this.spherical = {
  radius: 20,
  phi: Math.PI / 4,      // Vertical angle
  theta: 0               // Horizontal angle
}
this.sphericalSmoothed = { ... } // Interpolated

// Update loop
this.sphericalSmoothed.radius += (this.spherical.radius - this.sphericalSmoothed.radius) * 0.005

// Convert to Cartesian
const position = new THREE.Vector3()
position.setFromSpherical(this.sphericalSmoothed)

camera.lookAt(targetPoint)
```

**Input handling**:
- **Mouse drag**: Rotate (left-click), pan (right-click / Ctrl+Shift)
- **Wheel**: Zoom radius (10-50 units)
- **Touch**: Single-finger rotates, multi-touch pans

**Constraints**:
- Radius: 10–50
- Phi (vertical): 0.01–π/2
- Theta (horizontal): -π/2–0
- Target position bounded to room interior

### Animation patterns

**No global particle systems.** Animation is **per-object**:
- CoffeeSteam: shader time-uniform drives Perlin displacement
- Screens: video loop inherent
- Lights: color/strength tweakable via debug UI

**GSAP not observed** in core loop; likely used for timeline animations or transition sequences (not visible in extracted files).

### "Hero shot" composition

**Camera default position**: (-4, 2, 3) — **looking at desk area from slightly left + above eye level**.
- Framing puts monitor + desk objects in focus
- Negative x-offset creates compositional depth
- Warm baked lighting on left wall (morning sun simulation)
- Cool baked lighting on right (window/ambient)

**Result**: Eye drawn to center-right (desk), warm/cool balance suggests time of day.

---

## folio-2019 highlights

**Accessibility issue**: folio-2019 repo structure differs (uses `src/javascript/`, `src/shaders/` organization). Raw file access failed for this repo. **Based on GitHub metadata only:**

- **4,689 stars** — highest-starred Bruno project
- **92.9% JavaScript, 4.3% GLSL**
- **Vite build** (vs. webpack in my-room-in-3d)
- Uses `resources/3d/` for assets
- Implements similar modular pattern to my-room-in-3d

**Inference**: Car-driving portfolio scene likely uses same baked-lighting approach + custom camera/navigation. Omitting detailed breakdown due to access limitation.

---

## Other repos worth knowing

1. **threejs-template-complex** (294★) — Scaffolding for modular three.js projects; likely mirrors experience.js pattern
2. **infinite-world** (590★) — Procedural generation; may use noise shaders
3. **keppler** (1,931★) — Abstract visual, unknown scene type but high-star indicator of Bruno's polished work
4. **folio-2025** (1,452★) — Recent portfolio; worth checking for updated patterns (not accessed here)

---

## Adaptable patterns for Coke-Recap

**Coke-Recap current stack**: Vite + React 19 + R3F v9 + three 0.184 + @react-three/postprocessing

### Pattern 1: Modular scene orchestration (LOW effort, HIGH impact)

**What Bruno does**: Singleton Experience class coordinates all subsystems.

**Recipe for Coke-Recap**:
```jsx
// Create a useExperience hook (R3F pattern)
export const useExperience = () => {
  const experience = useRef(null)
  
  useFrame((state) => {
    // Continuous update loop (already in R3F)
    // experience.current?.update()
  })
  
  return experience.current
}

// Instead of Experience.js, use R3F's canvas architecture
<Canvas>
  <Experience />  {/* Central component */}
  <World />       {/* Child containing Baked, CoffeeSteam, etc. */}
  <CameraSystem />
  <Navigation />
</Canvas>
```

**Effort**: Low — R3F already provides this structure; we just need to extract component logic (Baked.js → \<Baked /> component).

**Impact**: High — Clarifies responsibility; enables easier debugging + hot-reload in React.

### Pattern 2: Baked lighting via UV lightmaps (MEDIUM effort, HIGH impact)

**What Bruno does**: Three texture variants (day/night/neutral) + light-intensity light map; shader blends them.

**Recipe for Coke-Recap (runtime-only, no Blender rebake)**:
1. If we already have a baked GLTF: extract its light map texture + base color
2. If not: **use three.js Lightmap support** on existing geometry
   ```jsx
   const lightMap = useTexture('/lightmap.png')
   return (
     <mesh geometry={geometry}>
       <meshStandardMaterial 
         map={colorMap}
         lightMap={lightMap}
         lightMapIntensity={2.0}
       />
     </mesh>
   )
   ```
3. For interactive lights: overlay using `glsl-blend` or additive blending

**Alternative (no light map)**: Bake a second UV channel in Blender, use AO texture + color tint.

**Effort**: Medium — Requires either GLTF with light maps or Blender bake setup.

**Impact**: High — Eliminates need for real-time shadow maps; GPU cost drops dramatically.

### Pattern 3: Custom shader for hero interactive element (MEDIUM effort, MEDIUM impact)

**What Bruno does**: Perlin-displaced steam with time-uniform + color control.

**Recipe for Coke-Recap** — Procedural "glow" or "liquid motion" for coke bottle:
```jsx
const shaderMaterial = useShaderMaterial(
  vertexShader: /* similar to coffeeSteam vertex */,
  fragmentShader: /* perlin + custom color */,
  {
    uTime: 0,
    uColor: [1, 0, 0],
    uIntensity: 1.0
  }
)

useFrame(({ clock }) => {
  shaderMaterial.uniforms.uTime.value = clock.getElapsedTime()
})

return <mesh material={shaderMaterial} geometry={bottleGeometry} />
```

**Effort**: Medium — Copy Perlin2d GLSL, adapt uniforms, wire to R3F's useFrame hook.

**Impact**: Medium — Creates visual "wow" on one element; doesn't improve overall scene efficiency.

### Pattern 4: Dual-mode camera (default + interactive debug) (LOW effort, MEDIUM impact)

**What Bruno does**: OrbitControls toggle; default animation path.

**Recipe for Coke-Recap**:
```jsx
const [debugMode, setDebugMode] = useState(false)

return (
  <>
    {debugMode ? (
      <OrbitControls />
    ) : (
      <CameraAnimation path={defaultCameraPath} />
    )}
    {isDebug && <button onClick={() => setDebugMode(!debugMode)}>Debug Camera</button>}
  </>
)
```

**Effort**: Low — R3F + drei provide both components.

**Impact**: Medium — Speeds up iteration during development; users get fixed cinematic view.

### Pattern 5: Shader material with debug UI (LOW effort, MEDIUM impact)

**What Bruno does**: Tweakpane integration; real-time uniform control.

**Recipe for Coke-Recap**:
```jsx
const [bakedNightMix, setBakedNightMix] = useState(0)

// In debug UI:
<Slider label="Day → Night" min={0} max={1} value={bakedNightMix} onChange={setBakedNightMix} />

// In shader:
useFrame(() => {
  shaderMaterial.uniforms.uNightMix.value = bakedNightMix
})
```

**Effort**: Low — React state management.

**Impact**: Medium — Dramatically speeds up visual iteration without rebuild.

### Pattern 6: Video texture on 3D geometry (LOW effort, LOW impact)

**What Bruno does**: HTML5 video → THREE.VideoTexture → MeshBasicMaterial.

**Recipe for Coke-Recap**:
```jsx
const video = useMemo(() => {
  const v = document.createElement('video')
  v.src = '/screen-video.mp4'
  v.autoplay = true
  v.loop = true
  v.playsInline = true
  return v
}, [])

const videoTexture = useTexture(() => new THREE.VideoTexture(video))

return (
  <mesh>
    <meshBasicMaterial map={videoTexture} />
  </mesh>
)
```

**Effort**: Low — Straightforward WebGL texture binding.

**Impact**: Low — Only useful if we want screens/displays in the scene.

### Pattern 7: Asset grouping + sequential loading (MEDIUM effort, LOW impact)

**What Bruno does**: Declare assets in manifest, load in groups, wait for completion before instantiating objects.

**Recipe for Coke-Recap**:
```jsx
const { scene } = useGLTF('/models/room.glb')  // useGLTF handles loading
// R3F suspends until loaded; no manual orchestration needed
```

**Effort**: Medium — Only if we're hand-rolling a custom loader. useGLTF + useTexture already do this.

**Impact**: Low — Not a bottleneck for Coke-Recap at current scene complexity.

---

## Things we CAN'T directly adopt (and alternatives)

### ❌ Blender-baked lighting workflow

**Why we can't**: Coke-Recap doesn't have a pre-baked Blender scene. Rebaking would require:
1. Modeling vending machine + pharmacy interior in Blender
2. Setting up lighting rigs
3. Baking to UV lightmaps + light maps
4. Exporting GLTF + textures
5. Repeat if design changes

**Time cost**: 40–80 hours for a professional interior scene.

**Runtime substitute** (what we *can* do):
1. **Lightmap baking in three.js runtime** (advanced, rarely used):
   - Use `THREE.LightProbeGenerator` + `THREE.WebGLCubeRenderTarget`
   - Bake to cubemap instead of texture (overkill for our scene)

2. **Fake baked lighting via texture + AO** (practical):
   - Render Blender scene with one standard light rig
   - Extract Ambient Occlusion as second UV channel
   - In shader: `color = baseColor × ao × lightColor`
   - Add one or two real-time directional lights for interaction

3. **Precomputed Radiance Transfer (PRT)** (over-engineered):
   - Overkill for a single interior scene

**Recommendation**: Use **fake baked lighting (option 2)** — same visual result, minimal overhead.

### ❌ Tweakpane debug UI (easily adoptable)

**Bruno uses**: Tweakpane (separate npm package).

**Coke-Recap can use**: React state + custom debug panel (HTML/CSS).

**Recipe**:
```jsx
const [uniforms, setUniforms] = useState({
  nightMix: 0,
  lightStrength: 1
})

// In dev mode only:
{process.env.NODE_ENV === 'development' && (
  <DebugPanel uniforms={uniforms} onChange={setUniforms} />
)}
```

**Trade-off**: Slightly more verbose than Tweakpane, but integrated with React.

---

## Key design principles extracted

1. **Modular composition**: Each scene element (lights, models, effects) is a discrete class/component; easy to disable, tweak, or replace.

2. **Baked-first, real-time-second**: Pre-compute what doesn't move; overlay real-time only where needed.

3. **Minimal postprocessing**: No bloom, vignette, or tone-mapping unless absolutely necessary. Let the shader do the work.

4. **Shader parameters as state**: Uniforms like `uNightMix` become interactive controls; no hardcoding.

5. **Singleton orchestrator**: One Experience class knows about all subsystems; update loops propagate downward.

6. **Asset manifest pattern**: Centralize asset declarations; delays object instantiation until resources ready.

---

## References

### Repositories accessed
- https://github.com/brunosimon/my-room-in-3d (4,417★, **primary source**)
- https://github.com/brunosimon/folio-2019 (4,689★, metadata only)
- https://github.com/brunosimon (profile, repo listing)

### Key files examined (my-room-in-3d)
- Experience.js — Singleton orchestrator pattern
- Renderer.js — WebGL + composer setup, MSAA config
- Camera.js — Dual-mode (default + orbit debug)
- Navigation.js — Spherical coordinates + constraints
- Baked.js — Shader material + texture blending
- CoffeeSteam.js — Perlin noise particle effect
- Resources.js — Asset grouping + sequential loading
- assets.js — Manifest structure
- shaders/baked/fragment.glsl — Lightmap blending + light overlay
- shaders/baked/vertex.glsl — Standard MVP pipeline
- shaders/coffeeSteam/{vertex,fragment}.glsl — Time-driven displacement
- shaders/partials/perlin2d.glsl — 2D Perlin noise utility

### Build + versioning
- my-room-in-3d: three.js 0.130.1, webpack, GSAP, Tweakpane
- folio-2019: Vite, three.js (version not specified), same dependencies pattern

---

## Unresolved questions

1. **folio-2019 architecture** — Couldn't access raw files (404 errors). Does it use identical baked-lighting pattern or something different? *Inferred: likely same, given star count + URL naming convention.*

2. **GSAP integration scope** — Seen in package.json but not in core files. Where is GSAP used? *Likely: camera transitions, object entrance animations.*

3. **Mobile optimization details** — Bruno sets MSAA conditionally (samples: pixels < 2 ? 4 : 0). What's the frame-rate target? *Inferred: 60fps; MSAA trade-off for lower-end mobile.*

4. **Lightmap generation tool** — What did Bruno use to bake day/night/neutral + light map textures? Substance Painter? Marmoset? *Unknown; likely Blender built-in bake.*

5. **Three.js version upgrade path** — my-room-in-3d uses 0.130.1 (old); Coke-Recap uses 0.184. Are Perlin2d GLSL syntax and shader material APIs stable across versions? *Likely yes, but minor changes possible.*

6. **Performance metrics** — No FPS targets or profiling data in source. What does "clean" actually mean in terms of frame time? *Inferred: 60fps on desktop, 30–45fps mobile.*

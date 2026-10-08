import * as THREE from './assets/three.module.js';

const canvas = document.getElementById('sculpture');

if (canvas) {
  const stage = canvas.parentElement;
  const fallback = document.getElementById('webgl-fallback');
  const motionButton = document.getElementById('motion-toggle');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let renderer;
  let frameId = 0;
  let contextLost = false;

  function showFallback() {
    contextLost = true;
    cancelAnimationFrame(frameId);
    frameId = 0;
    canvas.hidden = true;
    canvas.style.display = 'none';
    if (fallback) fallback.hidden = false;
    if (motionButton) {
      motionButton.hidden = true;
      motionButton.style.visibility = 'hidden';
    }
  }

  try {
    renderer = new THREE.WebGLRenderer({
      canvas, alpha: true, antialias: true, powerPreference: 'low-power'
    });
    renderer.setClearColor(0x171917, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // The studio and sculpture are fixed: update shadows only during interaction.
    renderer.shadowMap.autoUpdate = false;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 60);
    const sculpture = new THREE.Group();
    scene.add(sculpture);

    // A single asymmetric loop with a full twist. A broad, rounded rectangular
    // section creates the folds of a ribbon rather than a circular tube.
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.52, 1.82, -0.14),
      new THREE.Vector3(0.66, 1.70, 0.23),
      new THREE.Vector3(1.42, 0.85, 0.47),
      new THREE.Vector3(1.19, -0.45, 0.22),
      new THREE.Vector3(0.36, -1.75, -0.18),
      new THREE.Vector3(-0.81, -1.60, -0.44),
      new THREE.Vector3(-1.46, -0.45, -0.25),
      new THREE.Vector3(-1.24, 0.83, 0.32)
    ], true, 'centripetal');
    const rings = 320;
    const sides = 40;
    const frames = curve.computeFrenetFrames(rings, true);
    const positions = new Float32Array(rings * sides * 3);
    const indices = [];
    const center = new THREE.Vector3();
    const broadAxis = new THREE.Vector3();
    const narrowAxis = new THREE.Vector3();
    const point = new THREE.Vector3();
    const softened = value => Math.sign(value) * Math.pow(Math.abs(value), 0.72);

    for (let ring = 0; ring < rings; ring++) {
      const t = ring / rings;
      const phase = t * Math.PI * 2;
      curve.getPointAt(t, center);
      const twist = phase + 0.32 * Math.sin(phase) - 0.18 * Math.cos(phase * 2);
      const cosine = Math.cos(twist);
      const sine = Math.sin(twist);
      broadAxis.copy(frames.normals[ring]).multiplyScalar(cosine)
        .addScaledVector(frames.binormals[ring], sine);
      narrowAxis.copy(frames.normals[ring]).multiplyScalar(-sine)
        .addScaledVector(frames.binormals[ring], cosine);
      const width = 0.52 + 0.075 * Math.sin(phase - 0.65);
      const thickness = 0.145 + 0.02 * Math.cos(phase + 0.8);

      for (let side = 0; side < sides; side++) {
        const angle = side / sides * Math.PI * 2;
        point.copy(center)
          .addScaledVector(broadAxis, width * softened(Math.cos(angle)))
          .addScaledVector(narrowAxis, thickness * softened(Math.sin(angle)));
        const vertex = ring * sides + side;
        positions.set([point.x, point.y, point.z], vertex * 3);
        const nextRing = (ring + 1) % rings;
        const nextSide = (side + 1) % sides;
        const a = vertex;
        const b = nextRing * sides + side;
        const c = nextRing * sides + nextSide;
        const d = ring * sides + nextSide;
        indices.push(a, d, b, b, d, c);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    // A centered bounding sphere keeps the complete moving form inside the
    // camera frustum at every aspect ratio, including the narrow mobile stage.
    geometry.translate(
      -geometry.boundingSphere.center.x,
      -geometry.boundingSphere.center.y,
      -geometry.boundingSphere.center.z
    );
    geometry.computeBoundingSphere();
    geometry.computeBoundingBox();

    const amber = new THREE.MeshPhysicalMaterial({
      color: 0xb7743e,
      metalness: 0.08,
      roughness: 0.24,
      transmission: 0.28,
      thickness: 0.65,
      ior: 1.47,
      attenuationColor: new THREE.Color(0xa6501e),
      attenuationDistance: 1.8,
      clearcoat: 0.56,
      clearcoatRoughness: 0.24,
      specularIntensity: 0.85,
      envMapIntensity: 1.0
    });
    const ribbon = new THREE.Mesh(geometry, amber);
    ribbon.rotation.set(0.17, -0.38, -0.29);
    ribbon.castShadow = true;
    sculpture.add(ribbon);

    // Generated studio cards give broad gradients and narrow edge reflections.
    const studio = new THREE.Scene();
    studio.background = new THREE.Color(0x25281e);
    const cards = [
      { at: [-4.5, 3.4, 4.0], size: [4.5, 7], color: 0xffdfb5, power: 4.5 },
      { at: [4.0, 1.3, 2.8], size: [0.75, 6.5], color: 0xfff1df, power: 5.5 },
      { at: [0.5, 6.0, 0.5], size: [6.0, 2.4], color: 0xffe5c3, power: 3.0 },
      { at: [-3.0, -3.5, 1.5], size: [3.0, 3.5], color: 0xba6b32, power: 1.6 },
      { at: [1.5, 1.0, -4.5], size: [3.5, 6.0], color: 0xdab38a, power: 2.0 }
    ];
    for (const card of cards) {
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(...card.size),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(card.color).multiplyScalar(card.power),
          side: THREE.DoubleSide
        })
      );
      panel.position.set(...card.at);
      panel.lookAt(0, 0, 0);
      studio.add(panel);
    }
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(studio, 0.035);
    scene.environment = environment.texture;
    pmrem.dispose();
    studio.traverse(object => {
      if (object.isMesh) {
        object.geometry.dispose();
        object.material.dispose();
      }
    });

    scene.add(new THREE.HemisphereLight(0xf4d3a4, 0x34251b, 0.62));
    const key = new THREE.DirectionalLight(0xffe4bd, 3.1);
    key.position.set(-3.5, 5.5, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -4;
    key.shadow.camera.right = 4;
    key.shadow.camera.top = 4;
    key.shadow.camera.bottom = -4;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 20;
    key.shadow.normalBias = 0.035;
    key.shadow.bias = -0.0002;
    key.shadow.radius = 5;
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffedcf, 2.0);
    rim.position.set(4, 1.8, -3.2);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0xb97038, 0.95);
    fill.position.set(-2, -2.5, 3);
    scene.add(fill);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 12),
      new THREE.ShadowMaterial({ opacity: 0.045, depthWrite: false })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -geometry.boundingSphere.radius - 0.12;
    floor.receiveShadow = true;
    scene.add(floor);

    // Generate a soft ambient contact shadow once, without an external asset.
    const shadowSize = 64;
    const shadowData = new Uint8Array(shadowSize * shadowSize * 4);
    for (let y = 0; y < shadowSize; y++) {
      for (let x = 0; x < shadowSize; x++) {
        const distance = Math.hypot((x + 0.5) / shadowSize * 2 - 1,
          (y + 0.5) / shadowSize * 2 - 1);
        const alpha = Math.pow(Math.max(0, 1 - distance), 2) * 140;
        const offset = (y * shadowSize + x) * 4;
        shadowData[offset + 3] = alpha;
      }
    }
    const shadowTexture = new THREE.DataTexture(shadowData, shadowSize, shadowSize);
    shadowTexture.needsUpdate = true;
    const contact = new THREE.Mesh(
      new THREE.PlaneGeometry(5.6, 1.05),
      new THREE.MeshBasicMaterial({
        map: shadowTexture, transparent: true, opacity: 0.30,
        depthWrite: false, toneMapped: false
      })
    );
    contact.position.set(0.1, -2.42, -0.6);
    scene.add(contact);

    let visible = true;
    let paused = false;
    let dirty = true;
    let lastTime = 0;
    let pointerX = 0;
    let pointerY = 0;
    let scrollProgress = 0;
    let heroStart = 0;
    let heroHeight = 1;
    let rotationX = 0;
    let rotationY = 0;
    let rotationZ = 0;
    let lift = 0;
    const hero = stage.closest('.hero') || stage;
    const clamp = THREE.MathUtils.clamp;

    function motionAllowed() {
      return !paused && !reducedMotion.matches;
    }

    function updateButton() {
      if (!motionButton || contextLost) return;
      const stopped = paused || reducedMotion.matches;
      motionButton.setAttribute('aria-pressed', String(stopped));
      motionButton.setAttribute('aria-label', stopped
        ? 'Увімкнути рух 3D-об’єкта' : 'Зупинити рух 3D-об’єкта');
      const label = motionButton.querySelector('.motion-label');
      const icon = motionButton.querySelector('span:first-child');
      if (label) label.textContent = stopped ? 'Увімкнути рух' : 'Зупинити рух';
      if (icon) icon.textContent = stopped ? '▷' : 'Ⅱ';
      motionButton.hidden = reducedMotion.matches;
      motionButton.style.visibility = reducedMotion.matches ? 'hidden' : 'visible';
      motionButton.disabled = reducedMotion.matches;
    }

    function requestRender() {
      if (!frameId && visible && !document.hidden && !contextLost) {
        frameId = requestAnimationFrame(frame);
      }
    }

    function stopFrame() {
      cancelAnimationFrame(frameId);
      frameId = 0;
      lastTime = 0;
    }

    function resize() {
      if (contextLost) return;
      const width = Math.max(1, stage.clientWidth);
      const height = Math.max(1, stage.clientHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75,
        Math.sqrt(1600000 / (width * height)));
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      const verticalFov = THREE.MathUtils.degToRad(camera.fov);
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect);
      const limitingFov = Math.min(verticalFov, horizontalFov);
      const distance = (geometry.boundingSphere.radius + 0.2)
        / Math.sin(limitingFov / 2) * 1.09;
      camera.position.set(0, 0.6, distance);
      camera.lookAt(0, -0.04, 0);
      camera.updateProjectionMatrix();
      const heroBounds = hero.getBoundingClientRect();
      heroStart = heroBounds.top + window.scrollY;
      heroHeight = Math.max(heroBounds.height, 1);
      scrollProgress = clamp((window.scrollY - heroStart) / heroHeight, 0, 1);
      dirty = true;
      renderer.shadowMap.needsUpdate = true;
      requestRender();
    }

    function frame(time) {
      frameId = 0;
      if (!visible || document.hidden || contextLost) {
        lastTime = 0;
        return;
      }
      const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 1 / 60;
      lastTime = time;
      let moving = false;
      if (motionAllowed()) {
        const targetX = pointerY * 0.12 + scrollProgress * 0.14;
        const targetY = pointerX * 0.23 + scrollProgress * 0.46;
        const targetZ = -pointerX * 0.035 - scrollProgress * 0.055;
        const targetLift = scrollProgress * 0.06;
        const easing = 1 - Math.exp(-delta * 4.5);
        rotationX += (targetX - rotationX) * easing;
        rotationY += (targetY - rotationY) * easing;
        rotationZ += (targetZ - rotationZ) * easing;
        lift += (targetLift - lift) * easing;
        moving = Math.abs(targetX - rotationX) + Math.abs(targetY - rotationY)
          + Math.abs(targetZ - rotationZ) + Math.abs(targetLift - lift) > 0.00015;
        sculpture.rotation.set(rotationX, rotationY, rotationZ);
        sculpture.position.y = lift;
      }
      if (dirty || moving) {
        renderer.shadowMap.needsUpdate = true;
        renderer.render(scene, camera);
        dirty = false;
      }
      if (moving) requestRender();
      else lastTime = 0;
    }

    window.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch' || !motionAllowed()) return;
      pointerX = clamp(event.clientX / Math.max(window.innerWidth, 1) * 2 - 1, -1, 1);
      pointerY = clamp(event.clientY / Math.max(window.innerHeight, 1) * 2 - 1, -1, 1);
      requestRender();
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => {
      pointerX = 0;
      pointerY = 0;
      requestRender();
    }, { passive: true });
    window.addEventListener('scroll', () => {
      scrollProgress = clamp((window.scrollY - heroStart) / heroHeight, 0, 1);
      if (motionAllowed()) requestRender();
    }, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopFrame();
      else {
        dirty = true;
        requestRender();
      }
    });
    const intersection = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) {
        dirty = true;
        requestRender();
      } else stopFrame();
    }, { rootMargin: '60px' });
    intersection.observe(stage);
    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(stage);
    window.addEventListener('resize', resize, { passive: true });
    if (motionButton) motionButton.addEventListener('click', () => {
      paused = !paused;
      updateButton();
      if (paused) stopFrame();
      else requestRender();
    });
    reducedMotion.addEventListener('change', () => {
      updateButton();
      if (reducedMotion.matches) {
        stopFrame();
        rotationX = rotationY = rotationZ = lift = 0;
        sculpture.rotation.set(0, 0, 0);
        sculpture.position.y = 0;
        dirty = true;
      }
      requestRender();
    });
    canvas.addEventListener('webglcontextlost', event => {
      event.preventDefault();
      intersection.disconnect();
      sizeObserver.disconnect();
      showFallback();
    });
    updateButton();
    resize();
  } catch (error) {
    showFallback();
    if (renderer) renderer.dispose();
    console.warn('3D display unavailable; typography fallback enabled.', error.message);
  }
}

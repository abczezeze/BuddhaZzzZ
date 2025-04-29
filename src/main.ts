import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import gsap from 'gsap';

type GLTF = Awaited<ReturnType<typeof GLTFLoader.prototype.loadAsync>>;

// Declare sound variables
let sfxWind: THREE.Audio;
let bgmNN: THREE.Audio;

// Set up scene, camera, renderer, light
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x99DDFF);
scene.fog = new THREE.FogExp2(0xaaccff, 0.0007);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 50);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(200, 1000, 50);
light.castShadow = true;
scene.add(light);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
renderer.toneMapping = THREE.ReinhardToneMapping;
document.body.appendChild(renderer.domElement);

// Loading Manager
const progressContainer = document.getElementById('progress-container') as HTMLElement;
const progressBar = document.getElementById('progress-bar') as HTMLElement;
const progressText = document.getElementById('progress-text') as HTMLElement;

const manager = new THREE.LoadingManager();
manager.onProgress = (url: string, itemsLoaded: number, itemsTotal: number) => {
  const percentComplete = (itemsLoaded / itemsTotal) * 100;
  progressBar.style.width = percentComplete + '%';
  progressText.textContent = `Loading... ${Math.round(percentComplete)}%\nItem: ${url}`;
};

manager.onLoad = () => {
  progressContainer.style.display = 'none';
  animate();
};

manager.onError = (url: string) => {
  progressText.textContent = `Error loading: ${url}`;
};

// Create wave geometry
const geometry = new THREE.PlaneGeometry(200, 610, 4, 8);
const position = geometry.attributes.position;
(position as THREE.BufferAttribute).usage = THREE.DynamicDrawUsage;

for (let i = 0; i < position.count; i++) {
  const y = 35 * Math.sin(i / 2);
  position.setY(i, y);
}

// Create shader material
const material = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0.0 }
  },
  vertexShader: `
    uniform float time;
    varying vec3 vPosition;
    void main() {
      vec3 pos = position;
      float t = mod(time, 62.83);
      float wave = sin(pos.x / 5.0 + (t + pos.y) / 14.0);
      pos.z = 333.0 * wave;
      vPosition = pos;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    varying vec3 vPosition;
    void main() {
      float height = vPosition.z / 35.0;
      float red = 0.6 + 0.2 * sin(height * 2.0 + time);
      float green = 0.05 + 0.1 * sin(height + time + 1.0);
      float blue = 0.02 * sin(height + time + 2.0);
      float dist = length(vPosition.xy) / 50.0;
      float flame = 0.5 * sin(dist * 10.0 + time * 3.0);
      float flame2 = 0.3 * sin(dist * 15.0 + time * 4.0);
      red += flame + flame2;
      green += (flame + flame2) * 0.3;
      vec3 color = vec3(
        clamp(red * 0.8, 0.0, 1.0),
        clamp(green * 0.6, 0.0, 1.0),
        clamp(blue * 0.5, 0.0, 1.0)
      );
      gl_FragColor = vec4(color, 1.0);
    }
  `
});

const mesh = new THREE.Mesh(geometry, material);
mesh.position.set(0, -35, -25);
scene.add(mesh);

const clock = new THREE.Clock();

// Load models
let buddha: THREE.Object3D;
let leo: THREE.Object3D;
let nagas: THREE.Object3D;
let booth: THREE.Object3D;
let pagoda: THREE.Object3D;
let pavillion: THREE.Object3D;

const loader = new GLTFLoader(manager);

// Load Buddha model
const loadModels = async () => {
  try {
    const budaData = await loader.loadAsync('Models/buddha.glb');
    buddha = budaData.scene;
    buddha.children[1].traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material.emissive.setHex(0xFFAA00);
        child.material.emissiveIntensity = 0.5;
      }
    });

    gsap.to(buddha.children[1].position, {
      y: "+=2",
      duration: 1,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true
    });

    function rotateObject() {
      requestAnimationFrame(rotateObject);
      buddha.children[1].rotation.y += 0.02;
    }
    rotateObject();
    scene.add(buddha);

    // Load other models
    const leoData = await loader.loadAsync('Models/Leo.glb');
    leo = leoData.scene;
    scene.add(leo);

    const boothData = await loader.loadAsync('Models/booth.glb');
    booth = boothData.scene;
    scene.add(booth);

    const pavillionData = await loader.loadAsync('Models/pavillion.glb');
    pavillion = pavillionData.scene;
    scene.add(pavillion);

    // Load remaining models
    loader.load('Models/Nagas.glb', (gltf: GLTF) => {
      nagas = gltf.scene;
      scene.add(nagas);
    });

    loader.load('Models/floorWall.glb', (gltf: GLTF) => {
      scene.add(gltf.scene);
    });

    loader.load('Models/pagoda.glb', (gltf: GLTF) => {
      pagoda = gltf.scene;
      scene.add(pagoda);
    });

    loader.load('Models/lobby.glb', (gltf: GLTF) => {
      scene.add(gltf.scene);
    });

    loader.load('Models/stair.glb', (gltf: GLTF) => {
      scene.add(gltf.scene);
    });

  } catch (error) {
    console.error('Error loading models:', error);
  }
};

loadModels();

// Set up OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;

// Create camera info display
const info = document.createElement('div');
info.style.position = 'absolute';
info.style.top = '10px';
info.style.left = '10px';
info.style.color = 'black';
info.style.padding = '10px';
document.body.appendChild(info);

function updateCameraInfo(): void {
  info.innerHTML = `
    Position: ${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}<br>
    Rotation: ${camera.rotation.x.toFixed(2)}, ${camera.rotation.y.toFixed(2)}, ${camera.rotation.z.toFixed(2)}
  `;
}

controls.addEventListener('change', updateCameraInfo);

// Set up Effect Composer for Bloom
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.58,
  0,
  0
);
composer.addPass(bloomPass);

// Sound setup
const listener = new THREE.AudioListener();
bgmNN = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();

audioLoader.load('./sounds/BuddhaZzzZ.mp3', (buffer) => {
  bgmNN.setBuffer(buffer);
  bgmNN.setLoop(true);
  bgmNN.setVolume(0.1);
  bgmNN.play();
});

sfxWind = new THREE.Audio(listener);
audioLoader.load('./sounds/SoftWind.mp3', (buffer) => {
  sfxWind.setBuffer(buffer);
  sfxWind.setLoop(false);
  sfxWind.setVolume(0.9);
});

// GUI setup
const params = {
  bgm: 0.1,
  sfx: 0.9,
  threshold: 0,
  strength: 1,
  radius: 0,
  exposure: 1
};

const gui = new GUI();
const volumeFolder = gui.title('Sound');
volumeFolder.add(params, 'bgm').min(0.0).max(1.0).step(0.1).onChange(() => {
  bgmNN.setVolume(params.bgm);
});
volumeFolder.add(params, 'sfx').min(0.0).max(1.0).step(0.1).onChange(() => {
  sfxWind.setVolume(params.sfx);
});

const bloomFolder = gui.addFolder('bloom');
bloomFolder.add(params, 'threshold', 0.0, 1.0).onChange((value: number) => {
  bloomPass.threshold = value;
});
bloomFolder.add(params, 'strength', 0.0, 3.0).onChange((value: number) => {
  bloomPass.strength = value;
});

// Animation loop
function animate(): void {
  requestAnimationFrame(animate);
  const time = clock.getElapsedTime();
  material.uniforms.time.value = time;
  controls.update();
  composer.render();
}

// Window resize handler
function onWindowResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize); 
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';
import gsap from 'gsap';

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

// Optimize renderer settings
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(1); // Set to 1 for better performance
renderer.setAnimationLoop(animate);
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.shadowMap.enabled = false;
document.body.appendChild(renderer.domElement);

// Loading Manager
const progressContainer = document.getElementById('progress-container') as HTMLElement;
const progressBar = document.getElementById('progress-bar') as HTMLElement;
const progressText = document.getElementById('progress-text') as HTMLElement;

const manager = new THREE.LoadingManager();
manager.onProgress = (url: string, itemsLoaded: number, itemsTotal: number) => {
  const percentComplete = (itemsLoaded / itemsTotal) * 100;
  progressBar.style.width = percentComplete + '%';
  progressText.textContent = `Loading... ${Math.round(percentComplete)}%<br>Item: ${url}`;
};

manager.onLoad = () => {
  progressContainer.style.display = 'none';
  animate();
};

manager.onError = (url: string) => {
  progressText.textContent = `Error loading: ${url}`;
};

// Declare model variables
let buddha: THREE.Object3D = new THREE.Object3D();
let leo: THREE.Object3D = new THREE.Object3D();
let nagas: THREE.Object3D = new THREE.Object3D();
let pagoda: THREE.Object3D = new THREE.Object3D();
let pavillion: THREE.Object3D = new THREE.Object3D();
let wall: THREE.Object3D = new THREE.Object3D();

// Define models array globally
const models = [
  { path: '/Models/leo.glb', target: leo },
  { path: '/Models/pavillion.glb', target: pavillion },
  { path: '/Models/nagas.glb', target: nagas },
  { path: '/Models/floor.glb', target: null },
  { path: '/Models/pagoda.glb', target: pagoda },
  { path: '/Models/lobby-stair.glb', target: null },
  { path: '/Models/wall.glb', target: wall }
];

const loader = new GLTFLoader(manager);

// Optimize model loading
const loadModels = async () => {
  try {
    // Load Buddha model
    const budaData = await loader.loadAsync('/Models/buddha.glb');
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

    // Load other models with error handling
    for (const model of models) {
      try {
        const data = await loader.loadAsync(model.path);
        if (model.target) {
          model.target = data.scene;
        }
        scene.add(data.scene);
      } catch (error) {
        console.error(`Error loading ${model.path}:`, error);
      }
    }

  } catch (error) {
    console.error('Error loading models:', error);
  }
};

loadModels();

//effect shader
let geometry = new THREE.PlaneGeometry( 200,610,4,8 );
geometry.rotateX( - Math.PI / 2 );

const position = geometry.attributes.position as THREE.BufferAttribute;
position.usage = THREE.DynamicDrawUsage;

for ( let i = 0; i < position.count; i ++ ) {

    const y = 35 * Math.sin( i / 2 );
    position.setY( i, y );

}

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
            pos.z = 333.0 * wave; // คงที่ที่ 35 เท่าเดิม
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

let mesh = new THREE.Mesh( geometry, material );
mesh.position.set(0,-35,-25);
scene.add( mesh );

// Set up OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;

// Create camera info display
const info = document.createElement('div');
info.style.position = 'absolute';
info.style.top = '5%';
info.style.left = '50%';
info.style.transform = 'translate(-50%, -50%)';
info.style.color = 'black';
info.style.padding = '10px';
info.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
info.style.borderRadius = '5px';
info.innerHTML = 'Position: 0, 0, 0<br>Rotation: 0, 0, 0';
document.body.appendChild(info);

function updateCameraInfo(): void {
  info.innerHTML = `
    Position: ${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}<br>
    Rotation: ${camera.rotation.x.toFixed(2)}, ${camera.rotation.y.toFixed(2)}, ${camera.rotation.z.toFixed(2)}
  `;
}

controls.addEventListener('change', updateCameraInfo);

// Sound setup
const listener = new THREE.AudioListener();
bgmNN = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();

audioLoader.load('/sounds/BuddhaZzzZ.mp3', (buffer) => {
  bgmNN.setBuffer(buffer);
  bgmNN.setLoop(true);
  bgmNN.setVolume(0.1);
  bgmNN.play();
});

sfxWind = new THREE.Audio(listener);
audioLoader.load('/sounds/SoftWind.mp3', (buffer) => {
  sfxWind.setBuffer(buffer);
  sfxWind.setLoop(false);
  sfxWind.setVolume(0.9);
});

// Set up Effect Composer for Bloom
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.3,  // Reduced strength for better performance
  0.1,  // Reduced radius
  0.1   // Reduced threshold
);
composer.addPass(bloomPass);

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
const bloomFolder = gui.addFolder( 'bloom' );
bloomFolder.add( params, 'threshold', 0.0, 1.0 ).onChange( function ( value ) {
    bloomPass.threshold = Number( value );
} );
bloomFolder.add( params, 'strength', 0.0, 3.0 ).onChange( function ( value ) {
    bloomPass.strength = Number( value );
} );
gui.add( params, 'radius', 0.0, 1.0 ).step( 0.01 ).onChange( function ( value ) {
    bloomPass.radius = Number( value );
} );
const toneMappingFolder = gui.addFolder( 'tone mapping' );
toneMappingFolder.add( params, 'exposure', 0.1, 2 ).onChange( function ( value ) {
    renderer.toneMappingExposure = Math.pow( value, 4.0 );
} );

//Interactive
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
window.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);
  
  if (intersects.length > 0) {
    const ClickObj = intersects[0].object;
    console.log('Clicked object:', ClickObj);
    
    if (ClickObj.name === "BuddhaStatue") {
      panToObject(ClickObj);
    } else if (ClickObj.name === "Pagoda") {
      panToObject(ClickObj);
    } else if (ClickObj.name === "NagasStatueL") {
      panToObject(ClickObj);
    } else if (ClickObj.name === "pavillion") {
      panToObject(ClickObj);
    } else if (ClickObj.name === "StatueSinghR") {
      panToObject(ClickObj);
    } else if (ClickObj.name === "Lobby") {
      panToObject(ClickObj);
    } else if (ClickObj.name === "LobbyStair") {
      panToObject(ClickObj);
    } else if (ClickObj.name === "Wall") {
      panToObject(ClickObj);
    } else if (ClickObj.name === "Floor") {
      panToObject(ClickObj);
    } 
  }
});

// pan camera to object
function panToObject(target: THREE.Object3D) {
  const targetPosition = target.position.clone();
  const cameraTarget = {
    x: targetPosition.x+2,
    y: targetPosition.y+2,
    z: targetPosition.z+8
  };

  gsap.to(camera.position, {
    x: cameraTarget.x,
    y: cameraTarget.y,
    z: cameraTarget.z,
    duration: 2,
    ease: "power2.inOut",
    onUpdate: () => {
      camera.lookAt(targetPosition);
      controls.target.copy(targetPosition);
    }
  });
  sfxWind.play();
}

// Add stats
const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

const clock = new THREE.Clock();

// Update animation loop
function animate(): void {
  mesh.material.uniforms.time.value = clock.getElapsedTime()* 0.2;
  stats.update();
  controls.update();
  composer.render(); // Use composer instead of renderer
}

// Update window resize handler
function onWindowResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize);
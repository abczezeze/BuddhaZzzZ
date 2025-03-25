import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { GLTFLoader } from 'three/addons/GLTFLoader.js';
import { UnrealBloomPass } from 'three/addons/shaders/UnrealBloomPass.js';
import { EffectComposer } from 'three/addons/shaders/EffectComposer.js';
import { RenderPass } from 'three/addons/shaders/RenderPass.js';

const targetPosition = new THREE.Vector3();
let moving = false;

// Set up scene, camera, renderer, light
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x99DDFF);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(20,20,23);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(200, 1000, 50);
light.castShadow = true;
scene.add(light);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Loading Manager
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
let manager = new THREE.LoadingManager();
manager.onProgress = (url, itemsLoaded, itemsTotal) => {
  const percentComplete = (itemsLoaded / itemsTotal) * 100;
  progressBar.style.width = percentComplete + '%';
  progressText.textContent = `Loading... ${Math.round(percentComplete)}%<br>
  Item: ${url}`;
};
manager.onLoad = () => {
  progressContainer.style.display = 'none'; // ซ่อนเมื่อโหลดเสร็จ
};
manager.onError = (url) => {
  progressText.textContent = `Error loading: ${url}`;
};

const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFD700, // สีทอง
    emissive: 0xFFAA00, // เพิ่มแสงเบาๆ เพื่อให้เกิด Bloom
    emissiveIntensity: .5, // ความเข้มของแสงที่ออกมา
    roughness: 0.5, // ความหยาบของพื้นผิว
    metalness: 1 // ทำให้เป็นวัสดุที่มีคุณสมบัติเหมือนโลหะ
});
// Load models
const loader = new GLTFLoader(manager);
const buddhaData = await loader.loadAsync('Models/buddha.glb');
const buddha = buddhaData.scene;
buddha.children[1].traverse((child) => {
    if (child.isMesh) {
        child.material = goldMaterial;
    }
});
buddha.children[1].position.y = 9;
scene.add(buddha);
//console.log(buddha);
const LeoData = await loader.loadAsync('Models/Leo.glb');
const Leo = LeoData.scene;
scene.add(Leo);
const NagasData = await loader.loadAsync('Models/Nagas.glb');
const Nagas = NagasData.scene;
scene.add(Nagas);
const floorWallData = await loader.loadAsync('Models/floorWall.glb');
const floorWall = floorWallData.scene;
scene.add(floorWall);
const pagodaData = await loader.loadAsync('Models/pagoda.glb');
const pagoda = pagodaData.scene;
scene.add(pagoda);
const boothData = await loader.loadAsync('Models/booth.glb');
const booth = boothData.scene;
scene.add(booth);
const lobbyData = await loader.loadAsync('Models/lobby.glb');
const lobby = lobbyData.scene;
scene.add(lobby);
const stairData = await loader.loadAsync('Models/stair.glb');
const stair = stairData.scene;
scene.add(stair);
const pavillionData = await loader.loadAsync('Models/pavillion.glb');
const pavillion = pavillionData.scene;
scene.add(pavillion);

// Set up OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, 0);
controls.enableDamping = true;

// สร้าง HTML element สำหรับแสดงตำแหน่งกล้อง
const info = document.createElement('div');
info.style.position = 'absolute';
info.style.top = '10px';
info.style.left = '10px';
info.style.color = 'black';
//info.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
info.style.padding = '10px';
document.body.appendChild(info);

// ฟังก์ชันอัปเดตตำแหน่งกล้อง
function updateCameraInfo() {
    info.innerHTML = `
        Position: ${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}<br>
        Rotation: ${camera.rotation.x.toFixed(2)}, ${camera.rotation.y.toFixed(2)}, ${camera.rotation.z.toFixed(2)}
    `;
}

// อัปเดตค่าทุกครั้งที่ OrbitControls มีการเปลี่ยนแปลง
controls.addEventListener('change', updateCameraInfo);

// Set up Effect Composer for Bloom
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),  // Size
  1.5,  // Strength
  0.4,  // Radius
  0.85  // Threshold
);
composer.addPass(bloomPass);

// Resize handler
window.addEventListener('resize', onWindowResize);

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
        console.log(ClickObj);
        if(ClickObj.name==="BuddhaStatue") moveToObject(buddha.position);
        if(ClickObj.name==="Pagoda") moveToObject(pagoda.position);
        //if(ClickObj.name==="Pagoda") camera.position.set(-2,5,5);
    }
});

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

function moveToObject(position) {
    targetPosition.copy(position);
    targetPosition.x += 15;
    targetPosition.y += 15;
    moving = true;
}

function animate() {
    requestAnimationFrame(animate);

    buddha.children[1].rotation.y += .03;
    buddha.children[1].position.y = 8 + Math.sin(Date.now() * .001) * 1;

    if (moving) {
        camera.position.lerp(targetPosition, 0.01);
        if (camera.position.distanceTo(targetPosition) < 0.1) moving = false;
    }
    controls.update();
    composer.render();
}
animate();
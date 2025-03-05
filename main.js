import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { GLTFLoader } from 'three/addons/GLTFLoader.js';
import { UnrealBloomPass } from 'three/addons/UnrealBloomPass.js';
import { EffectComposer } from 'three/addons/EffectComposer.js';
import { RenderPass } from 'three/addons/RenderPass.js';

// Set up scene, camera, renderer, light
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x99DDFF);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(12,10,15);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(200, 1000, 50);
light.castShadow = true;
scene.add(light);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xFFD700, // สีทอง
    emissive: 0xFFAA00, // เพิ่มแสงเบาๆ เพื่อให้เกิด Bloom
    emissiveIntensity: .5, // ความเข้มของแสงที่ออกมา
    roughness: 0.5, // ความหยาบของพื้นผิว
    metalness: 1 // ทำให้เป็นวัสดุที่มีคุณสมบัติเหมือนโลหะ
});
// Load models
const loader = new GLTFLoader();
const buddhaData = await loader.loadAsync('Models/buddha.glb');
const buddha = buddhaData.scene;
buddha.position.y = 5;
buddha.traverse((child) => {
    if (child.isMesh) {
        child.material = goldMaterial;
    }
});
scene.add(buddha);

const LeoData = await loader.loadAsync('Models/Leo.glb');
const Leo = LeoData.scene;
Leo.position.x = 5;
scene.add(Leo);

const NagasData = await loader.loadAsync('Models/Nagas.glb');
const Nagas = NagasData.scene;
Nagas.position.x = -5;
scene.add(Nagas);

// Set up OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 0.1;
controls.maxDistance = 20;
controls.target.set(0, 0, 0);
controls.update();

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

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    buddha.rotation.y += .03;
    buddha.position.y = 5 + Math.sin(Date.now() * .001) * 1;
    composer.render();
}

animate();

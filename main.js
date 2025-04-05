import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
//import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

//declare sound
let sfxWind, bgmNN;
// Set up scene, camera, renderer, light
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x99DDFF);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0,33,22);

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(200, 1000, 50);
light.castShadow = true;
scene.add(light);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
renderer.toneMapping = THREE.ReinhardToneMapping;
document.body.appendChild(renderer.domElement);

// Loading Manager
const progressContainer = document.getElementById('progress-container');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
let manager = new THREE.LoadingManager();
manager.onProgress = (url, itemsLoaded, itemsTotal) => {
  const percentComplete = (itemsLoaded / itemsTotal) * 100;
  progressBar.style.width = percentComplete + '%';
  progressText.textContent = `Loading... ${Math.round(percentComplete)}%\nItem: ${url}`;

};
manager.onLoad = () => {
  progressContainer.style.display = 'none'; // ซ่อนเมื่อโหลดเสร็จ
  animate();
};
manager.onError = (url) => {
  progressText.textContent = `Error loading: ${url}`;
};

// Load models
let buddha, leo, nagas, booth, pagoda, pavillion;
const loader = new GLTFLoader(manager);
const budaData = await loader.loadAsync('Models/buddha.glb');
console.log(budaData);
buddha = budaData.scene;
    buddha.children[1].traverse((child) => {
    if (child.isMesh) {
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

const leoData = await loader.loadAsync('Models/Leo.glb');
leo = leoData.scene;
scene.add(leo);

loader.load('Models/Nagas.glb',function(gltf){
    nagas = gltf.scene;
    scene.add(nagas);
});

loader.load('Models/floorWall.glb',function(gltf){
    scene.add(gltf.scene);
});

loader.load('Models/pagoda.glb',function(gltf){
    pagoda = gltf.scene
    scene.add(pagoda);
});

const boothData = await loader.loadAsync('Models/booth.glb');
booth = boothData.scene
scene.add(booth);

loader.load('Models/lobby.glb',function(gltf){
    scene.add(gltf.scene);
});

loader.load('Models/stair.glb',function(gltf){
    scene.add(gltf.scene);
});

const pavillionData = await loader.loadAsync('Models/pavillion.glb');
pavillion = pavillionData.scene
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
let composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),  // Size
  0.58,  // Strength
  0,  // Radius
  0,  // Threshold
);
composer.addPass(bloomPass);

//sound
var listener = new THREE.AudioListener();
bgmNN = new THREE.Audio( listener );
var audioLoader = new THREE.AudioLoader();
audioLoader.load('./sounds/BuddhaZzzZ.mp3', function( buffer ) {
        bgmNN.setBuffer( buffer );
        bgmNN.setLoop( true );
        bgmNN.setVolume( 0.1 );
        bgmNN.play();
});

sfxWind = new THREE.Audio( listener );
audioLoader = new THREE.AudioLoader();
audioLoader.load('./sounds/SoftWind.mp3', function( buffer ) {
        sfxWind.setBuffer( buffer );
        sfxWind.setLoop( false );
        sfxWind.setVolume( 0.9 );
});

//gui
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
volumeFolder.add( params, 'bgm' ).min( 0.0 ).max( 1.0 ).step( 0.1 ).onChange( function () {
    bgmNN.setVolume( params.bgm );
} );
volumeFolder.add( params, 'sfx' ).min( 0.0 ).max( 1.0 ).step( 0.1 ).onChange( function () {
    sfxWind.setVolume( params.sfx );
} );
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

// Resize handler
window.addEventListener('resize', onWindowResize);

// แพนกล้องไปที่วัตถุ
function panToObject(target) {
    //console.log(target.position);
    gsap.to(camera.position, {
      x: target.position.x + 2,
      y: target.position.y + 2,
      z: target.position.z + 8,
      duration: 2,
      ease: "power2.inOut",
      onUpdate: () => camera.lookAt(target.position)
    });
    sfxWind.play();
  }

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
        if(ClickObj.name==="BuddhaStatue") panToObject(buddha.children[1]);
        if(ClickObj.name==="Pagoda") panToObject(pagoda.children[0]);
        if(ClickObj.name==="NagasStatueR") panToObject(nagas.children[1])
        if(ClickObj.name==="NagasStatueL") panToObject(nagas.children[0]);
        if(ClickObj.name==="pavillion") panToObject(pavillion.children[0]);
        if(ClickObj.name==="StatueSinghR") panToObject(leo.children[1])
        if(ClickObj.name==="StatueSinghL") panToObject(leo.children[0]);
        if(ClickObj.name==="Booth") panToObject(booth.children[0]);

    }
});

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);

    // buddha.children[1].rotation.y += .003;
    // buddha.children[1].position.y = 8 + Math.sin(Date.now() * .001) * 1;

    //controls.update();
    composer.render();
}
let scene, camera, renderer, controls, model;

function init() {
    const container = document.getElementById('viewer-container');
    scene = new THREE.Scene();
    createSkyBackground();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 50000);
    camera.position.set(5, 3, 5);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.physicallyCorrectLights = false;
    container.appendChild(renderer.domElement);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableRotate = true;
    controls.autoRotate = false;
    controls.minDistance = 0.5;
    controls.maxDistance = 5000;
    setupLighting();
    loadModel();
    window.addEventListener('resize', onWindowResize);
    animate();
}

function createSkyBackground() {
    const vertexShader = `
        varying vec3 vWorldPosition;
        void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;
    const fragmentShader = `
        varying vec3 vWorldPosition;
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        void main() {
            float h = normalize(vWorldPosition + offset).y;
            gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
    `;
    const uniforms = {
        topColor: { value: new THREE.Color(0x88b4d8) },
        bottomColor: { value: new THREE.Color(0xc8d8e8) },
        offset: { value: 33 },
        exponent: { value: 0.4 }
    };
    const skyGeo = new THREE.SphereGeometry(10000, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: THREE.BackSide
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);
}

function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(50, 150, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 1000;
    sunLight.shadow.camera.left = -200;
    sunLight.shadow.camera.right = 200;
    sunLight.shadow.camera.top = 200;
    sunLight.shadow.camera.bottom = -200;
    sunLight.shadow.bias = -0.0001;
    scene.add(sunLight);
    const topLight = new THREE.DirectionalLight(0xffffff, 0.8);
    topLight.position.set(0, 200, 0);
    scene.add(topLight);
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-100, 80, -100);
    scene.add(fillLight);
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x556b2f, 0.7);
    hemiLight.position.set(0, 100, 0);
    scene.add(hemiLight);
}

function loadModel() {
    const loader = new THREE.GLTFLoader();
    const loadingElement = document.getElementById('loading');
    const dracoLoader = new THREE.DRACOLoader();
    dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');
    loader.setDRACOLoader(dracoLoader);
    loader.load(
        'https://media.githubusercontent.com/media/kishorkishor/PAID_Blender_16/main/my%20blender%20project.glb',
        function (gltf) {
            model = gltf.scene;
            model.traverse(function (child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    if (child.material) {
                        child.material.side = THREE.DoubleSide;
                    }
                }
            });
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            model.position.x = -center.x;
            model.position.z = -center.z;
            model.position.y = -box.min.y;
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            let distance = Math.abs(maxDim / Math.tan(fov / 2));
            distance *= 1.2;
            camera.position.set(distance * 0.7, distance * 0.4, distance * 0.7);
            camera.lookAt(0, size.y * 0.3, 0);
            controls.target.set(0, size.y * 0.3, 0);
            controls.update();
            controls.minDistance = maxDim * 0.05;
            controls.maxDistance = maxDim * 5;
            scene.add(model);
            loadingElement.classList.add('hidden');
        },
        function (xhr) { },
        function (error) {
            loadingElement.innerHTML = '<p style="color: #ff6b6b;">Error loading model</p>';
        }
    );
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('DOMContentLoaded', init);

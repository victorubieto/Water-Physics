import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"

import { ShaderManager } from "./shaderManager.js";
// import { HDRJPGLoader } from "https://cdn.jsdelivr.net/npm/@monogrid/gainmap-js@3.0.0/dist/decode.js"
import { EXRLoader } from "three/addons/loaders/EXRLoader.js"

const VERSION = "0.0";

class App
{
    constructor()
    {
        this.scene = null;
        this.renderer = null;
        this.camera = null;
        this.controls = null;

        this.frameTime = 0.0;
        this.currentTime = performance.now() / 1000.0; // seconds
        
        this.textureLoader = new THREE.TextureLoader();
        this.exrLoader = new EXRLoader();
    }

    async init()
    {
        // Init Scene
        let scene = this.scene = new THREE.Scene();
        scene.background = new THREE.Color( 0x1f1f1f );
    
        // Renderer
        let renderer = this.renderer = new THREE.WebGLRenderer( {antialias: true} );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        // renderer.toneMapping = THREE.ReinhardToneMapping;
        document.body.appendChild( renderer.domElement );
    
        // Camera
        let camera = this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );
        let controls = this.controls = new OrbitControls( camera, renderer.domElement );
        controls.object.position.set( 0.0, 1.0, 3.0);
        controls.minDistance = 1.0;
        controls.maxDistance = 5.0;

        // Lights
        let hemiLight = new THREE.HemisphereLight( 0xfffff, 0xffffff, 0.05 );
        scene.add( hemiLight );

        let bulbLight = new THREE.PointLight( 0xffffff, 1, 100, 2 );
        let bulbGeometry = new THREE.SphereGeometry( 0.02, 16, 8 );
        let bulbMat = new THREE.MeshStandardMaterial( {emissive: 0xffffff, emissiveIntensity: 1, color: 0xffffff} );
        bulbLight.add( new THREE.Mesh( bulbGeometry, bulbMat ) );
        bulbLight.position.set( 0.75, 1, 0.75 );
        bulbLight.castShadow = true;
        scene.add( bulbLight );

        // Environment
        // let hdr = new HDRJPGLoader( renderer ).load(
        //     "res/hdrs/HdrSkyMorning004/HdrSkyMorning004_JPG_1K.jpg",
        //     () => {
        //         let hdrEquirectangularMap = hdr.renderTarget.texture;
        //         hdrEquirectangularMap.mapping = THREE.hdrEquirectangularReflectionMapping;
        //         hdrEquirectangularMap.needsUpdate = true;

        //         // scene.environment = hdrEquirectangularMap;
        //         // scene.background = hdrEquirectangularMap;
        //         this.background = hdrEquirectangularMap;

        //         hdr.dispose;
        //     }
        // );
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();

        this.exrLoader.setDataType(THREE.FloatType).load("res/hdrs/HdrSkyMorning004/HdrSkyMorning004_HDR_1K.exr",
            (texture) => {
                let exrCubeRenderTarget = pmremGenerator.fromEquirectangular(texture);
                this.exrBackground = exrCubeRenderTarget.texture;
                this.newEnvMap = exrCubeRenderTarget ? exrCubeRenderTarget.texture : null;
                // this.background.mapping = THREE.EquirectangularReflectionMapping;
                //hdrEquirectangularMap.mapping = THREE.hdrEquirectangularReflectionMapping;
                scene.background = this.newEnvMap;
                pmremGenerator.dispose();
                texture.dispose();
            }
        );

        // Load Shaders
        this.shaderManager = new ShaderManager("res/shaders/");
        let promise = await this.shaderManager.loadFromFile("basic.vs");
        promise = await this.shaderManager.loadFromFile("flat.fs"); // I CAN'T COMMENT THIS?????
        promise = await this.shaderManager.loadFromFile("waterSurface.fs");

        // Init Nodes
        let texture = this.textureLoader.load('/res/textures/TilesSquarePoolMixed001/TilesSquarePoolMixed001_COL_1K.jpg');
        let normalTexture = this.textureLoader.load('/res/textures/TilesSquarePoolMixed001/TilesSquarePoolMixed001_NRM_1K.jpg');
        let material1 = new THREE.MeshPhongMaterial( {side: THREE.BackSide, map: texture, normalMap: normalTexture} );
        let cube = new THREE.Mesh( new THREE.BoxGeometry( 1, 1, 1 ), material1 ); 
        scene.add( cube );

        let waterSurfaceMat = new THREE.ShaderMaterial({
            uniforms: {
                u_local_camera_position: {value: camera.position},
                u_local_light_position: {value: bulbLight.position},
                // u_texture: {type: "t", value: this.background},
                // u_env_tex: {value: this.newEnvMap},
            },
            vertexShader: this.shaderManager.get("basic.vs"),
            fragmentShader: this.shaderManager.get("waterSurface.fs"),
            side: THREE.DoubleSide,
            // envMap: this.newEnvMap,
            transparent: true,
        });
        waterSurfaceMat.envMap = this.newEnvMap; 
        waterSurfaceMat.uniforms.envMap = this.newEnvMap; 
        let plane = new THREE.Mesh( new THREE.PlaneGeometry( 1, 1 ), waterSurfaceMat );
        plane.position.set( 0.0, 0.4, 0.0 );
        plane.rotateX(-Math.PI / 2);
        scene.add( plane ); 

        // Add more info
        let versionDiv = document.createElement("div");
        versionDiv.id = "version";
        versionDiv.innerText = "v" + VERSION;
        versionDiv.style.color = "white";
        versionDiv.style.position = "absolute";
        versionDiv.style.left = "20px";
        versionDiv.style.bottom = "20px";
        document.body.appendChild( versionDiv );
        
        let fpsDiv = document.createElement("div");
        fpsDiv.id = "fps";
        fpsDiv.style.position = "absolute";
        fpsDiv.style.left = "20px";
        fpsDiv.style.bottom = "40px";
        fpsDiv.style.color = "white";
        document.body.appendChild( fpsDiv );

        // Add events
        window.addEventListener( "resize", this.onWindowResize.bind(this) );
        setInterval(() => {document.querySelector("#fps").innerHTML = (1.0/this.frameTime).toFixed(2) + " fps";}, 100);

        this.animate();
    }

    animate()
    {
        requestAnimationFrame( this.animate.bind(this) );

        // Compute dt
        let newTime = performance.now() / 1000.0;
        this.frameTime = newTime - this.currentTime;
        this.currentTime = newTime;

        // Update
        this.update(this.frameTime);

        // Render
        this.renderer.render( this.scene, this.camera );
    }

    update(dt)
    {
        this.controls.update();

        // Update uniforms
        // let cameraLocalPos = this.scene.children[3].worldToLocal(this.camera.position.clone());
        this.scene.children[3].material.uniforms.u_local_camera_position.value = this.camera.position;
        // let lightLocalPos = this.scene.children[3].worldToLocal(this.scene.children[1].position.clone());
        this.scene.children[3].material.uniforms.u_local_light_position.value = this.scene.children[1].position;
        this.scene.children[3].material.uniforms.u_env_tex = this.newEnvMap;
    }

    onWindowResize()
    {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize( window.innerWidth, window.innerHeight );
    }
}

let app = new App();
app.init();
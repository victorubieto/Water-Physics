import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"

import { ShaderManager } from "./shaderManager.js";

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
    }

    async init()
    {
        // Init Scene
        let scene = this.scene = new THREE.Scene();
    
        // Renderer
        let renderer = this.renderer = new THREE.WebGLRenderer( {antialias: true} );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( renderer.domElement );
    
        // Camera
        let camera = this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );
        let controls = this.controls = new OrbitControls( camera, renderer.domElement );
        controls.object.position.set( 0.0, 1.0, 4.0);
        controls.minDistance = 1.0;
        controls.maxDistance = 5.0;
        controls.enableDamping = true

        // Lights
        let hemiLight = new THREE.HemisphereLight( 0xfffff, 0xffffff, 0.05 );
        scene.add( hemiLight );

        let bulbLight = this.bulbLight = new THREE.PointLight( 0xffffff, 1, 100, 2 );
        let bulbGeometry = new THREE.SphereGeometry( 0.02, 16, 8 );
        let bulbMat = new THREE.MeshStandardMaterial( {emissive: 0xffffff, emissiveIntensity: 1, color: 0xffffff} );
        bulbLight.add( new THREE.Mesh( bulbGeometry, bulbMat ) );
        bulbLight.position.set( 0.75, 1, 0.75 );
        bulbLight.castShadow = true;
        scene.add( bulbLight );

        // Environment
        const urls = [
            '/res/cubemaps/sky_15_cubemap_2k/px.png',
            '/res/cubemaps/sky_15_cubemap_2k/nx.png',
            '/res/cubemaps/sky_15_cubemap_2k/py.png',
            '/res/cubemaps/sky_15_cubemap_2k/ny.png',
            '/res/cubemaps/sky_15_cubemap_2k/pz.png',
            '/res/cubemaps/sky_15_cubemap_2k/nz.png',
        ];
        const cubeTextureLoader = new THREE.CubeTextureLoader();
        scene.background = cubeTextureLoader.load(urls);

        let cubeRenderTarget = new THREE.WebGLCubeRenderTarget(512, {
            format: THREE.RGBFormat,
            generateMipmaps: true,
            minFilter: THREE.LinearMipmapLinearFilter,
        });
    
        this.cubeCamera = new THREE.CubeCamera(1, 100, cubeRenderTarget);

        // Load Shaders
        this.shaderManager = new ShaderManager("res/shaders/");
        let promise = await this.shaderManager.loadFromFile("basic.vs");
        promise = await this.shaderManager.loadFromFile("waterSurface.fs");

        // Init Nodes
        this.createPool();
        this.createSurface();

        this.addGUI();
        
        // Add events
        window.addEventListener( "resize", this.onWindowResize.bind(this) );
        setInterval(() => {document.querySelector("#fps").innerHTML = (1.0/this.frameTime).toFixed(2) + " fps";}, 100);

        this.animate();
    }

    createPool()
    {
        let texture = this.textureLoader.load('/res/textures/TilesSquarePoolMixed001/TilesSquarePoolMixed001_COL_1K.jpg');
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(3, 2);
        let normalTexture = this.textureLoader.load('/res/textures/TilesSquarePoolMixed001/TilesSquarePoolMixed001_NRM_1K.jpg');
        let material = new THREE.MeshPhongMaterial( {side: THREE.BackSide, map: texture } );//, normalMap: normalTexture} );

        this._geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            0.5, 0.5, 0.5,
            0.5, 0.5, -0.5,
            0.5, -0.5, 0.5,
            0.5, -0.5, -0.5,
            -0.5, 0.5, -0.5,
            -0.5, 0.5, 0.5,
            -0.5, -0.5, -0.5,
            -0.5, -0.5, 0.5,
            -0.5, 0.5, -0.5,
            0.5, 0.5, -0.5,
            -0.5, 0.5, 0.5,
            0.5, 0.5, 0.5,
            -0.5, -0.5, 0.5,
            0.5, -0.5, 0.5,
            -0.5, -0.5, -0.5,
            0.5, -0.5, -0.5,
            -0.5, 0.5, 0.5,
            0.5, 0.5, 0.5,
            -0.5, -0.5, 0.5,
            0.5, -0.5, 0.5,
            0.5, 0.5, -0.5,
            -0.5, 0.5, -0.5,
            0.5, -0.5, -0.5,
            -0.5, -0.5, -0.5
        ]);
        const uvs = new Float32Array([
            0, 1,
            1, 1,
            0, 0,
            1, 0,
            0, 1,
            1, 1,
            0, 0,
            1, 0,
            0, 1,
            1, 1,
            0, 0,
            1, 0,
            0, 1,
            1, 1,
            0, 0,
            1, 0,
            0, 1,
            1, 1,
            0, 0,
            1, 0,
            0, 1,
            1, 1,
            0, 0,
            1, 0
        ]);
        const indices = new Uint32Array([
            0, 2, 1,
            2, 3, 1,
            4, 6, 5,
            6, 7, 5,
            // 8, 10, 9, // omit top face
            // 10, 11, 9, // omit top face
            12, 14, 13,
            14, 15, 13,
            16, 18, 17,
            18, 19, 17,
            20, 22, 21,
            22, 23, 21
        ]);

        const normals = new Float32Array([
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, -1, 0,        
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1
        ]);
  
        this._geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        this._geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
        this._geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        this._geometry.setIndex(new THREE.BufferAttribute(indices, 1));

        let cube = new THREE.Mesh( this._geometry, material ); 
        cube.scale.set( 3, 1, 2 );

        this.scene.add( cube );
    }

    createSurface()
    {
        let waterSurfaceMat = new THREE.ShaderMaterial({
            uniforms: {
                u_camera_position: {value: this.camera.position},
                u_light_position: {value: this.bulbLight.position},
                u_cube_map: {value: this.cubeCamera.renderTarget.texture},
            },
            vertexShader: this.shaderManager.get("basic.vs"),
            fragmentShader: this.shaderManager.get("waterSurface.fs"),
            side: THREE.DoubleSide,
            transparent: true,
        });
        let plane = new THREE.Mesh( new THREE.PlaneGeometry( 3, 2 ), waterSurfaceMat );
        plane.position.set( 0.0, 0.5, 0.0 );
        plane.rotateX(-Math.PI / 2);
        this.scene.add( plane );
    }

    addGUI()
    {
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

        // update the render target
        this.scene.children[2].visible = false;
        this.scene.children[3].visible = false;
        this.cubeCamera.update(this.renderer, this.scene);
        this.scene.children[2].visible = true;
        this.scene.children[3].visible = true;

        // Update uniforms
        this.scene.children[3].material.uniforms.u_camera_position.value = this.camera.position;
        this.scene.children[3].material.uniforms.u_light_position.value = this.scene.children[1].position;
        this.scene.children[3].material.uniforms.u_cube_map.value = this.cubeCamera.renderTarget.texture;
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
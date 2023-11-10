import * as THREE from "three";
import { OrbitControls } from "three-stdlib";

export default class Sketch {
  constructor(options) {
    this.container = options.dom;
    this.scene = new THREE.Scene();

    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);

    this.setupPerspectiveCamera();

    this.time = 0;
    this.clock = new THREE.Clock();

    this.setupGround();
    this.setupResize();
    this.render();
  }

  setupPerspectiveCamera() {
    this.camera = new THREE.PerspectiveCamera(
      70,
      this.width / this.height,
      0.01,
      1000,
    );

    this.camera.position.set(50, 50, 50);
    this.camera.lookAt(0, 0, 0);

    this.controls = new OrbitControls(
      this.camera,
      this.renderer.domElement,
    );
  }

  setupOrthographicCamera() {
    const size = 55;

    this.camera = new THREE.OrthographicCamera(
      -size,
      size,
      size,
      -size,
      0.01,
      700,
    );
    this.camera.position.y = 100;

    this.camera.lookAt(0, 0, 0);

    this.controls = new OrbitControls(
      this.camera,
      this.renderer.domElement,
    );

    this.controls.enableRotate = false;
  }

  setupGround() {
    const plane = new THREE.PlaneGeometry(100, 100);
    const material = new THREE.MeshBasicMaterial({
      map: new THREE.TextureLoader().load("./background.png"),
    });
    this.ground = new THREE.Mesh(plane, material);
    this.ground.position.set(0, 0, 0);
    this.ground.rotation.x = -Math.PI * 0.5;

    this.scene.add(this.ground);
  }

  getMousePosition(e) {
    this.pointer.x = (e.clientX / this.width) * 2 - 1;
    this.pointer.y = -(e.clientY / this.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects([this.ground]);

    if (intersects.length > 0) {
      const { point } = intersects[0];
      return {
        x: point.x,
        y: point.y,
        z: point.z,
      };
    }

    return null;
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;

    this.camera.updateProjectionMatrix();
  }

  render() {
    this.renderer.render(this.scene, this.camera);

    window.requestAnimationFrame(this.render.bind(this));
  }
}

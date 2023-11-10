import * as THREE from "three";
import Sketch from "./Sketch";

class Experience {
  constructor() {
    this.sketch = new Sketch({
      dom: document.getElementById("container"),
    });

    this.mode = "VIEW";
    this.height = 3;

    this.points = [];
    this.currentPoints = [];
    this.closed = false;

    this.setupHeightEvent();
    this.setupModeEvent();
    this.setupCursor();
    this.setupClickEvent();
    this.setupHoverEvent();
  }

  setupHeightEvent() {
    this.heightInput = document.getElementById("height");
    this.heightInput.value = this.height;

    this.heightInput.addEventListener("change", (e) => {
      this.height = parseFloat(e.target.value);

      this.sketch.scene.children.forEach((child) => {
        if (
          child.userData.type === "WALL" ||
          child.userData.type === "LINE"
        ) {
          child.geometry.attributes.position.array[1] = this.height;
          child.geometry.attributes.position.array[4] = this.height;
          child.geometry.attributes.position.needsUpdate = true;
        } else if (
          child.userData.type === "ROOF" ||
          child.userData.type === "POINT"
        ) {
          child.position.y = this.height;
        }
      });

      this.points.forEach((points) => {
        points.forEach((point) => {
          point.y = this.height;
        });
      });
    });
  }

  setupModeEvent() {
    const modeInput = document.getElementById("mode");
    modeInput.value = this.mode;

    modeInput.addEventListener("change", (e) => {
      this.mode = e.target.value;

      if (this.mode === "DRAW") {
        this.cursor.visible = true;

        this.sketch.setupOrthographicCamera();
      } else {
        this.cursor.visible = false;

        this.sketch.setupPerspectiveCamera();
      }
    });
  }

  setupClickEvent() {
    window.addEventListener("click", (e) => {
      if (this.mode !== "DRAW") return;

      const point = this.sketch.getMousePosition(e);
      if (!point) return;

      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 10, 10),
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
        }),
      );
      mesh.userData = {
        type: "POINT",
      };

      const position = new THREE.Vector3(
        point.x,
        this.height,
        point.z,
      );

      if (this.currentPoints.length > 2) {
        const firstPoint = this.currentPoints[0];

        const distance =
          firstPoint.mesh.position.distanceTo(position);

        if (distance < 20) {
          this.closed = true;

          position.copy(firstPoint.mesh.position);
        }
      }

      mesh.position.set(position.x, position.y, position.z);
      this.currentPoints.push({
        x: position.x,
        y: position.y,
        z: position.z,
        mesh,
      });
      this.sketch.scene.add(mesh);

      // adding line between points
      if (this.currentPoints.length > 1) {
        const lastPoint =
          this.currentPoints[this.currentPoints.length - 2];
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(lastPoint.x, lastPoint.y, lastPoint.z),
            position,
          ]),
          new THREE.LineBasicMaterial({
            color: 0xffff00,
          }),
        );
        line.userData = {
          type: "LINE",
        };
        this.sketch.scene.add(line);
      }

      if (this.closed) {
        this.points.push(this.currentPoints);
        this.drawShapes(this.currentPoints);
        this.currentPoints = [];
        this.closed = false;
      }
    });
  }

  setupHoverEvent() {
    window.addEventListener("mousemove", (e) => {
      if (this.mode !== "DRAW") return;
      const point = this.sketch.getMousePosition(e);
      if (!point) return;
      this.cursor.visible = true;
      this.cursor.position.set(point.x, this.height, point.z);
    });
  }

  drawWalls(points) {
    for (let i = 0; i < points.length; i++) {
      const nextIndex = (i + 1) % points.length;
      const wallPoints = [
        new THREE.Vector3(points[i].x, this.height, points[i].z),
        new THREE.Vector3(
          points[nextIndex].x,
          this.height,
          points[nextIndex].z,
        ),
        new THREE.Vector3(
          points[nextIndex].x,
          0,
          points[nextIndex].z,
        ),
        new THREE.Vector3(points[i].x, 0, points[i].z),
      ];

      const geometry = new THREE.BufferGeometry().setFromPoints(
        wallPoints,
      );
      geometry.setIndex([0, 1, 2, 0, 2, 3]);

      const material = new THREE.MeshBasicMaterial({
        color: 0x848484,
        side: THREE.DoubleSide,
      });

      const wall = new THREE.Mesh(geometry, material);
      wall.userData = {
        type: "WALL",
      };

      this.sketch.scene.add(wall);
    }
  }

  drawShapes(points) {
    const roof = points.map((point) => {
      return new THREE.Vector2(point.x, -point.z);
    });

    this.drawRoof(roof);

    this.drawWalls(points);
  }

  drawRoof(points) {
    const shape = new THREE.Shape(points);

    const material = new THREE.MeshBasicMaterial({
      color: 0xcdc4bc,
      side: THREE.DoubleSide,
    });

    const geometry = new THREE.ShapeGeometry(shape);

    const roof = new THREE.Mesh(geometry, material);
    roof.userData = {
      type: "ROOF",
    };

    roof.rotation.x = -Math.PI * 0.5;
    roof.position.y = this.height;

    this.sketch.scene.add(roof);
  }

  setupCursor() {
    this.cursor = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 10, 10),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
      }),
    );
    this.sketch.scene.add(this.cursor);
    this.cursor.visible = false;
  }
}

new Experience();

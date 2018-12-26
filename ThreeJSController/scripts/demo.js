/*!
 *
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


'use strict';

/* eslint-env es6 */

class Demo {

  static get CAMERA_SETTINGS() {
    return {
      viewAngle: 45,
      near: 0.1,
      far: 10000
    };
  }

  constructor() {
    this._width;
    this._height;
    this._renderer;
    this._camera;
    this._aspect;
    this._settings;
    this._box;
    this._group;
    this._text = "test";
    this._color = 0xff0000;
    this._textPosition = {
      x: 0,
      y: 0,
      z: -3
    };
    this._firstLetter = true;
    this._container = document.querySelector('#container');

    this.clearContainer();
    this.createRenderer();

    this._onResize = this._onResize.bind(this);
    this._onDocumentKeyDown = this._onDocumentKeyDown.bind(this);
    this._onDocumentKeyPress = this._onDocumentKeyPress.bind(this);
    this._update = this._update.bind(this);

    this._onResize();

    this.createCamera();
    this.createScene();
    this.createMeshes();

    this._addEventListeners();
    requestAnimationFrame(this._update);
  }

  _update() {
    const ROTATION_VALUE = 4;
    const time = window.performance.now() * 0.0001;

    this._box.rotation.x = Math.sin(time) * ROTATION_VALUE;
    this._box.rotation.y = Math.cos(time) * ROTATION_VALUE;

    this._render();
  }

  _render() {
    this._renderer.render(this._scene, this._camera);
    requestAnimationFrame(this._update);
  }

  _onResize() {
    this._width = window.innerWidth;
    this._height = window.innerHeight;
    this._aspect = this._width / this._height;

    this._renderer.setSize(this._width, this._height);

    if (!this._camera) {
      return;
    }

    this._camera.aspect = this._aspect;
    this._camera.updateProjectionMatrix();
  }

  _onDocumentKeyDown(event) {
    if (this._firstLetter) {
      this._firstLetter = false;
      this._text = "";
    }
    var keyCode = event.keyCode;
    // backspace
    if (keyCode == 8) {
      event.preventDefault();
      this._text = this._text.substring(0, this._text.length - 1);
      this.refreshText();
    }
  }

  _onDocumentKeyPress(event) {
    var keyCode = event.which;
    // backspace
    if (keyCode == 8) {
      event.preventDefault();
    } else {
      var ch = String.fromCharCode(keyCode);
      this._text += ch;
      this.refreshText();
    }
  }

  _addEventListeners() {
    window.addEventListener('resize', this._onResize);
    document.addEventListener('keypress', this._onDocumentKeyPress);
    document.addEventListener('keydown', this._onDocumentKeyDown);
  }

  clearContainer() {
    this._container.innerHTML = '';
  }

  createRenderer() {
    this._renderer = new THREE.WebGLRenderer();
    this._container.appendChild(this._renderer.domElement);
  }

  createCamera() {
    this._settings = Demo.CAMERA_SETTINGS;
    this._camera = new THREE.PerspectiveCamera(
      this._settings.viewAngle,
      this._aspect,
      this._settings.near,
      this._settings.far
    );
  }

  createScene() {
    this._scene = new THREE.Scene();
  }

  createText() {
    var loader = new THREE.FontLoader();
    var value = this._text;
    var color = this._color;
    var scene = this._scene;
    this._group = new THREE.Group();
    this._scene.add(this._group);
    var group = this._group;
    loader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/fonts/gentilis_bold.typeface.json', function (font) {

      var textGeometry = new THREE.TextGeometry(value, {
        font: font,
        size: 1,
        height: 1,
        curveSegments: 12,
      });
      var textMaterial = new THREE.MeshBasicMaterial({
        color: color
      });
      var textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.castShadow = true;
      textMesh.position.z = -3;
      group.add(textMesh);
    });
  }

  refreshText() {
    this._scene.remove(this._group);
    this.createText();
  }

  createMeshes() {
    const RADIUS = 1;
    const WIDTHSEG = 16;
    const HEIGHTSEG = 16;

    // Box.
    const boxGeometry = new THREE.SphereGeometry(RADIUS, WIDTHSEG, HEIGHTSEG);
    const boxMaterial = new THREE.MeshBasicMaterial( {color: 0xffff00} );

    this._box = new THREE.Mesh(boxGeometry, boxMaterial);
    this._box.position.z = -5;

    // Debug Text.
    //this.createText();

    // Room.
    /* const roomGeometry = new THREE.BoxGeometry(10, 2, 10, 10, 2, 10);
    const roomMaterial = new THREE.MeshBasicMaterial({
      wireframe: true,
      opacity: 0.3,
      transparent: true,
      side: THREE.BackSide
    });
    const room = new THREE.Mesh(roomGeometry, roomMaterial);

    room.position.z = -5; */

    this._scene.add(this._box);
    // this._scene.add(room);
    this._camera.position.set(0, 0, 5);
    this._camera.lookAt(this._box.position);
  }
}
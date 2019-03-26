


var container;
var camera, scene, renderer;
var controller1, controller2;
var raycaster, intersected = [];
var tempMatrix = new THREE.Matrix4();
var group_no_move;
var group;
// var timestamp0, timestamp1, timestamp2, timestamp1;
var line;
var object;
// var points;
const NBTIMESTAMPS = 4;
var vertices = [];
var edges = [];


var flag;

//Variables pour le déplacement avec la croix
var continuousXMove = 0;
var continuousYMove = 0;

var controls, keyControls;
var pivot;

const CAMSTEP = 1;

var sphere4;
var sphere3;
var sphere2;
var sphere1;

var selected;
var is_selected;

var plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // it's up to you how you will create THREE.Plane(), there are several methods
var raycaster = new THREE.Raycaster(); //for reuse
var mouse = new THREE.Vector2(); //for reuse
var intersectPoint = new THREE.Vector3(); //for reuse

var file;

//double buffering pour l'affichage des elements
// 1 ecran qui dessine et un ecran qui affiche a l'utilisateur




const directions = {
  37: 'left',
  38: 'forward',
  39: 'right',
  40: 'backward'
};

// Safari iOS has issues with Map!
//let listeners = new Map();
var listeners = {};
var dispatch;
var rotation = 0;
var translation = 0;

function createControls(){

  window.addEventListener('keydown', function(e){
    e.preventDefault();
    createEvent({'direction': directions[e.which], 'animate': true});
  }, false);


  window.addEventListener('keyup', function(e){
    e.preventDefault();
    createEvent({'direction': directions[e.which], 'animate': false});
  }, false);

  var buttons = new Map();
  buttons.set('forward', document.getElementById('forward'));
  buttons.set('backward', document.getElementById('backward'));
  buttons.set('left', document.getElementById('left'));
  buttons.set('right', document.getElementById('right'));

  for(var key in directions){
    var direction = directions[key];
    var button = buttons.get(direction);
    if(button){
      initButton(button, direction);
    }
  }

  return {
    addEventListener: function(id, cb){
      listeners[id] = cb;
      //listeners.set(id, cb);
    },

    removeEventListener: function(id){
      delete listeners[id];
      //listeners.delete(id);
    },

    onChange: function(callback){
      this.addEventListener('cb', callback);
    },

    showButtons: function(...ids){
      ids.forEach(function(id){
        buttons.get(id).style.visibility = 'visible';
      });
    },

    hideButtons: function(...ids){
      ids.forEach(function(id){
        buttons.get(id).style.visibility = 'hidden';
      });
    }
  };
}


function initButton(button, direction){
  button.addEventListener('mousedown', function(){
    createEvent({'direction': direction, 'animate': true});
  }, false);

  button.addEventListener('touchstart', function(){
    createEvent({'direction': direction, 'animate': true});
  }, false);

  button.addEventListener('mouseup', function(){
    createEvent({'direction': direction, 'animate': false});
  }, false);

  button.addEventListener('touchend', function(){
    createEvent({'direction': direction, 'animate': false});
  }, false);
}


function createEvent(e){
  let direction = e.direction;

  if(e.animate === false){
    if(direction === 'left' || direction === 'right'){
      rotation = 0;
    }else if(direction === 'forward' || direction === 'backward'){
      translation = 0;
    }
  }else{
    rotation = direction === 'left' ? 1 : direction === 'right' ? -1 : rotation;
    translation = direction === 'forward' ? 1 : direction === 'backward' ? -1 : translation;
  }


  if((rotation !== 0 || translation !== 0) && dispatch === undefined){
    dispatch = setInterval(() => {
      if(dispatch !== undefined){
        dispatchEvent(getEvent());
      }
    }, 10);
  }else if((rotation === 0 && translation === 0) && dispatch !== undefined){
    clearInterval(dispatch);
    dispatch = undefined;
  }
}

function getEvent(){
  return {
    rotation: rotation,
    translation: translation
  };
}


function dispatchEvent(event){
  // for(let listener of listeners.values()){
  //   listener(event);
  // }
  Object.keys(listeners).forEach(function(id){
    listeners[id](event);
  });
}


loadJSON(function (response) {
    // Parse JSON string into object
    file = JSON.parse(response);
    init();
    animate();
});


function loadJSON(callback) {

    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', 'vrgraph.json', true);
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xobj.responseText);
        }
    };
    xobj.send(null);
}

function init() {


    container = document.createElement('div');
    document.body.appendChild(container);
    var info = document.createElement('div');
    info.style.position = 'absolute';
    info.style.top = '10px';
    info.style.width = '100%';
    info.style.textAlign = 'center';
    info.innerHTML = 'PROJET SUR LES CASQUES DE RÉALITÉ VIRTUELLE: AFFICHAGE DE GRANDS GRAPHES';
    container.appendChild(info);
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);


    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10000);

    scene.add(new THREE.HemisphereLight(0x808080, 0x606060));

    //mise en place de la lumière
    var light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0, 6, 0);
    light.castShadow = true;
    light.shadow.camera.top = 2;
    light.shadow.camera.bottom = -2;
    light.shadow.camera.right = 2;
    light.shadow.camera.left = -2;
    light.shadow.mapSize.set(4096, 4096);
    scene.add(light);

    pivot = new THREE.Mesh(new THREE.BoxGeometry(10, 10, 100), new THREE.MeshNormalMaterial());
    pivot.position.set(0, 0, 50);
    scene.add(pivot);

    world = world = new THREE.Mesh(new THREE.PlaneGeometry(200, 200, 20, 20), new THREE.MeshBasicMaterial({ wireframe: true, color: 0 }));
    world.position.z = 50;
    pivot.add(world)

    group = new THREE.Group();
    group.type = 'yes';
    scene.add(group);

    group_no_move = new THREE.Group();
    group_no_move.type = 'no';
    scene.add(group_no_move);


    var points = [];

    var geoms = [];
    for (var i = 0; i < NBTIMESTAMPS; i++){
        geoms.push(new THREE.BufferGeometry());
    }

    for (var i = 0; i < NBTIMESTAMPS; i++){
        vertices.push([]);
    }

    //Mise en place des noeuds dans les differrents timestamp
    for (var i = 0; i < file.nodes.length; i++) {
        var position = new THREE.Vector3(file.nodes[i].pos[0], file.nodes[i].pos[1], file.nodes[i].pos[2]);

        for (var j = 0; j < file.nodes[i].timestamp.length; j++) {
            vertices[file.nodes[i].timestamp[j]].push(file.nodes[i].pos[0], file.nodes[i].pos[1],file.nodes[i].pos[2]);
        }

        points.push(position);
    }
    var sprite = new THREE.TextureLoader().load('textures/circle3.png');


    for (var i = 0; i < NBTIMESTAMPS; i++) {

        geoms[i].addAttribute('position', new THREE.Float32BufferAttribute(vertices[i], 3));
        var material = new THREE.PointsMaterial({
            size: 1,
            // sizeAttenuation: true,
            color: Math.random() * 0xffffff,
            map: sprite,
            alphaTest: 0.5,
            transparent: false
        });
        var particles = new THREE.Points(geoms[i], material);
        particles.name="timestamp" + i;
        group.add(particles);
        if (i != 0){
            particles.visible = false;
        }
    }


    var edgesGeometry = [];
    for (var i = 0; i < NBTIMESTAMPS; i++){
        edgesGeometry.push(new THREE.Geometry());
    }


    //Mise en place des aretes dans les differents timestamp
    for (var i = 0; i < file.edges.length; i++) {

        var two_node = [];
        two_node.push(points[file.edges[i].src]);
        two_node.push(points[file.edges[i].tgt]);


        for (var j = 0; j < file.edges[i].timestamp.length; j++) {

            edgesGeometry[file.edges[i].timestamp[j]].vertices.push(two_node[0]);
            edgesGeometry[file.edges[i].timestamp[j]].vertices.push(two_node[1]);

        }
    }



    for (var i = 0; i < NBTIMESTAMPS; i++){
        var edgeMaterial = new THREE.LineBasicMaterial( {
            color: Math.random() * 0xffffff,
            linewidth: 1
        } );
        edges[i] = new THREE.LineSegments(edgesGeometry[i],edgeMaterial);
        edges[i].name = "timestamp" + i;
        group.add(edges[i]);
        if (i != 0){
            edges[i].visible = false;
        }
    }



//IL FAUDRAIT ESSAYER AVEC CE CODE LA POUR AFFICHER LES SOMMETS NORMALEMENT ON AURA PLUS DE BUGS
//_______________________________________________________________________________________________
//    var geometry = new THREE.BufferGeometry();
//    var vertices = [];
//    var sprite = new THREE.TextureLoader().load('textures/sprites/disc.png');
//    for (var i = 0; i < 10000; i++) {
//        var x = 2000 * Math.random() - 1000;
//        var y = 2000 * Math.random() - 1000;
//        var z = 2000 * Math.random() - 1000;
//        vertices.push(x, y, z);
//    }
//    geometry.addAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
//    material = new THREE.PointsMaterial({
//        size: 35,
//        sizeAttenuation: false,
//        map: sprite,
//        alphaTest: 0.5,
//        transparent: true
//    });
//    material.color.setHSL(1.0, 0.3, 0.7);
//    var particles = new THREE.Points(geometry, material);
//    scene.add(particles);
//
//_______________________________________________________________________________________________


    geometry = new THREE.IcosahedronBufferGeometry(1, 3);

    material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
    });
    sphere1 = new THREE.Mesh(geometry, material);
    sphere2 = new THREE.Mesh(geometry, material);
    sphere3 = new THREE.Mesh(geometry, material);
    sphere4 = new THREE.Mesh(geometry, material);

    sphere1.position.x = -15;
    sphere1.position.y = -20;
    sphere1.position.z = -30;
    sphere1.name = 'numero0';
    group_no_move.add(sphere1);
    // group.add(sphere1);
    // scene.add(sphere1);

    sphere2.position.x = -5;
    sphere2.position.y = -20;
    sphere2.position.z = -30;
    sphere2.name = 'numero1';
    group_no_move.add(sphere2);
    // group.add(sphere2);
    // scene.add(sphere2);

    sphere3.position.x = 5;
    sphere3.position.y = -20;
    sphere3.position.z = -30;
    sphere3.name = 'numero2';
    group_no_move.add(sphere3);
    // group.add(sphere3);
    // scene.add(sphere3);

    sphere4.position.x = 15;
    sphere4.position.y = -20;
    sphere4.position.z = -30;
    sphere4.name = 'numero3';
    group_no_move.add(sphere4);
    // group.add(sphere4);
    // scene.add(sphere4);



    //Mise en place des flèches
    /*geometry = new THREE.CylinderBufferGeometry(1, 1, 0.1, 50);
    var texture = new THREE.TextureLoader().load('img/flecheBas.png');

    // immediately use the texture for material creation
    material = new THREE.MeshBasicMaterial({
        map: texture
    });

    fleche_bas = new THREE.Mesh(geometry, material);
    fleche_bas.position.x = 20;
    fleche_bas.position.y = -14.5;
    fleche_bas.position.z = -20;
    fleche_bas.name = 'flecheB';
    fleche_bas.rotation.x = 0.5 * Math.PI;
    fleche_bas.rotation.y = 0.5 * Math.PI;
    group_no_move.add(fleche_bas);


    var texture = new THREE.TextureLoader().load('img/flecheHaut.png');

    // immediately use the texture for material creation
    material = new THREE.MeshBasicMaterial({
        map: texture
    });

    fleche_haut = new THREE.Mesh(geometry, material);
    fleche_haut.position.x = 20;
    fleche_haut.position.y = -10.5;
    fleche_haut.position.z = -20;
    fleche_haut.name = 'flecheH';
    fleche_haut.rotation.x = 0.5 * Math.PI;
    fleche_haut.rotation.y = 0.5 * Math.PI;
    group_no_move.add(fleche_haut);


    var texture = new THREE.TextureLoader().load('img/flecheDroite.png');

    // immediately use the texture for material creation
    material = new THREE.MeshBasicMaterial({
        map: texture
    });

    fleche_droite = new THREE.Mesh(geometry, material);
    fleche_droite.position.x = 22;
    fleche_droite.position.y = -12.5;
    fleche_droite.position.z = -20;
    fleche_droite.name = 'flecheD';
    fleche_droite.rotation.x = 0.5 * Math.PI;
    fleche_droite.rotation.y = 0.5 * Math.PI;
    group_no_move.add(fleche_droite);


    var texture = new THREE.TextureLoader().load('img/flecheGauche.png');

    // immediately use the texture for material creation
    material = new THREE.MeshBasicMaterial({
        map: texture
    });

    fleche_gauche = new THREE.Mesh(geometry, material);
    fleche_gauche.position.x = 18;
    fleche_gauche.position.y = -12.5;
    fleche_gauche.position.z = -20;
    fleche_gauche.name = 'flecheG';
    fleche_gauche.rotation.x = 0.5 * Math.PI;
    fleche_gauche.rotation.y = 0.5 * Math.PI;
    group_no_move.add(fleche_gauche);

    var texture = new THREE.TextureLoader().load('img/cancel.png');

    // immediately use the texture for material creation
    material = new THREE.MeshBasicMaterial({
        map: texture
    });

    cancel = new THREE.Mesh(geometry, material);
    cancel.position.x = 25;
    cancel.position.y = -10;
    cancel.position.z = -20;
    cancel.name = 'cancel';
    cancel.rotation.x = 0.5 * Math.PI;
    cancel.rotation.y = 0.5 * Math.PI;
    group_no_move.add(cancel);*/

    keyControls = createControls();
    keyControls.onChange(onKeyControllerChange);
    keyControls.showButtons();
    controls = new THREE.OrbitControls(camera);
    controls.keys = {};
    controls.addEventListener("change", function () {
      render();
    });


    renderer = new THREE.WebGLRenderer({
        antialias: true
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.shadowMap.enabled = true;
    renderer.vr.enabled = true;
    container.appendChild(renderer.domElement);
    document.body.appendChild(WEBVR.createButton(renderer));



    // controllers gamepad
    controller1 = renderer.vr.getController(0);
    controller1.addEventListener('selectstart', onSelectStart);
    controller1.addEventListener('selectend', onSelectEnd);
    scene.add(controller1);



    controller2 = renderer.vr.getController(1);
    controller2.addEventListener('selectstart', onSelectStart);
    controller2.addEventListener('selectend', onSelectEnd);
    scene.add(controller2);

    var geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
    var line = new THREE.Line(geometry);
    line.name = 'line';
    line.scale.z = 2000;
    controller1.add(line.clone());
    controller2.add(line.clone());

    window.addEventListener('vr controller connected', function (event) {
        //  The VRController instance is a THREE.Object3D, so we can just add it to the scene:
        var controller = event.detail;
        scene.add(controller);
        //  For standing experiences (not seated) we need to set the standingMatrix
        //  otherwise you’ll wonder why your controller appears on the floor
        //  instead of in your hands! And for seated experiences this will have no
        //  effect, so safe to do either way:
        controller.standingMatrix = renderer.vr.getStandingMatrix();
        //  And for 3DOF (seated) controllers you need to set the controller.head
        //  to reference your camera. That way we can make an educated guess where
        //  your hand ought to appear based on the camera’s rotation.
        controller.head = window.camera;
        //  Right now your controller has no visual.
        //  It’s just an empty THREE.Object3D.
        var
            meshColorOff = 0xDB3236, //  Red.
            meshColorOn = 0xF4C20D, //  Yellow.
            controllerMaterial = new THREE.MeshStandardMaterial({
                color: meshColorOff
            }),
            controllerMesh = new THREE.Mesh(
                new THREE.CylinderGeometry(0.005, 0.05, 0.1, 6),
                controllerMaterial
            ),
            handleMesh = new THREE.Mesh(
                new THREE.BoxGeometry(0.03, 0.1, 0.03),
                controllerMaterial
            );
        controllerMaterial.flatShading = true;
        controllerMesh.rotation.x = -Math.PI / 2;
        handleMesh.position.y = -0.05;
        controllerMesh.add(handleMesh);
        controller.userData.mesh = controllerMesh; //  So we can change the color later.
        controller.add(controllerMesh);
        controller.addEventListener('primary press began', onSelectStart);
        controller.addEventListener('primary press ended', onSelectEnd);
        controller.addEventListener('thumbstick axes moved', onThumbstickMove);
        // controller.addEventListener('thumbpad pressed', onThumbpadPress);
        controller.addEventListener('disconnected', function (event) {
            controller.parent.remove(controller);
        });
    })
    //resize();

}

function onKeyControllerChange(data) {
  if (data.rotation !== 0) {
    // invert rotation because we are rotating the world, not the camera
    pivot.rotation.z -= data.rotation * turnSpeed;
  }
  if (data.translation !== 0) {
    // invert translation on the x-axis because the world moves backwards towards the camera if the user moves forward
    world.position.x -= data.translation * moveSpeed * Math.cos(pivot.rotation.z);
    world.position.y += data.translation * moveSpeed * Math.sin(pivot.rotation.z);
  }
  render();
}


function onSelectStart(event) {
    var controller = event.target;
    var intersections = getIntersections(controller);

    if (intersections.length > 0) {
        var intersection = intersections[0];

        tempMatrix.getInverse(controller.matrixWorld);
        var object = intersection.object;



        if (object.type === "Mesh") {

            //Si ce n'est le curseur
            if (object.name.charAt(0) == 'n') {
                is_selected = 0;
                object.material.emissive.b = 1;
                erase_other(object);
                controller.userData.selected = object;

                //Si c'est les fleches de mouvements
            } else if ((object.name.charAt(0) == 'f')) {
                //fleche du haut
                if (object.name == "flecheH") {
                    // moveInSpace(0, -100);
                    continuousYMove = -CAMSTEP;

                    //fleche du bas
                } else if (object.name == "flecheB") {
                    // moveInSpace(0, 100);
                    continuousYMove = CAMSTEP;

                    //fleche de droite
                } else if (object.name == "flecheD") {
                    // moveInSpace(100, 0);
                    continuousXMove = CAMSTEP;

                    //fleche de gauche
                } else {
                    // moveInSpace(-100, 0);
                    continuousXMove = -CAMSTEP;
                }

                //Si c'est la croix
            } else if (object.name = "cancel") {
                //JE NE SAIS PLUS CE QUE DOIT FAIRE LA CROIX.....

                //Si c'est les sommets
            } else {

                object.matrix.premultiply(tempMatrix);
                object.matrix.decompose(object.position, object.quaternion, object.scale);
                object.position.x = 0;
                object.position.y = 0;

                if (object.geometry.parameters.radius !== undefined)
                    object.position.z = -intersection.distance - object.geometry.parameters.radius;

                if (object.geometry.parameters.depth !== undefined)
                    object.position.z = -intersection.distance - object.geometry.parameters.depth / 2;

                controller.add(object);
                controller.userData.selected = object;
                selected = 1;
            }
        }
    }
}

function onSelectEnd(event) {
    var controller = event.target;
    continuousXMove = 0;
    continuousYMove = 0;

    if (controller.userData.selected !== undefined) {
        var object = controller.userData.selected;

        if (object.name.charAt(0) != 'n') {
            var newPos = new THREE.Vector3();
            object.getWorldPosition(newPos);
            object.matrix.premultiply(controller.matrixWorld);
            object.matrix.decompose(object.position, object.quaternion, object.scale);

            group.add(object);

            object.position = newPos;
            object.position.x -= group.position.x;
            object.position.y -= group.position.y;
            object.position.z -= group.position.z;

            controller.userData.selected = undefined;
            selected = 0;
        } else {
            object.material.emissive.b = 0;
            controller.userData.selected = undefined;
        }

    }
}

//https://stackoverflow.com/questions/42812861/three-js-pivot-point/42866733#42866733
function rotateAboutPoint(obj, point, axis, theta, pointIsWorld){
	pointIsWorld = (pointIsWorld === undefined)? false : pointIsWorld;

	if(pointIsWorld){
		obj.parent.localToWorld(obj.position); // compensate for world coordinate
	}

	obj.position.sub(point); // remove the offset
	obj.position.applyAxisAngle(axis, theta); // rotate the POSITION
	obj.position.add(point); // re-add the offset

	if(pointIsWorld){
		obj.parent.worldToLocal(obj.position); // undo world coordinates compensation
	}

	obj.rotateOnAxis(axis, theta); // rotate the OBJECT
}

// Permet de se deplacer dans l'espace suivant la direction du regard
function moveInSpace(xAxisValue, yAxisValue, useRotate = false) {
    var xstep = CAMSTEP * xAxisValue;
    var ystep = CAMSTEP * yAxisValue;

    var direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    var ymove = direction.clone().multiplyScalar(ystep);
    group.position.add(ymove);

    if (useRotate) {
        // Le joystick sur le côté permet de tourner la caméra
        if (xAxisValue > 0.6) {
            var theta = xAxisValue * THREE.Math.degToRad(ROTSTEP);
            rotateAboutPoint(group, camera.position, camera.position.clone().normalize(), theta, false);
        }
    } else {
        // Le joystick sur le côté permet de se déplacer latéralement (straf)
        var axisOfRotation = camera.position.clone().normalize(); // Axe de la rotation a verifier
        var quad = new THREE.Quaternion().setFromAxisAngle(axisOfRotation, Math.PI / 2);
        direction.applyQuaternion(quad);
        var xmove = direction.multiplyScalar(xstep);
        group.position.add(xmove);
    }

}

function onThumbstickMove(event) {
    var x = parseFloat(event.axes[0].toFixed(2));
    var y = parseFloat(event.axes[1].toFixed(2));
    moveInSpace(x, y);
}

function getIntersections(controller) {


    tempMatrix.identity().extractRotation(controller.matrixWorld);

    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    var toIntersect = group_no_move.children.slice();
    //toIntersect = toIntersect.concat(group.children);
    return raycaster.intersectObjects(toIntersect);
}

function intersectObjects(controller) {


    // Do not highlight when already selected
    if (controller.userData.selected !== undefined) return;

    var line = controller.getObjectByName('line');
    var intersections = getIntersections(controller);

    if (intersections.length > 0) {
        var intersection = intersections[0];
        var object = intersection.object;

        if (object.name.charAt(0) == 'n') {
            object.material.emissive.b = 1;
        }

        intersected.push(object);
        line.scale.z = intersection.distance;

    } else {
        //    line.scale.z = 1000;
    }
}


//Affiche LE bon timestamps en fonction de la sphere selectionnee
function erase_other(object) {
    var timestamp = parseInt(object.name.slice(-1));
    for (var i = 0; i < group.children.length; i++) {
        if ((group.children[i].name.includes("timestamp"))){
            if (group.children[i].name.slice(-1)  == timestamp){
                group.children[i].visible = true;
            } else {
                group.children[i].visible = false;
            }
        }
    }
}

function cleanIntersected() {
    while (intersected.length) {
        var object = intersected.pop();

        if (object.name.charAt(0) == 'n') {
            object.material.emissive.b = 0;
        }

    }
}

function moveCursor(flag) {
    var direction = new THREE.Vector3();
    doAnimate = flag
    camera.getWorldDirection(direction);
    group_no_move.position.copy(direction).multiplyScalar(20);
    group_no_move.lookAt(camera.position);
}

function animate() {
    renderer.setAnimationLoop(render);
    setInterval(function(){
    if(doAnimate === true){
      update();
    }
}, 65);
}

function update(){
  //let rotation = direction === 'left' ? 1 : direction === 'right' ? -1 : 0;
  let translation = direction === 'forward' ? 1 : direction === 'backward' ? -1 : 0;

  //camera.rotation.z += rotation * turnSpeed;
  camera.position.x += translation * moveSpeed * Math.cos(camera.rotation.y + Math.PI/2);
  camera.position.z -= translation * moveSpeed * Math.sin(camera.rotation.y + Math.PI/2);

  dispatchEvent({'update': camera});
}

function resize() {
  var width = divContainer.offsetWidth;
  var height = divContainer.offsetHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  render();
}


function render() {
    cleanIntersected();
    intersectObjects(controller1);
    intersectObjects(controller2);
    moveCursor();
    if ((continuousXMove != 0) || (continuousYMove != 0)){
        moveInSpace(continuousXMove, continuousYMove);
    }
    THREE.VRController.update();
    renderer.render(scene, camera);
}

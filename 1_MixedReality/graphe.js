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
var NBTIMESTAMPS = 0;
var currentTimestamp = 0;
var vertices = [];
var edges = [];

var oldRotation = new THREE.Vector3();

const CAMSTEP = 1;
const ROTSTEP = 0.4;
const CURSORWIDTH = 20;
const CURSORHEIGHT = 1;
const CURSORFAKEHEIGHT = CURSORHEIGHT*10;

var cursorSelected = false;
var cursorThresholds = [];

var bestPositions = [new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,-1500), new THREE.Vector3(600,0,-1500), new THREE.Vector3(600,400,-1500)];

var transitionOn = false;

var currentPosition = new THREE.Vector3();

var selected;
var is_selected;

var plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0); // it's up to you how you will create THREE.Plane(), there are several methods
var raycaster = new THREE.Raycaster(); //for reuse
var mouse = new THREE.Vector2(); //for reuse
var intersectPoint = new THREE.Vector3(); //for reuse

var file;

//double buffering pour l'affichage des elements 
// 1 ecran qui dessine et un ecran qui affiche a l'utilisateur

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
    light.castShadow = false;
    light.shadow.camera.top = 2;
    light.shadow.camera.bottom = -2;
    light.shadow.camera.right = 2;
    light.shadow.camera.left = -2;
    light.shadow.mapSize.set(4096, 4096);
    scene.add(light);


    group = new THREE.Group();
    group.type = 'yes';
    scene.add(group);
    currentPosition.copy(group.position);

    group_no_move = new THREE.Group();
    group_no_move.type = 'no';
    scene.add(group_no_move);

    var points = [];

    var geoms = [];

    //Mise en place des noeuds dans les differrents timestamp
    for (var i = 0; i < file.nodes.length; i++) {
        var position = new THREE.Vector3(file.nodes[i].pos[0], file.nodes[i].pos[1], file.nodes[i].pos[2]);

        for (var j = 0; j < file.nodes[i].timestamp.length; j++) {
            var timestamp = file.nodes[i].timestamp[j];
            if (timestamp + 1 > NBTIMESTAMPS){
                for (var k = NBTIMESTAMPS; k < timestamp + 1; k++){
                    geoms.push(new THREE.BufferGeometry());
                    vertices.push([]);
                }
                NBTIMESTAMPS = timestamp + 1;
            }
            vertices[timestamp].push(file.nodes[i].pos[0], file.nodes[i].pos[1],file.nodes[i].pos[2]);
        }

        points.push(position);
    }
    var sprite = new THREE.TextureLoader().load('textures/circle.png');
    

    for (var i = 0; i < NBTIMESTAMPS; i++) {

        geoms[i].addAttribute('position', new THREE.Float32BufferAttribute(vertices[i], 3));
        var material = new THREE.PointsMaterial({
            size: 1,
            // sizeAttenuation: true,
            color: Math.random() * 0xffffff,
            map: sprite,
            alphaTest: 0.5,
            transparent: true,
            opacity: 0
        });
        if (i == 0){
            // particles.visible = false;
            material.opacity = 1;
        }
        var particles = new THREE.Points(geoms[i], material);
        particles.name="timestamp" + i;
        group.add(particles);
    }

    //Mise en place des aretes dans les differents timestamp
    

    var edgesGeometry = [];
    for (var i = 0; i < NBTIMESTAMPS; i++){
        edgesGeometry.push(new THREE.Geometry());
    }
    
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
            linewidth: 1,
            transparent: true,
            opacity: 0
        } );
        if ( i == 0){
            edgeMaterial.opacity = 1;
        }
        edges[i] = new THREE.LineSegments(edgesGeometry[i],edgeMaterial);
        edges[i].name = "timestamp" + i;
        group.add(edges[i]);
    }

    currentTimestamp = 0;

    geometry = new THREE.BoxBufferGeometry( CURSORWIDTH, CURSORFAKEHEIGHT, 0.1);
    var material1 = new THREE.MeshStandardMaterial({
        transparent: true,
        visible: false
    });

    var cursorBackground = new THREE.Mesh( geometry, material1 );
    cursorBackground.position.x = 0;
    cursorBackground.position.y = -15;
    cursorBackground.position.z = -25;
    cursorBackground.lookAt(camera.position);
    cursorBackground.name = "cursorBackground";
    group_no_move.add(cursorBackground);

    geometry = new THREE.BoxBufferGeometry( CURSORWIDTH, CURSORHEIGHT, 0.1);
    material = new THREE.MeshStandardMaterial({
        color: 0x696969,
        roughness: 0.7,
        metalness : 0.7,
        transparent: true,
        opacity:0.8
    });

    var cursorAppearantBackground = new THREE.Mesh( geometry, material );
    cursorBackground.add(cursorAppearantBackground);
    cursorAppearantBackground.position.z += 0.01;


    for (var i = 0; i < NBTIMESTAMPS; i++) {
        var geometry = new THREE.PlaneBufferGeometry(0.1, CURSORHEIGHT);
        var material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.7,
            metalness : 0.7
        });
        var graduation = new THREE.Mesh(geometry, material);
        cursorBackground.add(graduation);
        graduation.position.z += 0.1;
        graduation.position.x = i/(NBTIMESTAMPS-1)*(CURSORWIDTH - CURSORHEIGHT) - CURSORWIDTH/2 + CURSORHEIGHT/2;
        cursorThresholds.push(graduation.position.x);
    }

    

    geometry = new THREE.IcosahedronBufferGeometry( CURSORHEIGHT, 3);
    material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.7,
        metalness : 0.7
    });
    var cursor = new THREE.Mesh( geometry, material );
    
    cursorBackground.add( cursor );
    cursor.position.z += 0.05;
    cursor.position.x = 0;
    cursor.name = "cursor";
    moveCursorAtTimestamp(cursor, 0);



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
    var material = new THREE.MeshBasicMaterial({color: 0xff1a1a});
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
            controllerMaterial = new THREE.MeshLambertMaterial({
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
        controller.addEventListener('thumbpad press began', onThumbpadPressStart);
        controller.addEventListener('thumbpad press ended', onThumbpadPressEnd);
        controller.addEventListener('disconnected', function (event) {
            controller.parent.remove(controller);
        });
    })
}

function onSelectStart(event) {
    var controller = event.target;
    var intersections = getIntersections(controller);

    if (intersections.length > 0) {
        var intersection = intersections[0];

        tempMatrix.getInverse(controller.matrixWorld);
        var object = intersection.object;

        if (object.type === "Mesh") {

            if (object.name === "cursorBackground") {
                // is_selected = 0;
                cursorSelected = true;
                transitionOn = true;
                group_no_move.getObjectByName("cursorBackground").getObjectByName("cursor").material.emissive.r = 0.5;
                // controller.userData.selected = object;
                

            }/* else {
                object.matrix.premultiply(tempMatrix);
                object.matrix.decompose(object.position, object.quaternion, object.scale);
                object.position.x = 0;
                object.position.y = 0;
                if (object.geometry.parameters.radius !== undefined)
                    object.position.z = -intersection.distance - object.geometry.parameters.radius;
                if (object.geometry.parameters.depth !== undefined)
                    object.position.z = -intersection.distance - object.geometry.parameters.depth / 2;
                object.material.emissive.b = 1;
                controller.add(object);
                controller.userData.selected = object;
                selected = 1;
            }*/
        }
    }
}

function onSelectEnd(event) {
    var controller = event.target;
    if (cursorSelected) {
        var cursor = group_no_move.getObjectByName("cursorBackground").getObjectByName("cursor");
        var timestampInfos = computeTimestampFromPos(cursor.position.x);
        var timestamp = timestampInfos.timestamp;
        moveCursorAtTimestamp(cursor, timestamp);
        cursor.material.emissive.r = 0;
        // erase_other(timestamp);
        fadingTransition(cursor.position.x);
        transitionOn = false;
        cursorSelected = false;
    }

    if (controller.userData.selected !== undefined) {
        var object = controller.userData.selected;

        if (object.name.charAt(0) != 'c') {
            var newPos = new THREE.Vector3();
            object.getWorldPosition(newPos);
            object.matrix.premultiply(controller.matrixWorld);
            object.matrix.decompose(object.position, object.quaternion, object.scale);
            // object.material.emissive.b = 0;

            group.add(object);

            object.position = newPos;
            object.position.x -= group.position.x;
            object.position.y -= group.position.y;
            object.position.z -= group.position.z;

            controller.userData.selected = undefined;
            selected = 0;
        } else {
            // object.material.emissive.b = 0;
            // erase_other(object);
            // controller.userData.selected = undefined;
        }

    }
}

function onThumbpadPressStart(event){
    transitionOn = true;
}

function onThumbpadPressEnd(event){
    transitionOn = false;
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
        return intersection;
    }
}

function computeTimestampFromUV(x){
    var timestamp = Math.floor((x *100) / (100 / NBTIMESTAMPS));
    var inf = Math.floor((x *100) / (100 / (NBTIMESTAMPS-1)));
    var sup = Math.floor((x *100) / (100 / (NBTIMESTAMPS-1))) + 1;
    var returned = {
        timestamp: timestamp,
        previous: inf,
        next: sup
    }
    return returned;
}

function computeTimestampFromPos(x){
    var xUV = (x + CURSORWIDTH/2) / CURSORWIDTH;
    var timestampInfos = computeTimestampFromUV(xUV);
    var returned = {
        timestamp: timestampInfos.timestamp,
        previous: timestampInfos.previous,
        next: timestampInfos.next
    }
    return returned;
}

function moveCursorAtTimestamp(cursor, timestamp){
    cursor.position.x = timestamp/(NBTIMESTAMPS-1)*(CURSORWIDTH - CURSORHEIGHT) - CURSORWIDTH/2 + CURSORHEIGHT/2;
}

function moveCursorAtUVX(cursor, x){
    cursor.position.x = x*(CURSORWIDTH - CURSORHEIGHT) - CURSORWIDTH/2 + CURSORHEIGHT/2;
    if (cursor.position.x < -CURSORWIDTH/2) {
        cursor.position.x = -CURSORWIDTH/2;
    }
    if (cursor.position.x > CURSORWIDTH/2){
        cursor.position.x = CURSORWIDTH/2;
    }
}

function fadingTransition(x){
    var infos = computeTimestampFromPos(x);
    var transitionPercentage = (x - cursorThresholds[infos.previous])/(cursorThresholds[infos.next] - cursorThresholds[infos.previous]);
    for (var i = 0; i < group.children.length; i++) {
        if ((group.children[i].name.includes("timestamp"))){
            if (group.children[i].name.slice(-1)  == infos.previous){
                group.children[i].material.opacity = 1-transitionPercentage;
                if ((group.children[i].material.opacity <= 0.1) || ((infos.timestamp == NBTIMESTAMPS-1) && (transitionPercentage >= 0.9))){
                    group.children[i].material.opacity = 0;
                    group.children[i].material.visible = false;
                } else if (group.children[i].material.opacity >= 0.1){
                    group.children[i].material.visible = true;
                }
                group.children[i].material.needsUpdate = true;
            } else if (group.children[i].name.slice(-1)  == infos.next) {
                group.children[i].material.opacity = transitionPercentage;
                if (group.children[i].material.opacity <= 0.1){
                    group.children[i].material.opacity = 0;
                    group.children[i].material.visible = false;
                } else if (group.children[i].material.opacity >= 0.1){
                    group.children[i].material.visible = true;
                }
                group.children[i].material.needsUpdate = true;
            } else {
                group.children[i].material.visible = false;
                group.children[i].material.opacity = 0;
                group.children[i].material.needsUpdate = true;
            }
        }
    }
}


//Affiche LE bon timestamp en fonction de la sphere selectionnee
function erase_other(timestamp) {
    for (var i = 0; i < group.children.length; i++) {
        if ((group.children[i].name.includes("timestamp"))){
            if (group.children[i].name.slice(-1)  == timestamp){
                group.children[i].visible = true;
            } else {
                group.children[i].visible = false;
            }
        }
    }
    currentTimestamp = timestamp;
}

function cleanIntersected() {
    while (intersected.length) {
        var object = intersected.pop();

        if (object.name.charAt(0) == 'n') {
            object.material.emissive.b = 0;
        }

    }
}

function moveCursorGroup() {
    var direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    group_no_move.position.copy(direction).multiplyScalar(10);
    group_no_move.lookAt(camera.position);
    /*var rotation = new THREE.Vector3();
    rotation.copy(camera.rotation);
    rotation.sub(oldRotation);
    rotateAboutPoint(group_no_move, camera.position, new THREE.Vector3(1,0,0).normalize(), rotation.x, false);
    rotateAboutPoint(group_no_move, camera.position, new THREE.Vector3(0,1,0).normalize(), rotation.y, false);
    rotateAboutPoint(group_no_move, camera.position, new THREE.Vector3(0,0,1).normalize(), rotation.z, false);
    group_no_move.lookAt(camera.position);
    oldRotation.copy(camera.rotation);*/
}

function quatFrom2Vectors(a, b) {
    var u = a.clone();
    var v = b.clone();
    var cos_theta = u.normalize().dot(v.normalize());
    var half_cos = Math.sqrt(0.5 * (1.0 + cos_theta));
    var half_sin = Math.sqrt(0.5 * (1.0 - cos_theta));
    var w = new THREE.Vector3();
    w.crossVectors(a, b).normalize();
    return new THREE.Quaternion(half_sin * w.x,
        half_sin * w.y,
        half_sin * w.z,
        half_cos);
}

function transitionMovement(x){
    var infos = computeTimestampFromPos(x);
    var transitionPercentage = (x - cursorThresholds[infos.previous]) / (cursorThresholds[infos.next] - cursorThresholds[infos.previous]);
    var pos = bestPositions[infos.previous].clone().multiplyScalar(-1);
    var targetPos = bestPositions[infos.next].clone().multiplyScalar(-1);
    pos.lerp(targetPos, transitionPercentage);

    group.position.copy(pos);

    // Tentative de rotation du graphe pendant le deplacement pour continuer a observer le meme point
    // var quat = group.quaternion.clone();
    // var targetQuat = quatFrom2Vectors(group.position.clone().multiplyScalar(-1), targetPos.clone().multiplyScalar(-1));
    // quat.slerp(targetQuat, 0.01);
    // group.quaternion.copy(quat);
}

function animate() {
    // oldRotation.copy(camera.rotation)
    renderer.setAnimationLoop(render);
}

function render() {
    cleanIntersected();
    var intersection1 = intersectObjects(controller1);
    var intersection2 = intersectObjects(controller2);
    if (cursorSelected) {
        var cursor = group_no_move.getObjectByName("cursorBackground").getObjectByName("cursor");
        if ((intersection1 !== undefined) && (intersection1.object == group_no_move.getObjectByName("cursorBackground"))) {
            moveCursorAtUVX(cursor,intersection1.uv.x);
            fadingTransition(cursor.position.x);
        } else if ((intersection2 !== undefined) && (intersection2.object == group_no_move.getObjectByName("cursorBackground"))) {
            moveCursorAtUVX(cursor,intersection2.uv.x);
            fadingTransition(cursor.position.x);
        }
    }
    moveCursorGroup();
    if (transitionOn){
        var cursor = group_no_move.getObjectByName("cursorBackground").getObjectByName("cursor");
        transitionMovement(cursor.position.x);
    }
    // currentPosition.copy(group.position).multiplyScalar(-1);
    THREE.VRController.update();
    renderer.render(scene, camera);
}

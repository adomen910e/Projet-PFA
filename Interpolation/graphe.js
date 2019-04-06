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
var clock = new THREE.Clock();
var keyboard = new THREEx.KeyboardState();
//Variables pour le déplacement avec la croix
var continuousXMove = 0;
var continuousYMove = 0;
var pivot;
var save;
var avg_x, avg_y, avg_z;

var saved_group_positions = [];

var oldRotation = new THREE.Vector3();
var object;
var fleche_basr, fleche_hautr, fleche_droiter, fleche_gaucher;

const CAMSTEP = 1;
const ROTSTEP = 0.4;
const CURSORWIDTH = 20;
const CURSORHEIGHT = 1;
const CURSORFAKEHEIGHT = CURSORHEIGHT * 10;

var cursorSelected = false;

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
    info.innerHTML = '<a href="http://threejs.org" target="_blank" rel="noopener">three.js</a> webvr - dragging';
    container.appendChild(info);
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);


    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10000);
    //console.log(camera.position);
    //group.add(camera);
    
    

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
    
    group_no_move = new THREE.Group();
    group.position.set(-50, -50, -50);
    group_no_move.type = 'no';
    //group_no_move.add(camera);
    scene.add(group_no_move);

    
    //scene.add(object);
    
    
    var points = [];

    var geoms = [];

    
    //Variable pour calcul de centre
    var x_cordinates = [];
    var y_cordinates = [];
    var z_cordinates = [];
    
    var sum_x, sum_y, sum_z;
    
    //Mise en place des noeuds dans les differrents timestamp
    for (var i = 0; i < file.nodes.length; i++) {
        var position = new THREE.Vector3(file.nodes[i].pos[0], file.nodes[i].pos[1], file.nodes[i].pos[2]);
        x_cordinates.push(file.nodes[i].pos[0]);
        y_cordinates.push(file.nodes[i].pos[1]);
        z_cordinates.push(file.nodes[i].pos[2]);
        for (var j = 0; j < file.nodes[i].timestamp.length; j++) {
            var timestamp = file.nodes[i].timestamp[j];
            if (timestamp + 1 > NBTIMESTAMPS) {
                for (var k = NBTIMESTAMPS; k < timestamp + 1; k++) {
                    geoms.push(new THREE.BufferGeometry());
                    vertices.push([]);
                }
                NBTIMESTAMPS = timestamp + 1;
            }
            vertices[timestamp].push(file.nodes[i].pos[0], file.nodes[i].pos[1], file.nodes[i].pos[2]);
        }

        points.push(position);
    }
    sum_x = x_cordinates.reduce(function(a, b) { return a + b; });
    sum_y = y_cordinates.reduce(function(a, b) { return a + b; });
    sum_z = z_cordinates.reduce(function(a, b) { return a + b; });
    avg_x = sum_x/x_cordinates.length;
    avg_y = sum_y/y_cordinates.length;
    avg_z = sum_z/z_cordinates.length
    
    //console.log(avg_x + ',' + avg_y + ',' + avg_z);

    
    
    
    var sprite = new THREE.TextureLoader().load('img/circle.png');

    
    for (var i = 0; i < NBTIMESTAMPS; i++) {
        
        geoms[i].addAttribute('position', new THREE.Float32BufferAttribute(vertices[i], 3));
        var material = new THREE.PointsMaterial({
            size: 1,
            color: Math.random() * 0xffffff,
            map: sprite,
            alphaTest: 0.5,
            transparent: false
        });
        var particles = new THREE.Points(geoms[i], material);
        particles.name = "timestamp" + i;
        group.add(particles);
        if (i != 0) {
            particles.visible = false;
        }
    }

    //Mise en place des aretes dans les differents timestamp

    var edgesGeometry = [];
    for (var i = 0; i < NBTIMESTAMPS; i++) {
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



    for (var i = 0; i < NBTIMESTAMPS; i++) {
        var edgeMaterial = new THREE.LineBasicMaterial({
            color: Math.random() * 0xffffff,
            linewidth: 1
        });
        edges[i] = new THREE.LineSegments(edgesGeometry[i], edgeMaterial);
        edges[i].name = "timestamp" + i;
        group.add(edges[i]);
        if (i != 0) {
            edges[i].visible = false;
        }
    }
    
    
    currentTimestamp = 0;
    //pivot.add(group);

    geometry = new THREE.CylinderBufferGeometry(1, 1, 0.1, 50);
    var texture = new THREE.TextureLoader().load('img/save1.jpg');

    // immediately use the texture for material creation
    material = new THREE.MeshBasicMaterial({
        map: texture
    });

    save = new THREE.Mesh(geometry, material);
    save.position.x = 7.5;
    save.position.y = -5;
    save.position.z = -20;
    save.name = 'save';
    save.rotation.x = 0.5 * Math.PI;
    save.rotation.y = 0.5 * Math.PI;
    group_no_move.add(save);
    intersected.push(save);

    





    //Mise en place des flèches
    geometry = new THREE.CylinderBufferGeometry(1, 1, 0.1, 50);
    var texture = new THREE.TextureLoader().load('img/flecheBas.png');

    // immediately use the texture for material creation
    material = new THREE.MeshBasicMaterial({
        map: texture
    });

    fleche_bas = new THREE.Mesh(geometry, material);
    fleche_bas.position.x = 10;
    fleche_bas.position.y = -10.5;
    fleche_bas.position.z = -20;
    fleche_bas.name = 'flecheB';
    fleche_bas.rotation.x = 0.5 * Math.PI;
    fleche_bas.rotation.y = 0.5 * Math.PI;
    group_no_move.add(fleche_bas);
    intersected.push(fleche_bas);


    var texture = new THREE.TextureLoader().load('img/flecheHaut.png');

    // immediately use the texture for material creation
    material = new THREE.MeshBasicMaterial({
        map: texture
    });

    fleche_haut = new THREE.Mesh(geometry, material);
    fleche_haut.position.x = 10;
    fleche_haut.position.y = -4.5;
    fleche_haut.position.z = -20;
    fleche_haut.name = 'flecheH';
    fleche_haut.rotation.x = 0.5 * Math.PI;
    fleche_haut.rotation.y = 0.5 * Math.PI;
    group_no_move.add(fleche_haut);
    intersected.push(fleche_haut);


    var texture = new THREE.TextureLoader().load('img/flecheDroite.png');

    // immediately use the texture for material creation
    material = new THREE.MeshBasicMaterial({
        map: texture
    });

    fleche_droite = new THREE.Mesh(geometry, material);
    fleche_droite.position.x = 13;
    fleche_droite.position.y = -7.5;
    fleche_droite.position.z = -20;
    fleche_droite.name = 'flecheD';
    fleche_droite.rotation.x = 0.5 * Math.PI;
    fleche_droite.rotation.y = 0.5 * Math.PI;
    group_no_move.add(fleche_droite);
    intersected.push(fleche_droite);


    var texture = new THREE.TextureLoader().load('img/flecheGauche.png');

    // immediately use the texture for material creation
    material = new THREE.MeshBasicMaterial({
        map: texture
    });

    fleche_gauche = new THREE.Mesh(geometry, material);
    fleche_gauche.position.x = 7;
    fleche_gauche.position.y = -7.5;
    fleche_gauche.position.z = -20;
    fleche_gauche.name = 'flecheG';
    fleche_gauche.rotation.x = 0.5 * Math.PI;
    fleche_gauche.rotation.y = 0.5 * Math.PI;
    group_no_move.add(fleche_gauche);
    intersected.push(fleche_gauche);

    var texture = new THREE.TextureLoader().load('img/cancel.png');

    // immediately use the texture for material creation
    material = new THREE.MeshBasicMaterial({
        map: texture
    });

    cancel = new THREE.Mesh(geometry, material);
    cancel.position.x = 12.5;
    cancel.position.y = -5;
    cancel.position.z = -20;
    cancel.name = 'cancel';
    cancel.rotation.x = 0.5 * Math.PI;
    cancel.rotation.y = 0.5 * Math.PI;
    group_no_move.add(cancel);
    intersected.push(cancel);


    //Mise en place de la sphere flechee
    geometry = new THREE.SphereGeometry( 1.5, 10, 10 );
    material = new THREE.MeshBasicMaterial({
                             color: 0xF3A2B0,
                             wireframe: true
                             });
    var sphere = new THREE.Mesh( geometry, material );
    sphere.position.x = 10;
    sphere.position.y = -7.5;
    sphere.position.z = -20;
    intersected.push( sphere );
    group_no_move.add(sphere);
    
    //Mise en place des fleches de rotation
    
    geometry = new THREE.CylinderBufferGeometry(0.5, 0.5, 0.1, 50);
    var texture = new THREE.TextureLoader().load('img/flecheBas.png');
    
    // immediately use the texture for material creation
    material = new THREE.MeshBasicMaterial({
                                           map: texture
                                           });
    
    fleche_basr = new THREE.Mesh(geometry, material);
    fleche_basr.position.x = 9;
    fleche_basr.position.y = -7.34;
    fleche_basr.position.z = -18;
    fleche_basr.name = 'flecheBR';
    fleche_basr.rotation.x = 0.5 * Math.PI;
    fleche_basr.rotation.y = 0.5 * Math.PI;
    group_no_move.add(fleche_basr);
    intersected.push(fleche_basr);
    
    
    var texture = new THREE.TextureLoader().load('img/flecheHaut.png');
    
    // immediately use the texture for material creation
    material = new THREE.MeshBasicMaterial({
                                           map: texture
                                           });
    
    fleche_hautr = new THREE.Mesh(geometry, material);
    fleche_hautr.position.x = 9;
    fleche_hautr.position.y = -5.8;
    fleche_hautr.position.z = -18;
    fleche_hautr.name = 'flecheHR';
    fleche_hautr.rotation.x = 0.5 * Math.PI;
    fleche_hautr.rotation.y = 0.5 * Math.PI;
    group_no_move.add(fleche_hautr);
    intersected.push(fleche_hautr);
    
    
    var texture = new THREE.TextureLoader().load('img/flecheDroite.png');
    
    // immediately use the texture for material creation
    material = new THREE.MeshBasicMaterial({
                                           map: texture
                                           });
    
    fleche_droiter = new THREE.Mesh(geometry, material);
    fleche_droiter.position.x = 9.8;
    fleche_droiter.position.y = -6.6;
    fleche_droiter.position.z = -18;
    fleche_droiter.name = 'flecheDR';
    fleche_droiter.rotation.x = 0.5 * Math.PI;
    fleche_droiter.rotation.y = 0.5 * Math.PI;
    group_no_move.add(fleche_droiter);
    intersected.push(fleche_droiter);
    
    
    var texture = new THREE.TextureLoader().load('img/flecheGauche.png');
    
    // immediately use the texture for material creation
    material = new THREE.MeshBasicMaterial({
                                           map: texture
                                           });
    
    fleche_gaucher = new THREE.Mesh(geometry, material);
    fleche_gaucher.position.x = 8.5;
    fleche_gaucher.position.y = -7;
    fleche_gaucher.position.z = -19;
    fleche_gaucher.name = 'flecheGR';
    fleche_gaucher.rotation.x = 0.5 * Math.PI;
    fleche_gaucher.rotation.y = 0.5 * Math.PI;
    group_no_move.add(fleche_gaucher);
    intersected.push(fleche_gaucher);

    geometry = new THREE.BoxBufferGeometry(CURSORWIDTH, CURSORFAKEHEIGHT, 0.1);
    material = new THREE.MeshStandardMaterial({
        transparent: true,
        opacity: 0
    });

    var cursorBackground = new THREE.Mesh(geometry, material);
    cursorBackground.position.x = -5;
    cursorBackground.position.y = -10;
    cursorBackground.position.z = -25;
    cursorBackground.lookAt(camera.position);
    cursorBackground.name = "cursorBackground";
    group_no_move.add(cursorBackground);

    geometry = new THREE.BoxBufferGeometry(CURSORWIDTH, CURSORHEIGHT, 0.1);
    material = new THREE.MeshStandardMaterial({
        color: 0x696969,
        roughness: 0.7,
        metalness: 0.7,
        transparent: true,
        opacity: 0.8
    });

    var cursorAppearantBackground = new THREE.Mesh(geometry, material);
    cursorBackground.add(cursorAppearantBackground);
    cursorAppearantBackground.position.z += 0.01;


    for (var i = 0; i < NBTIMESTAMPS; i++) {
        var geometry = new THREE.PlaneBufferGeometry(0.1, CURSORHEIGHT);
        var material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.7,
            metalness: 0.7
        });
        var graduation = new THREE.Mesh(geometry, material);
        cursorBackground.add(graduation);
        graduation.position.z += 0.1;
        graduation.position.x = i / (NBTIMESTAMPS - 1) * (CURSORWIDTH - CURSORHEIGHT) - CURSORWIDTH / 2 + CURSORHEIGHT / 2;
    }



    geometry = new THREE.IcosahedronBufferGeometry(CURSORHEIGHT, 3);
    material = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.7,
        metalness: 0.7
    });
    var cursor = new THREE.Mesh(geometry, material);
    // cursor.position.copy(cursorBackground.position);

    cursorBackground.add(cursor);
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
    
    
    
    document.addEventListener("mousedown", mousedown);
    document.addEventListener("mouseup", mouseup);

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
    var material = new THREE.MeshBasicMaterial({
        color: 0xff1a1a
    });
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
        // controller.addEventListener('thumbpad pressed', onThumbpadPress);
        controller.addEventListener('disconnected', function (event) {
            controller.parent.remove(controller);
        });
    })
    /*scene.updateMatrixWorld(true);
    var position = new THREE.Vector3();
    position.setFromMatrixPosition( group.matrixWorld );
    console.log(position.x + ',' + position.y + ',' + position.z);
    //console.log(group.position);*/
    
    
}
function onSelectStart(event) {
    var controller = event.target;
    var intersections = getIntersections(controller);

    if (intersections.length > 0) {
        var intersection = intersections[0];

        tempMatrix.getInverse(controller.matrixWorld);
        var object = intersection.object;

        if (object.type === "Mesh") {

            //fleche du haut
            if (object.name == "flecheH") {
                moveInSpace(0, -1);
                continuousYMove = -CAMSTEP;

                //fleche du bas    
            } else if (object.name == "flecheB") {
                moveInSpace(0, 1);
                continuousYMove = CAMSTEP;

                //fleche de droite    
            } else if (object.name == "flecheD") {
                moveInSpace(1, 0);
                continuousXMove = CAMSTEP;

                //fleche de gauche
            } else if (object.name == "flecheG") {
                // var theta = xAxisValue * THREE.Math.degToRad(ROTSTEP);
                // rotateAboutPoint(group, camera.position, camera.position.clone().normalize(), theta, false);

                moveInSpace(-1, 0);
                continuousXMove = -CAMSTEP;

            } else if (object.name === "cursorBackground") {
                // is_selected = 0;
                cursorSelected = true;
                group_no_move.getObjectByName("cursorBackground").getObjectByName("cursor").material.emissive.r = 0.5;
                // controller.userData.selected = object;
             
            } else if (object.name === "cancel"){

            } else {
                object.matrix.premultiply(tempMatrix);
                object.matrix.decompose(object.position, object.quaternion, object.scale);
                object.position.x = 0;
                object.position.y = 0;
                if (object.geometry.parameters.radius !== undefined)
                    object.position.z = -intersection.distance - object.geometry.parameters.radius;
                if (object.geometry.parameters.depth !== undefined)
                    object.position.z = -intersection.distance - object.geometry.parameters.depth / 2;
                // object.material.emissive.b = 1;
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


    if (cursorSelected) {
        var cursor = group_no_move.getObjectByName("cursorBackground").getObjectByName("cursor");
        var timestampInfos = computeTimestampFromPos(cursor.position.x);
        var timestamp = timestampInfos.timestamp;
        moveCursorAtTimestamp(cursor, timestamp);
        cursor.material.emissive.r = 0;
        erase_other(timestamp);
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

//https://stackoverflow.com/questions/42812861/three-js-pivot-point/42866733#42866733
function rotateAboutPoint(obj, point, axis, theta, pointIsWorld) {
    pointIsWorld = (pointIsWorld === undefined) ? false : pointIsWorld;

    if (pointIsWorld) {
        obj.parent.localToWorld(obj.position); // compensate for world coordinate
    }

    obj.position.sub(point); // remove the offset
    obj.position.applyAxisAngle(axis, theta); // rotate the POSITION
    obj.position.add(point); // re-add the offset

    if (pointIsWorld) {
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

//Joystick
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


//Gere l'intersection entre le controller et un objet
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

function computeTimestampFromUV(x) {
    var timestamp = Math.floor((x * 100) / (100 / NBTIMESTAMPS));
    var inf = Math.floor((x * 100) / (100 / (NBTIMESTAMPS - 1)));
    var sup = Math.floor((x * 100) / (100 / (NBTIMESTAMPS - 1))) + 1;
    var returned = {
        timestamp: timestamp,
        other: (inf != timestamp) ? inf : sup
    }
    return returned;
}

function computeTimestampFromPos(x) {
    var xUV = (x + CURSORWIDTH / 2) / CURSORWIDTH;
    var timestampInfos = computeTimestampFromUV(xUV);
    var returned = {
        timestamp: timestampInfos.timestamp,
        other: timestampInfos.other
    }
    return returned;
}

//Replace le curseur sur le bon timestamp
function moveCursorAtTimestamp(cursor, timestamp) {
    cursor.position.x = timestamp / (NBTIMESTAMPS - 1) * (CURSORWIDTH - CURSORHEIGHT) - CURSORWIDTH / 2 + CURSORHEIGHT / 2;
}

function moveCursorAtUVX(cursor, x) {
    cursor.position.x = x * (CURSORWIDTH - CURSORHEIGHT) - CURSORWIDTH / 2 + CURSORHEIGHT / 2;
}


//Affiche LE bon timestamp en fonction de la sphere selectionnee
function erase_other(timestamp) {
    for (var i = 0; i < group.children.length; i++) {
        if ((group.children[i].name.includes("timestamp"))) {
            if (group.children[i].name.slice(-1) == timestamp) {
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


var timeout;

function mousedown(event) {
    timeout = setInterval(function(){
                          var vector = new THREE.Vector3(( event.clientX / window.innerWidth ) * 2 - 1, -( event.clientY / window.innerHeight ) * 2 + 1, 0.5);
                          vector = vector.unproject(camera);
                          var raycaster = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
                          var intersects = raycaster.intersectObjects(intersected);
                          if (intersects.length > 0) {
                          var delta = clock.getDelta(); // seconds.
                          var moveDistance = 200 * delta; // 200 pixels per second
                          //fleche du haut
                          if (intersects[0].object.name=="flecheH") {
                          //moveInSpace(0, -3);
                          //intersects[0].object.material.color.set(0xff0000);
                          group.position.set(group.position.x, group.position.y, group.position.z + moveDistance);
                          
                          //fleche du bas
                          } else if (intersects[0].object.name == "flecheB") {
                          //moveInSpace(0, 3);
                          group.position.set(group.position.x, group.position.y, group.position.z - moveDistance);
                          
                          //fleche de droite
                          } else if (intersects[0].object.name== "flecheD") {
                          //moveInSpace(moveDistance, 0);
                          group.position.set(group.position.x - moveDistance, group.position.y, group.position.z);
                          
                          //fleche de gauche
                          } else if (intersects[0].object.name== "flecheG") {
                          //moveInSpace(-3,0);
                          // var theta = xAxisValue * THREE.Math.degToRad(ROTSTEP);
                          // rotateAboutPoint(group, camera.position, camera.position.clone().normalize(), theta, false);
                          
                          group.position.set(group.position.x + moveDistance, group.position.y, group.position.z);
                          
                      
			   } else if (intersects[0].object.name== "cancel") {
                          //moveInSpace(-3,0);
                          // var theta = xAxisValue * THREE.Math.degToRad(ROTSTEP);
                          // rotateAboutPoint(group, camera.position, camera.position.clone().normalize(), theta, false);
                          
                               group.position.set(0,25.1,0);
			       group.rotation.set(0,0,0);
			   } else if(intersects[0].object.name == "save") {
			       saved_group_positions.push(group.position.z);
			       console.log(saved_group_positions[0]);
			       console.log(saved_group_positions[1]);
			       console.log(saved_group_positions[2]);
				 }
                          var rotation_matrix = new THREE.Matrix4().identity();
                          var centroid = new THREE.Vector3(avg_x, avg_y, avg_z);
                          if (intersects[0].object.name=="flecheHR") {
                          rotateAboutPoint(group, centroid, new THREE.Vector3(1,0,0),  Math.PI / 2 * delta);
                          
                          //fleche du bas
                          } else if (intersects[0].object.name == "flecheBR") {
                          rotateAboutPoint(group, centroid, new THREE.Vector3(1,0,0),  -Math.PI / 2 * delta);
                          //fleche de droite
                         } else if (intersects[0].object.name== "flecheDR") {
                          rotateAboutPoint(group, centroid, new THREE.Vector3(0,1,0),  -Math.PI / 2 * delta);
                          
                          //fleche de gauche
                          } else if (intersects[0].object.name== "flecheGR") {
                          rotateAboutPoint(group, centroid, new THREE.Vector3(0,1,0),  Math.PI / 2 * delta);
                          
                          }
                          }
                          }, 100);
    return false;
}







function mouseup(){
    
    clearInterval(timeout);
    return false;
}

function update()
{
    //pivot.add(group);
    var delta = clock.getDelta(); // seconds.
    var moveDistance = 70 * delta; // 200 pixels per second
    var rotateAngle = Math.PI / 2 * delta;   // pi/2 radians (90 degrees) per second
    
    // local transformations
    
    // move forwards/backwards/left/right
    if ( keyboard.pressed("W") )
        group.translateZ( -moveDistance );
    if ( keyboard.pressed("S") )
        group.translateZ(  moveDistance );
    if ( keyboard.pressed("Q") )
        group.translateX( -moveDistance );
    if ( keyboard.pressed("E") )
        group.translateX(  moveDistance );
    
    // rotate left/right/up/down
    var rotation_matrix = new THREE.Matrix4().identity();
    if ( keyboard.pressed("A") ){
        //pivot.rotation.x += rotateAngle;
        //pivot.rotateOnAxis( new THREE.Vector3(0,1,0), rotateAngle);
        //camera.lookAt(group.position);
        //console.log(group.position);
        var centroid = new THREE.Vector3(avg_x, avg_y, avg_z);
        //group.getWorldPosition(axis);
        rotateAboutPoint(group, centroid, new THREE.Vector3(0,1,0), rotateAngle);
    }
    if ( keyboard.pressed("D") ){
        var centroid = new THREE.Vector3(avg_x, avg_y, avg_z);
        rotateAboutPoint(group, centroid, new THREE.Vector3(0,1,0), -rotateAngle);
    }
    if ( keyboard.pressed("R") ){
        var centroid = new THREE.Vector3(avg_x, avg_y, avg_z);
        rotateAboutPoint(group, centroid, new THREE.Vector3(1,0,0), rotateAngle);
    }
    if ( keyboard.pressed("F") ){
        var centroid = new THREE.Vector3(avg_x, avg_y, avg_z);
        rotateAboutPoint(group, centroid, new THREE.Vector3(1,0,0), -rotateAngle);
    }
    if ( keyboard.pressed("Z") )
    {
        group.position.set(0,25.1,0);
        group.rotation.set(0,0,0);
    }
    
    /*var relativeCameraOffset = new THREE.Vector3(0,50,200);
     
     var cameraOffset = relativeCameraOffset.applyMatrix4( group.matrixWorld );
     
     camera_2.position.x = cameraOffset.x;
     camera_2.position.y = cameraOffset.y;
     camera_2.position.z = cameraOffset.z;
     camera_2.lookAt( group.position );
     
     //camera.updateMatrix();
     //camera.updateProjectionMatrix();
     
     if ( keyboard.pressed("1") )
     {  camera2Active = true;  }
     if ( keyboard.pressed("2") )
     {  camera2Active = false;  }
     
     
     
     //stats.update();*/
}

function moveCursor() {
    var direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    group_no_move.position.copy(direction).multiplyScalar(10);
    group_no_move.lookAt(camera.position);
    //    var rotation = new THREE.Vector3();
    //    rotation.copy(camera.rotation);
    //    rotation.sub(oldRotation);
    //    rotateAboutPoint(group_no_move, camera.position, new THREE.Vector3(1,0,0).normalize(), rotation.x, false);
    //    rotateAboutPoint(group_no_move, camera.position, new THREE.Vector3(0,1,0).normalize(), rotation.y, false);
    //    rotateAboutPoint(group_no_move, camera.position, new THREE.Vector3(0,0,1).normalize(), rotation.z, false);
    //    group_no_move.lookAt(camera.position);
    //    oldRotation.copy(camera.rotation);
}

function animate() {
    // oldRotation.copy(camera.rotation);
    //renderer.setAnimationLoop(render);
    requestAnimationFrame( animate );
    render();
    update();
}

function render() {
    /*cleanIntersected();
    var intersection1 = intersectObjects(controller1);
    var intersection2 = intersectObjects(controller2);

    //    Permet de se deplacer en continue avec les fleches
    if ((continuousXMove != 0) || (continuousYMove != 0)) {
        moveInSpace(continuousXMove, continuousYMove);
    }


    //    Si on est entrain de bouger le curseur 
    if (cursorSelected) {
        var cursor = group_no_move.getObjectByName("cursorBackground").getObjectByName("cursor");

        if ((intersection1 !== undefined) &&
            (intersection1.object == group_no_move.getObjectByName("cursorBackground"))) {

            moveCursorAtUVX(cursor, intersection1.uv.x);

        } else if ((intersection2 !== undefined) &&
            (intersection2.object == group_no_move.getObjectByName("cursorBackground"))) {

            moveCursorAtUVX(cursor, intersection2.uv.x);
        }
    }

    //    Affichage du mouvement du curseur
    moveCursor();

    THREE.VRController.update();*/
    //camera.lookAt(group.position);
    renderer.render(scene, camera);
}

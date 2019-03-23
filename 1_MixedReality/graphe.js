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

var oldCursorPos = new THREE.Vector3();

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

loadJSON(function (response) {
    // Parse JSON string into object
    file = JSON.parse(response);
    init();
    animate();
});


function loadJSON(callback) {

    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', 'mygraph.json', true);
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
    // scene.background = new THREE.Color(0xdccbce);


    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1500);

    scene.add(new THREE.HemisphereLight(0x808080, 0x606060));

    //mise en place de la lumière
    /*var light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0, 6, 0);
    light.castShadow = false;
    light.shadow.camera.top = 2;
    light.shadow.camera.bottom = -2;
    light.shadow.camera.right = 2;
    light.shadow.camera.left = -2;
    light.shadow.mapSize.set(4096, 4096);
    scene.add(light);*/


    group = new THREE.Group();
    group.type = 'yes';
    scene.add(group);

    group_no_move = new THREE.Group();
    group_no_move.type = 'no';
    scene.add(group_no_move);


    var geometry = new THREE.IcosahedronGeometry(1, 3);

    var material = new THREE.MeshLambertMaterial({
        color: Math.random() * 0xffffff,
        side: THREE.FrontSide
    });

    /*for (var i = 0; i < NBTIMESTAMPS; i++){
        vertices.push([]);
    }*/

    var points = [];

    var geoms = [];
    for (var i = 0; i < NBTIMESTAMPS; i++){
        geoms.push(new THREE.Geometry());
    }

    //Mise en place des noeuds dans les differrents timestamp
    for (var i = 0; i < file.nodes.length; i++) {
        // sphere1 = new THREE.Mesh(geometry, material);
        sphere1 = new THREE.Mesh(geometry);
        sphere1.position.x = file.nodes[i].pos[0];
        sphere1.position.y = file.nodes[i].pos[1];
        sphere1.position.z = file.nodes[i].pos[2];
        // sphere1.visible = false;


        for (var j = 0; j < file.nodes[i].timestamp.length; j++) {
            // vertices[file.nodes[i].timestamp[j]].push(sphere1);
            geoms[file.nodes[i].timestamp[j]].mergeMesh(sphere1);
        }

        // group.add(sphere1);
        // scene.add(sphere1);
        points.push(sphere1.position);
    }

    for (var i = 0; i < NBTIMESTAMPS; i++){
        vertices[i] = new THREE.Mesh(geoms[i],material);
        vertices[i].name= "timestamp" + i;
        group.add(vertices[i]);
        // if (i != 0){
        //     vertices[i].visible = false;
        // }
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


        // line.vertices.push(two_node);

        // edges = new THREE.Line(line, new THREE.LineBasicMaterial({
        //     color: Math.random() * 0xffffff,
        //     opacity: 0.01,
        //     side: THREE.FrontSide
        // }));

        // edges.visible = false;

        for (var j = 0; j < file.edges[i].timestamp.length; j++) {

            // vertices[file.edges[i].timestamp[j]].push(edges);
            // geoms[file.edges[i].timestamp[j]].merge(edges.geometry, edges.matrix);
            edgesGeometry[file.edges[i].timestamp[j]].vertices.push(two_node[0]);
            edgesGeometry[file.edges[i].timestamp[j]].vertices.push(two_node[1]);

            // if (file.edges[i].timestamp[j] == 0) {
            //     timestamp0.add(edges);
            //     edges.visible = true;

            // } else if (file.edges[i].timestamp[j] == 1) {
            //     timestamp1.add(edges);
            //     edges.visible = true; 

            // } else if (file.edges[i].timestamp[j] == 2) {
            //     timestamp2.add(edges);
            //     edges.visible = true; 

            // } else if (file.edges[i].timestamp[j] == 3) {
            //     timestamp3.add(edges);
            //     edges.visible = true;

            // }
        }

        // group.add(edges);
        // scene.add(edges);
    }

    var edgeMaterial = new THREE.LineBasicMaterial( {
        color: 0xffffff,
        linewidth: 1,
    } );

    for (var i = 0; i < NBTIMESTAMPS; i++){
        edges[i] = new THREE.LineSegments(edgesGeometry[i],edgeMaterial);
        edges[i].name = "timestamp" + i;
        group.add(edges[i]);
        // if (i != 0){
        //     edges[i].visible = false;
        // }
    }


    geometry = new THREE.IcosahedronBufferGeometry(1, 3);

    material = new THREE.MeshLambertMaterial({
        color: 0xffffff,
        side: THREE.FrontSide
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

    sphere2.position.x = -5;
    sphere2.position.y = -20;
    sphere2.position.z = -30;
    sphere2.name = 'numero1';
    group_no_move.add(sphere2);

    sphere3.position.x = 5;
    sphere3.position.y = -20;
    sphere3.position.z = -30;
    sphere3.name = 'numero2';
    group_no_move.add(sphere3);

    sphere4.position.x = 15;
    sphere4.position.y = -20;
    sphere4.position.z = -30;
    sphere4.name = 'numero3';
    group_no_move.add(sphere4);



    renderer = new THREE.WebGLRenderer({
        antialias: true
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    // renderer.shadowMap.enabled = true;
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
        // controller.addEventListener('thumbpad pressed', onThumbpadPress);
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

            if (object.name.charAt(0) != 'n') {
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

            } else {
                is_selected = 0;
                object.material.emissive.b = 1;
                erase_other(object);
                controller.userData.selected = object;
            }
        }
    }
}

function onSelectEnd(event) {
    var controller = event.target;

    if (controller.userData.selected !== undefined) {
        var object = controller.userData.selected;

        if (object.name.charAt(0) != 'n') {
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
            object.material.emissive.b = 0;
            // erase_other(object);
            controller.userData.selected = undefined;
        }

    }
}

// Permet de se deplacer dans l'espace suivant la direction du regard
function moveInSpace(xAxisValue, yAxisValue) {
    var xstep = CAMSTEP * xAxisValue;
    var ystep = CAMSTEP * yAxisValue;

    var direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    var axisOfRotation = camera.position.clone().normalize(); // Axe de la rotation a verifier
    var quad = new THREE.Quaternion().setFromAxisAngle(axisOfRotation, Math.PI / 2);
    var ymove = direction.clone().multiplyScalar(ystep);
    direction.applyQuaternion(quad);
    var xmove = direction.multiplyScalar(xstep);
    group.position.add(xmove.add(ymove));
}

function onThumbstickMove(event) {
    var x = parseFloat(event.axes[0].toFixed(2));
    var y = parseFloat(event.axes[1].toFixed(2));
    moveInSpace(x, y);

    // Déplacement en absolu (sans prendre en compte la direction de la caméra)
    /*group.translateX(xstep);
    group.translateY(-ystep);*/

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


function move(object, dx, dy, dz) {

    while ((object.position.x != dx) || (object.position.y != dy) || (object.position.z != dz)) {

        if (object.position.x > dx) {
            object.position.x = object.position.x - 1;
        } else if (object.position.x < dx) {
            object.position.x = object.position.x + 1;
        }


        if (object.position.y > dy) {
            object.position.y = object.position.y - 1;
        } else if (object.position.y < dy) {
            object.position.y = object.position.y + 1;
        }


        if (object.position.z > dz) {
            object.position.z = object.position.z - 1;
        } else if (object.position.z < dz) {
            object.position.z = object.position.z + 1;
        }

        renderer.render(scene, camera);
    }
}

function move_to_cam(object) {

    while ((object.position.x != 0) || (object.position.y != 2) || (object.position.z != -30)) {
        if (object.position.x > 0) {
            object.position.x = object.position.x - 1;
        } else if (object.position.x < 0) {
            object.position.x = object.position.x + 1;
        }

        if (object.position.y > 2) {
            object.position.y = object.position.y - 1;
        } else if (object.position.y < 2) {
            object.position.y = object.position.y + 1;
        }

        if (object.position.z > -30) {
            object.position.z = object.position.z - 1;
        } else if (object.position.z < -30) {
            object.position.z = object.position.z + 1;
        }

        renderer.render(scene, camera);
    }

}


//Affiche LE bon timestamp en fonction de la sphere selectionnee
function erase_other(object) {
    var timestamp = parseInt(object.name.slice(-1));
    for (var i = 0; i < NBTIMESTAMPS; i++) {
        if (i == timestamp){
            vertices[i].visible = true;
            edges[i].visible = true;
        } else {
            vertices[i].visible = false;
            edges[i].visible = false;
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

function moveCursor() {
    var direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    group_no_move.position.copy(direction).multiplyScalar(20);
    group_no_move.lookAt(camera.position);
}

function animate() {
    renderer.setAnimationLoop(render);
}

function render() {
    cleanIntersected();
    intersectObjects(controller1);
    intersectObjects(controller2);
    moveCursor();
    THREE.VRController.update();
    renderer.render(scene, camera);
}

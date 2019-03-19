var container;
var camera, scene, renderer;
var controller1, controller2;
var raycaster, intersected = [];
var tempMatrix = new THREE.Matrix4();
var group;
var cameraGroup;
var vertices;
var edges;
var object;
var points;

const CAMSTEP = 0.03;


//double buffering pour l'affichage des elements 
// 1 ecran qui dessine et un ecran qui affiche a l'utilisateur


init();
animate();

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
    cameraGroup = new THREE.Group();


    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10000);
    cameraGroup.add(camera);

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
    group = new THREE.Group();
    scene.add(group);


    //on initialise les lignes
    var line = new THREE.Geometry();


    var geometries = [
        new THREE.BoxBufferGeometry(0.2, 0.2, 0.2),
        new THREE.ConeBufferGeometry(0.2, 0.2, 64),
        new THREE.CylinderBufferGeometry(0.2, 0.2, 0.2, 64),
        new THREE.IcosahedronBufferGeometry(0.03, 3),
        new THREE.TorusBufferGeometry(0.2, 0.04, 64, 32)
    ];

    points = [];
    vertices = new THREE.Group();
    group.add(vertices);

    for (var i = 0; i < 50; i++) {

        //creation de spheres
        var geometry = geometries[3];

        var material = new THREE.MeshStandardMaterial({
            color: Math.random() * 0xffffff,
            roughness: 0.7,
            metalness: 0.0
        });

        object = new THREE.Mesh(geometry, material);

        object.position.x = Math.random() * 4 - 2;
        object.position.y = Math.random() * 2;
        object.position.z = Math.random() * 4 - 2;
        object.rotation.x = Math.random() * 2 * Math.PI;
        object.rotation.y = Math.random() * 2 * Math.PI;
        object.rotation.z = Math.random() * 2 * Math.PI;

        //object.scale.setScalar(Math.random() + 0.5);
        object.castShadow = true;
        object.receiveShadow = true;
        vertices.add(object);

        points.push(object.position);


    }

    line = new THREE.BufferGeometry().setFromPoints(points);

    edges = new THREE.Line(line, new THREE.LineBasicMaterial({
        color: 0xffffff,
        opacity: 0.05
    }));

    group.add(edges);


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
    // controller1.addEventListener('selectstart', onSelectStart);
    // controller1.addEventListener('selectend', onSelectEnd);
    controller1.addEventListener("mousemove", onMouseMove);
    controller1.addEventListener("mousedown", onMouseDown);
    scene.add(controller1);



    controller2 = renderer.vr.getController(1);
    // controller2.addEventListener('selectstart', onSelectStart);
    // controller2.addEventListener('selectend', onSelectEnd);
    scene.add(controller2);





    //
    var geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
    var line = new THREE.Line(geometry);
    line.name = 'line';
    line.scale.z = 5;
    controller1.add(line.clone());
    controller2.add(line.clone());
    raycaster = new THREE.Raycaster();
    //
    window.addEventListener('resize', onWindowResize, false);

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
        controller.addEventListener('thumbpad pressed', onThumbpadPress);
        controller.addEventListener('disconnected', function (event) {
            controller.parent.remove(controller);
        });
    })
    onWindowResize();

}

function onMouseMove(e) {

    camera.position.z += 10;


    renderer.render(scene, camera);
}

function onMouseDown(e) {

    camera.position.z += 10;


    renderer.render(scene, camera);
}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onSelectStart(event) {
    var controller = event.target;
    var intersections = getIntersections(controller);

    if (intersections.length > 0) {
        var intersection = intersections[0];
        tempMatrix.getInverse(controller.matrixWorld);
        var object = intersection.object;
        object.matrix.premultiply(tempMatrix);        
        object.matrix.decompose(object.position, object.quaternion, object.scale);
        object.position.x = 0;
        object.position.y = 0;
        if (object.geometry.parameters.radius !== undefined) 
            object.position.z = -intersection.distance - object.geometry.parameters.radius;
        if (object.geometry.parameters.depth !== undefined) 
            object.position.z = -intersection.distance - object.geometry.parameters.depth/2;
        object.material.emissive.b = 1;
        controller.add(object);
        controller.userData.selected = object;
    }

}

function onSelectEnd(event) {
    var controller = event.target;
    if (controller.userData.selected !== undefined) {
        var object = controller.userData.selected;
        var test = new THREE.Vector3();
        object.getWorldPosition(test);
        object.matrix.premultiply(controller.matrixWorld);
        object.matrix.decompose(object.position, object.quaternion, object.scale);
        object.material.emissive.b = 0;
        vertices.add(object);
        object.position = test;
        object.position.x -= group.position.x;
        object.position.y -= group.position.y;
        object.position.z -= group.position.z;
        controller.userData.selected = undefined;

    }
}

// Permet de se deplacer dans l'espace suivant la direction du regard
function moveInSpace(xAxisValue, yAxisValue){
    var xstep = CAMSTEP * xAxisValue;
    var ystep = CAMSTEP * yAxisValue;

    var direction = new THREE.Vector3();
    camera.getWorldDirection( direction );
    var axisOfRotation = camera.position.clone().normalize(); // Axe de la rotation a verifier
    var quad = new THREE.Quaternion().setFromAxisAngle( axisOfRotation, Math.PI / 2 );
    var ymove = direction.clone().multiplyScalar(ystep);
    direction.applyQuaternion(quad);
    var xmove = direction.multiplyScalar(xstep);
    group.position.add( xmove.add(ymove) );
}

function onThumbstickMove(event) {
    var x = parseFloat(event.axes[0].toFixed(2));
    var y = parseFloat(event.axes[1].toFixed(2));
    moveInSpace(x, y);

    // Déplacement en absolu (sans prendre en compte la direction de la caméra)
    /*group.translateX(xstep);
    group.translateY(-ystep);*/

}

function onThumbpadPress(event) {

    /*var controller = event.target;
    if (controller.getHandedness() == 'right') {
        group.translateZ(CAMSTEP);
    } else {
        group.translateZ(-CAMSTEP);
    }*/

}

function getIntersections(controller) {
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    return raycaster.intersectObjects(vertices.children);
}

function intersectObjects(controller) {
    // Do not highlight when already selected
    if (controller.userData.selected !== undefined) return;
    var line = controller.getObjectByName('line');
    var intersections = getIntersections(controller);
    if (intersections.length > 0) {
        var intersection = intersections[0];
        var object = intersection.object;
        object.material.emissive.r = 1;
        intersected.push(object);
        line.scale.z = intersection.distance;
    } else {
        line.scale.z = 5;
    }
}

function cleanIntersected() {
    while (intersected.length) {
        var object = intersected.pop();
        object.material.emissive.r = 0;
    }
}
//
function animate() {
    renderer.setAnimationLoop(render);
}

function render() {
    cleanIntersected();
    intersectObjects(controller1);
    intersectObjects(controller2);
    THREE.VRController.update();
    renderer.render(scene, camera);
}
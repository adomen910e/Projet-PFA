var container;
var camera, scene, renderer;
var controller1, controller2;
var raycaster, intersected = [];
var tempMatrix = new THREE.Matrix4();
var group_no_move;
var group;
var line;
var object;
var points;


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


    group = new THREE.Group();
    group.type = "yes";
    scene.add(group);

    group_no_move = new THREE.Group();
    group_no_move.type = "no";
    scene.add(group_no_move);


    var geometry = new THREE.IcosahedronBufferGeometry(1, 3);
    var material = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff,
    });
    var sphere1 = new THREE.Mesh(geometry, material);
    sphere1.position.x = -20;
    sphere1.position.y = 2;
    sphere1.position.z = -30;
    scene.add(sphere1);
    sphere1.id = "0";
    group_no_move.add(sphere1);


    geometry = new THREE.IcosahedronBufferGeometry(1, 3);
    material = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff,
    });
    var sphere2 = new THREE.Mesh(geometry, material);
    sphere2.position.x = 0;
    sphere2.position.y = 2;
    sphere2.position.z = -30;
    scene.add(sphere2);
    sphere2.id = "1";
    group_no_move.add(sphere2);

    geometry = new THREE.IcosahedronBufferGeometry(1, 3);
    material = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff,
    });
    var sphere3 = new THREE.Mesh(geometry, material);
    sphere3.position.x = 20;
    sphere3.position.y = 2;
    sphere3.position.z = -30;
    scene.add(sphere3);
    sphere3.id = "2";
    group_no_move.add(sphere3);


    geometry = new THREE.CylinderBufferGeometry(4, 4, 0.1, 64),
        material = new THREE.MeshStandardMaterial({
            color: Math.random() * 0xffffff,
        });
    var cylindre1 = new THREE.Mesh(geometry, material);
    cylindre1.position.x = 0;
    cylindre1.position.y = -5;
    cylindre1.position.z = -20;
    scene.add(cylindre1);
    group.add(cylindre1);


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
    controller1.addEventListener("mousemove", onMouseMove);
    controller1.addEventListener("mousedown", onMouseDown);
    scene.add(controller1);



    controller2 = renderer.vr.getController(1);
    controller2.addEventListener('selectstart', onSelectStart);
    controller2.addEventListener('selectend', onSelectEnd);
    scene.add(controller2);





    //
    var geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
    var line = new THREE.Line(geometry);
    line.name = 'line';
    line.scale.z = 100;
    controller1.add(line.clone());
    controller2.add(line.clone());
    raycaster = new THREE.Raycaster();
    //


    window.addEventListener('resize', onWindowResize, false);
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
        object.material.emissive.b = 1;

        if (object.type = "no") {
            erase_other(object);
        } else {
            controller.add(object);
            controller.userData.selected = object;
        }


    }

}

function onSelectEnd(event) {
    var controller = event.target;
    if (controller.userData.selected !== undefined) {
        var object = controller.userData.selected;
        object.matrix.premultiply(controller.matrixWorld);
        object.matrix.decompose(object.position, object.quaternion, object.scale);
        object.material.emissive.b = 0;
        group.add(object);
        controller.userData.selected = undefined;

    }
}

function getIntersections(controller) {

    tempMatrix.identity().extractRotation(controller.matrixWorld);

    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    return raycaster.intersectObjects(group.children);
}

function intersectObjects(controller) {
    // Do not highlight when already selected
    if (controller.userData.selected !== undefined) return;

    var line = controller.getObjectByName('line');
    var intersections = getIntersections(controller);

    if (intersections.length > 0) {
        var intersection = intersections[0];
        var object = intersection.object;

        if (object.type = "no") {
            line.scale.z = intersection.distance;
            //            erase_other(object);
            //            move_front_camera(object);
            //            
        } else {
            object.material.emissive.r = 1;
            intersected.push(object);
            line.scale.z = intersection.distance;
        }

    } else {
        line.scale.z = 100;
    }
}

function erase_other(object) {
    //    for(var i=0; i<3; i++){
    //        if (object.id = group_no_move.children[i].id){
    //            //RIEN FAIRE
    //        }else{
    //            group_no_move.children[i].transparent = true;
    //            //EFFACE
    //        }
    //    }
    group_no_move.children[0].color = "0x000000";

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
    renderer.render(scene, camera);
}

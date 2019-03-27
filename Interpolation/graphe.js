var container;
var scene, renderer;
var controller1, controller2;
var raycaster, intersected = [];
var tempMatrix = new THREE.Matrix4();
var group_no_move;
var group;
var test;
var line;
var object;
var points;
var camera, camera_2;
var cylindre1;
var sphere3;
var sphere2;
var sphere1;
var clock = new THREE.Clock();
var camera2Active = false;
var keyboard = new THREEx.KeyboardState();

var selected;
var MovingCube;
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


    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 20000);
    scene.add(camera);
    camera.position.set(0,200,550);
    camera.lookAt(scene.position);
    // camera 2
    camera_2 = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 20000);
    scene.add(camera_2);

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
    group.type = 'yes';
    scene.add(group);

    group_no_move = new THREE.Group();
    group_no_move.type = 'no';
    scene.add(group_no_move);

    
    test = new THREE.Group();
    scene.add(test);


    /*var geometry = new THREE.IcosahedronBufferGeometry(1, 3);
    var material = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff,
    });
    sphere1 = new THREE.Mesh(geometry, material);
    sphere1.position.x = -20;
    sphere1.position.y = 2;
    sphere1.position.z = -30;
    scene.add(sphere1);
    sphere1.name = 'numero';
    group.add(sphere1);



    geometry = new THREE.IcosahedronBufferGeometry(1, 3);
    material = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff,
    });
    sphere2 = new THREE.Mesh(geometry, material);
    sphere2.position.x = 0;
    sphere2.position.y = 2;
    sphere2.position.z = -30;
    scene.add(sphere2);
    sphere2.name = 'numero1';
    group.add(sphere2);
    test.add(sphere2);


    geometry = new THREE.IcosahedronBufferGeometry(1, 3);
    material = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff,
    });
    sphere3 = new THREE.Mesh(geometry, material);
    sphere3.position.x = 20;
    sphere3.position.y = 2;
    sphere3.position.z = -30;
    scene.add(sphere3);
    sphere3.name = 'numero2';
    group.add(sphere3);



    geometry = new THREE.CylinderBufferGeometry(4, 4, 0.1, 64);
    var texture = new THREE.TextureLoader().load('tourbi.png');

    // immediately use the texture for material creation
    material = new THREE.MeshBasicMaterial({
        map: texture
    });

    //    material = new THREE.MeshStandardMaterial({
    //        color: Math.random() * 0xffffff,
    //    });

    cylindre1 = new THREE.Mesh(geometry, material);
    cylindre1.position.x = 0;
    cylindre1.position.y = -5;
    cylindre1.position.z = -20;
    cylindre1.name = 'numero3';

    selected = 0;

    scene.add(cylindre1);
    //group.add(cylindre1);*/
    
    var geometry = new THREE.BoxGeometry( 400, 400, 1 );
    var material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
    MovingCube= new THREE.Mesh( geometry, material );
    //scene.add( cube );
    //MovingCube = new THREE.Mesh( MovingCubeGeom, MovingCubeMat );
    MovingCube.position.set(0, -5, 0);
    scene.add( MovingCube );
    group.add(MovingCube);
    //scene.add( MovingCube );


    renderer = new THREE.WebGLRenderer({
        antialias: true
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    //renderer.gammaInput = true;
    //renderer.gammaOutput = true;
    //renderer.shadowMap.enabled = true;
    //renderer.vr.enabled = true;
    container.appendChild(renderer.domElement);
    //document.body.appendChild(WEBVR.createButton(renderer));

    // controllers gamepad
    /*controller1 = renderer.vr.getController(0);
    controller1.addEventListener('selectstart', onSelectStart);
    controller1.addEventListener('selectend', onSelectEnd);
    scene.add(controller1);



    controller2 = renderer.vr.getController(1);
    controller2.addEventListener('selectstart', onSelectStart);
    controller2.addEventListener('selectend', onSelectEnd);
    scene.add(controller2);*/

    group.visible = true;
    //test.visible = true;




    //
    var geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
    var line = new THREE.Line(geometry);
    line.name = 'line';
    line.scale.z = 100;
    //controller1.add(line.clone());
    //controller2.add(line.clone());
    raycaster = new THREE.Raycaster();
    //


    window.addEventListener('resize', onWindowResize, false);
    onWindowResize();

}


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/*function onSelectStart(event) {
    var controller = event.target;
    var intersections = getIntersections(controller);

    if (intersections.length > 0) {
        var intersection = intersections[0];

        tempMatrix.getInverse(controller.matrixWorld);

        var object = intersection.object;

        if (object.name == 'numero3') {
            object.matrix.premultiply(tempMatrix);
            object.matrix.decompose(object.position, object.quaternion, object.scale);

            controller.add(object);
            controller.userData.selected = object;
            selected = 1;
        } else {
            object.material.emissive.b = 1;
            erase_other(object);
            controller.userData.selected = object;
        }
    }

}

function onSelectEnd(event) {
    var controller = event.target;

    if (controller.userData.selected !== undefined) {
        var object = controller.userData.selected;

        if (object.name == 'numero3') {
            object.matrix.premultiply(controller.matrixWorld);
            object.matrix.decompose(object.position, object.quaternion, object.scale);

            group.add(object);

            controller.userData.selected = undefined;
            selected = 0;
        } else {
            object.material.emissive.b = 0;
            erase_other(object);
            move_to_cam(object);
            controller.userData.selected = undefined;
        }

    }
}

function getIntersections(controller) {

    if (selected == 1) {
        change_color();
    }

    tempMatrix.identity().extractRotation(controller.matrixWorld);

    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    return raycaster.intersectObjects(group.children);
}

function intersectObjects(controller) {

    if (selected == 1) {
        change_color();
    }


    // Do not highlight when already selected
    if (controller.userData.selected !== undefined) return;

    var line = controller.getObjectByName('line');
    var intersections = getIntersections(controller);

    if (intersections.length > 0) {
        var intersection = intersections[0];
        var object = intersection.object;

        if (object.name != "numero3"){
            object.material.emissive.b = 1;
        }
        
        intersected.push(object);
        line.scale.z = intersection.distance;

    } else {
        line.scale.z = 100;
    }
}*/

function change_color() {

    sphere2.material.color.setHex(Math.random() * 0xffffff);
    sphere1.material.color.setHex(Math.random() * 0xffffff);
    sphere3.material.color.setHex(Math.random() * 0xffffff);

    renderer.render(scene, camera);
}

function move_to_cam(object) {

    while ((object.position.x != 0) && (object.position.y != 0) && (object.position.z != 0)) {
        if (object.position.x > 0) {
            object.position.x = object.position.x - 1;
        } else {
            object.position.x = object.position.x + 1;
        }

        if (object.position.y > 2) {
            object.position.y = object.position.y - 1;
        } else {
            object.position.y = object.position.y + 1;
        }

        if (object.position.z > -30) {
            object.position.z = object.position.z - 1;
        } else {
            object.position.z = object.position.z + 1;
        }

        renderer.render(scene, camera);
    }

    //    object.userData.velocity = new THREE.Vector3();
    //    object.userData.velocity.x = Math.random() * 0.01 - 0.005;
    //    object.userData.velocity.y = Math.random() * 0.01 - 0.005;
    //    object.userData.velocity.z = Math.random() * 0.01 - 0.005;

}

function erase_other(object) {
    for (var i = 0; i < 4; i++) {
        if (object.name == group.children[i].name) {
            //RIEN FAIRE
        } else if (group.children[i].name == 'numero3') {

        } else {
            group.children[i].visible = false;
            //EFFACE
        }
    }
}

function cleanIntersected() {
    while (intersected.length) {
        var object = intersected.pop();

        if (object.name != "numero3"){
            object.material.emissive.b = 0;
        }

    }
}

//
function animate() {
    requestAnimationFrame( animate );
    render();
    update();
}

function update()
{
    var delta = clock.getDelta(); // seconds.
    var moveDistance = 200 * delta; // 200 pixels per second
    var rotateAngle = Math.PI / 2 * delta;   // pi/2 radians (90 degrees) per second
    
    // local transformations
    
    // move forwards/backwards/left/right
    if ( keyboard.pressed("W") )
        MovingCube.translateZ( -moveDistance );
    if ( keyboard.pressed("S") )
        MovingCube.translateZ(  moveDistance );
    if ( keyboard.pressed("Q") )
        MovingCube.translateX( -moveDistance );
    if ( keyboard.pressed("E") )
        MovingCube.translateX(  moveDistance );
    
    // rotate left/right/up/down
    var rotation_matrix = new THREE.Matrix4().identity();
    if ( keyboard.pressed("A") )
        MovingCube.rotateOnAxis( new THREE.Vector3(0,1,0), rotateAngle);
    if ( keyboard.pressed("D") )
        MovingCube.rotateOnAxis( new THREE.Vector3(0,1,0), -rotateAngle);
    if ( keyboard.pressed("R") )
        MovingCube.rotateOnAxis( new THREE.Vector3(1,0,0), rotateAngle);
    if ( keyboard.pressed("F") )
        MovingCube.rotateOnAxis( new THREE.Vector3(1,0,0), -rotateAngle);
    
    if ( keyboard.pressed("Z") )
    {
        MovingCube.position.set(0,25.1,0);
        MovingCube.rotation.set(0,0,0);
    }
    
    var relativeCameraOffset = new THREE.Vector3(0,50,200);
    
    var cameraOffset = relativeCameraOffset.applyMatrix4( MovingCube.matrixWorld );
    
    camera_2.position.x = cameraOffset.x;
    camera_2.position.y = cameraOffset.y;
    camera_2.position.z = cameraOffset.z;
    camera_2.lookAt( MovingCube.position );
    
    //camera.updateMatrix();
    //camera.updateProjectionMatrix();
    
    if ( keyboard.pressed("1") )
    {  camera2Active = true;  }
    if ( keyboard.pressed("2") )
    {  camera2Active = false;  }
    
    
    
    //stats.update();
}


function render() {
    if (camera2Active)
    {  renderer.render( scene, camera_2 );  }
    else
    {  renderer.render( scene, camera );  }
}


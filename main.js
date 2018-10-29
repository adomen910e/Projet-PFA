var renderer, scene, camera, mesh, line;
var distance = 500;
var flag;
var directions = {};
directions.forward = false;
directions.backward = false;
directions.left = false;
directions.right = false;
var pos_init_y;
var pos_init_x;

init();
//animate();

function init() {
    // on initialise le moteur de rendu
    renderer = new THREE.WebGLRenderer();

    // si WebGL ne fonctionne pas sur votre navigateur vous pouvez utiliser le moteur de rendu Canvas à la place
    // renderer = new THREE.CanvasRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);

    // on initialise la scène
    scene = new THREE.Scene();

    //on initialise les lignes
    line = new THREE.Geometry();

    // on initialise la camera que l’on place ensuite sur la scène
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(0, 0, 1000);
    scene.add(camera);

    var points = [];


    // on créé un  cube au quel on définie un matériau puis on l’ajoute à la scène 
    for (var i = 0; i < 50; i++) {
        var geometry = new THREE.SphereGeometry(1, 10, 10);
        var material = new THREE.MeshBasicMaterial({
            color: Math.random() * 0xffff00
        });
        mesh = new THREE.Mesh(geometry, material);

        mesh.position.x = Math.random() * distance * 2 - distance;
        mesh.position.y = Math.random() * distance * 2 - distance;
        mesh.position.z = Math.random() * distance * 2 - distance;

        mesh.scale.x = mesh.scale.y = mesh.scale.z = Math.random() * 10 + 5;

        scene.add(mesh);

        points.push(mesh.position);
    }
    line = new THREE.BufferGeometry().setFromPoints(points);

    var link = new THREE.Line(line, new THREE.LineBasicMaterial({
        color: 0xffffff,
        opacity: 0.05
    }));

    scene.add(link);

    renderer.render(scene, camera);

    window.addEventListener("keydown", onKeyDown, false);
    window.addEventListener("mousemove", onMouseMove, false);
    window.addEventListener("mousedown", onMouseDown, false);
    window.addEventListener("mouseup", onMouseUp, false);
    window.addEventListener("resize", onWindowResize, false);
}

function onMouseDown(event) {
    flag = 0;
    pos_init_x = -event.clientX;
    pos_init_y = -event.clientY;
}

function onMouseUp(event) {
    flag = 1;
    
}

function onMouseMove(event) {
    if (flag == 0) {
        var mouseX = event.clientX ;
        var mouseY = event.clientY ;

        console.log("x:" + mouseX + " y:" + mouseY + "\n");
        camera.position.x += (-mouseX - pos_init_x) * 0.03;
        camera.position.y += -(-mouseY - pos_init_y) * 0.03;

        renderer.render(scene, camera);
    }else{
        console.log("console x:" + camera.position.x + " console y:" + camera.position.y + "\n\n");
    }

}


function onKeyDown(e) {
    var mouseX = event.clientX - innerWidth / 2;
    var mouseY = event.clientY - innerHeight / 2;

    switch (e.keyCode) {
        case 37: // Left
            camera.rotation.y += 0.01;
            break;
            
        case 81: // Q
            camera.position.x -= 10;
            break;

        case 38: // Up
            camera.rotation.x += 0.01;
            break;
            
        case 90: // Z
            camera.position.z -= 10;
            break;

        case 39: // Right
            camera.rotation.y -= 0.01;
            break;

        case 68: // D
            camera.position.x += 10;
            break;

        case 40: // Down
            camera.rotation.x -= 0.01;
            break;
            
        case 83: // S
            camera.position.z += 10;
            break;
    }

    renderer.render(scene, camera);
}


function onWindowResize(e) {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
}

function animate() {
    // on appel la fonction animate() récursivement à chaque frame
    requestAnimationFrame(animate);
    // on fait tourner le cube sur ses axes x et y
    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.02;
    // on effectue le rendu de la scène
    renderer.render(scene, camera);
}

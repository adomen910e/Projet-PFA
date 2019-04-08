var camera

function GraphVisualizer(filename) {

    Object.defineProperty(this, 'CAMSTEP', {
        value: 1,
        writable: false,
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(this, 'ROTSTEP', {
        value: 0.4,
        writable: false,
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(this, 'CURSORWIDTH', {
        value: 20,
        writable: false,
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(this, 'CURSORHEIGHT', {
        value: 1,
        writable: false,
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(this, 'CURSORDIST', {
        value: 25,
        writable: false,
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(this, 'CURSORFAKEHEIGHT', {
        value: this.CURSORHEIGHT * 10,
        writable: false,
        enumerable: true,
        configurable: true
    });

    this.isVRActive = false;
    this.keyboard = new THREEx.KeyboardState();
    this.isMouseSelecting = false;
    this.mousePos = new THREE.Vector2(0,0);

    this.intersected = [];
    this.currentTimestamp = 0;
    this.vertices = [];
    this.edges = [];

    this.oldRotationY = 5; // Valeur arbitraire ne se situant pas dans l'intervalle [-Pi, Pi]

    this.cursorSelected = false;
    this.cursorThresholds = [];
    this.pointedOut = false;

    this.bestPositions = [new THREE.Vector3(547, 160, -142), new THREE.Vector3(-386, 1019, -1441), new THREE.Vector3(600, 0, -600), new THREE.Vector3(600, 400, -600)];
    this.bestDirections = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -600), new THREE.Vector3(600, 0, -600), new THREE.Vector3(600, 400, -600)];
    this.savedGroupPosition = new THREE.Vector3();

    this.transitionOn = false;
    this.smoothTransitionOn = false;
    this.smoothTarget = new THREE.Vector3();

    this.continuousXMove = 0;
    this.continuousYMove = 0;

    this.currentPosition = new THREE.Vector3();

    this.raycaster = new THREE.Raycaster();
    this.stats = new Stats();

    // Creation du canvas
    this.container = document.createElement('div');
    document.body.appendChild(this.container);
    var info = document.createElement('div');
    info.style.position = 'absolute';
    info.style.top = '10px';
    info.style.width = '100%';
    info.style.textAlign = 'center';
    info.innerHTML = 'PROJET SUR LES CASQUES DE REALITE VIRTUELLE: AFFICHAGE DE GRANDS GRAPHES';
    this.container.appendChild(info);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Creation de la camera, on la place en variable globale afin que VRController y ait acces (requis lors de la fonction update)
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10000);
    this.camera = camera;

    this.scene.add(new THREE.HemisphereLight(0x808080, 0x606060));

    // Mise en place de la lumière
    var light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0, 6, 0);
    light.castShadow = false;
    light.shadow.camera.top = 2;
    light.shadow.camera.bottom = -2;
    light.shadow.camera.right = 2;
    light.shadow.camera.left = -2;
    light.shadow.mapSize.set(4096, 4096);
    this.scene.add(light);


    this.group = new THREE.Group();
    this.group.type = 'yes';
    this.scene.add(this.group);
    

    this.group_no_move = new THREE.Group();
    this.group_no_move.type = 'no';
    this.scene.add(this.group_no_move);

    var file;

    function loadJSON(callback) {
        var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
        xobj.open('GET', filename, true);

        function onReadyStateChange() {
            if (xobj.readyState == 4 && xobj.status == "200") {
                callback = callback.bind(this);
                callback(xobj.responseText);
            }
        }
        xobj.onreadystatechange = onReadyStateChange.bind(this);

        xobj.send(null);
    }
    loadJSON = loadJSON.bind(this);

    loadJSON(function (response) {
        // On parse le JSON et on le stocke dans un objet
        file = JSON.parse(response);

        var points = [];

        var geoms = [];

        var nbtimestamps = 0;

        this.group.position.copy(this.bestPositions[0].clone().multiplyScalar(-1));
        this.currentPosition.copy(this.group.position);

        
        // Mise en place des noeuds dans les differents timestamps : une geometrie par timestamp qui contient les positions de tous les noeuds
        // On calcule en meme temps le nombre de timestamp maximal et le "centre" du graphe

        var x_cordinates = [];
        var y_cordinates = [];
        var z_cordinates = [];

        var sum_x, sum_y, sum_z;

        for (var i = 0; i < file.nodes.length; i++) {
            var position = new THREE.Vector3(file.nodes[i].pos[0], file.nodes[i].pos[1], file.nodes[i].pos[2]);
            x_cordinates.push(file.nodes[i].pos[0]);
            y_cordinates.push(file.nodes[i].pos[1]);
            z_cordinates.push(file.nodes[i].pos[2]);

            for (var j = 0; j < file.nodes[i].timestamp.length; j++) {
                var timestamp = file.nodes[i].timestamp[j];
                if (timestamp + 1 > nbtimestamps) {
                    for (var k = nbtimestamps; k < timestamp + 1; k++) {
                        geoms.push(new THREE.BufferGeometry());
                        this.vertices.push([]);
                    }
                    nbtimestamps = timestamp + 1;
                }
                this.vertices[timestamp].push(file.nodes[i].pos[0], file.nodes[i].pos[1], file.nodes[i].pos[2]);
            }
            points.push(position);
        }

        sum_x = x_cordinates.reduce(function(a, b) { return a + b; });
        sum_y = y_cordinates.reduce(function(a, b) { return a + b; });
        sum_z = z_cordinates.reduce(function(a, b) { return a + b; });
        avg_x = sum_x/x_cordinates.length;
        avg_y = sum_y/y_cordinates.length;
        avg_z = sum_z/z_cordinates.length;

        this.localCentroid = new THREE.Vector3(avg_x, avg_y, avg_z);
        this.worldCentroid = new THREE.Vector3();
        this.worldCentroid.copy(this.group.localToWorld(this.localCentroid.clone()));

        // Le nombre total de timestamps est enregistre dans une constante
        Object.defineProperty(this, 'NBTIMESTAMPS', {
            value: nbtimestamps,
            writable: false,
            enumerable: true,
            configurable: true
        });

        var sprite = new THREE.TextureLoader().load('textures/circle.png');

        // Rendu des sommets : utilisation de billboards 
        for (var i = 0; i < this.NBTIMESTAMPS; i++) {

            geoms[i].addAttribute('position', new THREE.Float32BufferAttribute(this.vertices[i], 3));
            var material = new THREE.PointsMaterial({
                size: 1,
                color: Math.random() * 0xffffff,
                map: sprite,
                alphaTest: 0.5,
                transparent: true,
                opacity: 0
            });
            if (i == 0) {
                material.opacity = 1;
            }
            var particles = new THREE.Points(geoms[i], material);
            particles.name = "timestamp" + i;
            this.group.add(particles);
        }

        // Mise en place des aretes dans les differents timestamp

        // Stockage des aretes : un tableau pour chaque timestamp, contient les positions de depart et d'arrivee de toutes les aretes
        var edgesGeometry = [];
        for (var i = 0; i < this.NBTIMESTAMPS; i++) {
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

        // Rendu des aretes : une geometrie regroupant toutes les aretes par timestamp
        for (var i = 0; i < this.NBTIMESTAMPS; i++) {
            var edgeMaterial = new THREE.LineBasicMaterial({
                color: Math.random() * 0xffffff,
                linewidth: 1,
                transparent: true,
                opacity: 0
            });
            if (i == 0) {
                edgeMaterial.opacity = 1;
            }
            this.edges[i] = new THREE.LineSegments(edgesGeometry[i], edgeMaterial);
            this.edges[i].name = "timestamp" + i;
            this.group.add(this.edges[i]);
        }

        // Creation du curseur (hitbox + fond visible + seuils + curseur + sphere de retour en position)

        // Hitbox
        geometry = new THREE.BoxBufferGeometry(this.CURSORWIDTH, this.CURSORFAKEHEIGHT, 0.1);
        var material1 = new THREE.MeshStandardMaterial({
            transparent: true,
            visible: false
        });

        var cursorBackground = new THREE.Mesh(geometry, material1);
        cursorBackground.position.x = 0;
        cursorBackground.position.y = -5;
        cursorBackground.position.z = -this.CURSORDIST;
        cursorBackground.lookAt(this.camera.position);
        cursorBackground.name = "cursorBackground";
        this.group_no_move.add(cursorBackground);

        // Fond visible
        geometry = new THREE.BoxBufferGeometry(this.CURSORWIDTH, this.CURSORHEIGHT, 0.1);
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

        // Graduations
        for (var i = 0; i < this.NBTIMESTAMPS; i++) {
            var geometry = new THREE.PlaneBufferGeometry(0.1, this.CURSORHEIGHT);
            var material = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.7,
                metalness: 0.7
            });
            var graduation = new THREE.Mesh(geometry, material);
            cursorBackground.add(graduation);
            graduation.position.z += 0.1;
            graduation.position.x = i / (this.NBTIMESTAMPS - 1) * (this.CURSORWIDTH - this.CURSORHEIGHT) - this.CURSORWIDTH / 2 + this.CURSORHEIGHT / 2;
            this.cursorThresholds.push(graduation.position.x);
        }

        // Curseur
        geometry = new THREE.IcosahedronBufferGeometry(this.CURSORHEIGHT, 3);
        material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.7,
            metalness: 0.7
        });
        var cursor = new THREE.Mesh(geometry, material);

        cursorBackground.add(cursor);
        cursor.position.z += 0.05;
        cursor.position.x = 0;
        cursor.name = "cursor";
        this.moveCursorAtTimestamp(cursor, 0);

        // Sphere de retour en position
        geometry = new THREE.IcosahedronBufferGeometry(this.CURSORHEIGHT + 0.5, 3);
        material = new THREE.MeshStandardMaterial({});
        reset_arrow = new THREE.Mesh(geometry, material);

        reset_arrow.position.copy(cursorBackground.position.clone());
        reset_arrow.position.x -= 15;
        reset_arrow.name = 'reset_arrow';
        this.group_no_move.add(reset_arrow);
        if (this.currentPosition.equals(this.bestPositions[this.currentTimestamp])) {
            reset_arrow.material.emissive.g = 1;
        } else {
            reset_arrow.material.emissive.r = 1;
        }

        //Mise en place des flèches
        geometry = new THREE.CylinderBufferGeometry(1, 1, 0.1, 50);
        var texture = new THREE.TextureLoader().load('textures/flecheBas.png');

        // immediately use the texture for material creation
        material = new THREE.MeshBasicMaterial({
            map: texture
        });

        var xleft = cursorBackground.position.x + this.CURSORWIDTH/2 +2;
        var yleft = cursorBackground.position.y;

        fleche_bas = new THREE.Mesh(geometry, material);
        fleche_bas.position.x = xleft + 3;
        fleche_bas.position.y = yleft - 2;
        fleche_bas.position.z = -20;
        fleche_bas.name = 'flecheB';
        fleche_bas.rotation.x = 0.5 * Math.PI;
        fleche_bas.rotation.y = 0.5 * Math.PI;
        this.group_no_move.add(fleche_bas);


        var texture = new THREE.TextureLoader().load('textures/flecheHaut.png');

        material = new THREE.MeshBasicMaterial({
            map: texture
        });

        fleche_haut = new THREE.Mesh(geometry, material);
        fleche_haut.position.x = xleft + 3;
        fleche_haut.position.y = yleft + 2;
        fleche_haut.position.z = -20;
        fleche_haut.name = 'flecheH';
        fleche_haut.rotation.x = 0.5 * Math.PI;
        fleche_haut.rotation.y = 0.5 * Math.PI;
        this.group_no_move.add(fleche_haut);


        var texture = new THREE.TextureLoader().load('textures/flecheDroite.png');

        material = new THREE.MeshBasicMaterial({
            map: texture
        });

        fleche_droite = new THREE.Mesh(geometry, material);
        fleche_droite.position.x = xleft + 6;
        fleche_droite.position.y = yleft;
        fleche_droite.position.z = -20;
        fleche_droite.name = 'flecheD';
        fleche_droite.rotation.x = 0.5 * Math.PI;
        fleche_droite.rotation.y = 0.5 * Math.PI;
        this.group_no_move.add(fleche_droite);


        var texture = new THREE.TextureLoader().load('textures/flecheGauche.png');

        material = new THREE.MeshBasicMaterial({
            map: texture
        });

        fleche_gauche = new THREE.Mesh(geometry, material);
        fleche_gauche.position.x = xleft;
        fleche_gauche.position.y = yleft;
        fleche_gauche.position.z = -20;
        fleche_gauche.name = 'flecheG';
        fleche_gauche.rotation.x = 0.5 * Math.PI;
        fleche_gauche.rotation.y = 0.5 * Math.PI;
        this.group_no_move.add(fleche_gauche);

        // Bouton de sauvegarde de la position
        var texture = new THREE.TextureLoader().load('textures/save.jpg');
        material = new THREE.MeshBasicMaterial({
            map: texture
        });

        save = new THREE.Mesh(geometry, material);
        save.position.x = xleft + 0.5;
        save.position.y = yleft + 2.5;
        save.position.z = -20;
        save.name = 'save';
        save.rotation.x = 0.5 * Math.PI;
        save.rotation.y = 0.5 * Math.PI;
        this.group_no_move.add(save);

        // Bouton de retour a la position sauvegardee
        var texture = new THREE.TextureLoader().load('textures/retour.jpg');

        material = new THREE.MeshBasicMaterial({
            map: texture
        });

        back = new THREE.Mesh(geometry, material);
        back.position.x = xleft + 0.5;
        back.position.y = yleft - 2.5;
        back.position.z = -20;
        back.name = 'back';
        back.rotation.x = 0.5 * Math.PI;
        back.rotation.y = 0.5 * Math.PI;
        this.group_no_move.add(back);

        

        // Configuration du renderer

        this.renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.gammaInput = true;
        this.renderer.gammaOutput = true;
        this.renderer.shadowMap.enabled = true;
        this.renderer.vr.enabled = true;
        this.container.appendChild(this.renderer.domElement);
        document.body.appendChild(WEBVR.createButton(this.renderer));
        this.container.appendChild(this.stats.dom);


        // Creation des controlleurs standard (gachette uniquement)
        this.controller1 = this.renderer.vr.getController(0);
        this.controller1.addEventListener('selectstart', this.onSelectStart.bind(this));
        this.controller1.addEventListener('selectend', this.onSelectEnd.bind(this));
        this.controller1.userData.isSelecting = 0;
        this.scene.add(this.controller1);

        this.controller2 = this.renderer.vr.getController(1);
        this.controller2.addEventListener('selectstart', this.onSelectStart.bind(this));
        this.controller2.addEventListener('selectend', this.onSelectEnd.bind(this));
        this.controller2.userData.isSelecting = 0;
        this.scene.add(this.controller2);

        var geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]);
        var material = new THREE.MeshBasicMaterial({
            color: 0xff1a1a
        });
        var line = new THREE.Line(geometry);
        line.name = 'line';
        line.scale.z = 2000;
        this.controller1.add(line.clone());
        this.controller2.add(line.clone());

        // On stocke l'objet gamepad dans l'objet THREE representant les controleurs pour acceder a leur orientation
        window.addEventListener("gamepadconnected", function (event) {
            var gamepad = event.gamepad;
            this.controller1.userData.gamepad = gamepad;
        }.bind(this));

        document.addEventListener("mousedown", this.onSelectStart.bind(this));
        document.addEventListener("mouseup", this.onSelectEnd.bind(this));
        document.addEventListener("mousemove", this.onMouseMove.bind(this));

        window.addEventListener('vrdisplaypresentchange', function (event) {

            event.display.isPresenting ? this.isVRActive = true : this.isVRActive = false;

        }.bind(this), false);

        // Utilisation de VRController, qui permet de recuperer via des evenements les interactions sur la plupart des materiels de VR
        window.addEventListener('vr controller connected', function (event) {
            //  The VRController instance is a THREE.Object3D, so we can just add it to the scene:
            var controller = event.detail;
            this.scene.add(controller);
            //  For standing experiences (not seated) we need to set the standingMatrix
            //  otherwise you’ll wonder why your controller appears on the floor
            //  instead of in your hands! And for seated experiences this will have no
            //  effect, so safe to do either way:
            controller.standingMatrix = this.renderer.vr.getStandingMatrix();
            //  And for 3DOF (seated) controllers you need to set the controller.head
            //  to reference your camera. That way we can make an educated guess where
            //  your hand ought to appear based on the camera’s rotation.
            controller.head = this.camera;
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
            controller.type = "Controller";
            controllerMaterial.flatShading = true;
            controllerMesh.rotation.x = -Math.PI / 2;
            handleMesh.position.y = -0.05;
            controllerMesh.add(handleMesh);
            controller.add(controllerMesh);
            controller.addEventListener('thumbstick axes moved', this.onThumbstickMove.bind(this));
            controller.addEventListener('axes moved', this.onThumbstickMove.bind(this));
            controller.addEventListener('disconnected', function (event) {
                controller.parent.remove(controller);
            }.bind(this));
        }.bind(this));
        this.animate();
    });
}

GraphVisualizer.prototype.normalizeMouseInput = function (x, y) {
    return new THREE.Vector2(( x / window.innerWidth ) * 2 - 1, - ( y / window.innerHeight ) * 2 + 1);
}

GraphVisualizer.prototype.onSelectStart = function (event) {
    var intersections = [];

    if (this.isVRActive){
        var controller = event.target;
        // On empeche les clics pendant qu'on est en realite virtuelle
        if (event.clientX !== undefined){ 
            return ;
        }
    } else {
        var mouse = this.normalizeMouseInput(event.clientX, event.clientY);
        this.raycaster.setFromCamera( mouse, camera );
    } 
    
    // On desactive la possibilite de selectionner lorsqu'un movement automatique est en cours
    // On verifie transitionOn pour eviter qu'un deuxième controller effectue une selection meme temps
    if (!this.smoothTransitionOn && !this.transitionOn) {   
        intersections = this.isVRActive? this.getIntersections(controller) : this.raycaster.intersectObjects(this.group_no_move.children);
    }
    //Intersection avec un objet
    if (intersections.length > 0) {
        // On ne conserve que le premier objet traverse
        var intersection = intersections[0];    
        var object = intersection.object;

        if (object.type === "Mesh") {

            // Selection du curseur
            if (object.name === "cursorBackground") { 
                this.cursorSelected = true;
                this.isVRActive? controller.userData.isSelecting = true : this.isMouseSelecting = true;

                // On lance le deplacement automatique si on se trouve à la position initiale
                if (this.currentPosition.distanceTo(this.bestPositions[this.currentTimestamp]) < 1) {
                    this.transitionOn = true;
                }
                this.group_no_move.getObjectByName("cursorBackground").getObjectByName("cursor").material.emissive.b = 0.5;

                // Bouton de retour à la position initiale
            } else if ((object.name === "reset_arrow") && !this.transitionOn) { 
                this.smoothTarget.copy(this.bestPositions[this.currentTimestamp].clone().multiplyScalar(-1));
                this.smoothTransitionOn = true;
                this.group_no_move.getObjectByName("cursorBackground").getObjectByName("cursor").material.emissive.r = 0.5;

                // Fleches de movement
            } else if (object.name.includes("fleche")){ 
                if (object.name === "flecheH") { 
                    this.continuousYMove = -this.CAMSTEP;
    
                } else if (object.name === "flecheB") { 
                    this.continuousYMove = this.CAMSTEP;
      
                } else if (object.name === "flecheD") {
                    this.continuousXMove = this.CAMSTEP;
    
                } else if (object.name === "flecheG") {
                    this.continuousXMove = -this.CAMSTEP;
                }
                var reset = this.group_no_move.getObjectByName("reset_arrow");
                if (reset.material.emissive.b == 0) {
                    this.resetButtonToBlue();
                }

                // Bouton de sauvegarde
            } else if (object.name === "save"){
                this.savedGroupPosition.copy(this.group.position);

                // Bouton de retour a la position sauvegardee
            } else if (object.name === "back"){
                this.smoothTarget.copy(this.savedGroupPosition);
                this.smoothTransitionOn = true;
                this.group_no_move.getObjectByName("cursorBackground").getObjectByName("cursor").material.emissive.r = 0.5;
            }
        }
    }
};

GraphVisualizer.prototype.onSelectEnd = function (event) {
    var controller = event.target;
    this.continuousXMove = 0;
    this.continuousYMove = 0;
    this.isMouseSelecting = false;

    if (this.cursorSelected) {
        var cursor = this.group_no_move.getObjectByName("cursorBackground").getObjectByName("cursor");
        var timestampInfos = this.computeTimestampFromPos(cursor.position.x);
        var timestamp = timestampInfos.timestamp;

        // Lorsqu'on relache le curseur il vient se placer sur la graduation la plus proche
        this.moveCursorAtTimestamp(cursor, timestamp);
        cursor.material.emissive.b = 0;
        this.cursorSelected = false;

        if (this.isVRActive && controller.userData.isSelecting) {
            // On est potentiellement sorti de la hitbox lors de la selection, donc on remet cette variable à la valeur initiale pour le controller utilise
            this.oldRotationY = 5;
            controller.userData.isSelecting = 0;
        }  
        this.pointedOut = false;

        // On accorde l'apparence du graphe avec la position du curseur
        this.fadingTransition(cursor.position.x);

        // Deplacement fluide de la camera vers la "best position" du timestamp
        if (this.transitionOn) { 
            this.smoothTarget.copy(this.bestPositions[this.currentTimestamp].clone().multiplyScalar(-1));
            this.smoothTransitionOn = true;
            cursor.material.emissive.r = 0.5;
        }
        this.transitionOn = false;
    }
};

GraphVisualizer.prototype.onMouseMove = function (event) {
    if (!this.isVRActive){
        this.mousePos.x = event.clientX;
        this.mousePos.y = event.clientY;
    }
}


//https://stackoverflow.com/questions/42812861/three-js-pivot-point/42866733#42866733
GraphVisualizer.prototype.rotateAboutPoint = function (obj, point, axis, theta, pointIsWorld) {
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
};

// Permet de se deplacer dans l'espace suivant la direction du regard
GraphVisualizer.prototype.moveInSpace = function (xAxisValue, yAxisValue, useRotate = false) {
    var xstep = this.CAMSTEP * xAxisValue;
    var ystep = this.CAMSTEP * yAxisValue;

    var direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    var ymove = direction.clone().multiplyScalar(ystep);
    this.group.position.add(ymove);

    if (useRotate) {

        // Le joystick sur le côte permet de tourner la camera
        if (xAxisValue > 0.6) {
            var theta = xAxisValue * THREE.Math.degToRad(this.ROTSTEP);
            this.rotateAboutPoint(this.group, this.camera.position, this.camera.position.clone().normalize(), theta, false);
        }
    } else {

        // Le joystick sur le côte permet de se deplacer lateralement (straf)
        var axisOfRotation = this.camera.position.clone().normalize(); // L'axe de la rotation est celui allant de la camera aux "pieds"
        var quad = new THREE.Quaternion().setFromAxisAngle(axisOfRotation, Math.PI / 2);
        direction.applyQuaternion(quad);
        var xmove = direction.multiplyScalar(xstep);
        this.group.position.add(xmove);
    }
};

GraphVisualizer.prototype.onThumbstickMove = function (event) {
    if (!this.smoothTransitionOn && !this.transitionOn) {
        var x = parseFloat(event.axes[0].toFixed(2));
        var y = parseFloat(event.axes[1].toFixed(2));
        this.moveInSpace(x, y);
    }

    // On change la couleur du bouton de reset pour notifier qu'il est utilisable
    var reset = this.group_no_move.getObjectByName("reset_arrow");
    if (reset.material.emissive.b == 0) {
        this.resetButtonToBlue();
    }
};

GraphVisualizer.prototype.getIntersections = function (controller) {
    var tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);

    this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    var toIntersect = this.group_no_move.children.slice();
    return this.raycaster.intersectObjects(toIntersect);
};

GraphVisualizer.prototype.intersectObjects = function (controller) {

    var line = controller.getObjectByName('line');
    var intersections = this.getIntersections(controller);

    if (intersections.length > 0) {
        var intersection = intersections[0];
        var object = intersection.object;

        if (object.name.charAt(0) == 'n') {
            object.material.emissive.b = 1;
        }

        this.intersected.push(object);
        line.scale.z = intersection.distance;
        return intersection;
    } else {
        line.scale.z = 2000;
    }
};

GraphVisualizer.prototype.cleanIntersected = function () {
    while (this.intersected.length) {
        var object = this.intersected.pop();

        if (object.name.charAt(0) == 'n') {
            object.material.emissive.b = 0;
        }
    }
};

GraphVisualizer.prototype.computeTimestampFromUV = function (x) {
    var timestamp = Math.floor((x * 100) / (100 / this.NBTIMESTAMPS));
    if (timestamp < 0) {
        timestamp = 0;
    }

    if (timestamp >= this.NBTIMESTAMPS) {
        timestamp = this.NBTIMESTAMPS - 1;
    }

    var inf = Math.floor((x * 100) / (100 / (this.NBTIMESTAMPS - 1)));
    if (inf < 0) {
        inf = 0;
    }

    var sup = Math.floor((x * 100) / (100 / (this.NBTIMESTAMPS - 1))) + 1;
    if (sup >= this.NBTIMESTAMPS) {
        sup = this.NBTIMESTAMPS - 1;
    }

    var returned = {
        timestamp: timestamp,
        previous: inf,
        next: sup
    }

    return returned;
};

GraphVisualizer.prototype.computeTimestampFromPos = function (x) {
    var xUV = (x + this.CURSORWIDTH / 2) / this.CURSORWIDTH;
    var timestampInfos = this.computeTimestampFromUV(xUV);
    var returned = {
        timestamp: timestampInfos.timestamp,
        previous: timestampInfos.previous,
        next: timestampInfos.next
    }
    return returned;
};

GraphVisualizer.prototype.moveCursorAtTimestamp = function (cursor, timestamp) {
    cursor.position.x = timestamp / (this.NBTIMESTAMPS - 1) * (this.CURSORWIDTH - this.CURSORHEIGHT) - this.CURSORWIDTH / 2 + this.CURSORHEIGHT / 2;
    this.currentTimestamp = timestamp;
};

GraphVisualizer.prototype.moveCursorAtUVX = function (cursor, x) {
    cursor.position.x = x * (this.CURSORWIDTH) - this.CURSORWIDTH / 2 + this.CURSORHEIGHT / 2;
    if (cursor.position.x < -this.CURSORWIDTH / 2) {
        cursor.position.x = -this.CURSORWIDTH / 2 + this.CURSORHEIGHT / 2;
    }
    if (cursor.position.x > this.CURSORWIDTH / 2) {
        cursor.position.x = this.CURSORWIDTH / 2 - this.CURSORHEIGHT / 2;
    }
};

GraphVisualizer.prototype.moveCursorFromAllPos = function (cursor, orientation) {
    var quat = new THREE.Quaternion();
    quat.fromArray(orientation);
    var eulerRotation = new THREE.Euler();
    eulerRotation.setFromQuaternion(quat);
    if (this.oldRotationY == 5) {
        this.oldRotationY = eulerRotation.y;
    }
    var diff = this.oldRotationY - eulerRotation.y;
    this.oldRotationY = eulerRotation.y;

    // On ne prend en compte les valeurs qu'a partir d'un certain seuil (1/1000)
    if ((diff * 100 > 0.1) || (diff * 100 < -0.1)) {
        var offset = Math.tan(diff) * (this.CURSORDIST);
        cursor.position.x += offset;
    }
    if (cursor.position.x < -this.CURSORWIDTH / 2) {
        cursor.position.x = -this.CURSORWIDTH / 2;
    }
    if (cursor.position.x > this.CURSORWIDTH / 2) {
        cursor.position.x = this.CURSORWIDTH / 2;
    }
};

GraphVisualizer.prototype.fadingTransition = function (x) {
    var infos = this.computeTimestampFromPos(x);
    var transitionPercentage = (x - this.cursorThresholds[infos.previous]) / (this.cursorThresholds[infos.next] - this.cursorThresholds[infos.previous]);
    for (var i = 0; i < this.group.children.length; i++) {
        var mesh = this.group.children[i];

        if (mesh.name.includes("timestamp")) {
            // Lorsqu'on depasse la premiere ou la derniere graduation
            if ((mesh.name.slice(-1) == infos.previous) && (infos.previous == infos.next)) {
                mesh.material.opacity = 1;
                mesh.material.visible = true;
                mesh.material.needsUpdate = true;

                // Graphe du timestamp precedent
            } else if (mesh.name.slice(-1) == infos.previous) {
                mesh.material.opacity = 1 - transitionPercentage;

                if (mesh.material.opacity <= 0.1) {
                    mesh.material.opacity = 0;
                    mesh.material.visible = false;

                } else if (mesh.material.opacity >= 0.1) {
                    mesh.material.visible = true;
                }

                mesh.material.needsUpdate = true;

                // Graphe du timestamp suivant
            } else if (mesh.name.slice(-1) == infos.next) {
                mesh.material.opacity = transitionPercentage;

                if (mesh.material.opacity <= 0.1) {
                    mesh.material.opacity = 0;
                    mesh.material.visible = false;

                } else if (mesh.material.opacity >= 0.1) {
                    mesh.material.visible = true;
                }

                mesh.material.needsUpdate = true;

                // On n'affiche pas les autres temps
            } else {
                mesh.material.visible = false;
                mesh.material.opacity = 0;
                mesh.material.needsUpdate = true;
            }
        }
    }
};

GraphVisualizer.prototype.moveCursorGroup = function () {
    var direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    this.group_no_move.position.copy(this.camera.position).add(direction.multiplyScalar(12));
    this.group_no_move.lookAt(this.camera.position);
};

GraphVisualizer.prototype.transitionMovement = function (x) {
    var infos = this.computeTimestampFromPos(x);
    if (infos.previous != infos.next) {
        var transitionPercentage = (x - this.cursorThresholds[infos.previous]) / (this.cursorThresholds[infos.next] - this.cursorThresholds[infos.previous]);
        var pos = this.bestPositions[infos.previous].clone().multiplyScalar(-1);
        var targetPos = this.bestPositions[infos.next].clone().multiplyScalar(-1);
        pos.lerp(targetPos, transitionPercentage);
        this.group.position.copy(pos);
    }
};

GraphVisualizer.prototype.smoothMovement = function () {
    var pos = this.group.position.clone();
    var targetPos = this.smoothTarget;
    pos.lerp(targetPos, 0.02);

    this.group.position.copy(pos);
};

GraphVisualizer.prototype.resetButtonToRed = function () {
    var reset = this.group_no_move.getObjectByName("reset_arrow");
    reset.material.emissive.g = 0;
    reset.material.emissive.b = 0;
    reset.material.emissive.r = 1;
};

GraphVisualizer.prototype.resetButtonToGreen = function () {
    var reset = this.group_no_move.getObjectByName("reset_arrow");
    reset.material.emissive.g = 1;
    reset.material.emissive.b = 0;
    reset.material.emissive.r = 0;
};

GraphVisualizer.prototype.resetButtonToBlue = function () {
    var reset = this.group_no_move.getObjectByName("reset_arrow");
    reset.material.emissive.g = 0;
    reset.material.emissive.b = 1;
    reset.material.emissive.r = 0;
};

// Ces fonctions effectuent des rotations relativement aux coordonnées globales, pas a la camera
// Troisieme parametre (axe de la rotation) a modifier

GraphVisualizer.prototype.rotateUp = function (theta) {
    this.rotateAboutPoint(this.group, this.worldCentroid, new THREE.Vector3(1,0,0),  THREE.Math.degToRad(theta));
}

GraphVisualizer.prototype.rotateDown = function (theta) {
    this.rotateAboutPoint(this.group, this.worldCentroid, new THREE.Vector3(-1,0,0),  THREE.Math.degToRad(theta));
}

GraphVisualizer.prototype.rotateLeft = function (theta) {
    this.rotateAboutPoint(this.group, this.worldCentroid, new THREE.Vector3(0,-1,0),  THREE.Math.degToRad(theta));
}

GraphVisualizer.prototype.rotateRight = function (theta) {
    this.rotateAboutPoint(this.group, this.worldCentroid, new THREE.Vector3(0,1,0),  THREE.Math.degToRad(theta));
}

GraphVisualizer.prototype.rotatePitch = function (theta) {
    this.rotateAboutPoint(this.group, this.worldCentroid, new THREE.Vector3(0,0,1),  THREE.Math.degToRad(theta));
}

GraphVisualizer.prototype.rotatePitchInv = function (theta) {
    this.rotateAboutPoint(this.group, this.worldCentroid, new THREE.Vector3(0,0,-1),  THREE.Math.degToRad(theta));
}

// Permet le controle au clavier
GraphVisualizer.prototype.inspectKeyboard = function () {
    if ( this.keyboard.pressed('left') )
        this.moveInSpace(-1, 0);
    if ( this.keyboard.pressed('right') )
        this.moveInSpace(1, 0);
    if ( this.keyboard.pressed('up') )
        this.moveInSpace(0, -1);
    if ( this.keyboard.pressed('down') )
        this.moveInSpace(0, 1);
};

GraphVisualizer.prototype.animate = function () {
    this.renderer.setAnimationLoop(this.render.bind(this));
};


GraphVisualizer.prototype.render = function () {
    this.cleanIntersected();

    // Mise a jour de la position du centre du graphe
    this.worldCentroid.copy(this.group.localToWorld(this.localCentroid.clone())); 
    
    if (!this.isVRActive){
        this.inspectKeyboard();
        this.raycaster.setFromCamera(this.normalizeMouseInput(this.mousePos.x, this.mousePos.y), camera);
        var intersection3 = this.raycaster.intersectObjects(this.group_no_move.children)[0];
    } else {
        var intersection1 = this.intersectObjects(this.controller1);
        var intersection2 = this.intersectObjects(this.controller2);
    }
    
    // Permet de se deplacer en continu avec les fleches
    if ((this.continuousXMove != 0) || (this.continuousYMove != 0)) {
        this.moveInSpace(this.continuousXMove, this.continuousYMove);
    }

    // L'environnement suit la camera
    this.moveCursorGroup();

    var cursor = this.group_no_move.getObjectByName("cursorBackground").getObjectByName("cursor");

    // Deplacement du curseur en fonction de la position ou de la rotation du pointeur
    if (this.cursorSelected) {

        // Controller1 a la selection
        if (this.controller1.userData.isSelecting) {
            if (!this.pointedOut && (intersection1 !== undefined) && (intersection1.object == this.group_no_move.getObjectByName("cursorBackground"))) {
                this.moveCursorAtUVX(cursor, intersection1.uv.x);
            } else {
                this.pointedOut = true;
                this.moveCursorFromAllPos(cursor, this.controller1.userData.gamepad.pose.orientation);
            }

        // Controller2 a la selection
        } else if (this.controller2.userData.isSelecting) {
            if (!this.pointedOut && (intersection2 !== undefined) && (intersection2.object == this.group_no_move.getObjectByName("cursorBackground"))) {
                this.moveCursorAtUVX(cursor, intersection2.uv.x);
            } else {
                pointedOut = true;
                this.moveCursorFromAllPos(cursor, this.controller2.userData.gamepad.pose.orientation);
            }

        // Selection a la souris
        } else if (this.isMouseSelecting) {
            if (!this.pointedOut && (intersection3 !== undefined) && (intersection3.object == this.group_no_move.getObjectByName("cursorBackground"))) { 
                this.moveCursorAtUVX(cursor, intersection3.uv.x);
            } else {
                this.pointedOut = true;
            }
        }
        // On met le graphe dans l'etat correspondant a la position du curseur
        this.fadingTransition(cursor.position.x);
    }

    // Mouvement lors du changement de temps
    if (this.transitionOn) {
        this.resetButtonToRed();
        this.transitionMovement(cursor.position.x);
    }

    // Mise a jour de la position actuelle
    this.currentPosition.copy(this.group.position).multiplyScalar(-1);

    // Transition douce pour revenir a la position par defaut du timestamp le plus proche
    if (this.smoothTransitionOn) {
        this.resetButtonToRed();
        this.smoothMovement();
        if (this.currentPosition.distanceTo(this.smoothTarget.clone().multiplyScalar(-1)) < 1) {
            this.group.position.copy(this.smoothTarget);
            this.smoothTransitionOn = false;
            this.currentPosition.copy(this.group.position).multiplyScalar(-1);
            cursor.material.emissive.r = 0;
            this.resetButtonToGreen();
        }
    }

    THREE.VRController.update();
    this.stats.update();
    this.renderer.render(this.scene, this.camera);
};

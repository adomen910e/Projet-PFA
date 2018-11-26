import 'aframe';
import 'aframe-extras';
import 'aframe-forcegraph-component';

import Kapsule from 'kapsule';

//

export default Kapsule({

  props: {
    width: { default: window.innerWidth, triggerUpdate: false, onChange(width, state) { if(state.container) state.container.style.width = width }},
    height: { default: window.innerHeight, triggerUpdate: false, onChange(height, state) { if(state.container) state.container.style.height = height }},
    jsonUrl: {},
    graphData: { default: { nodes: [], links: [] }},
    numDimensions: { default: 3 },
    dagMode: {},
    dagLevelDistance: {},
    backgroundColor: { default: '#002' },
    showNavInfo: { default: true },
    nodeRelSize: { default: 4 }, // volume per val unit
    nodeId: { default: 'id' },
    nodeLabel: { default: 'name' },
    nodeDesc: { default: 'desc' },
    nodeVal: { default: 'val' },
    nodeResolution: { default: 8 }, // how many slice segments in the sphere's circumference
    nodeColor: { default: 'color' },
    nodeAutoColorBy: {},
    nodeOpacity: { default: 0.75 },
    nodeThreeObject: {},
    linkSource: { default: 'source' },
    linkTarget: { default: 'target' },
    linkLabel: { default: 'name' },
    linkDesc: { default: 'desc' },
    linkHoverPrecision: { default: 2 },
    linkVisibility: { default: true },
    linkColor: { default: 'color' },
    linkAutoColorBy: {},
    linkOpacity: { default: 0.2 },
    linkWidth: { default: 0 },
    linkResolution: { default: 6 }, // how many radial segments in each line cylinder's geometry
    linkCurvature: { default: 0 },
    linkCurveRotation: { default: 0 },
    linkMaterial: {},
    linkDirectionalArrowLength: { default: 0 },
    linkDirectionalArrowColor: {},
    linkDirectionalArrowRelPos: { default: 0.5 }, // value between 0<>1 indicating the relative pos along the (exposed) line
    linkDirectionalArrowResolution: { default: 8 }, // how many slice segments in the arrow's conic circumference
    linkDirectionalParticles: { default: 0 }, // animate photons travelling in the link direction
    linkDirectionalParticleSpeed: { default: 0.01 }, // in link length ratio per frame
    linkDirectionalParticleWidth: { default: 0.5 },
    linkDirectionalParticleColor: {},
    linkDirectionalParticleResolution: { default: 4 }, // how many slice segments in the particle sphere's circumference
    forceEngine: { default: 'd3' }, // d3 or ngraph
    d3AlphaDecay: { default: 0.0228 },
    d3VelocityDecay: { default: 0.4 },
    warmupTicks: { default: 0 }, // how many times to tick the force engine at init before starting to render
    cooldownTicks: {},
    cooldownTime: { default: 15000 }, // ms
    onEngineTick: {},
    onEngineStop: {}
  },

  aliases: { // Prop names supported for backwards compatibility
    nameField: 'nodeLabel',
    idField: 'nodeId',
    valField: 'nodeVal',
    colorField: 'nodeColor',
    autoColorBy: 'nodeAutoColorBy',
    linkSourceField: 'linkSource',
    linkTargetField: 'linkTarget',
    linkColorField: 'linkColor',
    lineOpacity: 'linkOpacity'
  },

  init(domNode, state) {
    // Wipe DOM
/*
    domNode.innerHTML = '';

    state.container = document.createElement('div');
    domNode.appendChild(state.container);
    state.container.style.position = 'relative';
    state.container.style.width = state.width;
    state.container.style.height = state.height;
*/

//    // Add nav info section
//    state.container.appendChild(state.navInfo = document.createElement('div'));
//    state.navInfo.className = 'graph-nav-info';
//    state.navInfo.textContent = 'Mouse drag: look, gamepad/arrow/wasd keys: move';
//
//    // Add scene
//    let scene;
//    state.container.appendChild(scene = document.createElement('a-scene'));
//    scene.setAttribute('embedded', '');
//    //scene.setAttribute('stats', null);
//
//    scene.appendChild(state.sky = document.createElement('a-sky'));
//
//    // Add camera and cursor
//    let cameraG;
//    scene.appendChild(cameraG = document.createElement('a-entity'));
//    cameraG.setAttribute('position', '0 0 300');
//    cameraG.setAttribute('movement-controls', 'fly: true; speed: 7');
//
//    let camera;
//    cameraG.appendChild(camera = document.createElement('a-entity'));
//    camera.setAttribute('camera', '');
//    camera.setAttribute('position', '0 0.001 0');
//    camera.setAttribute('look-controls', 'reverseMouseDrag: false; pointerLockEnabled: true');
//
//    /*let cursor;
//    camera.appendChild(cursor = document.createElement('a-cursor'));
//    cursor.setAttribute('color', 'lavender');
//    cursor.setAttribute('opacity', 0.5);*/
//
//    // Add forcegraph entity
//    scene.appendChild(state.forcegraph = document.createElement('a-entity'));
//    state.forcegraph.setAttribute('forcegraph', null);
//      
//     renderer = new THREE.WebGLRenderer({
//        antialias: true
//    });
//
//    renderer.setPixelRatio(window.devicePixelRatio);
//    renderer.setSize(window.innerWidth, window.innerHeight);
//    renderer.gammaInput = true;
//    renderer.gammaOutput = true;
//    renderer.shadowMap.enabled = true;
//    renderer.vr.enabled = true;
//    container.appendChild(renderer.domElement);
//    document.body.appendChild(WEBVR.createButton(renderer));
//
//    // controllers
//    controller1 = renderer.vr.getController(0);
//    controller1.addEventListener('selectstart', onSelectStart);
//    controller1.addEventListener('selectend', onSelectEnd);
//    scene.add(controller1);
//
//
//
//    controller2 = renderer.vr.getController(1);
//    controller2.addEventListener('selectstart', onSelectStart);
//    controller2.addEventListener('selectend', onSelectEnd);
//    scene.add(controller2);
      
      
  },

  update(state) {
    state.sky.setAttribute('color', state.backgroundColor);
    state.navInfo.style.display = state.showNavInfo ? null : 'none';

    const passThroughProps = [
      'jsonUrl',
      'numDimensions',
      'dagMode',
      'dagLevelDistance',
      'nodeRelSize',
      'nodeId',
      'nodeLabel',
      'nodeDesc',
      'nodeVal',
      'nodeResolution',
      'nodeColor',
      'nodeAutoColorBy',
      'nodeOpacity',
      'nodeThreeObject',
      'linkSource',
      'linkTarget',
      'linkLabel',
      'linkDesc',
      'linkHoverPrecision',
      'linkVisibility',
      'linkColor',
      'linkAutoColorBy',
      'linkOpacity',
      'linkWidth',
      'linkResolution',
      'linkCurvature',
      'linkCurveRotation',
      'linkMaterial',
      'linkDirectionalArrowLength',
      'linkDirectionalArrowColor',
      'linkDirectionalArrowRelPos',
      'linkDirectionalArrowResolution',
      'linkDirectionalParticles',
      'linkDirectionalParticleSpeed',
      'linkDirectionalParticleWidth',
      'linkDirectionalParticleColor',
      'linkDirectionalParticleResolution',
      'forceEngine',
      'd3AlphaDecay',
      'd3VelocityDecay',
      'warmupTicks',
      'cooldownTicks',
      'cooldownTime',
      'onEngineTick',
      'onEngineStop'
    ];

    const newProps = Object.assign({},
/*      ...Object.entries(state)
        .filter(([prop, val]) => passThroughProps.indexOf(prop) != -1 && val !== undefined && val !== null)
        .map(([key, val]) => ({ [key]: serialize(val) })),
      ...Object.entries(state.graphData)
        .map(([key, val]) => ({ [key]: JSON.stringify(val) })) // convert nodes & links to strings
    );

    state.forcegraph.setAttribute('forcegraph', newProps, true);

    //*/

    function serialize(p) {
      return p instanceof Function ? p.toString() : p; // convert functions to strings
    }
  }
});


ffunction onWindowResize() {
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
        controller.add(object);
        controller.userData.selected = object;
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


function render() {
    cleanIntersected();
    intersectObjects(controller1);
    intersectObjects(controller2);
    renderer.render(scene, camera);
}
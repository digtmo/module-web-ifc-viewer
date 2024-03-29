import { BoxGeometry, BufferGeometry, Group, Line, Mesh, Vector3 } from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { disposeMeshRecursively } from '../../../utils/ThreeUtils';
import { CameraProjections } from '../../../base-types';
export class IfcDimensionLine {
    constructor(context, start, end, lineMaterial, endpointMaterial, endpointGeometry, className, endpointScale) {
        // Elements
        this.root = new Group();
        this.endpointMeshes = [];
        this.scale = new Vector3(1, 1, 1);
        this.boundingSize = 0.05;
        this.context = context;
        this.labelClassName = className;
        this.start = start;
        this.end = end;
        this.scale = endpointScale;
        this.lineMaterial = lineMaterial;
        this.endpointMaterial = endpointMaterial;
        this.length = this.getLength();
        this.center = this.getCenter();
        this.axis = new BufferGeometry().setFromPoints([start, end]);
        this.line = new Line(this.axis, this.lineMaterial);
        this.root.add(this.line);
        this.endpoint = endpointGeometry;
        this.addEndpointMeshes();
        this.textLabel = this.newText();
        this.root.renderOrder = 2;
        this.context.getScene().add(this.root);
        this.context.ifcCamera.onChange.on(() => this.rescaleObjectsToCameraPosition());
        this.rescaleObjectsToCameraPosition();
    }
    dispose() {
        this.removeFromScene();
        this.context = null;
        disposeMeshRecursively(this.root);
        this.root = null;
        disposeMeshRecursively(this.line);
        this.line = null;
        this.endpointMeshes.forEach((mesh) => disposeMeshRecursively(mesh));
        this.endpointMeshes.length = 0;
        this.axis.dispose();
        this.axis = null;
        this.endpoint.dispose();
        this.endpoint = null;
        this.textLabel.removeFromParent();
        this.textLabel.element.remove();
        this.textLabel = null;
        this.lineMaterial.dispose();
        this.lineMaterial = null;
        this.endpointMaterial.dispose();
        this.endpointMaterial = null;
        if (this.boundingMesh) {
            disposeMeshRecursively(this.boundingMesh);
            this.boundingMesh = null;
        }
    }
    get boundingBox() {
        return this.boundingMesh;
    }
    get text() {
        return this.textLabel;
    }
    set dimensionColor(dimensionColor) {
        this.endpointMaterial.color = dimensionColor;
        this.lineMaterial.color = dimensionColor;
    }
    set visibility(visible) {
        this.root.visible = visible;
        this.textLabel.visible = visible;
    }
    set endpointGeometry(geometry) {
        this.endpointMeshes.forEach((mesh) => this.root.remove(mesh));
        this.endpointMeshes = [];
        this.endpoint = geometry;
        this.addEndpointMeshes();
    }
    set endpointScale(scale) {
        this.scale = scale;
        this.endpointMeshes.forEach((mesh) => mesh.scale.set(scale.x, scale.y, scale.z));
    }
    set endPoint(point) {
        this.end = point;
        if (!this.axis)
            return;
        const position = this.axis.attributes.position;
        if (!position)
            return;
        position.setXYZ(1, point.x, point.y, point.z);
        position.needsUpdate = true;
        this.endpointMeshes[1].position.set(point.x, point.y, point.z);
        this.endpointMeshes[1].lookAt(this.start);
        this.endpointMeshes[0].lookAt(this.end);
        this.length = this.getLength();
        this.textLabel.element.textContent = this.getTextContent();
        this.center = this.getCenter();
        this.textLabel.position.set(this.center.x, this.center.y, this.center.z);
        this.line.computeLineDistances();
    }
    removeFromScene() {
        this.context.getScene().remove(this.root);
        this.root.remove(this.textLabel);
    }
    createBoundingBox() {
        this.boundingMesh = this.newBoundingBox();
        this.setupBoundingBox(this.end);
    }
    rescaleObjectsToCameraPosition() {
        this.endpointMeshes.forEach((mesh) => this.rescaleMesh(mesh, IfcDimensionLine.scaleFactor));
        if (this.boundingMesh) {
            this.rescaleMesh(this.boundingMesh, this.boundingSize, true, true, false);
        }
    }
    rescaleMesh(mesh, scalefactor = 1, x = true, y = true, z = true) {
        const camera = this.context.ifcCamera.activeCamera;
        let scale = new Vector3().subVectors(mesh.position, camera.position).length();
        if (this.context.ifcCamera.projection === CameraProjections.Orthographic) {
            scale *= 0.1;
        }
        scale *= scalefactor;
        const scaleX = x ? scale : 1;
        const scaleY = y ? scale : 1;
        const scaleZ = z ? scale : 1;
        mesh.scale.set(scaleX, scaleY, scaleZ);
    }
    addEndpointMeshes() {
        this.newEndpointMesh(this.start, this.end);
        this.newEndpointMesh(this.end, this.start);
    }
    newEndpointMesh(position, direction) {
        const mesh = new Mesh(this.endpoint, this.endpointMaterial);
        mesh.position.set(position.x, position.y, position.z);
        mesh.scale.set(this.scale.x, this.scale.y, this.scale.z);
        mesh.lookAt(direction);
        this.endpointMeshes.push(mesh);
        this.root.add(mesh);
    }
    newText() {
        const htmlText = document.createElement('div');
        htmlText.className = this.labelClassName;
        htmlText.textContent = this.getTextContent();
        const label = new CSS2DObject(htmlText);
        label.position.set(this.center.x, this.center.y, this.center.z);
        this.root.add(label);
        return label;
    }
    getTextContent() {
        return `${this.length / IfcDimensionLine.scale} ${IfcDimensionLine.units}`;
    }
    newBoundingBox() {
        const box = new BoxGeometry(1, 1, this.length);
        return new Mesh(box);
    }
    setupBoundingBox(end) {
        if (!this.boundingMesh)
            return;
        this.boundingMesh.position.set(this.center.x, this.center.y, this.center.z);
        this.boundingMesh.lookAt(end);
        this.boundingMesh.visible = false;
        this.root.add(this.boundingMesh);
    }
    getLength() {
        return parseFloat(this.start.distanceTo(this.end).toFixed(2));
    }
    getCenter() {
        let dir = this.end.clone().sub(this.start);
        const len = dir.length() * 0.5;
        dir = dir.normalize().multiplyScalar(len);
        return this.start.clone().add(dir);
    }
}
IfcDimensionLine.scaleFactor = 0.1;
IfcDimensionLine.scale = 1;
IfcDimensionLine.units = 'm';
//# sourceMappingURL=dimension-line.js.map
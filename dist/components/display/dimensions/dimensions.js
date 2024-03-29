import { ConeGeometry, LineDashedMaterial, MeshBasicMaterial, Vector3 } from 'three';
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { IfcComponent } from '../../../base-types';
import { IfcDimensionLine } from './dimension-line';
export class IfcDimensions extends IfcComponent {
    constructor(context) {
        super(context);
        this.dimensions = [];
        this.labelClassName = 'ifcjs-dimension-label';
        this.previewClassName = 'ifcjs-dimension-preview';
        // State
        this.enabled = false;
        this.preview = false;
        this.dragging = false;
        this.snapDistance = 0.25;
        // Measures
        this.baseScale = new Vector3(1, 1, 1);
        // Materials
        this.lineMaterial = new LineDashedMaterial({
            color: 0x000000,
            linewidth: 2,
            depthTest: false,
            dashSize: 0.2,
            gapSize: 0.2
        });
        this.endpointsMaterial = new MeshBasicMaterial({ color: 0x000000, depthTest: false });
        // Temp variables
        this.startPoint = new Vector3();
        this.endPoint = new Vector3();
        this.context = context;
        this.endpoint = IfcDimensions.getDefaultEndpointGeometry();
        const htmlPreview = document.createElement('div');
        htmlPreview.className = this.previewClassName;
        this.previewElement = new CSS2DObject(htmlPreview);
        this.previewElement.visible = false;
    }
    dispose() {
        this.context = null;
        this.dimensions.forEach((dim) => dim.dispose());
        this.dimensions = null;
        this.currentDimension = null;
        this.endpoint.dispose();
        this.endpoint = null;
        this.previewElement.removeFromParent();
        this.previewElement.element.remove();
        this.previewElement = null;
    }
    update(_delta) {
        if (this.enabled && this.preview) {
            const intersects = this.context.castRayIfc();
            this.previewElement.visible = !!intersects;
            if (!intersects)
                return;
            this.previewElement.visible = true;
            const closest = this.getClosestVertex(intersects);
            this.previewElement.visible = !!closest;
            if (!closest)
                return;
            this.previewElement.position.set(closest.x, closest.y, closest.z);
            if (this.dragging) {
                this.drawInProcess();
            }
        }
    }
    // TODO: This causes a memory leak, and it's a bit confusing
    setArrow(height, radius) {
        this.endpoint = IfcDimensions.getDefaultEndpointGeometry(height, radius);
    }
    setPreviewElement(element) {
        this.previewElement = new CSS2DObject(element);
    }
    get active() {
        return this.enabled;
    }
    get previewActive() {
        return this.preview;
    }
    get previewObject() {
        return this.previewElement;
    }
    set previewActive(state) {
        this.preview = state;
        const scene = this.context.getScene();
        if (this.preview) {
            scene.add(this.previewElement);
        }
        else {
            scene.remove(this.previewElement);
        }
    }
    set active(state) {
        this.enabled = state;
        this.dimensions.forEach((dim) => {
            dim.visibility = state;
        });
    }
    set dimensionsColor(color) {
        this.endpointsMaterial.color = color;
        this.lineMaterial.color = color;
    }
    set dimensionsWidth(width) {
        this.lineMaterial.linewidth = width;
    }
    set endpointGeometry(geometry) {
        this.dimensions.forEach((dim) => {
            dim.endpointGeometry = geometry;
        });
    }
    set endpointScaleFactor(factor) {
        IfcDimensionLine.scaleFactor = factor;
    }
    set endpointScale(scale) {
        this.baseScale = scale;
        this.dimensions.forEach((dim) => {
            dim.endpointScale = scale;
        });
    }
    create() {
        if (!this.enabled)
            return;
        if (!this.dragging) {
            this.drawStart();
            return;
        }
        this.drawEnd();
    }
    createInPlane(plane) {
        if (!this.enabled)
            return;
        if (!this.dragging) {
            this.drawStartInPlane(plane);
            return;
        }
        this.drawEnd();
    }
    delete() {
        if (!this.enabled || this.dimensions.length === 0)
            return;
        const boundingBoxes = this.getBoundingBoxes();
        const intersects = this.context.castRay(boundingBoxes);
        if (intersects.length === 0)
            return;
        const selected = this.dimensions.find((dim) => dim.boundingBox === intersects[0].object);
        if (!selected)
            return;
        const index = this.dimensions.indexOf(selected);
        this.dimensions.splice(index, 1);
        selected.removeFromScene();
    }
    deleteAll() {
        this.dimensions.forEach((dim) => {
            dim.removeFromScene();
        });
        this.dimensions = [];
    }
    cancelDrawing() {
        var _a;
        if (!this.currentDimension)
            return;
        this.dragging = false;
        (_a = this.currentDimension) === null || _a === void 0 ? void 0 : _a.removeFromScene();
        this.currentDimension = undefined;
    }
    drawStart() {
        this.dragging = true;
        const intersects = this.context.castRayIfc();
        if (!intersects)
            return;
        const found = this.getClosestVertex(intersects);
        if (!found)
            return;
        this.startPoint = found;
    }
    drawStartInPlane(plane) {
        this.dragging = true;
        const intersects = this.context.castRay([plane]);
        if (!intersects || intersects.length < 1)
            return;
        this.startPoint = intersects[0].point;
    }
    drawInProcess() {
        const intersects = this.context.castRayIfc();
        if (!intersects)
            return;
        const found = this.getClosestVertex(intersects);
        if (!found)
            return;
        this.endPoint = found;
        if (!this.currentDimension)
            this.currentDimension = this.drawDimension();
        this.currentDimension.endPoint = this.endPoint;
    }
    drawEnd() {
        if (!this.currentDimension)
            return;
        this.currentDimension.createBoundingBox();
        this.dimensions.push(this.currentDimension);
        this.currentDimension = undefined;
        this.dragging = false;
    }
    get getDimensionsLines() {
        return this.dimensions;
    }
    drawDimension() {
        return new IfcDimensionLine(this.context, this.startPoint, this.endPoint, this.lineMaterial, this.endpointsMaterial, this.endpoint, this.labelClassName, this.baseScale);
    }
    getBoundingBoxes() {
        return this.dimensions
            .map((dim) => dim.boundingBox)
            .filter((box) => box !== undefined);
    }
    static getDefaultEndpointGeometry(height = 0.1, radius = 0.03) {
        const coneGeometry = new ConeGeometry(radius, height);
        coneGeometry.translate(0, -height / 2, 0);
        coneGeometry.rotateX(-Math.PI / 2);
        return coneGeometry;
    }
    getClosestVertex(intersects) {
        let closestVertex = new Vector3();
        let vertexFound = false;
        let closestDistance = Number.MAX_SAFE_INTEGER;
        const vertices = this.getVertices(intersects);
        vertices === null || vertices === void 0 ? void 0 : vertices.forEach((vertex) => {
            if (!vertex)
                return;
            const distance = intersects.point.distanceTo(vertex);
            if (distance > closestDistance || distance > this.snapDistance)
                return;
            vertexFound = true;
            closestVertex = vertex;
            closestDistance = intersects.point.distanceTo(vertex);
        });
        return vertexFound ? closestVertex : intersects.point;
    }
    getVertices(intersects) {
        const mesh = intersects.object;
        if (!intersects.face || !mesh)
            return null;
        const geom = mesh.geometry;
        return [
            this.getVertex(intersects.face.a, geom),
            this.getVertex(intersects.face.b, geom),
            this.getVertex(intersects.face.c, geom)
        ];
    }
    getVertex(index, geom) {
        if (index === undefined)
            return null;
        const vertices = geom.attributes.position;
        return new Vector3(vertices.getX(index), vertices.getY(index), vertices.getZ(index));
    }
}
//# sourceMappingURL=dimensions.js.map
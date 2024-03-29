import { Vector2, WebGLRenderer } from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { IfcComponent } from '../../../base-types';
import { Postproduction } from './postproduction';
export class IfcRenderer extends IfcComponent {
    constructor(context) {
        super(context);
        this.renderer2D = new CSS2DRenderer();
        this.blocked = false;
        this.context = context;
        this.container = context.options.container;
        this.renderer = new WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.setupRenderers();
        this.postProduction = new Postproduction(this.context, this.renderer);
        this.adjustRendererSize();
    }
    dispose() {
        var _a, _b;
        this.renderer.domElement.remove();
        this.renderer.dispose();
        this.postProduction.dispose();
        this.postProduction = null;
        this.renderer = null;
        this.renderer2D = null;
        this.container = null;
        this.context = null;
        (_a = this.tempRenderer) === null || _a === void 0 ? void 0 : _a.dispose();
        (_b = this.tempCanvas) === null || _b === void 0 ? void 0 : _b.remove();
    }
    update(_delta) {
        if (this.blocked)
            return;
        const scene = this.context.getScene();
        const camera = this.context.getCamera();
        this.renderer.render(scene, camera);
        this.renderer2D.render(scene, camera);
    }
    getSize() {
        return new Vector2(this.renderer.domElement.clientWidth, this.renderer.domElement.clientHeight);
    }
    adjustRendererSize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        this.renderer.setSize(width, height);
        this.postProduction.setSize(width, height);
        this.renderer2D.setSize(width, height);
    }
    newScreenshot(camera, dimensions) {
        const previousDimensions = this.getSize();
        const domElement = this.renderer.domElement;
        const tempCanvas = domElement.cloneNode(true);
        // Using a new renderer to make screenshots without updating what the user sees in the canvas
        if (!this.tempRenderer) {
            this.tempRenderer = new WebGLRenderer({ canvas: tempCanvas, antialias: true });
            this.tempRenderer.localClippingEnabled = true;
        }
        if (dimensions) {
            this.tempRenderer.setSize(dimensions.x, dimensions.y);
            this.context.ifcCamera.updateAspect(dimensions);
        }
        // todo add this later to have a centered screenshot
        // await this.context.getIfcCamera().currentNavMode.fitModelToFrame();
        const scene = this.context.getScene();
        const cameraToRender = camera || this.context.getCamera();
        this.tempRenderer.render(scene, cameraToRender);
        const result = this.tempRenderer.domElement.toDataURL();
        if (dimensions)
            this.context.ifcCamera.updateAspect(previousDimensions);
        return result;
    }
    setupRenderers() {
        this.renderer.localClippingEnabled = true;
        this.container.appendChild(this.renderer.domElement);
        this.renderer2D.domElement.style.position = 'absolute';
        this.renderer2D.domElement.style.top = '0px';
        this.renderer2D.domElement.style.pointerEvents = 'none';
        this.container.appendChild(this.renderer2D.domElement);
    }
}
//# sourceMappingURL=renderer.js.map
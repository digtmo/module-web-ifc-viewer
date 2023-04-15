import { Object3D, WebGLRenderer } from 'three';
import { IfcContext } from '../context';
export declare class Postproduction {
    private context;
    private renderer;
    htmlOverlay: HTMLImageElement;
    excludedItems: Set<Object3D<import("three").Event>>;
    private initialized;
    private saoPass?;
    private fxaaPass?;
    private basePass?;
    private customOutline?;
    private outlineUniforms;
    private depthTexture?;
    private readonly composer;
    private readonly renderTarget;
    private readonly visibilityField;
    private isUserControllingCamera;
    private isControlSleeping;
    private lastWheelUsed;
    private lastResized;
    private resizeDelay;
    private isActive;
    private isVisible;
    private scene?;
    private white;
    private tempMaterial;
    private outlineParams;
    get active(): boolean;
    set active(active: boolean);
    get visible(): boolean;
    set visible(visible: boolean);
    get outlineColor(): number;
    set outlineColor(color: number);
    get sao(): import("three/examples/jsm/postprocessing/SAOPass").SAOPassParams | undefined;
    constructor(context: IfcContext, renderer: WebGLRenderer);
    dispose(): void;
    setSize(width: number, height: number): void;
    update(): void;
    private hideExcludedItems;
    private showExcludedItems;
    private tryToInitialize;
    private setupEvents;
    private onControlStart;
    private onWake;
    private onResize;
    private onControl;
    private onControlEnd;
    private onWheel;
    private onSleep;
    private onChangeProjection;
    private setupHtmlOverlay;
    private addAntialiasPass;
    private addOutlinePass;
    private addSaoPass;
    private addBasePass;
    private newRenderTarget;
}

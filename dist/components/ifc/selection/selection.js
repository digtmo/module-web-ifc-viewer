import { IfcComponent } from '../../../base-types';
export class IfcSelection extends IfcComponent {
    constructor(context, loader, material) {
        super(context);
        this.context = context;
        this.meshes = new Set();
        // True only for prepick
        this.fastRemovePrevious = false;
        this.renderOrder = 0;
        this.modelIDs = new Set();
        this.selectedFaces = {};
        this.pick = async (item, focusSelection = false, removePrevious = true) => {
            var _a;
            const mesh = item.object;
            if (item.faceIndex === undefined || ((_a = this.selectedFaces[mesh.modelID]) === null || _a === void 0 ? void 0 : _a.has(item.faceIndex))) {
                return null;
            }
            const id = this.loader.ifcManager.getExpressId(mesh.geometry, item.faceIndex);
            if (id === undefined)
                return null;
            if (removePrevious) {
                if (this.fastRemovePrevious) {
                    this.toggleVisibility(false);
                    this.modelIDs.clear();
                    this.selectedFaces = {};
                }
                else {
                    this.unpick();
                }
            }
            if (!this.selectedFaces[mesh.modelID])
                this.selectedFaces[mesh.modelID] = new Set();
            this.selectedFaces[mesh.modelID].add(item.faceIndex);
            this.modelIDs.add(mesh.modelID);
            const selected = this.newSelection(mesh.modelID, [id], removePrevious);
            selected.position.copy(mesh.position);
            selected.rotation.copy(mesh.rotation);
            selected.scale.copy(mesh.scale);
            selected.visible = true;
            selected.renderOrder = this.renderOrder;
            if (focusSelection) {
                await this.focusSelection(selected);
            }
            return { modelID: mesh.modelID, id };
        };
        this.pickByID = async (modelID, ids, focusSelection = false, removePrevious = true) => {
            const mesh = this.context.items.ifcModels.find((model) => model.modelID === modelID);
            if (!mesh)
                return;
            if (removePrevious) {
                this.modelIDs.clear();
            }
            this.modelIDs.add(modelID);
            const selected = this.newSelection(modelID, ids, removePrevious);
            selected.visible = true;
            selected.position.copy(mesh.position);
            selected.rotation.copy(mesh.rotation);
            selected.scale.copy(mesh.scale);
            selected.renderOrder = this.renderOrder;
            if (focusSelection)
                await this.focusSelection(selected);
        };
        this.newSelection = (modelID, ids, removePrevious) => {
            const mesh = this.loader.ifcManager.createSubset({
                scene: this.scene,
                modelID,
                ids,
                removePrevious,
                material: this.material
            });
            if (mesh) {
                this.meshes.add(mesh);
                this.context.renderer.postProduction.excludedItems.add(mesh);
            }
            return mesh;
        };
        this.scene = context.getScene();
        this.loader = loader;
        if (material)
            this.material = material;
    }
    dispose() {
        var _a;
        this.meshes.forEach((mesh) => {
            mesh.removeFromParent();
            mesh.geometry.dispose();
        });
        (_a = this.material) === null || _a === void 0 ? void 0 : _a.dispose();
        this.meshes = null;
        this.material = null;
        this.scene = null;
        this.loader = null;
        this.context = null;
    }
    unpick() {
        for (const modelID of this.modelIDs) {
            this.loader.ifcManager.removeSubset(modelID, this.material);
        }
        this.modelIDs.clear();
        this.meshes.clear();
        this.selectedFaces = {};
    }
    toggleVisibility(visible) {
        this.meshes.forEach((mesh) => (mesh.visible = visible));
    }
    async focusSelection(mesh) {
        const postproductionActive = this.context.renderer.postProduction.active;
        this.context.renderer.postProduction.active = false;
        await this.context.ifcCamera.targetItem(mesh);
        this.context.renderer.postProduction.active = postproductionActive;
    }
}
//# sourceMappingURL=selection.js.map
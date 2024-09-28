import { Attribute } from "../Attribute";
import { AttributeDefinitions } from "../AttributeDefinitions";
import { DockLocation } from "../DockLocation";
import { DropInfo } from "../DropInfo";
import { Orientation } from "../Orientation";
import { Rect } from "../Rect";
import { CLASSES } from "../Types";
import { Model } from "./Model";
import { Node } from "./Node";
import { TabNode } from "./TabNode";
import { adjustSelectedIndex } from "./Utils";
export class BorderNode extends Node {
    /** @internal */
    static fromJson(json, model) {
        const location = DockLocation.getByName(json.location);
        const border = new BorderNode(location, json, model);
        if (json.children) {
            border.children = json.children.map((jsonChild) => {
                const child = TabNode.fromJson(jsonChild, model);
                child.setParent(border);
                return child;
            });
        }
        return border;
    }
    /** @internal */
    constructor(location, json, model) {
        super(model);
        /** @internal */
        this.outerRect = Rect.empty();
        /** @internal */
        this.contentRect = Rect.empty();
        /** @internal */
        this.tabHeaderRect = Rect.empty();
        this.location = location;
        this.attributes.id = `border_${location.getName()}`;
        BorderNode.attributeDefinitions.fromJson(json, this.attributes);
        model.addNode(this);
    }
    getLocation() {
        return this.location;
    }
    getClassName() {
        return this.getAttr("className");
    }
    isHorizontal() {
        return this.location.orientation === Orientation.HORZ;
    }
    getSize() {
        const defaultSize = this.getAttr("size");
        const selected = this.getSelected();
        if (selected === -1) {
            return defaultSize;
        }
        else {
            const tabNode = this.children[selected];
            const tabBorderSize = this.isHorizontal() ? tabNode.getAttr("borderWidth") : tabNode.getAttr("borderHeight");
            if (tabBorderSize === -1) {
                return defaultSize;
            }
            else {
                return tabBorderSize;
            }
        }
    }
    getMinSize() {
        const selectedNode = this.getSelectedNode();
        let min = this.getAttr("minSize");
        if (selectedNode) {
            const nodeMin = this.isHorizontal() ? selectedNode.getMinWidth() : selectedNode.getMinHeight();
            min = Math.max(min, nodeMin);
        }
        return min;
    }
    getMaxSize() {
        const selectedNode = this.getSelectedNode();
        let max = this.getAttr("maxSize");
        if (selectedNode) {
            const nodeMax = this.isHorizontal() ? selectedNode.getMaxWidth() : selectedNode.getMaxHeight();
            max = Math.min(max, nodeMax);
        }
        return max;
    }
    getSelected() {
        return this.attributes.selected;
    }
    isAutoHide() {
        return this.getAttr("enableAutoHide");
    }
    getSelectedNode() {
        if (this.getSelected() !== -1) {
            return this.children[this.getSelected()];
        }
        return undefined;
    }
    getOrientation() {
        return this.location.getOrientation();
    }
    /**
     * Returns the config attribute that can be used to store node specific data that
     * WILL be saved to the json. The config attribute should be changed via the action Actions.updateNodeAttributes rather
     * than directly, for example:
     * this.state.model.doAction(
     *   FlexLayout.Actions.updateNodeAttributes(node.getId(), {config:myConfigObject}));
     */
    getConfig() {
        return this.attributes.config;
    }
    isMaximized() {
        return false;
    }
    isShowing() {
        return this.attributes.show;
    }
    toJson() {
        const json = {};
        BorderNode.attributeDefinitions.toJson(json, this.attributes);
        json.location = this.location.getName();
        json.children = this.children.map((child) => child.toJson());
        return json;
    }
    /** @internal */
    isAutoSelectTab(whenOpen) {
        if (whenOpen == null) {
            whenOpen = this.getSelected() !== -1;
        }
        if (whenOpen) {
            return this.getAttr("autoSelectTabWhenOpen");
        }
        else {
            return this.getAttr("autoSelectTabWhenClosed");
        }
    }
    /** @internal */
    setSelected(index) {
        this.attributes.selected = index;
    }
    /** @internal */
    getTabHeaderRect() {
        return this.tabHeaderRect;
    }
    /** @internal */
    setTabHeaderRect(r) {
        this.tabHeaderRect = r;
    }
    /** @internal */
    getOuterRect() {
        return this.outerRect;
    }
    /** @internal */
    setOuterRect(r) {
        this.outerRect = r;
    }
    /** @internal */
    getRect() {
        return this.tabHeaderRect;
    }
    /** @internal */
    getContentRect() {
        return this.contentRect;
    }
    /** @internal */
    setContentRect(r) {
        this.contentRect = r;
    }
    /** @internal */
    isEnableDrop() {
        return this.getAttr("enableDrop");
    }
    /** @internal */
    setSize(pos) {
        const selected = this.getSelected();
        if (selected === -1) {
            this.attributes.size = pos;
        }
        else {
            const tabNode = this.children[selected];
            const tabBorderSize = this.isHorizontal() ? tabNode.getAttr("borderWidth") : tabNode.getAttr("borderHeight");
            if (tabBorderSize === -1) {
                this.attributes.size = pos;
            }
            else {
                if (this.isHorizontal()) {
                    tabNode.setBorderWidth(pos);
                }
                else {
                    tabNode.setBorderHeight(pos);
                }
            }
        }
    }
    /** @internal */
    updateAttrs(json) {
        BorderNode.attributeDefinitions.update(json, this.attributes);
    }
    /** @internal */
    remove(node) {
        const removedIndex = this.removeChild(node);
        if (this.getSelected() !== -1) {
            adjustSelectedIndex(this, removedIndex);
        }
    }
    /** @internal */
    canDrop(dragNode, x, y) {
        if (!(dragNode instanceof TabNode)) {
            return undefined;
        }
        let dropInfo;
        const dockLocation = DockLocation.CENTER;
        if (this.tabHeaderRect.contains(x, y)) {
            if (this.location.orientation === Orientation.VERT) {
                if (this.children.length > 0) {
                    let child = this.children[0];
                    let childRect = child.getTabRect();
                    const childY = childRect.y;
                    const childHeight = childRect.height;
                    let pos = this.tabHeaderRect.x;
                    let childCenter = 0;
                    for (let i = 0; i < this.children.length; i++) {
                        child = this.children[i];
                        childRect = child.getTabRect();
                        childCenter = childRect.x + childRect.width / 2;
                        if (x >= pos && x < childCenter) {
                            const outlineRect = new Rect(childRect.x - 2, childY, 3, childHeight);
                            dropInfo = new DropInfo(this, outlineRect, dockLocation, i, CLASSES.FLEXLAYOUT__OUTLINE_RECT);
                            break;
                        }
                        pos = childCenter;
                    }
                    if (dropInfo == null) {
                        const outlineRect = new Rect(childRect.getRight() - 2, childY, 3, childHeight);
                        dropInfo = new DropInfo(this, outlineRect, dockLocation, this.children.length, CLASSES.FLEXLAYOUT__OUTLINE_RECT);
                    }
                }
                else {
                    const outlineRect = new Rect(this.tabHeaderRect.x + 1, this.tabHeaderRect.y + 2, 3, 18);
                    dropInfo = new DropInfo(this, outlineRect, dockLocation, 0, CLASSES.FLEXLAYOUT__OUTLINE_RECT);
                }
            }
            else {
                if (this.children.length > 0) {
                    let child = this.children[0];
                    let childRect = child.getTabRect();
                    const childX = childRect.x;
                    const childWidth = childRect.width;
                    let pos = this.tabHeaderRect.y;
                    let childCenter = 0;
                    for (let i = 0; i < this.children.length; i++) {
                        child = this.children[i];
                        childRect = child.getTabRect();
                        childCenter = childRect.y + childRect.height / 2;
                        if (y >= pos && y < childCenter) {
                            const outlineRect = new Rect(childX, childRect.y - 2, childWidth, 3);
                            dropInfo = new DropInfo(this, outlineRect, dockLocation, i, CLASSES.FLEXLAYOUT__OUTLINE_RECT);
                            break;
                        }
                        pos = childCenter;
                    }
                    if (dropInfo == null) {
                        const outlineRect = new Rect(childX, childRect.getBottom() - 2, childWidth, 3);
                        dropInfo = new DropInfo(this, outlineRect, dockLocation, this.children.length, CLASSES.FLEXLAYOUT__OUTLINE_RECT);
                    }
                }
                else {
                    const outlineRect = new Rect(this.tabHeaderRect.x + 2, this.tabHeaderRect.y + 1, 18, 3);
                    dropInfo = new DropInfo(this, outlineRect, dockLocation, 0, CLASSES.FLEXLAYOUT__OUTLINE_RECT);
                }
            }
            if (!dragNode.canDockInto(dragNode, dropInfo)) {
                return undefined;
            }
        }
        else if (this.getSelected() !== -1 && this.outerRect.contains(x, y)) {
            const outlineRect = this.outerRect;
            dropInfo = new DropInfo(this, outlineRect, dockLocation, -1, CLASSES.FLEXLAYOUT__OUTLINE_RECT);
            if (!dragNode.canDockInto(dragNode, dropInfo)) {
                return undefined;
            }
        }
        return dropInfo;
    }
    /** @internal */
    drop(dragNode, location, index, select) {
        let fromIndex = 0;
        const dragParent = dragNode.getParent();
        if (dragParent !== undefined) {
            fromIndex = dragParent.removeChild(dragNode);
            // if selected node in border is being docked into a different border then deselect border tabs
            if (dragParent !== this && dragParent instanceof BorderNode && dragParent.getSelected() === fromIndex) {
                dragParent.setSelected(-1);
            }
            else {
                adjustSelectedIndex(dragParent, fromIndex);
            }
        }
        // if dropping a tab back to same tabset and moving to forward position then reduce insertion index
        if (dragNode instanceof TabNode && dragParent === this && fromIndex < index && index > 0) {
            index--;
        }
        // simple_bundled dock to existing tabset
        let insertPos = index;
        if (insertPos === -1) {
            insertPos = this.children.length;
        }
        if (dragNode instanceof TabNode) {
            this.addChild(dragNode, insertPos);
        }
        if (select || (select !== false && this.isAutoSelectTab())) {
            this.setSelected(insertPos);
        }
        this.model.tidy();
    }
    /** @internal */
    getSplitterBounds(index, useMinSize = false) {
        const pBounds = [0, 0];
        const minSize = useMinSize ? this.getMinSize() : 0;
        const maxSize = useMinSize ? this.getMaxSize() : 99999;
        const rootRow = this.model.getRoot(Model.MAIN_WINDOW_ID);
        const innerRect = rootRow.getRect();
        const splitterSize = this.model.getSplitterSize();
        if (this.location === DockLocation.TOP) {
            pBounds[0] = this.tabHeaderRect.getBottom() + minSize;
            const maxPos = this.tabHeaderRect.getBottom() + maxSize;
            pBounds[1] = Math.max(pBounds[0], innerRect.getBottom() - rootRow.getMinHeight() - splitterSize);
            pBounds[1] = Math.min(pBounds[1], maxPos);
        }
        else if (this.location === DockLocation.LEFT) {
            pBounds[0] = this.tabHeaderRect.getRight() + minSize;
            const maxPos = this.tabHeaderRect.getRight() + maxSize;
            pBounds[1] = Math.max(pBounds[0], innerRect.getRight() - rootRow.getMinWidth() - splitterSize);
            pBounds[1] = Math.min(pBounds[1], maxPos);
        }
        else if (this.location === DockLocation.BOTTOM) {
            pBounds[1] = this.tabHeaderRect.y - minSize - splitterSize;
            const maxPos = this.tabHeaderRect.y - maxSize - splitterSize;
            pBounds[0] = Math.min(pBounds[1], innerRect.y + rootRow.getMinHeight());
            pBounds[0] = Math.max(pBounds[0], maxPos);
        }
        else if (this.location === DockLocation.RIGHT) {
            pBounds[1] = this.tabHeaderRect.x - minSize - splitterSize;
            const maxPos = this.tabHeaderRect.x - maxSize - splitterSize;
            pBounds[0] = Math.min(pBounds[1], innerRect.x + rootRow.getMinWidth());
            pBounds[0] = Math.max(pBounds[0], maxPos);
        }
        return pBounds;
    }
    /** @internal */
    calculateSplit(splitter, splitterPos) {
        const pBounds = this.getSplitterBounds(splitterPos);
        if (this.location === DockLocation.BOTTOM || this.location === DockLocation.RIGHT) {
            return Math.max(0, pBounds[1] - splitterPos);
        }
        else {
            return Math.max(0, splitterPos - pBounds[0]);
        }
    }
    /** @internal */
    getAttributeDefinitions() {
        return BorderNode.attributeDefinitions;
    }
    /** @internal */
    static getAttributeDefinitions() {
        return BorderNode.attributeDefinitions;
    }
    /** @internal */
    static createAttributeDefinitions() {
        const attributeDefinitions = new AttributeDefinitions();
        attributeDefinitions.add("type", BorderNode.TYPE, true).setType(Attribute.STRING).setFixed();
        attributeDefinitions.add("selected", -1).setType(Attribute.NUMBER).setDescription(`index of selected/visible tab in border; -1 means no tab selected`);
        attributeDefinitions.add("show", true).setType(Attribute.BOOLEAN).setDescription(`show/hide this border`);
        attributeDefinitions.add("config", undefined).setType("any").setDescription(`a place to hold json config used in your own code`);
        attributeDefinitions.addInherited("enableDrop", "borderEnableDrop").setType(Attribute.BOOLEAN).setDescription(`whether tabs can be dropped into this border`);
        attributeDefinitions.addInherited("className", "borderClassName").setType(Attribute.STRING).setDescription(`class applied to tab button`);
        attributeDefinitions.addInherited("autoSelectTabWhenOpen", "borderAutoSelectTabWhenOpen").setType(Attribute.BOOLEAN).setDescription(`whether to select new/moved tabs in border when the border is already open`);
        attributeDefinitions.addInherited("autoSelectTabWhenClosed", "borderAutoSelectTabWhenClosed").setType(Attribute.BOOLEAN).setDescription(`whether to select new/moved tabs in border when the border is currently closed`);
        attributeDefinitions.addInherited("size", "borderSize").setType(Attribute.NUMBER).setDescription(`size of the tab area when selected`);
        attributeDefinitions.addInherited("minSize", "borderMinSize").setType(Attribute.NUMBER).setDescription(`the minimum size of the tab area`);
        attributeDefinitions.addInherited("maxSize", "borderMaxSize").setType(Attribute.NUMBER).setDescription(`the maximum size of the tab area`);
        attributeDefinitions.addInherited("enableAutoHide", "borderEnableAutoHide").setType(Attribute.BOOLEAN).setDescription(`hide border if it has zero tabs`);
        return attributeDefinitions;
    }
}
BorderNode.TYPE = "border";
/** @internal */
BorderNode.attributeDefinitions = BorderNode.createAttributeDefinitions();
//# sourceMappingURL=BorderNode.js.map
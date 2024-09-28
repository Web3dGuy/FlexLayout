import { Attribute } from "../Attribute";
import { AttributeDefinitions } from "../AttributeDefinitions";
import { Rect } from "../Rect";
import { Model } from "./Model";
import { Node } from "./Node";
import { TabSetNode } from "./TabSetNode";
export class TabNode extends Node {
    /** @internal */
    static fromJson(json, model, addToModel = true) {
        const newLayoutNode = new TabNode(model, json, addToModel);
        return newLayoutNode;
    }
    /** @internal */
    constructor(model, json, addToModel = true) {
        super(model);
        /** @internal */
        this.tabRect = Rect.empty();
        this.extra = {}; // extra data added to node not saved in json
        this.moveableElement = null;
        this.tabStamp = null;
        this.rendered = false;
        this.visible = false;
        TabNode.attributeDefinitions.fromJson(json, this.attributes);
        if (addToModel === true) {
            model.addNode(this);
        }
    }
    getName() {
        return this.getAttr("name");
    }
    getHelpText() {
        return this.getAttr("helpText");
    }
    getComponent() {
        return this.getAttr("component");
    }
    getWindowId() {
        if (this.parent instanceof TabSetNode) {
            return this.parent.getWindowId();
        }
        return Model.MAIN_WINDOW_ID;
    }
    getWindow() {
        const layoutWindow = this.model.getwindowsMap().get(this.getWindowId());
        if (layoutWindow) {
            return layoutWindow.window;
        }
        return undefined;
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
    /**
     * Returns an object that can be used to store transient node specific data that will
     * NOT be saved in the json.
     */
    getExtraData() {
        return this.extra;
    }
    isPoppedOut() {
        return this.getWindowId() !== Model.MAIN_WINDOW_ID;
    }
    isSelected() {
        return this.getParent().getSelectedNode() === this;
    }
    getIcon() {
        return this.getAttr("icon");
    }
    isEnableClose() {
        return this.getAttr("enableClose");
    }
    getCloseType() {
        return this.getAttr("closeType");
    }
    isEnablePopout() {
        return this.getAttr("enablePopout");
    }
    isEnablePopoutIcon() {
        return this.getAttr("enablePopoutIcon");
    }
    isEnablePopoutOverlay() {
        return this.getAttr("enablePopoutOverlay");
    }
    isEnableDrag() {
        return this.getAttr("enableDrag");
    }
    isEnableRename() {
        return this.getAttr("enableRename");
    }
    isEnableWindowReMount() {
        return this.getAttr("enableWindowReMount");
    }
    getClassName() {
        return this.getAttr("className");
    }
    getContentClassName() {
        return this.getAttr("contentClassName");
    }
    getTabSetClassName() {
        return this.getAttr("tabsetClassName");
    }
    isEnableRenderOnDemand() {
        return this.getAttr("enableRenderOnDemand");
    }
    getMinWidth() {
        return this.getAttr("minWidth");
    }
    getMinHeight() {
        return this.getAttr("minHeight");
    }
    getMaxWidth() {
        return this.getAttr("maxWidth");
    }
    getMaxHeight() {
        return this.getAttr("maxHeight");
    }
    toJson() {
        const json = {};
        TabNode.attributeDefinitions.toJson(json, this.attributes);
        return json;
    }
    /** @internal */
    saveScrollPosition() {
        if (this.moveableElement) {
            this.scrollLeft = this.moveableElement.scrollLeft;
            this.scrollTop = this.moveableElement.scrollTop;
            // console.log("save", this.getName(), this.scrollTop);
        }
    }
    /** @internal */
    restoreScrollPosition() {
        if (this.scrollTop) {
            requestAnimationFrame(() => {
                if (this.moveableElement) {
                    if (this.scrollTop) {
                        // console.log("restore", this.getName(), this.scrollTop);
                        this.moveableElement.scrollTop = this.scrollTop;
                        this.moveableElement.scrollLeft = this.scrollLeft;
                    }
                }
            });
        }
    }
    /** @internal */
    setRect(rect) {
        if (!rect.equals(this.rect)) {
            this.fireEvent("resize", { rect });
            this.rect = rect;
        }
    }
    /** @internal */
    setVisible(visible) {
        if (visible !== this.visible) {
            this.fireEvent("visibility", { visible });
            this.visible = visible;
        }
    }
    /** @internal */
    getScrollTop() {
        return this.scrollTop;
    }
    /** @internal */
    setScrollTop(scrollTop) {
        this.scrollTop = scrollTop;
    }
    /** @internal */
    getScrollLeft() {
        return this.scrollLeft;
    }
    /** @internal */
    setScrollLeft(scrollLeft) {
        this.scrollLeft = scrollLeft;
    }
    /** @internal */
    isRendered() {
        return this.rendered;
    }
    /** @internal */
    setRendered(rendered) {
        this.rendered = rendered;
    }
    /** @internal */
    getTabRect() {
        return this.tabRect;
    }
    /** @internal */
    setTabRect(rect) {
        this.tabRect = rect;
    }
    /** @internal */
    getTabStamp() {
        return this.tabStamp;
    }
    /** @internal */
    setTabStamp(stamp) {
        this.tabStamp = stamp;
    }
    /** @internal */
    getMoveableElement() {
        return this.moveableElement;
    }
    /** @internal */
    setMoveableElement(element) {
        this.moveableElement = element;
    }
    /** @internal */
    setRenderedName(name) {
        this.renderedName = name;
    }
    /** @internal */
    getNameForOverflowMenu() {
        const altName = this.getAttr("altName");
        if (altName !== undefined) {
            return altName;
        }
        return this.renderedName;
    }
    /** @internal */
    setName(name) {
        this.attributes.name = name;
    }
    /** @internal */
    delete() {
        this.parent.remove(this);
        this.fireEvent("close", {});
    }
    /** @internal */
    updateAttrs(json) {
        TabNode.attributeDefinitions.update(json, this.attributes);
    }
    /** @internal */
    getAttributeDefinitions() {
        return TabNode.attributeDefinitions;
    }
    /** @internal */
    setBorderWidth(width) {
        this.attributes.borderWidth = width;
    }
    /** @internal */
    setBorderHeight(height) {
        this.attributes.borderHeight = height;
    }
    /** @internal */
    static getAttributeDefinitions() {
        return TabNode.attributeDefinitions;
    }
    /** @internal */
    static createAttributeDefinitions() {
        const attributeDefinitions = new AttributeDefinitions();
        attributeDefinitions.add("type", TabNode.TYPE, true).setType(Attribute.STRING).setFixed();
        attributeDefinitions.add("id", undefined).setType(Attribute.STRING).setDescription(`the unique id of the tab, if left undefined a uuid will be assigned`);
        attributeDefinitions.add("name", "[Unnamed Tab]").setType(Attribute.STRING).setDescription(`name of tab to be displayed in the tab button`);
        attributeDefinitions.add("altName", undefined).setType(Attribute.STRING).setDescription(`if there is no name specifed then this value will be used in the overflow menu`);
        attributeDefinitions.add("helpText", undefined).setType(Attribute.STRING).setDescription(`An optional help text for the tab to be displayed upon tab hover.`);
        attributeDefinitions.add("component", undefined).setType(Attribute.STRING).setDescription(`string identifying which component to run (for factory)`);
        attributeDefinitions.add("config", undefined).setType("any").setDescription(`a place to hold json config for the hosted component`);
        attributeDefinitions.add("tabsetClassName", undefined).setType(Attribute.STRING).setDescription(`class applied to parent tabset when this is the only tab and it is stretched to fill the tabset`);
        attributeDefinitions.add("enableWindowReMount", false).setType(Attribute.BOOLEAN).setDescription(`if enabled the tab will re-mount when popped out/in`);
        attributeDefinitions.addInherited("enableClose", "tabEnableClose").setType(Attribute.BOOLEAN).setDescription(`allow user to close tab via close button`);
        attributeDefinitions.addInherited("closeType", "tabCloseType").setType("ICloseType").setDescription(`see values in ICloseType`);
        attributeDefinitions.addInherited("enableDrag", "tabEnableDrag").setType(Attribute.BOOLEAN).setDescription(`allow user to drag tab to new location`);
        attributeDefinitions.addInherited("enableRename", "tabEnableRename").setType(Attribute.BOOLEAN).setDescription(`allow user to rename tabs by double clicking`);
        attributeDefinitions.addInherited("className", "tabClassName").setType(Attribute.STRING).setDescription(`class applied to tab button`);
        attributeDefinitions.addInherited("contentClassName", "tabContentClassName").setType(Attribute.STRING).setDescription(`class applied to tab content`);
        attributeDefinitions.addInherited("icon", "tabIcon").setType(Attribute.STRING).setDescription(`the tab icon`);
        attributeDefinitions.addInherited("enableRenderOnDemand", "tabEnableRenderOnDemand").setType(Attribute.BOOLEAN).setDescription(`whether to avoid rendering component until tab is visible`);
        attributeDefinitions.addInherited("enablePopout", "tabEnablePopout").setType(Attribute.BOOLEAN).setAlias("enableFloat").setDescription(`enable popout (in popout capable browser)`);
        attributeDefinitions.addInherited("enablePopoutIcon", "tabEnablePopoutIcon").setType(Attribute.BOOLEAN).setDescription(`whether to show the popout icon in the tabset header if this tab enables popouts`);
        attributeDefinitions.addInherited("enablePopoutOverlay", "tabEnablePopoutOverlay").setType(Attribute.BOOLEAN).setDescription(`if this tab will not work correctly in a popout window when the main window is backgrounded (inactive)
            then enabling this option will gray out this tab`);
        attributeDefinitions.addInherited("borderWidth", "tabBorderWidth").setType(Attribute.NUMBER).setDescription(`width when added to border, -1 will use border size`);
        attributeDefinitions.addInherited("borderHeight", "tabBorderHeight").setType(Attribute.NUMBER).setDescription(`height when added to border, -1 will use border size`);
        attributeDefinitions.addInherited("minWidth", "tabMinWidth").setType(Attribute.NUMBER).setDescription(`the min width of this tab`);
        attributeDefinitions.addInherited("minHeight", "tabMinHeight").setType(Attribute.NUMBER).setDescription(`the min height of this tab`);
        attributeDefinitions.addInherited("maxWidth", "tabMaxWidth").setType(Attribute.NUMBER).setDescription(`the max width of this tab`);
        attributeDefinitions.addInherited("maxHeight", "tabMaxHeight").setType(Attribute.NUMBER).setDescription(`the max height of this tab`);
        return attributeDefinitions;
    }
}
TabNode.TYPE = "tab";
/** @internal */
TabNode.attributeDefinitions = TabNode.createAttributeDefinitions();
//# sourceMappingURL=TabNode.js.map
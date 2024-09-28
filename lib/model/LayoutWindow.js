import { Rect } from "../Rect";
import { RowNode } from "./RowNode";
import { keepOnScreen } from "../view/Utils";
export class LayoutWindow {
    constructor(windowId, rect) {
        this._windowId = windowId;
        this._rect = rect;
        this._toScreenRectFunction = (r) => r;
    }
    visitNodes(fn) {
        this.root.forEachNode(fn, 0);
    }
    get windowId() {
        return this._windowId;
    }
    get rect() {
        return this._rect;
    }
    get layout() {
        return this._layout;
    }
    get window() {
        return this._window;
    }
    get root() {
        return this._root;
    }
    get maximizedTabSet() {
        return this._maximizedTabSet;
    }
    get activeTabSet() {
        return this._activeTabSet;
    }
    /** @internal */
    set rect(value) {
        this._rect = value;
    }
    /** @internal */
    set layout(value) {
        this._layout = value;
    }
    /** @internal */
    set window(value) {
        this._window = value;
    }
    /** @internal */
    set root(value) {
        this._root = value;
    }
    /** @internal */
    set maximizedTabSet(value) {
        this._maximizedTabSet = value;
    }
    /** @internal */
    set activeTabSet(value) {
        this._activeTabSet = value;
    }
    /** @internal */
    get toScreenRectFunction() {
        return this._toScreenRectFunction;
    }
    /** @internal */
    set toScreenRectFunction(value) {
        this._toScreenRectFunction = value;
    }
    toJson() {
        // chrome sets top,left to large -ve values when minimized, dont save in this case
        if (this._window && this._window.screenTop > -10000) {
            this.rect = new Rect(this._window.screenLeft, this._window.screenTop, this._window.outerWidth, this._window.outerHeight);
        }
        return { layout: this.root.toJson(), rect: this.rect.toJson() };
    }
    static fromJson(windowJson, model, windowId) {
        const count = model.getwindowsMap().size;
        let rect = windowJson.rect ? Rect.fromJson(windowJson.rect) : new Rect(50 + 50 * count, 50 + 50 * count, 600, 400);
        rect = keepOnScreen(rect); // snaps to grid of 10x10 and then moves into visible area
        // snapping prevents issue where window moves 1 pixel per save/restore on Chrome
        const layoutWindow = new LayoutWindow(windowId, rect);
        layoutWindow.root = RowNode.fromJson(windowJson.layout, model, layoutWindow);
        return layoutWindow;
    }
}
//# sourceMappingURL=LayoutWindow.js.map
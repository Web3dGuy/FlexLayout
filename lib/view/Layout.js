import * as React from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { DockLocation } from "../DockLocation";
import { I18nLabel } from "../I18nLabel";
import { Orientation } from "../Orientation";
import { Rect } from "../Rect";
import { CLASSES } from "../Types";
import { Actions } from "../model/Actions";
import { BorderNode } from "../model/BorderNode";
import { Model } from "../model/Model";
import { TabNode } from "../model/TabNode";
import { TabSetNode } from "../model/TabSetNode";
import { BorderTab } from "./BorderTab";
import { BorderTabSet } from "./BorderTabSet";
import { DragContainer } from "./DragContainer";
import { ErrorBoundary } from "./ErrorBoundary";
import { PopoutWindow } from "./PopoutWindow";
import { AsterickIcon, CloseIcon, EdgeIcon, MaximizeIcon, OverflowIcon, PopoutIcon, RestoreIcon } from "./Icons";
import { Overlay } from "./Overlay";
import { Row } from "./Row";
import { Tab } from "./Tab";
import { copyInlineStyles, enablePointerOnIFrames, isDesktop, isSafari } from "./Utils";
import { TabButtonStamp } from "./TabButtonStamp";
import { SizeTracker } from "./SizeTracker";
/**
 * A React component that hosts a multi-tabbed layout
 */
export class Layout extends React.Component {
    /** @internal */
    constructor(props) {
        super(props);
        this.selfRef = React.createRef();
        this.revision = 0;
    }
    /** re-render the layout */
    redraw() {
        this.selfRef.current.redraw("parent " + this.revision);
    }
    /**
     * Adds a new tab to the given tabset
     * @param tabsetId the id of the tabset where the new tab will be added
     * @param json the json for the new tab node
     * @returns the added tab node or undefined
     */
    addTabToTabSet(tabsetId, json) {
        return this.selfRef.current.addTabToTabSet(tabsetId, json);
    }
    /**
     * Adds a new tab by dragging an item to the drop location, must be called from within an HTML
     * drag start handler. You can use the setDragComponent() method to set the drag image before calling this
     * method.
     * @param event the drag start event
     * @param json the json for the new tab node
     * @param onDrop a callback to call when the drag is complete
     */
    addTabWithDragAndDrop(event, json, onDrop) {
        this.selfRef.current.addTabWithDragAndDrop(event, json, onDrop);
    }
    /**
     * Move a tab/tabset using drag and drop, must be called from within an HTML
     * drag start handler
     * @param event the drag start event
     * @param node the tab or tabset to drag
     */
    moveTabWithDragAndDrop(event, node) {
        this.selfRef.current.moveTabWithDragAndDrop(event, node);
    }
    /**
     * Adds a new tab to the active tabset (if there is one)
     * @param json the json for the new tab node
     * @returns the added tab node or undefined
     */
    addTabToActiveTabSet(json) {
        return this.selfRef.current.addTabToActiveTabSet(json);
    }
    /**
     * Sets the drag image from a react component for a drag event
     * @param event the drag event
     * @param component the react component to be used for the drag image
     * @param x the x position of the drag cursor on the image
     * @param y the x position of the drag cursor on the image
     */
    setDragComponent(event, component, x, y) {
        this.selfRef.current.setDragComponent(event, component, x, y);
    }
    /** Get the root div element of the layout */
    getRootDiv() {
        return this.selfRef.current.getRootDiv();
    }
    /** @internal */
    render() {
        return (React.createElement(LayoutInternal, Object.assign({ ref: this.selfRef }, this.props, { renderRevision: this.revision++ })));
    }
}
/** @internal */
export class LayoutInternal extends React.Component {
    // private renderCount: any;
    constructor(props) {
        super(props);
        this.moveableElementMap = new Map();
        this.dragEnterCount = 0;
        this.dragging = false;
        this.updateLayoutMetrics = () => {
            if (this.findBorderBarSizeRef.current) {
                const borderBarSize = this.findBorderBarSizeRef.current.getBoundingClientRect().height;
                if (borderBarSize !== this.state.calculatedBorderBarSize) {
                    this.setState({ calculatedBorderBarSize: borderBarSize });
                }
            }
        };
        this.onModelChange = (action) => {
            this.redrawInternal("model change");
            if (this.props.onModelChange) {
                this.props.onModelChange(this.props.model, action);
            }
        };
        this.updateRect = () => {
            const rect = this.getDomRect();
            if (!rect.equals(this.state.rect) && rect.width !== 0 && rect.height !== 0) {
                // console.log("updateRect", rect.floor());
                this.setState({ rect });
                if (this.windowId !== Model.MAIN_WINDOW_ID) {
                    this.redrawInternal("rect updated");
                }
            }
        };
        this.getClassName = (defaultClassName) => {
            if (this.props.classNameMapper === undefined) {
                return defaultClassName;
            }
            else {
                return this.props.classNameMapper(defaultClassName);
            }
        };
        this.onCloseWindow = (windowLayout) => {
            this.doAction(Actions.closeWindow(windowLayout.windowId));
        };
        this.onSetWindow = (windowLayout, window) => {
        };
        this.showControlInPortal = (control, element) => {
            const portal = createPortal(control, element);
            this.setState({ portal });
        };
        this.hideControlInPortal = () => {
            this.setState({ portal: undefined });
        };
        this.getIcons = () => {
            return this.icons;
        };
        this.setDragNode = (event, node) => {
            LayoutInternal.dragState = new DragState(this.mainLayout, DragSource.Internal, node, undefined, undefined);
            // Note: can only set (very) limited types on android! so cannot set json
            // Note: must set text/plain for android to allow drag, 
            //  so just set a simple message indicating its a flexlayout drag (this is not used anywhere else)
            event.dataTransfer.setData('text/plain', "--flexlayout--");
            event.dataTransfer.effectAllowed = "copyMove";
            event.dataTransfer.dropEffect = "move";
            this.dragEnterCount = 0;
            if (node instanceof TabSetNode) {
                let rendered = false;
                let content = this.i18nName(I18nLabel.Move_Tabset);
                if (node.getChildren().length > 0) {
                    content = this.i18nName(I18nLabel.Move_Tabs).replace("?", String(node.getChildren().length));
                }
                if (this.props.onRenderDragRect) {
                    const dragComponent = this.props.onRenderDragRect(content, node, undefined);
                    if (dragComponent) {
                        this.setDragComponent(event, dragComponent, 10, 10);
                        rendered = true;
                    }
                }
                if (!rendered) {
                    this.setDragComponent(event, content, 10, 10);
                }
            }
            else {
                const element = event.target;
                const rect = element.getBoundingClientRect();
                const offsetX = event.clientX - rect.left;
                const offsetY = event.clientY - rect.top;
                const parentNode = node === null || node === void 0 ? void 0 : node.getParent();
                const isInVerticalBorder = parentNode instanceof BorderNode && parentNode.getOrientation() === Orientation.HORZ;
                const x = isInVerticalBorder ? 10 : offsetX;
                const y = isInVerticalBorder ? 10 : offsetY;
                let rendered = false;
                if (this.props.onRenderDragRect) {
                    const content = React.createElement(TabButtonStamp, { key: node.getId(), layout: this, node: node });
                    const dragComponent = this.props.onRenderDragRect(content, node, undefined);
                    if (dragComponent) {
                        this.setDragComponent(event, dragComponent, x, y);
                        rendered = true;
                    }
                }
                if (!rendered) {
                    if (isSafari()) { // safari doesnt render the offscreen tabstamps
                        this.setDragComponent(event, React.createElement(TabButtonStamp, { node: node, layout: this }), x, y);
                    }
                    else {
                        event.dataTransfer.setDragImage(node.getTabStamp(), x, y);
                    }
                }
            }
        };
        this.onDragEnterRaw = (event) => {
            this.dragEnterCount++;
            if (this.dragEnterCount === 1) {
                this.onDragEnter(event);
            }
        };
        this.onDragLeaveRaw = (event) => {
            this.dragEnterCount--;
            if (this.dragEnterCount === 0) {
                this.onDragLeave(event);
            }
        };
        this.onDragEnter = (event) => {
            // console.log("onDragEnter", this.windowId, this.dragEnterCount);
            var _a;
            if (!LayoutInternal.dragState && this.props.onExternalDrag) { // not internal dragging
                const externalDrag = this.props.onExternalDrag(event);
                if (externalDrag) {
                    const tempNode = TabNode.fromJson(externalDrag.json, this.props.model, false);
                    LayoutInternal.dragState = new DragState(this.mainLayout, DragSource.External, tempNode, externalDrag.json, externalDrag.onDrop);
                }
            }
            if (LayoutInternal.dragState) {
                if (this.windowId !== Model.MAIN_WINDOW_ID && LayoutInternal.dragState.mainLayout === this.mainLayout) {
                    LayoutInternal.dragState.mainLayout.setDraggingOverWindow(true);
                }
                if (LayoutInternal.dragState.mainLayout !== this.mainLayout) {
                    return; // drag not by this layout or its popouts
                }
                event.preventDefault();
                this.dropInfo = undefined;
                const rootdiv = this.selfRef.current;
                this.outlineDiv = this.currentDocument.createElement("div");
                this.outlineDiv.className = this.getClassName(CLASSES.FLEXLAYOUT__OUTLINE_RECT);
                this.outlineDiv.style.visibility = "hidden";
                const speed = this.props.model.getAttribute("tabDragSpeed");
                this.outlineDiv.style.transition = `top ${speed}s, left ${speed}s, width ${speed}s, height ${speed}s`;
                rootdiv.appendChild(this.outlineDiv);
                this.dragging = true;
                this.showOverlay(true);
                // add edge indicators
                if (!this.isDraggingOverWindow && this.props.model.getMaximizedTabset(this.windowId) === undefined) {
                    this.setState({ showEdges: this.props.model.isEnableEdgeDock() });
                }
                const clientRect = (_a = this.selfRef.current) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect();
                const r = new Rect(event.clientX - (clientRect.left), event.clientY - (clientRect.top), 1, 1);
                r.positionElement(this.outlineDiv);
            }
        };
        this.onDragOver = (event) => {
            var _a, _b, _c;
            if (this.dragging && !this.isDraggingOverWindow) {
                // console.log("onDragOver");
                event.preventDefault();
                const clientRect = (_a = this.selfRef.current) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect();
                const pos = {
                    x: event.clientX - ((_b = clientRect === null || clientRect === void 0 ? void 0 : clientRect.left) !== null && _b !== void 0 ? _b : 0),
                    y: event.clientY - ((_c = clientRect === null || clientRect === void 0 ? void 0 : clientRect.top) !== null && _c !== void 0 ? _c : 0),
                };
                this.checkForBorderToShow(pos.x, pos.y);
                let dropInfo = this.props.model.findDropTargetNode(this.windowId, LayoutInternal.dragState.dragNode, pos.x, pos.y);
                if (dropInfo) {
                    this.dropInfo = dropInfo;
                    if (this.outlineDiv) {
                        this.outlineDiv.className = this.getClassName(dropInfo.className);
                        dropInfo.rect.positionElement(this.outlineDiv);
                        this.outlineDiv.style.visibility = "visible";
                    }
                }
            }
        };
        this.onDragLeave = (event) => {
            // console.log("onDragLeave", this.windowId, this.dragging);
            if (this.dragging) {
                if (this.windowId !== Model.MAIN_WINDOW_ID) {
                    LayoutInternal.dragState.mainLayout.setDraggingOverWindow(false);
                }
                this.clearDragLocal();
            }
        };
        this.onDrop = (event) => {
            // console.log("ondrop", this.windowId, this.dragging, Layout.dragState);
            if (this.dragging) {
                event.preventDefault();
                const dragState = LayoutInternal.dragState;
                if (this.dropInfo) {
                    if (dragState.dragJson !== undefined) {
                        const newNode = this.doAction(Actions.addNode(dragState.dragJson, this.dropInfo.node.getId(), this.dropInfo.location, this.dropInfo.index));
                        if (dragState.fnNewNodeDropped !== undefined) {
                            dragState.fnNewNodeDropped(newNode, event);
                        }
                    }
                    else if (dragState.dragNode !== undefined) {
                        this.doAction(Actions.moveNode(dragState.dragNode.getId(), this.dropInfo.node.getId(), this.dropInfo.location, this.dropInfo.index));
                    }
                }
                this.mainLayout.clearDragMain();
            }
            this.dragEnterCount = 0; // must set to zero here ref sublayouts
        };
        this.orderedIds = [];
        this.selfRef = React.createRef();
        this.moveablesRef = React.createRef();
        this.mainRef = React.createRef();
        this.findBorderBarSizeRef = React.createRef();
        this.supportsPopout = props.supportsPopout !== undefined ? props.supportsPopout : defaultSupportsPopout;
        this.popoutURL = props.popoutURL ? props.popoutURL : "popout.html";
        this.icons = Object.assign(Object.assign({}, defaultIcons), props.icons);
        this.windowId = props.windowId ? props.windowId : Model.MAIN_WINDOW_ID;
        this.mainLayout = this.props.mainLayout ? this.props.mainLayout : this;
        this.isDraggingOverWindow = false;
        this.layoutWindow = this.props.model.getwindowsMap().get(this.windowId);
        this.layoutWindow.layout = this;
        this.popoutWindowName = this.props.popoutWindowName || "Popout Window";
        // this.renderCount = 0;
        this.state = {
            rect: Rect.empty(),
            editingTab: undefined,
            showEdges: false,
            showOverlay: false,
            calculatedBorderBarSize: 29,
            layoutRevision: 0,
            forceRevision: 0,
            showHiddenBorder: DockLocation.CENTER
        };
        this.isMainWindow = this.windowId === Model.MAIN_WINDOW_ID;
    }
    componentDidMount() {
        this.updateRect();
        this.currentDocument = this.selfRef.current.ownerDocument;
        this.currentWindow = this.currentDocument.defaultView;
        this.layoutWindow.window = this.currentWindow;
        this.layoutWindow.toScreenRectFunction = (r) => this.getScreenRect(r);
        this.resizeObserver = new ResizeObserver(entries => {
            requestAnimationFrame(() => {
                this.updateRect();
            });
        });
        if (this.selfRef.current) {
            this.resizeObserver.observe(this.selfRef.current);
        }
        if (this.isMainWindow) {
            this.props.model.addChangeListener(this.onModelChange);
            this.updateLayoutMetrics();
        }
        else {
            // since resizeObserver doesn't always work as expected when observing element in another document
            this.currentWindow.addEventListener("resize", () => {
                this.updateRect();
            });
            const sourceElement = this.props.mainLayout.getRootDiv();
            const targetElement = this.selfRef.current;
            copyInlineStyles(sourceElement, targetElement);
            this.styleObserver = new MutationObserver(() => {
                const changed = copyInlineStyles(sourceElement, targetElement);
                if (changed) {
                    this.redraw("mutation observer");
                }
            });
            // Observe changes to the source element's style attribute
            this.styleObserver.observe(sourceElement, { attributeFilter: ['style'] });
        }
        // allow tabs to overlay when hidden
        document.addEventListener('visibilitychange', () => {
            for (const [_, layoutWindow] of this.props.model.getwindowsMap()) {
                const layout = layoutWindow.layout;
                if (layout) {
                    this.redraw("visibility change");
                }
            }
        });
    }
    componentDidUpdate() {
        this.currentDocument = this.selfRef.current.ownerDocument;
        this.currentWindow = this.currentDocument.defaultView;
        if (this.isMainWindow) {
            if (this.props.model !== this.previousModel) {
                if (this.previousModel !== undefined) {
                    this.previousModel.removeChangeListener(this.onModelChange); // stop listening to old model
                }
                this.props.model.getwindowsMap().get(this.windowId).layout = this;
                this.props.model.addChangeListener(this.onModelChange);
                this.layoutWindow = this.props.model.getwindowsMap().get(this.windowId);
                this.layoutWindow.layout = this;
                this.layoutWindow.toScreenRectFunction = (r) => this.getScreenRect(r);
                this.previousModel = this.props.model;
                this.tidyMoveablesMap();
            }
            this.updateLayoutMetrics();
        }
    }
    componentWillUnmount() {
        var _a, _b;
        if (this.selfRef.current) {
            (_a = this.resizeObserver) === null || _a === void 0 ? void 0 : _a.unobserve(this.selfRef.current);
        }
        (_b = this.styleObserver) === null || _b === void 0 ? void 0 : _b.disconnect();
    }
    render() {
        // console.log("render", this.windowId, this.state.revision, this.renderCount++);
        // first render will be used to find the size (via selfRef)
        if (!this.selfRef.current) {
            return (React.createElement("div", { ref: this.selfRef, className: this.getClassName(CLASSES.FLEXLAYOUT__LAYOUT) },
                React.createElement("div", { ref: this.moveablesRef, key: "__moveables__", className: this.getClassName(CLASSES.FLEXLAYOUT__LAYOUT_MOVEABLES) }),
                this.renderMetricsElements()));
        }
        const model = this.props.model;
        model.getRoot(this.windowId).calcMinMaxSize();
        model.getRoot(this.windowId).setPaths("");
        model.getBorderSet().setPaths();
        const inner = this.renderLayout();
        const outer = this.renderBorders(inner);
        const tabs = this.renderTabs();
        const reorderedTabs = this.reorderComponents(tabs, this.orderedIds);
        let floatingWindows = null;
        let tabMoveables = null;
        let tabStamps = null;
        let metricElements = null;
        if (this.isMainWindow) {
            floatingWindows = this.renderWindows();
            metricElements = this.renderMetricsElements();
            tabMoveables = this.renderTabMoveables();
            tabStamps = React.createElement("div", { key: "__tabStamps__", className: this.getClassName(CLASSES.FLEXLAYOUT__LAYOUT_TAB_STAMPS) }, this.renderTabStamps());
        }
        return (React.createElement("div", { ref: this.selfRef, className: this.getClassName(CLASSES.FLEXLAYOUT__LAYOUT), onDragEnter: this.onDragEnterRaw, onDragLeave: this.onDragLeaveRaw, onDragOver: this.onDragOver, onDrop: this.onDrop },
            React.createElement("div", { ref: this.moveablesRef, key: "__moveables__", className: this.getClassName(CLASSES.FLEXLAYOUT__LAYOUT_MOVEABLES) }),
            metricElements,
            React.createElement(Overlay, { key: "__overlay__", layout: this, show: this.state.showOverlay }),
            outer,
            reorderedTabs,
            tabMoveables,
            tabStamps,
            this.state.portal,
            floatingWindows));
    }
    renderBorders(inner) {
        const classMain = this.getClassName(CLASSES.FLEXLAYOUT__LAYOUT_MAIN);
        const borders = this.props.model.getBorderSet().getBorderMap();
        if (this.isMainWindow && borders.size > 0) {
            inner = (React.createElement("div", { className: classMain, ref: this.mainRef }, inner));
            const borderSetComponents = new Map();
            const borderSetContentComponents = new Map();
            for (const [_, location] of DockLocation.values) {
                const border = borders.get(location);
                const showBorder = border && (!border.isAutoHide() ||
                    (border.isAutoHide() && (border.getChildren().length > 0 || this.state.showHiddenBorder === location)));
                if (showBorder) {
                    borderSetComponents.set(location, React.createElement(BorderTabSet, { layout: this, border: border, size: this.state.calculatedBorderBarSize }));
                    borderSetContentComponents.set(location, React.createElement(BorderTab, { layout: this, border: border, show: border.getSelected() !== -1 }));
                }
            }
            const classBorderOuter = this.getClassName(CLASSES.FLEXLAYOUT__LAYOUT_BORDER_CONTAINER);
            const classBorderInner = this.getClassName(CLASSES.FLEXLAYOUT__LAYOUT_BORDER_CONTAINER_INNER);
            if (this.props.model.getBorderSet().getLayoutHorizontal()) {
                const innerWithBorderTabs = (React.createElement("div", { className: classBorderInner, style: { flexDirection: "column" } },
                    borderSetContentComponents.get(DockLocation.TOP),
                    React.createElement("div", { className: classBorderInner, style: { flexDirection: "row" } },
                        borderSetContentComponents.get(DockLocation.LEFT),
                        inner,
                        borderSetContentComponents.get(DockLocation.RIGHT)),
                    borderSetContentComponents.get(DockLocation.BOTTOM)));
                return (React.createElement("div", { className: classBorderOuter, style: { flexDirection: "column" } },
                    borderSetComponents.get(DockLocation.TOP),
                    React.createElement("div", { className: classBorderInner, style: { flexDirection: "row" } },
                        borderSetComponents.get(DockLocation.LEFT),
                        innerWithBorderTabs,
                        borderSetComponents.get(DockLocation.RIGHT)),
                    borderSetComponents.get(DockLocation.BOTTOM)));
            }
            else {
                const innerWithBorderTabs = (React.createElement("div", { className: classBorderInner, style: { flexDirection: "row" } },
                    borderSetContentComponents.get(DockLocation.LEFT),
                    React.createElement("div", { className: classBorderInner, style: { flexDirection: "column" } },
                        borderSetContentComponents.get(DockLocation.TOP),
                        inner,
                        borderSetContentComponents.get(DockLocation.BOTTOM)),
                    borderSetContentComponents.get(DockLocation.RIGHT)));
                return (React.createElement("div", { className: classBorderOuter, style: { flexDirection: "row" } },
                    borderSetComponents.get(DockLocation.LEFT),
                    React.createElement("div", { className: classBorderInner, style: { flexDirection: "column" } },
                        borderSetComponents.get(DockLocation.TOP),
                        innerWithBorderTabs,
                        borderSetComponents.get(DockLocation.BOTTOM)),
                    borderSetComponents.get(DockLocation.RIGHT)));
            }
        }
        else { // no borders
            return (React.createElement("div", { className: classMain, ref: this.mainRef, style: { position: "absolute", top: 0, left: 0, bottom: 0, right: 0, display: "flex" } }, inner));
        }
    }
    renderLayout() {
        return (React.createElement(React.Fragment, null,
            React.createElement(Row, { key: "__row__", layout: this, node: this.props.model.getRoot(this.windowId) }),
            this.renderEdgeIndicators()));
    }
    renderEdgeIndicators() {
        const edges = [];
        const arrowIcon = this.icons.edgeArrow;
        if (this.state.showEdges) {
            const r = this.props.model.getRoot(this.windowId).getRect();
            const length = edgeRectLength;
            const width = edgeRectWidth;
            const offset = edgeRectLength / 2;
            const className = this.getClassName(CLASSES.FLEXLAYOUT__EDGE_RECT);
            const radius = 50;
            edges.push(React.createElement("div", { key: "North", style: { top: 0, left: r.width / 2 - offset, width: length, height: width, borderBottomLeftRadius: radius, borderBottomRightRadius: radius }, className: className + " " + this.getClassName(CLASSES.FLEXLAYOUT__EDGE_RECT_TOP) },
                React.createElement("div", { style: { transform: "rotate(180deg)" } }, arrowIcon)));
            edges.push(React.createElement("div", { key: "West", style: { top: r.height / 2 - offset, left: 0, width: width, height: length, borderTopRightRadius: radius, borderBottomRightRadius: radius }, className: className + " " + this.getClassName(CLASSES.FLEXLAYOUT__EDGE_RECT_LEFT) },
                React.createElement("div", { style: { transform: "rotate(90deg)" } }, arrowIcon)));
            edges.push(React.createElement("div", { key: "South", style: { top: r.height - width, left: r.width / 2 - offset, width: length, height: width, borderTopLeftRadius: radius, borderTopRightRadius: radius }, className: className + " " + this.getClassName(CLASSES.FLEXLAYOUT__EDGE_RECT_BOTTOM) },
                React.createElement("div", null, arrowIcon)));
            edges.push(React.createElement("div", { key: "East", style: { top: r.height / 2 - offset, left: r.width - width, width: width, height: length, borderTopLeftRadius: radius, borderBottomLeftRadius: radius }, className: className + " " + this.getClassName(CLASSES.FLEXLAYOUT__EDGE_RECT_RIGHT) },
                React.createElement("div", { style: { transform: "rotate(-90deg)" } }, arrowIcon)));
        }
        return edges;
    }
    renderWindows() {
        const floatingWindows = [];
        if (this.supportsPopout) {
            const windows = this.props.model.getwindowsMap();
            let i = 1;
            for (const [windowId, layoutWindow] of windows) {
                if (windowId !== Model.MAIN_WINDOW_ID) {
                    floatingWindows.push(React.createElement(PopoutWindow, { key: windowId, layout: this, title: this.popoutWindowName + " " + i, layoutWindow: layoutWindow, url: this.popoutURL + "?id=" + windowId, onSetWindow: this.onSetWindow, onCloseWindow: this.onCloseWindow },
                        React.createElement(LayoutInternal, Object.assign({}, this.props, { windowId: windowId, mainLayout: this }))));
                    i++;
                }
            }
        }
        return floatingWindows;
    }
    renderTabMoveables() {
        const tabMoveables = [];
        this.props.model.visitNodes((node) => {
            if (node instanceof TabNode) {
                const child = node;
                const element = this.getMoveableElement(child.getId());
                child.setMoveableElement(element);
                const selected = child.isSelected();
                const rect = child.getParent().getContentRect();
                // only render first time if size >0
                const renderTab = child.isRendered() ||
                    ((selected || !child.isEnableRenderOnDemand()) && (rect.width > 0 && rect.height > 0));
                if (renderTab) {
                    //  console.log("rendertab", child.getName(), this.props.renderRevision);
                    const key = child.getId() + (child.isEnableWindowReMount() ? child.getWindowId() : "");
                    tabMoveables.push(createPortal(React.createElement(SizeTracker, { rect: rect, selected: child.isSelected(), forceRevision: this.state.forceRevision, tabsRevision: this.props.renderRevision, key: key },
                        React.createElement(ErrorBoundary, { message: this.i18nName(I18nLabel.Error_rendering_component) }, this.props.factory(child))), element, key));
                    child.setRendered(renderTab);
                }
            }
        });
        return tabMoveables;
    }
    renderTabStamps() {
        const tabStamps = [];
        this.props.model.visitNodes((node) => {
            if (node instanceof TabNode) {
                const child = node;
                // what the tab should look like when dragged (since images need to have been loaded before drag image can be taken)
                tabStamps.push(React.createElement(DragContainer, { key: child.getId(), layout: this, node: child }));
            }
        });
        return tabStamps;
    }
    renderTabs() {
        const tabs = new Map();
        this.props.model.visitWindowNodes(this.windowId, (node) => {
            if (node instanceof TabNode) {
                const child = node;
                const selected = child.isSelected();
                const path = child.getPath();
                const renderTab = child.isRendered() || selected || !child.isEnableRenderOnDemand();
                if (renderTab) {
                    // const rect = (child.getParent() as BorderNode | TabSetNode).getContentRect();
                    // const key = child.getId();
                    tabs.set(child.getId(), (
                    // <SizeTracker rect={rect} forceRevision={this.state.forceRevision} key={key}>
                    React.createElement(Tab, { key: child.getId(), layout: this, path: path, node: child, selected: selected })
                    // </SizeTracker>
                    ));
                }
            }
        });
        return tabs;
    }
    renderMetricsElements() {
        return (React.createElement("div", { key: "findBorderBarSize", ref: this.findBorderBarSizeRef, className: this.getClassName(CLASSES.FLEXLAYOUT__BORDER_SIZER) }, "FindBorderBarSize"));
    }
    checkForBorderToShow(x, y) {
        const r = this.getBoundingClientRect(this.mainRef.current);
        const c = r.getCenter();
        const margin = edgeRectWidth;
        const offset = edgeRectLength / 2;
        let overEdge = false;
        if (this.props.model.isEnableEdgeDock() && this.state.showHiddenBorder === DockLocation.CENTER) {
            if ((y > c.y - offset && y < c.y + offset) ||
                (x > c.x - offset && x < c.x + offset)) {
                overEdge = true;
            }
        }
        let location = DockLocation.CENTER;
        if (!overEdge) {
            if (x <= r.x + margin) {
                location = DockLocation.LEFT;
            }
            else if (x >= r.getRight() - margin) {
                location = DockLocation.RIGHT;
            }
            else if (y <= r.y + margin) {
                location = DockLocation.TOP;
            }
            else if (y >= r.getBottom() - margin) {
                location = DockLocation.BOTTOM;
            }
        }
        if (location !== this.state.showHiddenBorder) {
            this.setState({ showHiddenBorder: location });
        }
    }
    tidyMoveablesMap() {
        // console.log("tidyMoveablesMap");
        const tabs = new Map();
        this.props.model.visitNodes((node, _) => {
            if (node instanceof TabNode) {
                tabs.set(node.getId(), node);
            }
        });
        for (const [nodeId, element] of this.moveableElementMap) {
            if (!tabs.has(nodeId)) {
                // console.log("delete", nodeId);
                element.remove(); // remove from dom
                this.moveableElementMap.delete(nodeId); // remove map entry 
            }
        }
    }
    reorderComponents(components, ids) {
        const nextIds = [];
        const nextIdsSet = new Set();
        let reordered = [];
        // Keep any previous tabs in the same DOM order as before, removing any that have been deleted
        for (const id of ids) {
            if (components.get(id)) {
                nextIds.push(id);
                nextIdsSet.add(id);
            }
        }
        ids.splice(0, ids.length, ...nextIds);
        // Add tabs that have been added to the DOM
        for (const [id, _] of components) {
            if (!nextIdsSet.has(id)) {
                ids.push(id);
            }
        }
        reordered = ids.map((id) => {
            return components.get(id);
        });
        return reordered;
    }
    redraw(type) {
        // console.log("redraw", this.windowId, type);
        this.mainLayout.setState((state, props) => { return { forceRevision: state.forceRevision + 1 }; });
    }
    redrawInternal(type) {
        // console.log("redrawInternal", this.windowId, type);
        this.mainLayout.setState((state, props) => { return { layoutRevision: state.layoutRevision + 1 }; });
    }
    doAction(action) {
        if (this.props.onAction !== undefined) {
            const outcome = this.props.onAction(action);
            if (outcome !== undefined) {
                return this.props.model.doAction(outcome);
            }
            return undefined;
        }
        else {
            return this.props.model.doAction(action);
        }
    }
    getBoundingClientRect(div) {
        const layoutRect = this.getDomRect();
        if (layoutRect) {
            return Rect.getBoundingClientRect(div).relativeTo(layoutRect);
        }
        return Rect.empty();
    }
    getMoveableContainer() {
        return this.moveablesRef.current;
    }
    getMoveableElement(id) {
        let moveableElement = this.moveableElementMap.get(id);
        if (moveableElement === undefined) {
            moveableElement = document.createElement("div");
            this.moveablesRef.current.appendChild(moveableElement);
            moveableElement.className = CLASSES.FLEXLAYOUT__TAB_MOVEABLE;
            this.moveableElementMap.set(id, moveableElement);
        }
        return moveableElement;
    }
    getMainLayout() {
        return this.mainLayout;
    }
    getCurrentDocument() {
        return this.currentDocument;
    }
    getDomRect() {
        if (this.selfRef.current) {
            return Rect.fromDomRect(this.selfRef.current.getBoundingClientRect());
        }
        else {
            return Rect.empty();
        }
    }
    getWindowId() {
        return this.windowId;
    }
    getRootDiv() {
        return this.selfRef.current;
    }
    getMainElement() {
        return this.mainRef.current;
    }
    getFactory() {
        return this.props.factory;
    }
    isSupportsPopout() {
        return this.supportsPopout;
    }
    isRealtimeResize() {
        var _a;
        return (_a = this.props.realtimeResize) !== null && _a !== void 0 ? _a : false;
    }
    getPopoutURL() {
        return this.popoutURL;
    }
    setEditingTab(tabNode) {
        this.setState({ editingTab: tabNode });
    }
    getEditingTab() {
        return this.state.editingTab;
    }
    getModel() {
        return this.props.model;
    }
    getScreenRect(inRect) {
        const rect = inRect.clone();
        const layoutRect = this.getDomRect();
        // Note: outerHeight can be less than innerHeight when window is zoomed, so cannot use
        // const navHeight = Math.min(65, this.currentWindow!.outerHeight - this.currentWindow!.innerHeight);
        // const navWidth = Math.min(65, this.currentWindow!.outerWidth - this.currentWindow!.innerWidth);
        const navHeight = 60;
        const navWidth = 2;
        // console.log(rect.y, this.currentWindow!.screenX,layoutRect.y);
        rect.x = this.currentWindow.screenX + this.currentWindow.scrollX + navWidth / 2 + layoutRect.x + rect.x;
        rect.y = this.currentWindow.screenY + this.currentWindow.scrollY + (navHeight - navWidth / 2) + layoutRect.y + rect.y;
        rect.height += navHeight;
        rect.width += navWidth;
        return rect;
    }
    addTabToTabSet(tabsetId, json) {
        const tabsetNode = this.props.model.getNodeById(tabsetId);
        if (tabsetNode !== undefined) {
            const node = this.doAction(Actions.addNode(json, tabsetId, DockLocation.CENTER, -1));
            return node;
        }
        return undefined;
    }
    addTabToActiveTabSet(json) {
        const tabsetNode = this.props.model.getActiveTabset(this.windowId);
        if (tabsetNode !== undefined) {
            const node = this.doAction(Actions.addNode(json, tabsetNode.getId(), DockLocation.CENTER, -1));
            return node;
        }
        return undefined;
    }
    maximize(tabsetNode) {
        this.doAction(Actions.maximizeToggle(tabsetNode.getId(), this.getWindowId()));
    }
    customizeTab(tabNode, renderValues) {
        if (this.props.onRenderTab) {
            this.props.onRenderTab(tabNode, renderValues);
        }
    }
    customizeTabSet(tabSetNode, renderValues) {
        if (this.props.onRenderTabSet) {
            this.props.onRenderTabSet(tabSetNode, renderValues);
        }
    }
    i18nName(id, param) {
        let message;
        if (this.props.i18nMapper) {
            message = this.props.i18nMapper(id, param);
        }
        if (message === undefined) {
            message = id + (param === undefined ? "" : param);
        }
        return message;
    }
    getShowOverflowMenu() {
        return this.props.onShowOverflowMenu;
    }
    getTabSetPlaceHolderCallback() {
        return this.props.onTabSetPlaceHolder;
    }
    showContextMenu(node, event) {
        if (this.props.onContextMenu) {
            this.props.onContextMenu(node, event);
        }
    }
    auxMouseClick(node, event) {
        if (this.props.onAuxMouseClick) {
            this.props.onAuxMouseClick(node, event);
        }
    }
    showOverlay(show) {
        this.setState({ showOverlay: show });
        enablePointerOnIFrames(!show, this.currentDocument);
    }
    // *************************** Start Drag Drop *************************************
    addTabWithDragAndDrop(event, json, onDrop) {
        const tempNode = TabNode.fromJson(json, this.props.model, false);
        LayoutInternal.dragState = new DragState(this.mainLayout, DragSource.Add, tempNode, json, onDrop);
    }
    moveTabWithDragAndDrop(event, node) {
        this.setDragNode(event, node);
    }
    setDragComponent(event, component, x, y) {
        let dragElement = (React.createElement("div", { style: { position: "unset" }, className: this.getClassName(CLASSES.FLEXLAYOUT__LAYOUT) + " " + this.getClassName(CLASSES.FLEXLAYOUT__DRAG_RECT) }, component));
        const tempDiv = this.currentDocument.createElement('div');
        tempDiv.setAttribute("data-layout-path", "/drag-rectangle");
        tempDiv.style.position = "absolute";
        tempDiv.style.left = "-10000px";
        tempDiv.style.top = "-10000px";
        this.currentDocument.body.appendChild(tempDiv);
        createRoot(tempDiv).render(dragElement);
        event.dataTransfer.setDragImage(tempDiv, x, y);
        setTimeout(() => {
            this.currentDocument.body.removeChild(tempDiv);
        }, 0);
    }
    setDraggingOverWindow(overWindow) {
        // console.log("setDraggingOverWindow", overWindow);
        if (this.isDraggingOverWindow !== overWindow) {
            if (this.outlineDiv) {
                this.outlineDiv.style.visibility = overWindow ? "hidden" : "visible";
            }
            if (overWindow) {
                this.setState({ showEdges: false });
            }
            else {
                // add edge indicators
                if (this.props.model.getMaximizedTabset(this.windowId) === undefined) {
                    this.setState({ showEdges: this.props.model.isEnableEdgeDock() });
                }
            }
            this.isDraggingOverWindow = overWindow;
        }
    }
    clearDragMain() {
        // console.log("clear drag main");
        LayoutInternal.dragState = undefined;
        if (this.windowId === Model.MAIN_WINDOW_ID) {
            this.isDraggingOverWindow = false;
        }
        for (const [, layoutWindow] of this.props.model.getwindowsMap()) {
            // console.log(layoutWindow);
            layoutWindow.layout.clearDragLocal();
        }
    }
    clearDragLocal() {
        // console.log("clear drag local", this.windowId);
        this.setState({ showEdges: false });
        this.showOverlay(false);
        this.dragEnterCount = 0;
        this.dragging = false;
        if (this.outlineDiv) {
            this.selfRef.current.removeChild(this.outlineDiv);
            this.outlineDiv = undefined;
        }
    }
}
LayoutInternal.dragState = undefined;
export const FlexLayoutVersion = "0.8.1";
const defaultIcons = {
    close: React.createElement(CloseIcon, null),
    closeTabset: React.createElement(CloseIcon, null),
    popout: React.createElement(PopoutIcon, null),
    maximize: React.createElement(MaximizeIcon, null),
    restore: React.createElement(RestoreIcon, null),
    more: React.createElement(OverflowIcon, null),
    edgeArrow: React.createElement(EdgeIcon, null),
    activeTabset: React.createElement(AsterickIcon, null)
};
var DragSource;
(function (DragSource) {
    DragSource["Internal"] = "internal";
    DragSource["External"] = "external";
    DragSource["Add"] = "add";
})(DragSource || (DragSource = {}));
/** @internal */
const defaultSupportsPopout = isDesktop();
/** @internal */
const edgeRectLength = 100;
/** @internal */
const edgeRectWidth = 10;
// global layout drag state
class DragState {
    constructor(mainLayout, dragSource, dragNode, dragJson, fnNewNodeDropped) {
        this.mainLayout = mainLayout;
        this.dragSource = dragSource;
        this.dragNode = dragNode;
        this.dragJson = dragJson;
        this.fnNewNodeDropped = fnNewNodeDropped;
    }
}
//# sourceMappingURL=Layout.js.map
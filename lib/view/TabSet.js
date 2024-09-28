import * as React from "react";
import { I18nLabel } from "../I18nLabel";
import { Actions } from "../model/Actions";
import { showPopup } from "./PopupMenu";
import { TabButton } from "./TabButton";
import { useTabOverflow } from "./TabOverflowHook";
import { Orientation } from "../Orientation";
import { CLASSES } from "../Types";
import { isAuxMouseEvent } from "./Utils";
import { createPortal } from "react-dom";
import { Rect } from "../Rect";
/** @internal */
export const TabSet = (props) => {
    const { node, layout } = props;
    const tabStripRef = React.useRef(null);
    const tabStripInnerRef = React.useRef(null);
    const contentRef = React.useRef(null);
    const buttonBarRef = React.useRef(null);
    const overflowbuttonRef = React.useRef(null);
    const stickyButtonsRef = React.useRef(null);
    const icons = layout.getIcons();
    // must use useEffect (rather than useLayoutEffect) otherwise contentrect not set correctly (has height 0 when changing theme in demo)
    React.useEffect(() => {
        node.setRect(layout.getBoundingClientRect(selfRef.current));
        if (tabStripRef.current) {
            node.setTabStripRect(layout.getBoundingClientRect(tabStripRef.current));
        }
        const newContentRect = Rect.getContentRect(contentRef.current).relativeTo(layout.getDomRect());
        if (!node.getContentRect().equals(newContentRect)) {
            node.setContentRect(newContentRect);
            layout.redrawInternal("tabset content rect " + newContentRect);
        }
    });
    // this must be after the useEffect, so the node rect is already set (else window popin will not position tabs correctly)
    const { selfRef, position, userControlledLeft, hiddenTabs, onMouseWheel, tabsTruncated } = useTabOverflow(node, Orientation.HORZ, buttonBarRef, stickyButtonsRef);
    const onOverflowClick = (event) => {
        const callback = layout.getShowOverflowMenu();
        if (callback !== undefined) {
            callback(node, event, hiddenTabs, onOverflowItemSelect);
        }
        else {
            const element = overflowbuttonRef.current;
            showPopup(element, hiddenTabs, onOverflowItemSelect, layout);
        }
        event.stopPropagation();
    };
    const onOverflowItemSelect = (item) => {
        layout.doAction(Actions.selectTab(item.node.getId()));
        userControlledLeft.current = false;
    };
    const onDragStart = (event) => {
        if (!layout.getEditingTab()) {
            if (node.isEnableDrag()) {
                event.stopPropagation();
                layout.setDragNode(event.nativeEvent, node);
            }
            else {
                event.preventDefault();
            }
        }
        else {
            event.preventDefault();
        }
    };
    const onPointerDown = (event) => {
        if (!isAuxMouseEvent(event)) {
            let name = node.getName();
            if (name === undefined) {
                name = "";
            }
            else {
                name = ": " + name;
            }
            layout.doAction(Actions.setActiveTabset(node.getId(), layout.getWindowId()));
        }
    };
    const onAuxMouseClick = (event) => {
        if (isAuxMouseEvent(event)) {
            layout.auxMouseClick(node, event);
        }
    };
    const onContextMenu = (event) => {
        layout.showContextMenu(node, event);
    };
    const onInterceptPointerDown = (event) => {
        event.stopPropagation();
    };
    const onMaximizeToggle = (event) => {
        if (node.canMaximize()) {
            layout.maximize(node);
        }
        event.stopPropagation();
    };
    const onClose = (event) => {
        layout.doAction(Actions.deleteTabset(node.getId()));
        event.stopPropagation();
    };
    const onCloseTab = (event) => {
        layout.doAction(Actions.deleteTab(node.getChildren()[0].getId()));
        event.stopPropagation();
    };
    const onPopoutTab = (event) => {
        if (selectedTabNode !== undefined) {
            layout.doAction(Actions.popoutTab(selectedTabNode.getId()));
            // layout.doAction(Actions.popoutTabset(node.getId()));
        }
        event.stopPropagation();
    };
    const onDoubleClick = (event) => {
        if (node.canMaximize()) {
            layout.maximize(node);
        }
    };
    // Start Render
    const cm = layout.getClassName;
    // tabbar inner can get shifted left via tab rename, this resets scrollleft to 0
    if (tabStripInnerRef.current !== null && tabStripInnerRef.current.scrollLeft !== 0) {
        tabStripInnerRef.current.scrollLeft = 0;
    }
    const selectedTabNode = node.getSelectedNode();
    const path = node.getPath();
    const tabs = [];
    if (node.isEnableTabStrip()) {
        for (let i = 0; i < node.getChildren().length; i++) {
            const child = node.getChildren()[i];
            let isSelected = node.getSelected() === i;
            tabs.push(React.createElement(TabButton, { layout: layout, node: child, path: path + "/tb" + i, key: child.getId(), selected: isSelected }));
            if (i < node.getChildren().length - 1) {
                tabs.push(React.createElement("div", { key: "divider" + i, className: cm(CLASSES.FLEXLAYOUT__TABSET_TAB_DIVIDER) }));
            }
        }
    }
    let stickyButtons = [];
    let buttons = [];
    // allow customization of header contents and buttons
    const renderState = { stickyButtons, buttons, overflowPosition: undefined };
    layout.customizeTabSet(node, renderState);
    stickyButtons = renderState.stickyButtons;
    buttons = renderState.buttons;
    const isTabStretch = node.isEnableSingleTabStretch() && node.getChildren().length === 1;
    const showClose = (isTabStretch && (node.getChildren()[0].isEnableClose())) || node.isEnableClose();
    if (renderState.overflowPosition === undefined) {
        renderState.overflowPosition = stickyButtons.length;
    }
    if (stickyButtons.length > 0) {
        if (!node.isEnableTabWrap() && (tabsTruncated || isTabStretch)) {
            buttons = [...stickyButtons, ...buttons];
        }
        else {
            tabs.push(React.createElement("div", { ref: stickyButtonsRef, key: "sticky_buttons_container", onPointerDown: onInterceptPointerDown, onDragStart: (e) => { e.preventDefault(); }, className: cm(CLASSES.FLEXLAYOUT__TAB_TOOLBAR_STICKY_BUTTONS_CONTAINER) }, stickyButtons));
        }
    }
    if (!node.isEnableTabWrap()) {
        if (hiddenTabs.length > 0) {
            const overflowTitle = layout.i18nName(I18nLabel.Overflow_Menu_Tooltip);
            let overflowContent;
            if (typeof icons.more === "function") {
                overflowContent = icons.more(node, hiddenTabs);
            }
            else {
                overflowContent = (React.createElement(React.Fragment, null,
                    icons.more,
                    React.createElement("div", { className: cm(CLASSES.FLEXLAYOUT__TAB_BUTTON_OVERFLOW_COUNT) }, hiddenTabs.length)));
            }
            buttons.splice(Math.min(renderState.overflowPosition, buttons.length), 0, React.createElement("button", { key: "overflowbutton", "data-layout-path": path + "/button/overflow", ref: overflowbuttonRef, className: cm(CLASSES.FLEXLAYOUT__TAB_TOOLBAR_BUTTON) + " " + cm(CLASSES.FLEXLAYOUT__TAB_BUTTON_OVERFLOW), title: overflowTitle, onClick: onOverflowClick, onPointerDown: onInterceptPointerDown }, overflowContent));
        }
    }
    if (selectedTabNode !== undefined &&
        layout.isSupportsPopout() &&
        selectedTabNode.isEnablePopout() &&
        selectedTabNode.isEnablePopoutIcon()) {
        const popoutTitle = layout.i18nName(I18nLabel.Popout_Tab);
        buttons.push(React.createElement("button", { key: "popout", "data-layout-path": path + "/button/popout", title: popoutTitle, className: cm(CLASSES.FLEXLAYOUT__TAB_TOOLBAR_BUTTON) + " " + cm(CLASSES.FLEXLAYOUT__TAB_TOOLBAR_BUTTON_FLOAT), onClick: onPopoutTab, onPointerDown: onInterceptPointerDown }, (typeof icons.popout === "function") ? icons.popout(selectedTabNode) : icons.popout));
    }
    if (node.canMaximize()) {
        const minTitle = layout.i18nName(I18nLabel.Restore);
        const maxTitle = layout.i18nName(I18nLabel.Maximize);
        buttons.push(React.createElement("button", { key: "max", "data-layout-path": path + "/button/max", title: node.isMaximized() ? minTitle : maxTitle, className: cm(CLASSES.FLEXLAYOUT__TAB_TOOLBAR_BUTTON) + " " + cm(CLASSES.FLEXLAYOUT__TAB_TOOLBAR_BUTTON_ + (node.isMaximized() ? "max" : "min")), onClick: onMaximizeToggle, onPointerDown: onInterceptPointerDown }, node.isMaximized() ?
            (typeof icons.restore === "function") ? icons.restore(node) : icons.restore :
            (typeof icons.maximize === "function") ? icons.maximize(node) : icons.maximize));
    }
    if (!node.isMaximized() && showClose) {
        const title = isTabStretch ? layout.i18nName(I18nLabel.Close_Tab) : layout.i18nName(I18nLabel.Close_Tabset);
        buttons.push(React.createElement("button", { key: "close", "data-layout-path": path + "/button/close", title: title, className: cm(CLASSES.FLEXLAYOUT__TAB_TOOLBAR_BUTTON) + " " + cm(CLASSES.FLEXLAYOUT__TAB_TOOLBAR_BUTTON_CLOSE), onClick: isTabStretch ? onCloseTab : onClose, onPointerDown: onInterceptPointerDown }, (typeof icons.closeTabset === "function") ? icons.closeTabset(node) : icons.closeTabset));
    }
    if (node.isActive() && node.isEnableActiveIcon()) {
        const title = layout.i18nName(I18nLabel.Active_Tabset);
        buttons.push(React.createElement("div", { key: "active", "data-layout-path": path + "/button/active", title: title, className: cm(CLASSES.FLEXLAYOUT__TAB_TOOLBAR_ICON) }, (typeof icons.activeTabset === "function") ? icons.activeTabset(node) : icons.activeTabset));
    }
    const buttonbar = (React.createElement("div", { key: "buttonbar", ref: buttonBarRef, className: cm(CLASSES.FLEXLAYOUT__TAB_TOOLBAR), onPointerDown: onInterceptPointerDown, onDragStart: (e) => { e.preventDefault(); } }, buttons));
    let tabStrip;
    let tabStripClasses = cm(CLASSES.FLEXLAYOUT__TABSET_TABBAR_OUTER);
    if (node.getClassNameTabStrip() !== undefined) {
        tabStripClasses += " " + node.getClassNameTabStrip();
    }
    tabStripClasses += " " + CLASSES.FLEXLAYOUT__TABSET_TABBAR_OUTER_ + node.getTabLocation();
    if (node.isActive()) {
        tabStripClasses += " " + cm(CLASSES.FLEXLAYOUT__TABSET_SELECTED);
    }
    if (node.isMaximized()) {
        tabStripClasses += " " + cm(CLASSES.FLEXLAYOUT__TABSET_MAXIMIZED);
    }
    if (isTabStretch) {
        const tabNode = node.getChildren()[0];
        if (tabNode.getTabSetClassName() !== undefined) {
            tabStripClasses += " " + tabNode.getTabSetClassName();
        }
    }
    if (node.isEnableTabWrap()) {
        if (node.isEnableTabStrip()) {
            tabStrip = (React.createElement("div", { className: tabStripClasses, style: { flexWrap: "wrap", gap: "1px", marginTop: "2px" }, ref: tabStripRef, "data-layout-path": path + "/tabstrip", onPointerDown: onPointerDown, onDoubleClick: onDoubleClick, onContextMenu: onContextMenu, onClick: onAuxMouseClick, onAuxClick: onAuxMouseClick, draggable: true, onDragStart: onDragStart },
                tabs,
                React.createElement("div", { style: { flexGrow: 1 } }),
                buttonbar));
        }
    }
    else {
        if (node.isEnableTabStrip()) {
            tabStrip = (React.createElement("div", { className: tabStripClasses, ref: tabStripRef, "data-layout-path": path + "/tabstrip", onPointerDown: onPointerDown, onDoubleClick: onDoubleClick, onContextMenu: onContextMenu, onClick: onAuxMouseClick, onAuxClick: onAuxMouseClick, draggable: true, onWheel: onMouseWheel, onDragStart: onDragStart },
                React.createElement("div", { ref: tabStripInnerRef, className: cm(CLASSES.FLEXLAYOUT__TABSET_TABBAR_INNER) + " " + cm(CLASSES.FLEXLAYOUT__TABSET_TABBAR_INNER_ + node.getTabLocation()) },
                    React.createElement("div", { style: { left: position, width: (isTabStretch ? "100%" : "10000px") }, className: cm(CLASSES.FLEXLAYOUT__TABSET_TABBAR_INNER_TAB_CONTAINER) + " " + cm(CLASSES.FLEXLAYOUT__TABSET_TABBAR_INNER_TAB_CONTAINER_ + node.getTabLocation()) }, tabs)),
                buttonbar));
        }
    }
    var emptyTabset;
    if (node.getChildren().length === 0) {
        const placeHolderCallback = layout.getTabSetPlaceHolderCallback();
        if (placeHolderCallback) {
            emptyTabset = placeHolderCallback(node);
        }
    }
    let content = React.createElement("div", { ref: contentRef, className: cm(CLASSES.FLEXLAYOUT__TABSET_CONTENT) }, emptyTabset);
    if (node.getTabLocation() === "top") {
        content = React.createElement(React.Fragment, null,
            tabStrip,
            content);
    }
    else {
        content = React.createElement(React.Fragment, null,
            content,
            tabStrip);
    }
    let style = {
        flexGrow: Math.max(1, node.getWeight() * 1000),
        minWidth: node.getMinWidth(),
        minHeight: node.getMinHeight(),
        maxWidth: node.getMaxWidth(),
        maxHeight: node.getMaxHeight()
    };
    if (node.getModel().getMaximizedTabset(layout.getWindowId()) !== undefined && !node.isMaximized()) {
        style.display = "none";
    }
    // note: tabset container is needed to allow flexbox to size without border/padding/margin
    // then inner tabset can have border/padding/margin for styling
    const tabset = (React.createElement("div", { ref: selfRef, className: cm(CLASSES.FLEXLAYOUT__TABSET_CONTAINER), style: style },
        React.createElement("div", { className: cm(CLASSES.FLEXLAYOUT__TABSET), "data-layout-path": path }, content)));
    if (node.isMaximized()) {
        if (layout.getMainElement()) {
            return createPortal(React.createElement("div", { style: {
                    position: "absolute",
                    display: "flex",
                    top: 0, left: 0, bottom: 0, right: 0
                } }, tabset), layout.getMainElement());
        }
        else {
            return tabset;
        }
    }
    else {
        return tabset;
    }
};
//# sourceMappingURL=TabSet.js.map
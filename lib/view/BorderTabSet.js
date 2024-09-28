import * as React from "react";
import { DockLocation } from "../DockLocation";
import { BorderButton } from "./BorderButton";
import { showPopup } from "./PopupMenu";
import { Actions } from "../model/Actions";
import { I18nLabel } from "../I18nLabel";
import { useTabOverflow } from "./TabOverflowHook";
import { Orientation } from "../Orientation";
import { CLASSES } from "../Types";
import { isAuxMouseEvent } from "./Utils";
import { Rect } from "../Rect";
/** @internal */
export const BorderTabSet = (props) => {
    const { border, layout, size } = props;
    const toolbarRef = React.useRef(null);
    const overflowbuttonRef = React.useRef(null);
    const stickyButtonsRef = React.useRef(null);
    const icons = layout.getIcons();
    React.useLayoutEffect(() => {
        border.setTabHeaderRect(Rect.getBoundingClientRect(selfRef.current).relativeTo(layout.getDomRect()));
    });
    const { selfRef, position, userControlledLeft, hiddenTabs, onMouseWheel, tabsTruncated } = useTabOverflow(border, Orientation.flip(border.getOrientation()), toolbarRef, stickyButtonsRef);
    const onAuxMouseClick = (event) => {
        if (isAuxMouseEvent(event)) {
            layout.auxMouseClick(border, event);
        }
    };
    const onContextMenu = (event) => {
        layout.showContextMenu(border, event);
    };
    const onInterceptPointerDown = (event) => {
        event.stopPropagation();
    };
    const onOverflowClick = (event) => {
        const callback = layout.getShowOverflowMenu();
        if (callback !== undefined) {
            callback(border, event, hiddenTabs, onOverflowItemSelect);
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
    const onPopoutTab = (event) => {
        const selectedTabNode = border.getChildren()[border.getSelected()];
        if (selectedTabNode !== undefined) {
            layout.doAction(Actions.popoutTab(selectedTabNode.getId()));
        }
        event.stopPropagation();
    };
    const cm = layout.getClassName;
    const tabButtons = [];
    const layoutTab = (i) => {
        let isSelected = border.getSelected() === i;
        let child = border.getChildren()[i];
        tabButtons.push(React.createElement(BorderButton, { layout: layout, border: border.getLocation().getName(), node: child, path: border.getPath() + "/tb" + i, key: child.getId(), selected: isSelected, icons: icons }));
        if (i < border.getChildren().length - 1) {
            tabButtons.push(React.createElement("div", { key: "divider" + i, className: cm(CLASSES.FLEXLAYOUT__BORDER_TAB_DIVIDER) }));
        }
    };
    for (let i = 0; i < border.getChildren().length; i++) {
        layoutTab(i);
    }
    let borderClasses = cm(CLASSES.FLEXLAYOUT__BORDER) + " " + cm(CLASSES.FLEXLAYOUT__BORDER_ + border.getLocation().getName());
    if (border.getClassName() !== undefined) {
        borderClasses += " " + border.getClassName();
    }
    // allow customization of tabset right/bottom buttons
    let buttons = [];
    let stickyButtons = [];
    const renderState = { buttons, stickyButtons: stickyButtons, overflowPosition: undefined };
    layout.customizeTabSet(border, renderState);
    buttons = renderState.buttons;
    if (renderState.overflowPosition === undefined) {
        renderState.overflowPosition = stickyButtons.length;
    }
    if (stickyButtons.length > 0) {
        if (tabsTruncated) {
            buttons = [...stickyButtons, ...buttons];
        }
        else {
            tabButtons.push(React.createElement("div", { ref: stickyButtonsRef, key: "sticky_buttons_container", onPointerDown: onInterceptPointerDown, onDragStart: (e) => { e.preventDefault(); }, className: cm(CLASSES.FLEXLAYOUT__TAB_TOOLBAR_STICKY_BUTTONS_CONTAINER) }, stickyButtons));
        }
    }
    if (hiddenTabs.length > 0) {
        const overflowTitle = layout.i18nName(I18nLabel.Overflow_Menu_Tooltip);
        let overflowContent;
        if (typeof icons.more === "function") {
            overflowContent = icons.more(border, hiddenTabs);
        }
        else {
            overflowContent = (React.createElement(React.Fragment, null,
                icons.more,
                React.createElement("div", { className: cm(CLASSES.FLEXLAYOUT__TAB_BUTTON_OVERFLOW_COUNT) }, hiddenTabs.length)));
        }
        buttons.splice(Math.min(renderState.overflowPosition, buttons.length), 0, React.createElement("button", { key: "overflowbutton", ref: overflowbuttonRef, className: cm(CLASSES.FLEXLAYOUT__BORDER_TOOLBAR_BUTTON) + " " + cm(CLASSES.FLEXLAYOUT__BORDER_TOOLBAR_BUTTON_OVERFLOW) + " " + cm(CLASSES.FLEXLAYOUT__BORDER_TOOLBAR_BUTTON_OVERFLOW_ + border.getLocation().getName()), title: overflowTitle, onClick: onOverflowClick, onPointerDown: onInterceptPointerDown }, overflowContent));
    }
    const selectedIndex = border.getSelected();
    if (selectedIndex !== -1) {
        const selectedTabNode = border.getChildren()[selectedIndex];
        if (selectedTabNode !== undefined && layout.isSupportsPopout() && selectedTabNode.isEnablePopout()) {
            const popoutTitle = layout.i18nName(I18nLabel.Popout_Tab);
            buttons.push(React.createElement("button", { key: "popout", title: popoutTitle, className: cm(CLASSES.FLEXLAYOUT__BORDER_TOOLBAR_BUTTON) + " " + cm(CLASSES.FLEXLAYOUT__BORDER_TOOLBAR_BUTTON_FLOAT), onClick: onPopoutTab, onPointerDown: onInterceptPointerDown }, (typeof icons.popout === "function") ? icons.popout(selectedTabNode) : icons.popout));
        }
    }
    const toolbar = (React.createElement("div", { key: "toolbar", ref: toolbarRef, className: cm(CLASSES.FLEXLAYOUT__BORDER_TOOLBAR) + " " + cm(CLASSES.FLEXLAYOUT__BORDER_TOOLBAR_ + border.getLocation().getName()) }, buttons));
    let innerStyle = {};
    let outerStyle = {};
    const borderHeight = size - 1;
    if (border.getLocation() === DockLocation.LEFT) {
        innerStyle = { right: "100%", top: position };
        outerStyle = { width: borderHeight };
    }
    else if (border.getLocation() === DockLocation.RIGHT) {
        innerStyle = { left: "100%", top: position };
        outerStyle = { width: borderHeight };
    }
    else {
        innerStyle = { left: position };
        outerStyle = { height: borderHeight };
    }
    return (React.createElement("div", { ref: selfRef, style: {
            display: "flex",
            flexDirection: (border.getOrientation() === Orientation.VERT ? "row" : "column")
        }, className: borderClasses, "data-layout-path": border.getPath(), onClick: onAuxMouseClick, onAuxClick: onAuxMouseClick, onContextMenu: onContextMenu, onWheel: onMouseWheel },
        React.createElement("div", { style: outerStyle, className: cm(CLASSES.FLEXLAYOUT__BORDER_INNER) + " " + cm(CLASSES.FLEXLAYOUT__BORDER_INNER_ + border.getLocation().getName()) },
            React.createElement("div", { style: innerStyle, className: cm(CLASSES.FLEXLAYOUT__BORDER_INNER_TAB_CONTAINER) + " " + cm(CLASSES.FLEXLAYOUT__BORDER_INNER_TAB_CONTAINER_ + border.getLocation().getName()) }, tabButtons)),
        toolbar));
};
//# sourceMappingURL=BorderTabSet.js.map
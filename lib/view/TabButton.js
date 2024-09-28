import * as React from "react";
import { I18nLabel } from "../I18nLabel";
import { Actions } from "../model/Actions";
import { ICloseType } from "../model/ICloseType";
import { CLASSES } from "../Types";
import { getRenderStateEx, isAuxMouseEvent } from "./Utils";
/** @internal */
export const TabButton = (props) => {
    const { layout, node, selected, path } = props;
    const selfRef = React.useRef(null);
    const contentRef = React.useRef(null);
    const icons = layout.getIcons();
    React.useLayoutEffect(() => {
        node.setTabRect(layout.getBoundingClientRect(selfRef.current));
        if (layout.getEditingTab() === node) {
            contentRef.current.select();
        }
    });
    const onDragStart = (event) => {
        if (node.isEnableDrag()) {
            event.stopPropagation(); // prevent starting a tabset drag as well
            layout.setDragNode(event.nativeEvent, node);
        }
        else {
            event.preventDefault();
        }
    };
    const onDragEnd = (event) => {
        layout.clearDragMain();
    };
    const onAuxMouseClick = (event) => {
        if (isAuxMouseEvent(event)) {
            layout.auxMouseClick(node, event);
        }
    };
    const onContextMenu = (event) => {
        layout.showContextMenu(node, event);
    };
    const onClick = () => {
        layout.doAction(Actions.selectTab(node.getId()));
    };
    const onDoubleClick = (event) => {
        if (node.isEnableRename()) {
            onRename();
            event.stopPropagation();
        }
    };
    const onRename = () => {
        layout.setEditingTab(node);
        layout.getCurrentDocument().body.addEventListener("pointerdown", onEndEdit);
    };
    const onEndEdit = (event) => {
        if (event.target !== contentRef.current) {
            layout.getCurrentDocument().body.removeEventListener("pointerdown", onEndEdit);
            layout.setEditingTab(undefined);
        }
    };
    const isClosable = () => {
        const closeType = node.getCloseType();
        if (selected || closeType === ICloseType.Always) {
            return true;
        }
        if (closeType === ICloseType.Visible) {
            // not selected but x should be visible due to hover
            if (window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
                return true;
            }
        }
        return false;
    };
    const onClose = (event) => {
        if (isClosable()) {
            layout.doAction(Actions.deleteTab(node.getId()));
        }
        else {
            onClick();
        }
    };
    const onClosePointerDown = (event) => {
        event.stopPropagation();
    };
    const onTextBoxPointerDown = (event) => {
        event.stopPropagation();
    };
    const onTextBoxKeyPress = (event) => {
        if (event.code === 'Escape') {
            // esc
            layout.setEditingTab(undefined);
        }
        else if (event.code === 'Enter') {
            // enter
            layout.setEditingTab(undefined);
            layout.doAction(Actions.renameTab(node.getId(), event.target.value));
        }
    };
    const cm = layout.getClassName;
    const parentNode = node.getParent();
    const isStretch = parentNode.isEnableSingleTabStretch() && parentNode.getChildren().length === 1;
    let baseClassName = isStretch ? CLASSES.FLEXLAYOUT__TAB_BUTTON_STRETCH : CLASSES.FLEXLAYOUT__TAB_BUTTON;
    let classNames = cm(baseClassName);
    classNames += " " + cm(baseClassName + "_" + parentNode.getTabLocation());
    if (!isStretch) {
        if (selected) {
            classNames += " " + cm(baseClassName + "--selected");
        }
        else {
            classNames += " " + cm(baseClassName + "--unselected");
        }
    }
    if (node.getClassName() !== undefined) {
        classNames += " " + node.getClassName();
    }
    const renderState = getRenderStateEx(layout, node);
    let content = renderState.content ? (React.createElement("div", { className: cm(CLASSES.FLEXLAYOUT__TAB_BUTTON_CONTENT) }, renderState.content)) : null;
    const leading = renderState.leading ? (React.createElement("div", { className: cm(CLASSES.FLEXLAYOUT__TAB_BUTTON_LEADING) }, renderState.leading)) : null;
    if (layout.getEditingTab() === node) {
        content = (React.createElement("input", { ref: contentRef, className: cm(CLASSES.FLEXLAYOUT__TAB_BUTTON_TEXTBOX), "data-layout-path": path + "/textbox", type: "text", autoFocus: true, defaultValue: node.getName(), onKeyDown: onTextBoxKeyPress, onPointerDown: onTextBoxPointerDown }));
    }
    if (node.isEnableClose() && !isStretch) {
        const closeTitle = layout.i18nName(I18nLabel.Close_Tab);
        renderState.buttons.push(React.createElement("div", { key: "close", "data-layout-path": path + "/button/close", title: closeTitle, className: cm(CLASSES.FLEXLAYOUT__TAB_BUTTON_TRAILING), onPointerDown: onClosePointerDown, onClick: onClose }, (typeof icons.close === "function") ? icons.close(node) : icons.close));
    }
    return (React.createElement("div", { ref: selfRef, "data-layout-path": path, className: classNames, onClick: onClick, onAuxClick: onAuxMouseClick, onContextMenu: onContextMenu, title: node.getHelpText(), draggable: true, onDragStart: onDragStart, onDragEnd: onDragEnd, onDoubleClick: onDoubleClick },
        leading,
        content,
        renderState.buttons));
};
//# sourceMappingURL=TabButton.js.map
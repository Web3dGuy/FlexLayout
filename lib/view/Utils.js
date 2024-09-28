import * as React from "react";
import { TabNode } from "../model/TabNode";
import { TabSetNode } from "../model/TabSetNode";
/** @internal */
export function isDesktop() {
    const desktop = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    return desktop;
}
/** @internal */
export function getRenderStateEx(layout, node, iconAngle) {
    let leadingContent = undefined;
    let titleContent = node.getName();
    let name = node.getName();
    if (iconAngle === undefined) {
        iconAngle = 0;
    }
    if (leadingContent === undefined && node.getIcon() !== undefined) {
        if (iconAngle !== 0) {
            leadingContent = React.createElement("img", { style: { width: "1em", height: "1em", transform: "rotate(" + iconAngle + "deg)" }, src: node.getIcon(), alt: "leadingContent" });
        }
        else {
            leadingContent = React.createElement("img", { style: { width: "1em", height: "1em" }, src: node.getIcon(), alt: "leadingContent" });
        }
    }
    let buttons = [];
    // allow customization of leading contents (icon) and contents
    const renderState = { leading: leadingContent, content: titleContent, name, buttons };
    layout.customizeTab(node, renderState);
    node.setRenderedName(renderState.name);
    return renderState;
}
/** @internal */
export function isAuxMouseEvent(event) {
    let auxEvent = false;
    if (event.nativeEvent instanceof MouseEvent) {
        if (event.nativeEvent.button !== 0 || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) {
            auxEvent = true;
        }
    }
    return auxEvent;
}
export function enablePointerOnIFrames(enable, currentDocument) {
    const iframes = [
        ...getElementsByTagName('iframe', currentDocument),
        ...getElementsByTagName('webview', currentDocument),
    ];
    for (const iframe of iframes) {
        iframe.style.pointerEvents = enable ? 'auto' : 'none';
    }
}
;
export function getElementsByTagName(tag, currentDocument) {
    return [...currentDocument.getElementsByTagName(tag)];
}
export function startDrag(doc, event, drag, dragEnd, dragCancel) {
    event.preventDefault();
    const pointerMove = (ev) => {
        ev.preventDefault();
        drag(ev.clientX, ev.clientY);
    };
    const pointerCancel = (ev) => {
        ev.preventDefault();
        dragCancel();
    };
    const pointerUp = () => {
        doc.removeEventListener("pointermove", pointerMove);
        doc.removeEventListener("pointerup", pointerUp);
        doc.removeEventListener("pointercancel", pointerCancel);
        dragEnd();
    };
    doc.addEventListener("pointermove", pointerMove);
    doc.addEventListener("pointerup", pointerUp);
    doc.addEventListener('pointercancel', pointerCancel);
}
export function canDockToWindow(node) {
    if (node instanceof TabNode) {
        return node.isEnablePopout();
    }
    else if (node instanceof TabSetNode) {
        for (const child of node.getChildren()) {
            if (child.isEnablePopout() === false) {
                return false;
            }
        }
        return true;
    }
    return false;
}
export function keepOnScreen(rect) {
    rect.snap(10);
    const availableScreenWidth = window.screen.availWidth;
    const availableScreenHeight = window.screen.availHeight;
    if (rect.x + rect.width > availableScreenWidth || rect.y + rect.height > availableScreenHeight) {
        // Adjust the rectangle to fit within the available screen space
        rect.x = Math.max(0, Math.min(rect.x, availableScreenWidth - rect.width));
        rect.y = Math.max(0, Math.min(rect.y, availableScreenHeight - rect.height));
    }
    return rect;
}
export function isOnScreen(rect) {
    const availableScreenWidth = window.screen.availWidth;
    const availableScreenHeight = window.screen.availHeight;
    return (rect.x >= 0 && rect.getRight() <= availableScreenWidth &&
        rect.y >= 0 || rect.getBottom() <= availableScreenHeight);
}
export function copyInlineStyles(source, target) {
    // Get the inline style attribute from the source element
    const sourceStyle = source.getAttribute('style');
    const targetStyle = target.getAttribute('style');
    if (sourceStyle === targetStyle)
        return false;
    // console.log("copyInlineStyles", sourceStyle);
    if (sourceStyle) {
        // Set the style attribute on the target element
        target.setAttribute('style', sourceStyle);
    }
    else {
        // If the source has no inline style, clear the target's style attribute
        target.removeAttribute('style');
    }
    return true;
}
export function isSafari() {
    const userAgent = navigator.userAgent;
    return userAgent.includes("Safari") && !userAgent.includes("Chrome") && !userAgent.includes("Chromium");
}
//# sourceMappingURL=Utils.js.map
import * as React from "react";
import { Actions } from "../model/Actions";
import { BorderNode } from "../model/BorderNode";
import { RowNode } from "../model/RowNode";
import { Orientation } from "../Orientation";
import { CLASSES } from "../Types";
import { enablePointerOnIFrames, isDesktop, startDrag } from "./Utils";
import { Rect } from "../Rect";
/** @internal */
export const Splitter = (props) => {
    const { layout, node, index, horizontal } = props;
    const [dragging, setDragging] = React.useState(false);
    const selfRef = React.useRef(null);
    const extendedRef = React.useRef(null);
    const pBounds = React.useRef([]);
    const outlineDiv = React.useRef(undefined);
    const handleDiv = React.useRef(undefined);
    const dragStartX = React.useRef(0);
    const dragStartY = React.useRef(0);
    const initalSizes = React.useRef({ initialSizes: [], sum: 0, startPosition: 0 });
    // const throttleTimer = React.useRef<NodeJS.Timeout | undefined>(undefined);
    const size = node.getModel().getSplitterSize();
    let extra = node.getModel().getSplitterExtra();
    if (!isDesktop()) {
        // make hit test area on mobile at least 30px
        extra = Math.max(30, extra + size) - size;
    }
    React.useEffect(() => {
        var _a, _b;
        // Android fix: must have passive touchstart handler to prevent default handling
        (_a = selfRef.current) === null || _a === void 0 ? void 0 : _a.addEventListener("touchstart", onTouchStart, { passive: false });
        (_b = extendedRef.current) === null || _b === void 0 ? void 0 : _b.addEventListener("touchstart", onTouchStart, { passive: false });
        return () => {
            var _a, _b;
            (_a = selfRef.current) === null || _a === void 0 ? void 0 : _a.removeEventListener("touchstart", onTouchStart);
            (_b = extendedRef.current) === null || _b === void 0 ? void 0 : _b.removeEventListener("touchstart", onTouchStart);
        };
    }, []);
    const onTouchStart = (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
    };
    const onPointerDown = (event) => {
        var _a;
        event.stopPropagation();
        if (node instanceof RowNode) {
            initalSizes.current = node.getSplitterInitials(index);
        }
        enablePointerOnIFrames(false, layout.getCurrentDocument());
        startDrag(event.currentTarget.ownerDocument, event, onDragMove, onDragEnd, onDragCancel);
        pBounds.current = node.getSplitterBounds(index, true);
        const rootdiv = layout.getRootDiv();
        outlineDiv.current = layout.getCurrentDocument().createElement("div");
        outlineDiv.current.style.flexDirection = horizontal ? "row" : "column";
        outlineDiv.current.className = layout.getClassName(CLASSES.FLEXLAYOUT__SPLITTER_DRAG);
        outlineDiv.current.style.cursor = node.getOrientation() === Orientation.VERT ? "ns-resize" : "ew-resize";
        if (node.getModel().isSplitterEnableHandle()) {
            handleDiv.current = layout.getCurrentDocument().createElement("div");
            handleDiv.current.className = cm(CLASSES.FLEXLAYOUT__SPLITTER_HANDLE) + " " +
                (horizontal ? cm(CLASSES.FLEXLAYOUT__SPLITTER_HANDLE_HORZ) : cm(CLASSES.FLEXLAYOUT__SPLITTER_HANDLE_VERT));
            outlineDiv.current.appendChild(handleDiv.current);
        }
        const r = (_a = selfRef.current) === null || _a === void 0 ? void 0 : _a.getBoundingClientRect();
        const rect = new Rect(r.x - layout.getDomRect().x, r.y - layout.getDomRect().y, r.width, r.height);
        dragStartX.current = event.clientX - r.x;
        dragStartY.current = event.clientY - r.y;
        rect.positionElement(outlineDiv.current);
        if (rootdiv) {
            rootdiv.appendChild(outlineDiv.current);
        }
        setDragging(true);
    };
    const onDragCancel = () => {
        const rootdiv = layout.getRootDiv();
        if (rootdiv && outlineDiv.current) {
            rootdiv.removeChild(outlineDiv.current);
        }
        outlineDiv.current = undefined;
        setDragging(false);
    };
    const onDragMove = (x, y) => {
        if (outlineDiv.current) {
            const clientRect = layout.getDomRect();
            if (!clientRect) {
                return;
            }
            if (node.getOrientation() === Orientation.VERT) {
                outlineDiv.current.style.top = getBoundPosition(y - clientRect.y - dragStartY.current) + "px";
            }
            else {
                outlineDiv.current.style.left = getBoundPosition(x - clientRect.x - dragStartX.current) + "px";
            }
            if (layout.isRealtimeResize()) {
                updateLayout(true);
            }
        }
    };
    const onDragEnd = () => {
        if (outlineDiv.current) {
            updateLayout(false);
            const rootdiv = layout.getRootDiv();
            if (rootdiv && outlineDiv.current) {
                rootdiv.removeChild(outlineDiv.current);
            }
            outlineDiv.current = undefined;
        }
        enablePointerOnIFrames(true, layout.getCurrentDocument());
        setDragging(false);
    };
    const updateLayout = (realtime) => {
        const redraw = () => {
            if (outlineDiv.current) {
                let value = 0;
                if (node.getOrientation() === Orientation.VERT) {
                    value = outlineDiv.current.offsetTop;
                }
                else {
                    value = outlineDiv.current.offsetLeft;
                }
                if (node instanceof BorderNode) {
                    const pos = node.calculateSplit(node, value);
                    layout.doAction(Actions.adjustBorderSplit(node.getId(), pos));
                }
                else {
                    const init = initalSizes.current;
                    const weights = node.calculateSplit(index, value, init.initialSizes, init.sum, init.startPosition);
                    layout.doAction(Actions.adjustWeights(node.getId(), weights));
                }
            }
        };
        redraw();
    };
    const getBoundPosition = (p) => {
        const bounds = pBounds.current;
        let rtn = p;
        if (p < bounds[0]) {
            rtn = bounds[0];
        }
        if (p > bounds[1]) {
            rtn = bounds[1];
        }
        return rtn;
    };
    const cm = layout.getClassName;
    const style = {
        cursor: horizontal ? "ew-resize" : "ns-resize",
        flexDirection: horizontal ? "column" : "row"
    };
    let className = cm(CLASSES.FLEXLAYOUT__SPLITTER) + " " + cm(CLASSES.FLEXLAYOUT__SPLITTER_ + node.getOrientation().getName());
    if (node instanceof BorderNode) {
        className += " " + cm(CLASSES.FLEXLAYOUT__SPLITTER_BORDER);
    }
    else {
        if (node.getModel().getMaximizedTabset(layout.getWindowId()) !== undefined) {
            style.display = "none";
        }
    }
    if (horizontal) {
        style.width = size + "px";
        style.minWidth = size + "px";
    }
    else {
        style.height = size + "px";
        style.minHeight = size + "px";
    }
    let handle;
    if (!dragging && node.getModel().isSplitterEnableHandle()) {
        handle = (React.createElement("div", { className: cm(CLASSES.FLEXLAYOUT__SPLITTER_HANDLE) + " " +
                (horizontal ? cm(CLASSES.FLEXLAYOUT__SPLITTER_HANDLE_HORZ) : cm(CLASSES.FLEXLAYOUT__SPLITTER_HANDLE_VERT)) }));
    }
    if (extra === 0) {
        return (React.createElement("div", { className: className, style: style, ref: selfRef, "data-layout-path": node.getPath() + "/s" + (index - 1), onPointerDown: onPointerDown }, handle));
    }
    else {
        // add extended transparent div for hit testing
        const style2 = {};
        if (node.getOrientation() === Orientation.HORZ) {
            style2.height = "100%";
            style2.width = size + extra + "px";
            style2.cursor = "ew-resize";
        }
        else {
            style2.height = size + extra + "px";
            style2.width = "100%";
            style2.cursor = "ns-resize";
        }
        const className2 = cm(CLASSES.FLEXLAYOUT__SPLITTER_EXTRA);
        return (React.createElement("div", { className: className, style: style, ref: selfRef, "data-layout-path": node.getPath() + "/s" + (index - 1), onPointerDown: onPointerDown },
            React.createElement("div", { style: style2, ref: extendedRef, className: className2, onPointerDown: onPointerDown })));
    }
};
//# sourceMappingURL=Splitter.js.map
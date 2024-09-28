import * as React from "react";
import { Orientation } from "../Orientation";
import { Rect } from "../Rect";
import { Splitter } from "./Splitter";
import { DockLocation } from "../DockLocation";
import { CLASSES } from "../Types";
export function BorderTab(props) {
    const { layout, border, show } = props;
    const selfRef = React.useRef(null);
    React.useLayoutEffect(() => {
        const outerRect = layout.getBoundingClientRect(selfRef.current);
        const contentRect = Rect.getContentRect(selfRef.current).relativeTo(layout.getDomRect());
        if (outerRect.width > 0) {
            border.setOuterRect(outerRect);
            if (!border.getContentRect().equals(contentRect)) {
                border.setContentRect(contentRect);
                layout.redrawInternal("border content rect");
            }
        }
    });
    let horizontal = true;
    const style = {};
    if (border.getOrientation() === Orientation.HORZ) {
        style.width = border.getSize();
        style.minWidth = border.getMinSize();
        style.maxWidth = border.getMaxSize();
    }
    else {
        style.height = border.getSize();
        style.minHeight = border.getMinSize();
        style.maxHeight = border.getMaxSize();
        horizontal = false;
    }
    style.display = show ? "flex" : "none";
    const className = layout.getClassName(CLASSES.FLEXLAYOUT__BORDER_TAB_CONTENTS);
    if (border.getLocation() === DockLocation.LEFT || border.getLocation() === DockLocation.TOP) {
        return (React.createElement(React.Fragment, null,
            React.createElement("div", { ref: selfRef, style: style, className: className }),
            show && React.createElement(Splitter, { layout: layout, node: border, index: 0, horizontal: horizontal })));
    }
    else {
        return (React.createElement(React.Fragment, null,
            show && React.createElement(Splitter, { layout: layout, node: border, index: 0, horizontal: horizontal }),
            React.createElement("div", { ref: selfRef, style: style, className: className })));
    }
}
//# sourceMappingURL=BorderTab.js.map
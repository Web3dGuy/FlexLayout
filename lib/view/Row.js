import * as React from "react";
import { RowNode } from "../model/RowNode";
import { TabSetNode } from "../model/TabSetNode";
import { CLASSES } from "../Types";
import { TabSet } from "./TabSet";
import { Splitter } from "./Splitter";
import { Orientation } from "../Orientation";
/** @internal */
export const Row = (props) => {
    const { layout, node } = props;
    const selfRef = React.useRef(null);
    const horizontal = node.getOrientation() === Orientation.HORZ;
    React.useLayoutEffect(() => {
        node.setRect(layout.getBoundingClientRect(selfRef.current));
    });
    const items = [];
    let i = 0;
    for (const child of node.getChildren()) {
        if (i > 0) {
            items.push(React.createElement(Splitter, { key: "splitter" + i, layout: layout, node: node, index: i, horizontal: horizontal }));
        }
        if (child instanceof RowNode) {
            items.push(React.createElement(Row, { key: child.getId(), layout: layout, node: child }));
        }
        else if (child instanceof TabSetNode) {
            items.push(React.createElement(TabSet, { key: child.getId(), layout: layout, node: child }));
        }
        i++;
    }
    const style = {
        flexGrow: Math.max(1, node.getWeight() * 1000), // NOTE:  flex-grow cannot have values < 1 otherwise will not fill parent, need to normalize 
        minWidth: node.getMinWidth(),
        minHeight: node.getMinHeight(),
        maxWidth: node.getMaxWidth(),
        maxHeight: node.getMaxHeight(),
    };
    if (horizontal) {
        style.flexDirection = "row";
    }
    else {
        style.flexDirection = "column";
    }
    return (React.createElement("div", { ref: selfRef, className: layout.getClassName(CLASSES.FLEXLAYOUT__ROW), style: style }, items));
};
//# sourceMappingURL=Row.js.map
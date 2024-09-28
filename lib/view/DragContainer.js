import * as React from "react";
import { CLASSES } from "../Types";
import { TabButtonStamp } from "./TabButtonStamp";
/** @internal */
export const DragContainer = (props) => {
    const { layout, node } = props;
    const selfRef = React.useRef(null);
    React.useEffect(() => {
        node.setTabStamp(selfRef.current);
    }, [node, selfRef.current]);
    const cm = layout.getClassName;
    let classNames = cm(CLASSES.FLEXLAYOUT__DRAG_RECT);
    return (React.createElement("div", { ref: selfRef, className: classNames },
        React.createElement(TabButtonStamp, { key: node.getId(), layout: layout, node: node })));
};
//# sourceMappingURL=DragContainer.js.map
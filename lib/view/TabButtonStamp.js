import * as React from "react";
import { CLASSES } from "../Types";
import { getRenderStateEx } from "./Utils";
/** @internal */
export const TabButtonStamp = (props) => {
    const { layout, node } = props;
    const cm = layout.getClassName;
    let classNames = cm(CLASSES.FLEXLAYOUT__TAB_BUTTON_STAMP);
    const renderState = getRenderStateEx(layout, node);
    let content = renderState.content ? (React.createElement("div", { className: cm(CLASSES.FLEXLAYOUT__TAB_BUTTON_CONTENT) }, renderState.content))
        : node.getNameForOverflowMenu();
    const leading = renderState.leading ? (React.createElement("div", { className: cm(CLASSES.FLEXLAYOUT__TAB_BUTTON_LEADING) }, renderState.leading)) : null;
    return (React.createElement("div", { className: classNames, title: node.getHelpText() },
        leading,
        content));
};
//# sourceMappingURL=TabButtonStamp.js.map
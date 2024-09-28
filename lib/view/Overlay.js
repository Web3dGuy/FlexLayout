import * as React from "react";
import { CLASSES } from "../Types";
/** @internal */
export const Overlay = (props) => {
    const { layout, show } = props;
    return (React.createElement("div", { className: layout.getClassName(CLASSES.FLEXLAYOUT__LAYOUT_OVERLAY), style: { display: (show ? "flex" : "none")
        } }));
};
//# sourceMappingURL=Overlay.js.map
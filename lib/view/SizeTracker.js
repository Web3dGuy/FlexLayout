import * as React from "react";
// only render if size changed or forceRevision changed or tabsRevision changed
export const SizeTracker = React.memo(({ children }) => {
    return React.createElement(React.Fragment, null, children);
}, (prevProps, nextProps) => {
    return prevProps.rect.equalSize(nextProps.rect) &&
        prevProps.selected === nextProps.selected &&
        prevProps.forceRevision === nextProps.forceRevision &&
        prevProps.tabsRevision === nextProps.tabsRevision;
});
//# sourceMappingURL=SizeTracker.js.map
import * as React from "react";
import { WebviewWindow } from "C:/Users/hr737/Workspace/FlexLayout/node_modules/@tauri-apps/api/webviewWindow";
import { CLASSES } from "../Types";
/** @internal */
export const PopoutWindow = (props) => {
    const { title, layout, layoutWindow, url, onCloseWindow, onSetWindow } = props;
    const popoutWindow = React.useRef(null);
    const tauriWindow = React.useRef(null);
    React.useEffect(() => {
        if (!popoutWindow.current && !tauriWindow.current) {
            const windowId = layoutWindow.windowId;
            const rect = layoutWindow.rect;
            // Standard JavaScript window
            popoutWindow.current = window.open(url, windowId, `left=${rect.x},top=${rect.y},width=${rect.width},height=${rect.height}`);
            if (popoutWindow.current) {
                setupWindow(popoutWindow.current, layoutWindow, onSetWindow, onCloseWindow);
            }
            // Tauri WebviewWindow creation
            const webviewOptions = {
                url: 'popout.html',
                title: title,
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
            };
            tauriWindow.current = new WebviewWindow(windowId, webviewOptions);
            tauriWindow.current.once('tauri://created', () => {
                console.log(`Tauri window created for ${windowId}`);
                if (tauriWindow.current) {
                    onSetWindow(layoutWindow, tauriWindow.current);
                }
            });
            tauriWindow.current.once('tauri://error', (e) => {
                console.error('Failed to create Tauri window:', e);
                onCloseWindow(layoutWindow);
            });
        }
        return () => {
            var _a;
            if (tauriWindow.current) {
                tauriWindow.current.close().catch(e => console.error('Error closing Tauri window:', e));
            }
            if (!layout.getModel().getwindowsMap().has(layoutWindow.windowId)) {
                (_a = popoutWindow.current) === null || _a === void 0 ? void 0 : _a.close();
                popoutWindow.current = null;
            }
        };
    }, []);
    // Since content and setContent are commented out, we'll return null directly or handle children differently if needed
    return null; // or handle children here if needed
};
function setupWindow(window, layoutWindow, onSetWindow, onCloseWindow) {
    if ('emit' in window) {
        // Tauri window setup if different methods are required
    }
    else {
        // Standard window setup
        window.addEventListener("load", () => {
            if (window) {
                window.resizeTo(layoutWindow.rect.width, layoutWindow.rect.height);
                window.moveTo(layoutWindow.rect.x, layoutWindow.rect.y);
                const popoutDocument = window.document;
                popoutDocument.title = ''; // Ensure title is handled or use an empty string as fallback
                const popoutContent = popoutDocument.createElement("div");
                popoutContent.className = CLASSES.FLEXLAYOUT__FLOATING_WINDOW_CONTENT;
                popoutDocument.body.appendChild(popoutContent);
                // Commented out unused function calls
                // copyStyles(popoutDocument, new Map()).then(() => {
                //     // setContent(popoutContent); // Uncomment if content logic is needed
                // });
                window.addEventListener("beforeunload", () => {
                    onCloseWindow(layoutWindow);
                });
            }
        });
    }
}
//# sourceMappingURL=PopoutWindow.js.map
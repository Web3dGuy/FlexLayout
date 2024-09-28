import * as React from "react";
import { createPortal } from "react-dom";
import { CLASSES } from "../Types";
import { Window as tWindow } from "C:/Users/hr737/Workspace/FlexLayout/node_modules/@tauri-apps/api/window";
import { Webview } from "C:/Users/hr737/Workspace/FlexLayout/node_modules/@tauri-apps/api/webview";
/** @internal */
export const PopoutWindow = (props) => {
    const { title, layout, layoutWindow, url, onCloseWindow, onSetWindow, children } = props;
    const popoutWindow = React.useRef(null);
    const [content, setContent] = React.useState(undefined);
    // map from main docs style -> this docs equivalent style
    const styleMap = new Map();
    React.useLayoutEffect(() => {
        if (!popoutWindow.current) { // only create window once, even in strict mode
            const windowId = layoutWindow.windowId;
            const rect = layoutWindow.rect;
            console.log("Window ID:", windowId, "Window URL: ", url);
            popoutWindow.current = window.open(url, windowId, `left=${rect.x},top=${rect.y},width=${rect.width},height=${rect.height}`);
            const popOut = new tWindow('popOutWindow');
            const webview = new Webview(popOut, 'popOutWindow', {
                url: 'https://github.com/tauri-apps/tauri',
                x: 0,
                y: 0,
                width: 800,
                height: 600,
            });
            webview.once('tauri://created', function () {
                // webview successfully created
            });
            webview.once('tauri://error', function (e) {
                // an error happened creating the webview
            });
            if (popoutWindow.current) {
                layoutWindow.window = popoutWindow.current;
                onSetWindow(layoutWindow, popoutWindow.current);
                // listen for parent unloading to remove all popouts
                window.addEventListener("beforeunload", () => {
                    if (popoutWindow.current) {
                        const closedWindow = popoutWindow.current;
                        popoutWindow.current = null; // need to set to null before close, since this will trigger popup window before unload...
                        closedWindow.close();
                    }
                });
                popoutWindow.current.addEventListener("load", () => {
                    if (popoutWindow.current) {
                        popoutWindow.current.focus();
                        // note: resizeto must be before moveto in chrome otherwise the window will end up at 0,0
                        popoutWindow.current.resizeTo(rect.width, rect.height);
                        popoutWindow.current.moveTo(rect.x, rect.y);
                        const popoutDocument = popoutWindow.current.document;
                        popoutDocument.title = title;
                        const popoutContent = popoutDocument.createElement("div");
                        popoutContent.className = CLASSES.FLEXLAYOUT__FLOATING_WINDOW_CONTENT;
                        popoutDocument.body.appendChild(popoutContent);
                        copyStyles(popoutDocument, styleMap).then(() => {
                            setContent(popoutContent); // re-render once link styles loaded
                        });
                        // listen for style mutations
                        const observer = new MutationObserver((mutationsList) => handleStyleMutations(mutationsList, popoutDocument, styleMap));
                        observer.observe(document.head, { childList: true });
                        // listen for popout unloading (needs to be after load for safari)
                        popoutWindow.current.addEventListener("beforeunload", () => {
                            if (popoutWindow.current) {
                                onCloseWindow(layoutWindow); // remove the layoutWindow in the model
                                popoutWindow.current = null;
                                observer.disconnect();
                            }
                        });
                    }
                });
            }
            else {
                console.warn(`Unable to open window ${url}`);
                onCloseWindow(layoutWindow); // remove the layoutWindow in the model
            }
        }
        return () => {
            var _a;
            // only close popoutWindow if windowId has been removed from the model (ie this was due to model change)
            if (!layout.getModel().getwindowsMap().has(layoutWindow.windowId)) {
                (_a = popoutWindow.current) === null || _a === void 0 ? void 0 : _a.close();
                popoutWindow.current = null;
            }
        };
    }, []);
    if (content !== undefined) {
        return createPortal(children, content);
    }
    else {
        return null;
    }
};
function handleStyleMutations(mutationsList, popoutDocument, styleMap) {
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            for (const addition of mutation.addedNodes) {
                if (addition instanceof HTMLLinkElement || addition instanceof HTMLStyleElement) {
                    copyStyle(popoutDocument, addition, styleMap);
                }
            }
            for (const removal of mutation.removedNodes) {
                if (removal instanceof HTMLLinkElement || removal instanceof HTMLStyleElement) {
                    const popoutStyle = styleMap.get(removal);
                    if (popoutStyle) {
                        popoutDocument.head.removeChild(popoutStyle);
                    }
                }
            }
        }
    }
}
;
/** @internal */
function copyStyles(popoutDoc, styleMap) {
    const promises = [];
    const styleElements = document.querySelectorAll('style, link[rel="stylesheet"]');
    for (const element of styleElements) {
        copyStyle(popoutDoc, element, styleMap, promises);
    }
    return Promise.all(promises);
}
/** @internal */
function copyStyle(popoutDoc, element, styleMap, promises) {
    if (element instanceof HTMLLinkElement) {
        // prefer links since they will keep paths to images etc
        const linkElement = element.cloneNode(true);
        popoutDoc.head.appendChild(linkElement);
        styleMap.set(element, linkElement);
        if (promises) {
            promises.push(new Promise((resolve) => {
                linkElement.onload = () => resolve(true);
            }));
        }
    }
    else if (element instanceof HTMLStyleElement) {
        try {
            const styleElement = element.cloneNode(true);
            popoutDoc.head.appendChild(styleElement);
            styleMap.set(element, styleElement);
        }
        catch (e) {
            // can throw an exception
        }
    }
}
//# sourceMappingURL=PopoutWindow.js.map
"use strict";
function urlGlobToRegex(matchPattern) {
    return '^' + matchPattern
        .replace(/[.]/g, '\\.') // Escape dots
        .replace(/[?]/, '.') // Single-character wildcards
        .replace(/^[*]:/, 'https?') // Protocol
        .replace(/^(https[?]?:[/][/])[*]/, '$1[^/:]+') // Subdomain wildcard
        .replace(/[/][*]/, '/?.+') // Whole path wildcards (so it can match the whole origin)
        .replace(/[*]/g, '.+') // Path wildcards
        .replace(/[/]/g, '\\/'); // Escape slashes
}
// @ts-ignore
async function p(fn, ...args) {
    return new Promise((resolve, reject) => {
        // @ts-ignore
        fn(...args, result => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            }
            else {
                resolve(result);
            }
        });
    });
}
async function isOriginPermitted(url) {
    return p(chrome.permissions.contains, {
        origins: [new URL(url).origin + '/*']
    });
}
async function wasPreviouslyLoaded(tabId, loadCheck) {
    const result = await p(chrome.tabs.executeScript, tabId, {
        code: loadCheck,
        runAt: 'document_start'
    });
    return result && result[0];
}
if (!chrome.contentScripts) {
    chrome.contentScripts = {
        // The callback is only used by webextension-polyfill
        async register(contentScriptOptions, callback) {
            const { js = [], css = [], allFrames, matchAboutBlank, matches, runAt } = contentScriptOptions;
            // Injectable code; it sets a `true` property on `document` with the hash of the files as key.
            const loadCheck = `document[${JSON.stringify(JSON.stringify({ js, css }))}]`;
            const matchesRegex = new RegExp(matches.map(urlGlobToRegex).join('$') + '$');
            const listener = async (tabId, { status }) => {
                if (status !== 'loading') {
                    return;
                }
                const { url } = await p(chrome.tabs.get, tabId);
                if (!url || // No URL = no permission;
                    !matchesRegex.test(url) || // Manual `matches` glob matching
                    !await isOriginPermitted(url) || // Permissions check
                    await wasPreviouslyLoaded(tabId, loadCheck) // Double-injection avoidance
                ) {
                    return;
                }
                for (const file of css) {
                    chrome.tabs.insertCSS(tabId, {
                        ...file,
                        matchAboutBlank,
                        allFrames,
                        runAt: runAt || 'document_start' // CSS should prefer `document_start` when unspecified
                    });
                }
                for (const file of js) {
                    chrome.tabs.executeScript(tabId, {
                        ...file,
                        matchAboutBlank,
                        allFrames,
                        runAt
                    });
                }
                // Mark as loaded
                chrome.tabs.executeScript(tabId, {
                    code: `${loadCheck} = true`,
                    runAt: 'document_start',
                    allFrames
                });
            };
            chrome.tabs.onUpdated.addListener(listener);
            const registeredContentScript = {
                async unregister() {
                    return p(chrome.tabs.onUpdated.removeListener.bind(chrome.tabs.onUpdated), listener);
                }
            };
            if (typeof callback === 'function') {
                callback(registeredContentScript);
            }
            return Promise.resolve(registeredContentScript);
        }
    };
}
//# sourceMappingURL=content-scripts-register-polyfill.map

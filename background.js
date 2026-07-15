// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetch_html') {
        fetch(request.url)
            .then(res => res.text())
            .then(text => sendResponse({ success: true, text: text }))
            .catch(err => sendResponse({ success: false, error: err.toString() }));
        return true; // Keep channel open for async response
    }
});

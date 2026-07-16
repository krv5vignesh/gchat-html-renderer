# Google Chat HTML Renderer

A browser extension (Chrome & Firefox) that intercepts and securely renders HTML file attachments directly within Google Chat. 

Google Chat natively forces you to download HTML files or views them as raw, unformatted text. This extension seamlessly replaces that raw text with a secure, sandboxed rendering of the HTML payload, retaining interactivity and formatting.

## ✨ Features

- **Inline Rendering**: Click any `.html` attachment in Google Chat to view it natively. No downloads required.
- **CSP Bypass Sandbox**: Renders the HTML in an isolated sandbox to completely bypass Google Chat's strict Content Security Policy. This allows inline scripts, styles, and buttons within your HTML files to work flawlessly.
- **Modal Aesthetics**: Displays the report in a beautiful, centered modal view overlaying the chat.
- **Open in New Tab**: Easily open complex or large HTML reports in a dedicated new tab for better reading.
- **Save as HTML**: Download the rendered HTML directly from the new tab view. The download intelligently adopts the original attachment's filename.
- **Keyboard Navigation**: The extension seamlessly respects Google Chat's native `Escape` key handler for closing the viewer.

## 🛠️ Installation (Developer Mode)

### Chrome / Edge / Chromium
1. Clone or download this repository.
2. Open `chrome://extensions/`.
3. Enable **"Developer mode"** in the top right.
4. Click **"Load unpacked"** and select this directory.
5. Reload your Google Chat tabs.

### Firefox (142+)
1. Clone or download this repository.
2. Open `about:debugging#/runtime/this-firefox`.
3. Click **"Load Temporary Add-on…"** and select the `manifest.json` file in this directory.
4. Reload your Google Chat tabs.

> The same codebase runs on both browsers. On Chrome it uses the recommended
> `sandbox` manifest key; on Firefox (which doesn't support that key) it falls
> back to a sandboxed `<iframe srcdoc>` to safely execute untrusted HTML.

## 🏗️ Architecture

1. **Interception**: `content.js` uses a `MutationObserver` to watch for Google Chat's native file viewer opening an HTML file.
2. **The Modal**: It replaces the raw text node with a styled, floating modal `div` containing an `iframe` that loads the extension's `sandbox.html` (a web-accessible resource, so the outer frame is exempt from Google Chat's CSP).
3. **The Handshake**: The HTML string is passed securely to `sandbox.html` via `postMessage()`.
4. **The Sandbox**: `sandbox.js` renders the report with isolation from extension APIs and Google Chat's DOM, feature-detecting its environment:
   - **Chrome**: the `sandbox` manifest key makes `sandbox.html` a true sandboxed page (opaque origin, relaxed CSP), so it renders directly via `document.write` — Chrome's officially recommended approach.
   - **Firefox**: the `sandbox` manifest key is unsupported, so it renders the HTML into a nested `<iframe sandbox="allow-scripts …">` via `srcdoc`, which gives the content its own opaque origin and CSP-free execution.
5. **Storage Handoff**: When opening in a new tab, `chrome.storage.local` is used to securely pass the HTML payload (and filename) to `viewer.html`.
6. **Session Persistence**: The new tab relies on `sessionStorage` allowing you to continuously refresh the HTML report without losing data.

## 📜 License
MIT License

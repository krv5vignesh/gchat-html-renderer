# Google Chat HTML Renderer

A Chrome Extension that intercepts and securely renders HTML file attachments directly within Google Chat. 

Google Chat natively forces you to download HTML files or views them as raw, unformatted text. This extension seamlessly replaces that raw text with a secure, sandboxed rendering of the HTML payload, retaining interactivity and formatting.

## ✨ Features

- **Inline Rendering**: Click any `.html` attachment in Google Chat to view it natively. No downloads required.
- **CSP Bypass Sandbox**: Employs a secure Chrome Extension sandbox (`sandbox.html`) to completely bypass Google Chat's strict Content Security Policy. This allows inline scripts, styles, and buttons within your HTML files to work flawlessly.
- **Modal Aesthetics**: Displays the report in a beautiful, centered modal view overlaying the chat.
- **Open in New Tab**: Easily open complex or large HTML reports in a dedicated new tab for better reading.
- **Save as HTML**: Download the raw HTML directly from the new tab view.
- **Keyboard Navigation**: Press `Escape` while viewing the HTML report to instantly close the viewer.

## 🛠️ Installation (Developer Mode)

1. Clone or download this repository.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **"Developer mode"** in the top right.
4. Click **"Load unpacked"** and select this directory.
5. Reload your Google Chat tabs.

## 🏗️ Architecture

1. **Interception**: `content.js` uses a `MutationObserver` to watch for Google Chat's native file viewer opening an HTML file.
2. **The Modal**: It replaces the raw text node with a styled, floating modal `div` containing a sandboxed `iframe`.
3. **The Handshake**: The HTML string is passed securely to `sandbox.html` via `postMessage()`.
4. **The Sandbox**: `sandbox.js` uses `document.write` to execute the HTML. Because it is a sandboxed extension page, it ignores Google Chat's CSP but is isolated from accessing Chrome APIs or Google Chat's DOM.
5. **Storage Handoff**: When opening in a new tab, `chrome.storage.local` is used to pass the massive HTML string to `viewer.html` without running into URL length limits.

## 📜 License
MIT License

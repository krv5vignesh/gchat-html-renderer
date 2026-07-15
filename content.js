// content.js
// Intercepts clicks on .html attachments in Google Chat to display an inline custom renderer.

// --- UI Constants ---
const OPEN_IN_NEW_TAB_SVG = `<svg focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>`;
const CLOSE_SVG = `<svg focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>`;
const DOWNLOAD_SVG = `<svg focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>`;

// --- State ---
let activeOverlay = null;
let activeUrl = null;

// --- Modal UI Components ---
function createCustomInlineModal() {
    // Background dimming overlay
    const overlay = document.createElement('div');
    overlay.className = 'html-custom-overlay';
    Object.assign(overlay.style, {
        position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
        backgroundColor: 'rgba(0,0,0,0.6)', zIndex: '999999',
        display: 'flex', justifyContent: 'center', alignItems: 'center'
    });
    
    // Main modal container
    const modal = document.createElement('div');
    modal.className = 'html-custom-modal';
    Object.assign(modal.style, {
        width: '90vw', height: 'calc(100vh - 120px)', backgroundColor: 'white',
        borderRadius: '8px', overflow: 'hidden', position: 'relative',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        display: 'flex', justifyContent: 'center', alignItems: 'center'
    });
    
    // Loading text
    const loader = document.createElement('div');
    loader.className = 'html-loader';
    loader.innerText = 'Loading HTML...';
    Object.assign(loader.style, { fontFamily: 'sans-serif', fontSize: '18px', color: '#666' });
    modal.appendChild(loader);
    
    // Close Button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = CLOSE_SVG;
    closeBtn.title = 'Close';
    Object.assign(closeBtn.style, {
        position: 'absolute', top: '10px', right: '15px', background: 'white',
        border: '1px solid #ccc', borderRadius: '4px', padding: '5px',
        cursor: 'pointer', zIndex: '1000000', color: '#333'
    });
    
    const closeHandler = () => {
        overlay.remove();
        if (activeOverlay === overlay) activeOverlay = null;
        activeUrl = null; // Reset state so it can be clicked again
        document.removeEventListener('keydown', escapeHandler);
        window.removeEventListener('message', messageHandler);
    };
    closeBtn.addEventListener('click', closeHandler);
    
    // Close on background click
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeHandler();
    });
    
    // Close on Escape key from main window
    const escapeHandler = (e) => {
        if (e.key === 'Escape') closeHandler();
    };
    document.addEventListener('keydown', escapeHandler);
    
    // Close on Escape key from iframe
    const messageHandler = (e) => {
        if (e.data && e.data.action === 'close_modal') {
            closeHandler();
        }
    };
    window.addEventListener('message', messageHandler);
    
    modal.appendChild(closeBtn);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    return overlay;
}

function populateCustomInlineModal(overlay, htmlContent, filename = 'document.html') {
    const modal = overlay.querySelector('.html-custom-modal');
    if (!modal) return;
    
    // Remove loading indicator
    const loader = modal.querySelector('.html-loader');
    if (loader) loader.remove();
    
    modal.style.display = 'block';
    
    // Open in New Tab Button
    const newTabBtn = document.createElement('button');
    newTabBtn.innerHTML = OPEN_IN_NEW_TAB_SVG;
    newTabBtn.title = 'Open in New Tab';
    Object.assign(newTabBtn.style, {
        position: 'absolute', bottom: '15px', right: '55px', background: 'white',
        border: '1px solid #ccc', borderRadius: '4px', padding: '5px',
        cursor: 'pointer', zIndex: '1000000', color: '#333'
    });
    
    newTabBtn.addEventListener('click', () => {
        chrome.storage.local.set({ htmlPayload: htmlContent, htmlFilename: filename }, () => {
            window.open(chrome.runtime.getURL('viewer.html'), '_blank');
            const closeBtn = modal.querySelector('button[title="Close"]');
            if (closeBtn) closeBtn.click();
        });
    });
    modal.appendChild(newTabBtn);
    
    // Download Button
    const downloadBtn = document.createElement('button');
    downloadBtn.innerHTML = DOWNLOAD_SVG;
    downloadBtn.title = 'Download HTML File';
    Object.assign(downloadBtn.style, {
        position: 'absolute', bottom: '15px', right: '15px', background: 'white',
        border: '1px solid #ccc', borderRadius: '4px', padding: '5px',
        cursor: 'pointer', zIndex: '1000000', color: '#333'
    });
    
    downloadBtn.addEventListener('click', () => {
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    });
    modal.appendChild(downloadBtn);
    
    // Inject Sandbox Iframe
    const iframe = document.createElement('iframe');
    iframe.src = chrome.runtime.getURL('sandbox.html');
    Object.assign(iframe.style, { width: '100%', height: '100%', border: 'none', backgroundColor: 'white' });
    
    iframe.addEventListener('load', () => {
        iframe.contentWindow.postMessage({ type: 'RENDER_HTML', html: htmlContent }, '*');
    });
    
    modal.appendChild(iframe);
}

// --- Click Handling ---
function getHtmlInfoFromClickTarget(target) {
    let container = null;
    let filename = 'document.html';
    
    // Traverse up to find the attachment chip
    for (let i = 0; i < 5 && target && target !== document.body; i++) {
        const label = target.getAttribute('aria-label') || '';
        const text = (target.innerText || '').trim();
        
        const labelLower = label.toLowerCase();
        const textLower = text.toLowerCase();
        
        // Match .html or .htm files
        if (labelLower.includes('.html') || labelLower.includes('.htm') || 
           ((textLower.endsWith('.html') || textLower.endsWith('.htm')) && text.length < 200 && text.split('\n').length <= 2)) {
            container = target;
            
            // Extract filename from text or label
            if (textLower.endsWith('.html') || textLower.endsWith('.htm')) {
                const lines = text.split('\n');
                filename = lines[lines.length - 1].trim();
            } else if (label) {
                const match = label.match(/([^\\/\s]+\.html?)/i);
                if (match) filename = match[1];
            }
            
            if (container.parentElement) container = container.parentElement;
            break;
        }
        target = target.parentElement;
    }
    
    if (!container) return null;

    // Extract the download URL from the chip
    const aTags = container.querySelectorAll('a[href]');
    for (const a of aTags) {
        if (a.href.includes('get_attachment_url') || a.href.includes('googleusercontent') || a.href.includes('docs.google.com')) {
            return { url: a.href, filename };
        }
    }
    
    if (container.tagName === 'A' && container.href) return { url: container.href, filename };
    return null;
}

// Global click interceptor
document.addEventListener('click', async (e) => {
    let url = null;
    let filename = 'document.html';
    
    if (e.target.tagName === 'A' && e.target.href && (e.target.href.includes('get_attachment_url') || e.target.href.includes('googleusercontent') || e.target.href.includes('docs.google.com'))) {
        url = e.target.href;
        const match = url.match(/([^\\/\s]+\.html?)/i);
        if (match) filename = match[1];
    } else {
        const info = getHtmlInfoFromClickTarget(e.target);
        if (info) {
            url = info.url;
            filename = info.filename;
        }
    }
    
    if (url && (filename.toLowerCase().endsWith('.html') || filename.toLowerCase().endsWith('.htm'))) {
        e.preventDefault();
        e.stopImmediatePropagation();
        
        // Debounce: ignore multiple rapid clicks
        if (activeUrl === url) return;
        activeUrl = url;
        
        if (activeOverlay) activeOverlay.remove();
        
        const overlay = createCustomInlineModal();
        activeOverlay = overlay;
        
        try {
            // Check cache for instant load
            chrome.storage.local.get([url], (result) => {
                if (result[url]) {
                    populateCustomInlineModal(overlay, result[url], filename);
                } else {
                    // Fetch via background script
                    chrome.runtime.sendMessage({ action: 'fetch_html', url: url }, (response) => {
                        if (!activeOverlay || activeUrl !== url) return; // User closed modal early
                        
                        if (response && response.success) {
                            chrome.storage.local.set({ [url]: response.text });
                            populateCustomInlineModal(overlay, response.text, filename);
                        } else {
                            console.error('Background fetch failed:', response?.error);
                            overlay.remove();
                            window.open(url, '_blank');
                        }
                    });
                }
            });
        } catch (err) {
            console.error('Failed to handle HTML attachment:', err);
            if (activeOverlay) activeOverlay.remove();
            window.open(url, '_blank');
        }
    }
}, true); // use capture phase

// --- Prefetching ---
let prefetchTimeout = null;

function prefetchHtmlChips() {
    // Highly optimized DOM query instead of slow TreeWalker
    const chips = document.querySelectorAll('[aria-label*=".html" i], [aria-label*=".htm" i]');
    
    for (const container of chips) {
        if (container.dataset.htmlPrefetched) continue;
        
        let url = null;
        const aTags = container.querySelectorAll('a[href]');
        for (const a of aTags) {
            if (a.href.includes('get_attachment_url') || a.href.includes('googleusercontent') || a.href.includes('docs.google.com')) {
                url = a.href;
                break;
            }
        }
        if (!url && container.tagName === 'A' && container.href) url = container.href;
        
        if (url) {
            container.dataset.htmlPrefetched = 'true';
            
            // Hide external link icon to match HTML chips perfectly
            const svgs = container.querySelectorAll('svg');
            if (svgs.length > 0) {
                const lastSvg = svgs[svgs.length - 1];
                if (lastSvg && lastSvg.parentElement) {
                    lastSvg.parentElement.style.display = 'none';
                }
            }

            // Prefetch and cache
            chrome.storage.local.get([url], (result) => {
                if (!result[url]) {
                    chrome.runtime.sendMessage({ action: 'fetch_html', url: url }, (response) => {
                        if (response && response.success) {
                            chrome.storage.local.set({ [url]: response.text });
                        }
                    });
                }
            });
        }
    }
}

// Watch DOM for new .html attachments to prefetch with a debounce to save CPU
const nativeObserver = new MutationObserver(() => {
    if (prefetchTimeout) clearTimeout(prefetchTimeout);
    prefetchTimeout = setTimeout(prefetchHtmlChips, 500);
});
nativeObserver.observe(document.body, { childList: true, subtree: true });

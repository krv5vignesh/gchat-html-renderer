// --- UTILITIES ---

// --- UI COMPONENTS ---

function getOpenInNewTabSvg() {
    return `<svg focusable="false" width="24" height="24" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" fill="currentColor"></path></svg>`;
}

function addOpenInNewTabButton(text, retryCount = 0) {
    // Google Chat's SPA keeps old, hidden modals in the DOM. 
    // We must find the native button that is ACTUALLY visible on the screen right now.
    const nativeBtns = document.querySelectorAll('[aria-label*="Download" i], [aria-label*="Print" i], [aria-label*="Drive" i]');
    let activeNativeBtn = null;
    
    for (const btn of nativeBtns) {
        if (btn.offsetWidth > 0 || btn.offsetHeight > 0) {
            activeNativeBtn = btn;
            break;
        }
    }

    if (activeNativeBtn && activeNativeBtn.parentNode) {
        let openBtn = document.getElementById('gchat-html-new-tab-btn');
        
        if (!openBtn) {
            openBtn = document.createElement('button');
            openBtn.id = 'gchat-html-new-tab-btn';
            openBtn.title = 'Open in New Tab';
            openBtn.innerHTML = getOpenInNewTabSvg();
            
            Object.assign(openBtn.style, {
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.71)',
                cursor: 'pointer',
                padding: '8px',
                width: '40px',
                height: '40px',
                margin: '0 4px',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                verticalAlign: 'middle'
            });
            
            openBtn.onmouseover = () => openBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
            openBtn.onmouseout = () => openBtn.style.backgroundColor = 'transparent';
        }
        
        openBtn.onclick = () => openInNewTab(text);
        
        // If the button isn't already inside this specific header, move it there
        if (openBtn.parentNode !== activeNativeBtn.parentNode) {
            activeNativeBtn.parentNode.insertBefore(openBtn, activeNativeBtn);
        }
    } else if (retryCount < 20) {
        setTimeout(() => addOpenInNewTabButton(text, retryCount + 1), 50);
    }
}

function openInNewTab(text) {
    const newWin = window.open('', '_blank');
    if (newWin) {
        newWin.document.write(text);
        newWin.document.close();
    } else {
        alert('Please allow popups to open the report in a new tab.');
    }
}

// --- MAIN LOGIC ---

function replaceHtmlTextWithIframe() {
    // Only search elements that might realistically hold raw HTML blocks
    const elements = document.querySelectorAll('div:not([data-html-rendered]), pre:not([data-html-rendered]), span:not([data-html-rendered])');
    
    for (const el of elements) {
        if (el.children.length > 2) continue;
        
        const text = el.textContent.trim();
        
        // Fast-fail check before string matching
        if (text.length < 50) continue;
        
        if (text.startsWith('<!DOCTYPE html') || text.startsWith('<html') || text.startsWith('<!doctype html')) {
            
            if (el.tagName === 'BODY' || el.tagName === 'HTML' || el.id === 'yDmH0d') continue;
            
            const iframe = document.createElement('iframe');
            iframe.srcdoc = text;
            
            // CRITICAL SECURITY FIX: Sandbox the iframe so uploaded HTML 
            // cannot access the parent page's cookies or DOM (XSS protection).
            iframe.sandbox = 'allow-scripts';
            
            Object.assign(iframe.style, {
                width: 'calc(100% - 48px)',
                height: 'calc(100vh - 88px)',
                margin: '64px 24px 24px 24px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                backgroundColor: 'white',
                boxSizing: 'border-box'
            });
            
            el.dataset.htmlRendered = 'true';
            
            el.innerHTML = '';
            el.appendChild(iframe);
            
            addOpenInNewTabButton(text);
            
            break; // Stop after finding the first valid block
        }
    }
}

// --- OBSERVER ---

// Use requestAnimationFrame instead of setTimeout.
// This batches mutations for performance but executes BEFORE the browser paints,
// completely eliminating the "visual flash" of raw text.
let isScheduled = false;

const observer = new MutationObserver((mutations) => {
    let hasAddedNodes = false;
    for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
            hasAddedNodes = true;
            break;
        }
    }
    
    if (hasAddedNodes && !isScheduled) {
        isScheduled = true;
        requestAnimationFrame(() => {
            replaceHtmlTextWithIframe();
            isScheduled = false;
        });
    }
});

observer.observe(document.body, { childList: true, subtree: true });
replaceHtmlTextWithIframe();

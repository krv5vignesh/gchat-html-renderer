// --- UI COMPONENTS ---

function openInNewTab(text) {
    // Generate a unique ID for this report
    const id = 'html_report_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    
    // Store it in local storage temporarily
    chrome.storage.local.set({ [id]: text }, () => {
        const url = chrome.runtime.getURL(`viewer.html?id=${id}`);
        const newWin = window.open(url, '_blank');
        if (!newWin) {
            alert('Please allow popups to open the report in a new tab.');
        }
    });
}

// --- MAIN LOGIC ---

function replaceHtmlTextWithIframe() {
    // Simple, synchronous query. Executes in <1ms natively so it does not cause lag.
    const elements = document.querySelectorAll('div, pre, span');
    
    for (const el of elements) {
        // Fast-fail to skip processed nodes
        if (el.dataset.htmlRendered) continue;
        if (el.children.length > 2) continue;
        
        const text = el.textContent.trim();
        
        // Fast-fail string match
        if (text.length > 50 && (text.startsWith('<!DOCTYPE html') || text.startsWith('<html') || text.startsWith('<!doctype html'))) {
            
            if (el.tagName === 'BODY' || el.tagName === 'HTML' || el.id === 'yDmH0d') continue;
            
            // Mark as rendered immediately to prevent duplicate processing
            el.dataset.htmlRendered = 'true';
            
            // Clear the raw HTML text
            el.innerHTML = '';
            
            // Create a controlled wrapper for our UI
            const wrapper = document.createElement('div');
            Object.assign(wrapper.style, {
                display: 'flex',
                flexDirection: 'column',
                width: '90vw',
                height: 'calc(100vh - 100px)',
                margin: '76px auto 24px auto',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: 'white'
            });

            // Close modal when clicking on the background (outside the wrapper)
            el.addEventListener('click', (e) => {
                if (!wrapper.contains(e.target)) {
                    const closeBtn = document.querySelector('button[aria-label="Close"]');
                    if (closeBtn) closeBtn.click();
                }
            });

            // 1. Create the Open in New Tab Button
            // We append this directly to document.body. If it's inside the wrapper, 
            // Google Chat's native header creates a stacking context that intercepts the clicks!
            let openBtn = document.getElementById('gchat-html-new-tab-btn');
            if (!openBtn) {
                openBtn = document.createElement('button');
                openBtn.id = 'gchat-html-new-tab-btn';
                openBtn.title = 'Open in New Tab';
                openBtn.innerHTML = `
                    <svg focusable="false" width="24" height="24" viewBox="0 0 24 24">
                        <path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" fill="currentColor"></path>
                    </svg>
                `;
                
                Object.assign(openBtn.style, {
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.71)',
                    cursor: 'pointer',
                    padding: '8px',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxSizing: 'border-box',
                    position: 'fixed',
                    top: '12px',
                    right: '160px',
                    zIndex: '999999'
                });
                
                openBtn.onmouseover = () => openBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                openBtn.onmouseout = () => openBtn.style.backgroundColor = 'transparent';
                document.body.appendChild(openBtn);
            }
            
            // Assign functionality and link to the modal container for lifecycle management
            openBtn.onclick = () => openInNewTab(text);
            openBtn._linkedElement = el;

            // 2. Create the secure Iframe using our extension sandbox
            // This safely bypasses Google Chat's strict CSP blocking inline scripts,
            // while utilizing the highly secure Chrome Extension sandbox mechanism.
            const iframe = document.createElement('iframe');
            iframe.src = chrome.runtime.getURL('sandbox.html');
            Object.assign(iframe.style, {
                flexGrow: '1',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                backgroundColor: 'white'
            });
            
            // Wait for our sandboxed page to load, then securely transmit the HTML text
            iframe.onload = () => {
                iframe.contentWindow.postMessage({ type: 'RENDER_HTML', html: text }, '*');
            };
            
            wrapper.appendChild(iframe);
            el.appendChild(wrapper);
            
            break; // Stop after finding the valid block
        }
    }
}

// --- OBSERVER ---

// A dead-simple, synchronous observer. 
const observer = new MutationObserver(() => {
    replaceHtmlTextWithIframe();
    
    // Lifecycle management: Destroy the button if its parent modal is closed
    const btn = document.getElementById('gchat-html-new-tab-btn');
    if (btn && btn._linkedElement && !document.body.contains(btn._linkedElement)) {
        btn.remove();
    }
});

observer.observe(document.body, { childList: true, subtree: true });
replaceHtmlTextWithIframe();

// Listen for Escape key from sandbox iframe
window.addEventListener('message', (event) => {
    if (event.data && event.data.action === 'close_modal') {
        // Try finding any element with aria-label="Close" (usually a span or div in GChat, not always a button)
        const closeBtn = document.querySelector('[aria-label="Close"], [aria-label="Close viewer"]');
        if (closeBtn) {
            closeBtn.click();
        } else {
            // Fallback: simulate Escape key on the body
            document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        }
    }
});

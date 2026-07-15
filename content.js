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
            
            // Make the container transparent to clicks so background clicks pass through to GChat's native backdrop!
            el.style.pointerEvents = 'none';
            
            // Create a controlled wrapper for our UI
            const wrapper = document.createElement('div');
            Object.assign(wrapper.style, {
                pointerEvents: 'auto', // Re-enable clicks for our modal
                display: 'flex',
                flexDirection: 'column',
                width: '90vw',
                height: 'calc(100vh - 120px)',
                margin: '96px auto 24px auto',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: 'white'
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

            // 2. Render using Shadow DOM
            // Instead of an iframe (which breaks focus and the Escape key due to cross-origin security),
            // we use a Shadow DOM. This provides 100% perfect CSS isolation so the report's styles
            // don't leak into Google Chat, while keeping the element in the main document.
            // This allows Google Chat's native Escape listener to work perfectly with zero hacks!
            // Note: Inline scripts will not execute here due to Google Chat's CSP, but they will execute 
            // when the user clicks 'Open in New Tab'.
            const shadowHost = document.createElement('div');
            Object.assign(shadowHost.style, {
                flexGrow: '1',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                backgroundColor: 'white',
                overflow: 'auto'
            });
            
            const shadow = shadowHost.attachShadow({ mode: 'open' });
            shadow.innerHTML = text;
            
            wrapper.appendChild(shadowHost);
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

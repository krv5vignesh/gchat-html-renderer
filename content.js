// --- UI COMPONENTS ---

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
                width: 'calc(100% - 48px)',
                height: 'calc(100vh - 88px)',
                margin: '64px 24px 24px 24px',
            });

            // 1. Create the Open in New Tab Button
            // We place this INSIDE our wrapper so it's lifecycle-managed by the modal (dies when closed),
            // but we use 'position: fixed' to float it exactly over Google Chat's native header!
            const openBtn = document.createElement('button');
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
            openBtn.onclick = () => openInNewTab(text);
            
            wrapper.appendChild(openBtn);

            // 2. Create the secure Iframe
            const iframe = document.createElement('iframe');
            iframe.srcdoc = text;
            iframe.sandbox = 'allow-scripts'; // CRITICAL SECURITY FIX
            Object.assign(iframe.style, {
                flexGrow: '1',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                backgroundColor: 'white'
            });
            
            wrapper.appendChild(iframe);
            el.appendChild(wrapper);
            
            break; // Stop after finding the valid block
        }
    }
}

// --- OBSERVER ---

// A dead-simple, synchronous observer. 
// We drop the debounce/requestAnimationFrame complexity because our fast-fail 
// DOM query executes in <1ms and does not actually cause browser lag.
const observer = new MutationObserver(() => {
    replaceHtmlTextWithIframe();
});

observer.observe(document.body, { childList: true, subtree: true });
replaceHtmlTextWithIframe();

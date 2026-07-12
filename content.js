// Function to add the "Open in new tab" icon button to the native Google Chat header
function addOpenInNewTabButton(text) {
    if (document.getElementById('gchat-html-new-tab-btn')) {
        document.getElementById('gchat-html-new-tab-btn').onclick = () => openInNewTab(text);
        return;
    }

    const openBtn = document.createElement('button');
    openBtn.id = 'gchat-html-new-tab-btn';
    openBtn.title = 'Open in New Tab';
    
    // Explicitly set the SVG icon
    openBtn.innerHTML = `<svg focusable="false" width="24" height="24" viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" fill="currentColor"></path></svg>`;
    
    // Pixel-perfect manual styling matching Google's 40x40 icon buttons
    openBtn.style.background = 'transparent';
    openBtn.style.border = 'none';
    openBtn.style.color = 'rgba(255, 255, 255, 0.71)'; // Fixes the "too bright" issue (native is usually ~70% opacity)
    openBtn.style.cursor = 'pointer';
    openBtn.style.padding = '8px'; // 8px padding + 24px icon = exact 40px width/height
    openBtn.style.width = '40px';
    openBtn.style.height = '40px';
    openBtn.style.margin = '0 4px'; // Standard spacing
    openBtn.style.borderRadius = '50%';
    openBtn.style.display = 'inline-flex';
    openBtn.style.alignItems = 'center';
    openBtn.style.justifyContent = 'center';
    openBtn.style.boxSizing = 'border-box';
    openBtn.style.verticalAlign = 'middle'; // Fixes the "slightly up" vertical alignment issue
    
    openBtn.onmouseover = () => openBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
    openBtn.onmouseout = () => openBtn.style.backgroundColor = 'transparent';
    
    openBtn.onclick = () => openInNewTab(text);

    const nativeBtn = document.querySelector('[aria-label*="Download" i], [aria-label*="Print" i], [aria-label*="Drive" i]');
    
    if (nativeBtn && nativeBtn.parentNode) {
        // Insert it right before the native button
        nativeBtn.parentNode.insertBefore(openBtn, nativeBtn);
    } else {
        // Fallback
        openBtn.style.position = 'fixed';
        openBtn.style.top = '12px';
        openBtn.style.right = '160px'; 
        openBtn.style.zIndex = '999999';
        document.body.appendChild(openBtn);
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

function replaceHtmlTextWithIframe() {
    const elements = document.querySelectorAll('div, pre, span');
    
    for (const el of elements) {
        if (el.dataset.htmlRendered) continue;
        if (el.children.length > 2) continue;
        
        const text = el.textContent.trim();
        
        if ((text.startsWith('<!DOCTYPE html') || text.startsWith('<html') || text.startsWith('<!doctype html')) && text.length > 50) {
            
            if (el.tagName === 'BODY' || el.tagName === 'HTML' || el.id === 'yDmH0d') continue;
            
            const iframe = document.createElement('iframe');
            iframe.srcdoc = text;
            
            iframe.style.width = 'calc(100% - 48px)';
            iframe.style.height = 'calc(100vh - 88px)'; 
            iframe.style.margin = '64px 24px 24px 24px'; 
            iframe.style.border = '1px solid #ddd';
            iframe.style.borderRadius = '8px';
            iframe.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            iframe.style.backgroundColor = 'white';
            iframe.style.boxSizing = 'border-box';
            
            el.dataset.htmlRendered = 'true';
            
            el.innerHTML = '';
            el.appendChild(iframe);
            
            // Add our sleek icon button to the top header
            addOpenInNewTabButton(text);
            
            break;
        }
    }
}

const observer = new MutationObserver(() => {
    replaceHtmlTextWithIframe();
});

observer.observe(document.body, { childList: true, subtree: true });
replaceHtmlTextWithIframe();

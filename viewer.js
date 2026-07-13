const params = new URLSearchParams(window.location.search);
const id = params.get('id');

if (id) {
    chrome.storage.local.get([id], (result) => {
        const text = result[id];
        if (text) {
            // Clean up storage to save space
            chrome.storage.local.remove(id);
            
            // Create the sandboxed iframe to securely render the HTML and bypass CSP
            const iframe = document.createElement('iframe');
            iframe.src = 'sandbox.html';
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            
            iframe.onload = () => {
                iframe.contentWindow.postMessage({ type: 'RENDER_HTML', html: text }, '*');
            };
            
            document.body.appendChild(iframe);
        } else {
            document.body.innerHTML = '<h3 style="padding: 20px; font-family: sans-serif; color: #333;">Report expired or not found. Please open it again from Google Chat.</h3>';
        }
    });
}

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
            
            // Create Download Button
            const downloadBtn = document.createElement('button');
            downloadBtn.innerText = 'Save as HTML';
            Object.assign(downloadBtn.style, {
                position: 'fixed',
                bottom: '30px',
                right: '30px',
                padding: '10px 20px',
                backgroundColor: '#1a73e8',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontFamily: 'sans-serif',
                fontSize: '14px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                zIndex: '9999'
            });
            downloadBtn.onclick = () => {
                const blob = new Blob([text], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'report.html';
                a.click();
                URL.revokeObjectURL(url);
            };
            document.body.appendChild(downloadBtn);
        } else {
            document.body.innerHTML = '<h3 style="padding: 20px; font-family: sans-serif; color: #333;">Report expired or not found. Please open it again from Google Chat.</h3>';
        }
    });
}

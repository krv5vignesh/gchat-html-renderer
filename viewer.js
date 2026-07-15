const params = new URLSearchParams(window.location.search);
const id = params.get('id');

if (id) {
    chrome.storage.local.get([id], (result) => {
        let text = null;
        let filename = 'report.html';

        if (result[id]) {
            text = result[id].text;
            filename = result[id].filename || 'report.html';
            // Save to sessionStorage to survive tab reloads
            sessionStorage.setItem('report_text', text);
            sessionStorage.setItem('report_filename', filename);
            // Clean up chrome storage
            chrome.storage.local.remove(id);
        } else {
            // Fallback to sessionStorage for page reloads
            text = sessionStorage.getItem('report_text');
            filename = sessionStorage.getItem('report_filename') || 'report.html';
        }

        if (text) {
            document.title = filename; // Update tab title
            
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
                width: '130px',
                padding: '10px 0', 
                backgroundColor: '#ECECFF', 
                color: '#1f0909',
                border: '1px solid #9370DB', 
                borderRadius: '5px',
                cursor: 'pointer', 
                zIndex: '10000', 
                textAlign: 'center',
                fontFamily: '"PT Serif", serif', 
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
            });
            downloadBtn.onclick = () => {
                const blob = new Blob([text], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
            };
            document.body.appendChild(downloadBtn);
        } else {
            document.body.innerHTML = '<h3 style="padding: 20px; font-family: sans-serif; color: #333;">Report expired or not found. Please open it again from Google Chat.</h3>';
        }
    });
}

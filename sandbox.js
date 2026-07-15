window.addEventListener('message', (event) => {
    // Only process our specific message type
    if (event.data && event.data.type === 'RENDER_HTML') {
        document.open();
        document.write(event.data.html);
        document.close();
        
        // Re-attach keydown listener after document rewrite
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                window.parent.postMessage({ action: 'close_modal' }, '*');
            }
        });
    }
});

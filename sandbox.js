window.addEventListener('message', (event) => {
    // Only process our specific message type
    if (event.data && event.data.type === 'RENDER_HTML') {
        document.open();
        document.write(event.data.html);
        document.close();
        
        // Use window and document with capture phase to ensure it's caught
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                window.parent.postMessage({ action: 'close_modal' }, '*');
            }
        };
        window.addEventListener('keydown', handleEscape, true);
        document.addEventListener('keydown', handleEscape, true);
    }
});

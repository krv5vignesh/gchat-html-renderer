window.addEventListener('message', (event) => {
    // Only process our specific message type
    if (event.data && event.data.type === 'RENDER_HTML') {
        document.open();
        document.write(event.data.html);
        document.close();
        
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                window.parent.postMessage({ action: 'close_modal' }, '*');
            }
        };
        
        // Attach to window using capture phase
        window.addEventListener('keydown', handleEscape, true);
        
        // Also attach to document just in case it doesn't bubble up to window in some contexts
        document.addEventListener('keydown', handleEscape, true);
    }
});

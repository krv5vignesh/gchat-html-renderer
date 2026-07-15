window.addEventListener('message', (event) => {
    // Only process our specific message type
    if (event.data && event.data.type === 'RENDER_HTML') {
        document.open();
        document.write(event.data.html);
        document.close();
        // Clean up: Escape key forwarding has been removed to keep the codebase simple.
        // If focus is in the iframe, the user will have to click outside first to use Escape.
    }
});

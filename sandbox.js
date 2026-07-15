window.addEventListener('message', (event) => {
    // Only process our specific message type
    if (event.data && event.data.type === 'RENDER_HTML') {
        document.open();
        document.write(event.data.html);
        document.close();
        
        // The ultimate simple fix for the Escape key:
        // By instantly yielding focus back to the parent window whenever the user clicks inside the iframe,
        // we ensure that Google Chat's native Escape listener always catches the keypress.
        // We exclude text inputs so they remain interactive.
        window.addEventListener('mouseup', () => {
            setTimeout(() => {
                const active = document.activeElement;
                const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
                if (!isInput) {
                    window.parent.focus();
                }
            }, 0);
        });
    }
});

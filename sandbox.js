window.addEventListener('message', (event) => {
    // Only process our specific message type
    if (event.data && event.data.type === 'RENDER_HTML') {
        const escapeScript = `
            <script>
                window.addEventListener('keydown', function(e) {
                    if (e.key === 'Escape') {
                        window.parent.postMessage({ action: 'close_modal' }, '*');
                    }
                }, true);
            </script>
        `;
        document.open();
        document.write(event.data.html + escapeScript);
        document.close();
    }
});

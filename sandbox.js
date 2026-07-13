window.addEventListener('message', (event) => {
    // Only process our specific message type
    if (event.data && event.data.type === 'RENDER_HTML') {
        document.open();
        document.write(event.data.html);
        document.close();
    }
});

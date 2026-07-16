window.addEventListener('message', (event) => {
    // Only process our specific message type
    if (!event.data || event.data.type !== 'RENDER_HTML') return;

    const html = event.data.html || '';

    // Chrome: true sandboxed page (opaque origin) -> render directly.
    // Firefox: no "sandbox" manifest key, so use a sandboxed <iframe srcdoc> instead.
    if (window.origin === 'null') {
        document.open();
        document.write(html);
        document.close();
        return;
    }

    const frame = document.createElement('iframe');
    frame.setAttribute(
        'sandbox',
        'allow-scripts allow-forms allow-popups allow-modals allow-popups-to-escape-sandbox allow-downloads'
    );
    frame.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:none;margin:0;';
    frame.srcdoc = html;

    document.body.replaceChildren(frame);
});

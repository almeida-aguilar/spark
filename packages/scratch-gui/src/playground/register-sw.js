// SPARK: registro del service worker y aviso de actualización (fase 8).
// Nunca recarga sin preguntar para no perder trabajo.

const showUpdatePrompt = registration => {
    if (document.getElementById('spark-sw-update')) return;

    const lang = (document.documentElement.lang || navigator.language || 'en').toLower();
    const isEs = lang.indexOf('es') === 0;
    const message = isEs ?
        'Hay una versión nueva. ¿Actualizar?' :
        'A new version is available. Update?';
    const updateLabel = isEs ? 'Actualizar' : 'Update';
    const laterLabel = isEs ? 'Más tarde' : 'Later';

    const bar = document.createElement('div');
    bar.id = 'spark-sw-update';
    bar.setAttribute('role', 'status');
    Object.assign(bar.style, {
        position: 'fixed',
        left: '50%',
        bottom: '16px',
        transform: 'translateX(-50%)',
        zIndex: '10000',
        background: '#333',
        color: '#fff',
        padding: '12px 16px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontFamily: 'sans-serif',
        fontSize: '14px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
    });

    const text = document.createElement('span');
    text.textContent = message;
    bar.appendChild(text);

    const makeButton = (label, primary) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = label;
        Object.assign(btn.style, {
            border: 'none',
            borderRadius: '4px',
            padding: '6px 12px',
            cursor: 'pointer',
            fontSize: '14px',
            background: primary ? '#855CD6' : '#555',
            color: '#fff'
        });
        return btn;
    };

    const later = makeButton(laterLabel, false);
    later.addEventListener('click', () => bar.remove());

    const update = makeButton(updateLabel, true);
    update.addEventListener('click', () => {
        const waiting = registration.waiting;
        if (!waiting) {
            bar.remove();
            return;
        }
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (refreshing) return;
            refreshing = true;
            window.location.reload();
        });
        waiting.postMessage({type: 'SKIP_WAITING'});
    });

    bar.appendChild(later);
    bar.appendChild(update);
    document.body.appendChild(bar);
};

const registerServiceWorker = () => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    // En desarrollo no se registra para evitar interferencias con HMR.
    if (process.env.NODE_ENV !== 'production') return;

    window.addEventListener('load', () => {
        const swUrl = 'sw.js';
        navigator.serviceWorker.register(swUrl, {scope: './'}).then(registration => {
            if (registration.waiting) {
                showUpdatePrompt(registration);
            }
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (!newWorker) return;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showUpdatePrompt(registration);
                    }
                });
            });
        }).catch(() => {
            // registro fallido (p. ej. contexto no seguro): la app sigue funcionando
        });
    });
};

export default registerServiceWorker;

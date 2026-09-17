export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const isApiRequest = pathname === '/api' || pathname.startsWith('/api/');

    // Allow Firebase/Firestore API calls to pass through
    if (url.hostname.includes('firebase') || url.hostname.includes('googleapis.com')) {
      return fetch(request);
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405 });
    }

      if (pathname === '/robots.txt') {
        if (!env.ASSETS) return new Response('Not Found', { status: 404 });
        const robotsResponse = await env.ASSETS.fetch(request);
        if (robotsResponse.status === 404) return new Response('Not Found', { status: 404 });
        return new Response(request.method === 'HEAD' ? null : robotsResponse.body, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            'X-Content-Type-Options': 'nosniff'
          }
        });
      }

      if (pathname === '/google987caa5b12be50ea.html') {
        if (!env.ASSETS) {
          return new Response('Not Found', { status: 404 });
        }

        const verificationResponse = await env.ASSETS.fetch(request);
        if (verificationResponse.status === 404) {
          return new Response('Not Found', { status: 404 });
        }

        return new Response(request.method === 'HEAD' ? null : verificationResponse.body, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8'
          }
        });
      }

      if (pathname === '/sitemap.xml') {
        if (!env.ASSETS) {
          return new Response('Not Found', { status: 404 });
        }

        const sitemapResponse = await env.ASSETS.fetch(request);
        if (sitemapResponse.status === 404) {
          return new Response('Not Found', { status: 404 });
        }

        return new Response(request.method === 'HEAD' ? null : sitemapResponse.body, {
          status: 200,
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            'X-Content-Type-Options': 'nosniff'
          }
        });
      }

    const knownRoutes = new Set(['/', '/shop', '/contact', '/policies', '/orders', '/wishlist', '/admin', '/cart', '/checkout', '/payment', '/bank-transfer', '/order-confirmation']);
    const isKnownDocumentRoute = knownRoutes.has(pathname) || pathname.startsWith('/product/');
    if (env.ASSETS && !isKnownDocumentRoute && !pathname.includes('.') && pathname !== '/favicon.ico') {
      return new Response('Not Found', { status: 404 });
    }

    if (env.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) {
        const privatePath = /^\/(admin|cart|checkout|payment|bank-transfer|order-confirmation|orders|wishlist)(\/|$)/.test(pathname);
        if (!privatePath) return assetResponse;
        const headers = new Headers(assetResponse.headers);
        headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
        return new Response(request.method === 'HEAD' ? null : assetResponse.body, { status: assetResponse.status, headers });
      }

      if (isApiRequest) {
        return new Response('Not Found', { status: 404 });
      }

      if (!pathname.includes('.') && isKnownDocumentRoute) {
        const fallbackUrl = new URL('/index.html', url);
        const fallbackResponse = await env.ASSETS.fetch(new Request(fallbackUrl, request));
        const privatePath = /^\/(admin|cart|checkout|payment|bank-transfer|order-confirmation|orders|wishlist)(\/|$)/.test(pathname);
        if (!privatePath) return fallbackResponse;
        const headers = new Headers(fallbackResponse.headers);
        headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
        return new Response(request.method === 'HEAD' ? null : fallbackResponse.body, { status: fallbackResponse.status, headers });
      }

      return assetResponse;
    }

    if (isApiRequest) {
      return new Response('Not Found', { status: 404 });
    }

    // Every extensionless URL belongs to the client-side application. This is
    // important on refresh because the browser requests the nested URL first.
    if (pathname.includes('.') && pathname !== '/favicon.ico') {
      return new Response('Not Found', { status: 404 });
    }

    if (!isKnownDocumentRoute) {
      return new Response('Not Found', { status: 404 });
    }

    return new Response(`
      <!doctype html>
      <html lang="fr">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>SOVANEX</title>
        </head>
        <body style="margin:0;background:#0A0A0A;color:white;font-family:sans-serif;display:grid;place-items:center;min-height:100vh;">
          <div style="text-align:center;">
            <h1 style="margin-bottom:12px;letter-spacing:0.2em;">SOVANEX</h1>
            <p style="opacity:0.8;">Reloading the boutique...</p>
          </div>
          <script>
            const target = location.pathname === '/' ? '/' : '/';
            if (window.location.pathname !== target) {
              window.location.replace(target + window.location.search + window.location.hash);
            }
          </script>
        </body>
      </html>
    `, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  },
};

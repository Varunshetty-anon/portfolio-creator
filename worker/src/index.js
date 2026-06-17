export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;

    // Only handle GET and HEAD requests
    if (method !== 'GET' && method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // Expected path: /api/v1/portfolio/drive-proxy/:id
    const match = url.pathname.match(/\/api\/v1\/portfolio\/drive-proxy\/([a-zA-Z0-9_-]+)/);
    if (!match) {
      return new Response('Not Found', { status: 404 });
    }

    const fileId = match[1];

    // Check R2 for the file
    const object = await env.frames_videos_r2.get(fileId, {
      range: request.headers,
      onlyIf: request.headers,
    });

    if (object !== null) {
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);
      headers.set('Accept-Ranges', 'bytes');
      
      // Cache heavily at the browser
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');

      const status = object.range ? 206 : 200;
      
      // If HEAD request, do not return body
      const body = method === 'HEAD' ? null : object.body;
      
      return new Response(body, {
        headers,
        status,
      });
    }

    // Cache miss - fallback to origin
    const fallbackOrigin = url.searchParams.get('fallbackOrigin');
    if (!fallbackOrigin) {
      return new Response('File not found in edge cache and no fallbackOrigin provided', { status: 404 });
    }

    const fallbackUrl = `${fallbackOrigin}${url.pathname}`;
    
    // Trigger background migration asynchronously without blocking the response
    const migrateUrl = `${fallbackOrigin}/api/v1/portfolio/migrate-to-r2/${fileId}`;
    ctx.waitUntil(
      fetch(migrateUrl, { method: 'POST' }).catch(err => console.error('Background migration trigger failed:', err))
    );

    // Proxy the request to the origin
    return fetch(fallbackUrl, request);
  },
};

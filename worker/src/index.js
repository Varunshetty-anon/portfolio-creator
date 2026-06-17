const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Range',
  'Access-Control-Expose-Headers': 'Accept-Ranges, Content-Encoding, Content-Length, Content-Range',
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;

    // Handle CORS preflight requests
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only handle GET and HEAD requests
    if (method !== 'GET' && method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    }

    // Expected path: /api/v1/portfolio/drive-proxy/:id
    const match = url.pathname.match(/\/api\/v1\/portfolio\/drive-proxy\/([a-zA-Z0-9_-]+)/);
    if (!match) {
      return new Response('Not Found', { status: 404, headers: corsHeaders });
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
      
      // Fix quoted Content-Type
      const contentType = headers.get('Content-Type');
      if (contentType && contentType.startsWith('"') && contentType.endsWith('"')) {
        headers.set('Content-Type', contentType.slice(1, -1));
      }
      
      headers.set('etag', object.httpEtag);
      headers.set('Accept-Ranges', 'bytes');
      
      // Add required headers for 206 Partial Content
      if (object.range) {
        headers.set('Content-Range', `bytes ${object.range.offset}-${object.range.offset + object.range.length - 1}/${object.size}`);
        headers.set('Content-Length', object.range.length.toString());
      } else {
        headers.set('Content-Length', object.size.toString());
      }
      
      // Cache heavily at the browser
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      
      // ADD CORS
      Object.entries(corsHeaders).forEach(([k, v]) => headers.set(k, v));

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
      return new Response('File not found in edge cache and no fallbackOrigin provided', { status: 404, headers: corsHeaders });
    }

    const fallbackUrl = `${fallbackOrigin}${url.pathname}`;
    
    // Trigger background migration asynchronously without blocking the response
    const migrateUrl = `${fallbackOrigin}/api/v1/portfolio/migrate-to-r2/${fileId}`;
    ctx.waitUntil(
      fetch(migrateUrl, { method: 'POST' }).catch(err => console.error('Background migration trigger failed:', err))
    );

    // Proxy the request to the origin
    const originResponse = await fetch(fallbackUrl, request);
    
    // Add CORS to fallback response
    const responseHeaders = new Headers(originResponse.headers);
    Object.entries(corsHeaders).forEach(([k, v]) => responseHeaders.set(k, v));
    
    return new Response(originResponse.body, {
      status: originResponse.status,
      statusText: originResponse.statusText,
      headers: responseHeaders
    });
  },
};

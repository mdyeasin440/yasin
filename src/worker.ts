/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Cloudflare Worker for Spidey Jersey DTF Pro (spd-dtf)
 * Handles D1 SQLite Database bindings, R2 Bucket Asset Uploads, and API endpoints.
 */

// Ambient Cloudflare Worker interface declarations for zero-dependency compilation
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  all<T = any>(): Promise<{ results: T[]; success: boolean }>;
  run<T = any>(): Promise<{ success: boolean; meta: any }>;
}

export interface R2Bucket {
  put(key: string, value: any, options?: any): Promise<any>;
  get(key: string): Promise<any>;
  delete(key: string): Promise<any>;
  list(options?: any): Promise<{ objects: any[] }>;
}

export interface Fetcher {
  fetch(request: Request | string, requestInit?: any): Promise<Response>;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

export interface Env {
  MY_DB?: D1Database;
  MY_BUCKET?: R2Bucket;
  ASSETS?: Fetcher;
  GEMINI_API_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx?: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    // CORS headers for local testing & cross-origin dev
    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 1. Health check
      if (pathname === '/api/health') {
        return jsonResponse(
          {
            status: 'ok',
            service: 'Spidey Jersey DTF Pro Backend',
            version: '2.0.0',
            d1_ready: Boolean(env.MY_DB),
            r2_ready: Boolean(env.MY_BUCKET),
            timestamp: new Date().toISOString(),
          },
          corsHeaders
        );
      }

      // 2. Presets API: /api/presets
      if (pathname.startsWith('/api/presets')) {
        return await handlePresetsRoute(request, env, pathname, method, corsHeaders);
      }

      // 3. Orders API: /api/orders/bulk
      if (pathname.startsWith('/api/orders')) {
        return await handleOrdersRoute(request, env, pathname, method, corsHeaders);
      }

      // 4. R2 Asset Uploads / Streaming: /api/assets/*
      if (pathname.startsWith('/api/assets')) {
        return await handleAssetsRoute(request, env, pathname, method, corsHeaders);
      }

      // 5. Fallback for Static Assets (SPA)
      if (env.ASSETS) {
        return await env.ASSETS.fetch(request);
      }

      return new Response('Not found', { status: 404, headers: corsHeaders });
    } catch (err: any) {
      console.error('Worker error:', err);
      return jsonResponse(
        { error: err.message || 'Internal Server Error', stack: err.stack },
        corsHeaders,
        500
      );
    }
  },
};

function jsonResponse(data: any, corsHeaders: Record<string, string> = {}, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

// Handlers
async function handlePresetsRoute(
  request: Request,
  env: Env,
  pathname: string,
  method: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const db = env.MY_DB;

  if (method === 'GET') {
    if (db) {
      const results = await db.prepare('SELECT * FROM design_presets ORDER BY is_default DESC, updated_at DESC').all();
      return jsonResponse({ success: true, presets: results.results }, corsHeaders);
    }
    return jsonResponse({ success: true, presets: [], message: 'D1 not bound; using client cache' }, corsHeaders);
  }

  if (method === 'POST') {
    const body: any = await request.json();
    const id = body.id || `preset_${Date.now()}`;
    const name = body.name || 'Custom Preset';
    const sport = body.sport || 'baseball';
    const category = body.category || 'custom';
    const description = body.description || '';
    const configJson = JSON.stringify(body);

    if (db) {
      await db
        .prepare(
          'INSERT OR REPLACE INTO design_presets (id, name, sport, category, description, config_json, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
        )
        .bind(id, name, sport, category, description, configJson)
        .run();
    }

    return jsonResponse({ success: true, id, message: 'Preset saved successfully' }, corsHeaders);
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders });
}

async function handleOrdersRoute(
  request: Request,
  env: Env,
  pathname: string,
  method: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const db = env.MY_DB;

  if (method === 'POST' && pathname === '/api/orders/bulk') {
    const body: any = await request.json();
    const id = body.id || `order_${Date.now()}`;
    const orderNumber = body.orderNumber || `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const teamName = body.teamName || 'Team';
    const sport = body.sport || 'baseball';
    const garmentType = body.garmentType || 'baseball_jersey';
    const garmentColor = body.garmentColor || '#0F172A';
    const rollWidthInches = body.rollWidthInches || 22.0;
    const gapInches = body.gapInches || 0.375;
    const rosterJson = JSON.stringify(body.roster || []);
    const gangSheetJson = body.gangSheet ? JSON.stringify(body.gangSheet) : null;
    const totalItems = body.roster?.length || 0;
    const totalLengthInches = body.gangSheet?.totalLengthInches || 0;

    if (db) {
      await db
        .prepare(
          `INSERT OR REPLACE INTO orders 
           (id, order_number, team_name, sport, garment_type, garment_color, roll_width_inches, gap_inches, roster_json, gang_sheet_json, total_items, total_length_inches, status, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ready', CURRENT_TIMESTAMP)`
        )
        .bind(
          id,
          orderNumber,
          teamName,
          sport,
          garmentType,
          garmentColor,
          rollWidthInches,
          gapInches,
          rosterJson,
          gangSheetJson,
          totalItems,
          totalLengthInches
        )
        .run();
    }

    return jsonResponse(
      {
        success: true,
        id,
        orderNumber,
        totalItems,
        message: 'Order imported and saved successfully',
      },
      corsHeaders
    );
  }

  if (method === 'GET' && pathname === '/api/orders') {
    if (db) {
      const orders = await db.prepare('SELECT * FROM orders ORDER BY updated_at DESC LIMIT 50').all();
      return jsonResponse({ success: true, orders: orders.results }, corsHeaders);
    }
    return jsonResponse({ success: true, orders: [] }, corsHeaders);
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders });
}

async function handleAssetsRoute(
  request: Request,
  env: Env,
  pathname: string,
  method: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const bucket = env.MY_BUCKET;
  const key = pathname.replace('/api/assets/', '');

  if (!bucket) {
    return jsonResponse(
      { success: false, message: 'R2 bucket is not bound in current environment' },
      corsHeaders
    );
  }

  // Upload asset
  if (method === 'PUT' || method === 'POST') {
    if (!key) {
      return jsonResponse({ error: 'Asset key is required' }, corsHeaders, 400);
    }

    const contentType = request.headers.get('Content-Type') || 'application/octet-stream';
    const fileBody = await request.arrayBuffer();

    await bucket.put(key, fileBody, {
      httpMetadata: { contentType },
    });

    return jsonResponse(
      {
        success: true,
        key,
        url: `/api/assets/${key}`,
        size: fileBody.byteLength,
        contentType,
      },
      corsHeaders
    );
  }

  // Get/Stream asset
  if (method === 'GET') {
    if (!key) {
      const list = await bucket.list({ limit: 50 });
      return jsonResponse({ success: true, objects: list.objects }, corsHeaders);
    }

    const object = await bucket.get(key);
    if (!object) {
      return new Response('Asset not found', { status: 404, headers: corsHeaders });
    }

    const headers = new Headers(corsHeaders);
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new Response(object.body, { headers });
  }

  // Delete asset
  if (method === 'DELETE') {
    if (!key) {
      return jsonResponse({ error: 'Key required' }, corsHeaders, 400);
    }
    await bucket.delete(key);
    return jsonResponse({ success: true, key, deleted: true }, corsHeaders);
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders });
}

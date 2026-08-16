/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Cloudflare Worker for Spidey Jersey DTF Pro (yasin)
 * Handles Automatic D1 SQLite Database table initialization & sync,
 * R2 Bucket Asset Uploads, and API endpoints with zero manual configuration.
 */

// Ambient Cloudflare Worker interface declarations for zero-dependency compilation
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch?(statements: D1PreparedStatement[]): Promise<any[]>;
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
  [key: string]: any;
}

// Universal helper to find D1 Database binding under any common name
function getD1(env: Env): D1Database | undefined {
  return (
    env.DB ||
    env.MY_DB ||
    env.DATABASE ||
    env.d1 ||
    env.spideydtf_db ||
    env.spideydtf ||
    env.DTF_DB ||
    env.D1_DATABASE
  );
}

// Universal helper to find R2 Bucket binding under any common name
function getR2(env: Env): R2Bucket | undefined {
  return (
    env.MY_BUCKET ||
    env.BUCKET ||
    env.ASSETS_BUCKET ||
    env.R2_BUCKET ||
    env.dtftest ||
    env['spidery-assets'] ||
    env.spidery_assets ||
    env.STORAGE
  );
}

export default {
  async fetch(request: Request, env: Env, ctx?: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    // Universal CORS headers
    const corsHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const db = getD1(env);
      const bucket = getR2(env);

      // 1. Health check & Diagnostics endpoint
      if (pathname === '/api/health' || pathname === '/api/status') {
        let dbStatus = 'disconnected';
        let presetCountInDb = 0;

        if (db) {
          try {
            await ensureDbSchema(db);
            const countResult = await db.prepare('SELECT COUNT(*) as count FROM design_presets').all();
            presetCountInDb = countResult.results?.[0]?.count || 0;
            dbStatus = 'connected';
          } catch (e: any) {
            dbStatus = `error: ${e.message}`;
          }
        }

        return jsonResponse(
          {
            status: 'ok',
            service: 'Spidey Jersey DTF Cloud Engine',
            version: '2.5.0',
            d1: {
              status: dbStatus,
              bound: Boolean(db),
              presetCount: presetCountInDb,
            },
            r2: {
              bound: Boolean(bucket),
            },
            timestamp: new Date().toISOString(),
          },
          corsHeaders
        );
      }

      // 2. Presets API: /api/presets
      if (pathname.startsWith('/api/presets')) {
        return await handlePresetsRoute(request, env, pathname, method, corsHeaders);
      }

      // 3. Orders API: /api/orders
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
      console.error('Worker fetch error:', err);
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

/**
 * Automatically creates all tables with safe schema migrations
 */
async function ensureDbSchema(db: D1Database): Promise<void> {
  try {
    // 1. Presets Table
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS design_presets (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          code TEXT,
          sport TEXT DEFAULT 'soccer',
          category TEXT DEFAULT 'custom',
          description TEXT,
          config_json TEXT,
          is_default INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`
      )
      .run();

    // Ensure config_json column exists
    try {
      await db.prepare(`ALTER TABLE design_presets ADD COLUMN config_json TEXT`).run();
    } catch {
      // Column already exists
    }

    // 2. Orders Table
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          order_number TEXT NOT NULL,
          team_name TEXT,
          sport TEXT,
          garment_type TEXT,
          garment_color TEXT,
          roll_width_inches REAL,
          gap_inches REAL,
          roster_json TEXT,
          gang_sheet_json TEXT,
          total_items INTEGER,
          total_length_inches REAL,
          status TEXT DEFAULT 'ready',
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`
      )
      .run();

    // 3. Custom Assets Table (metadata for uploaded SVG/PNG/TTF)
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS custom_assets (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          category TEXT,
          url TEXT NOT NULL,
          file_size INTEGER,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`
      )
      .run();
  } catch (err) {
    console.error('DB Schema initialization error:', err);
  }
}

async function handlePresetsRoute(
  request: Request,
  env: Env,
  pathname: string,
  method: string,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const db = getD1(env);

  // GET: Fetch all presets
  if (method === 'GET') {
    if (db) {
      try {
        await ensureDbSchema(db);
        const results = await db
          .prepare('SELECT * FROM design_presets ORDER BY is_default DESC, updated_at DESC')
          .all();

        const list = (results.results || []).map((row: any) => {
          if (row.config_json) {
            try {
              const parsed = JSON.parse(row.config_json);
              return {
                ...parsed,
                id: row.id || parsed.id,
                name: row.name || parsed.name,
                code: row.code || parsed.code,
                sport: row.sport || parsed.sport,
                category: row.category || parsed.category,
              };
            } catch {
              return row;
            }
          }
          return row;
        });

        return jsonResponse(
          {
            success: true,
            d1_connected: true,
            count: list.length,
            presets: list,
          },
          corsHeaders
        );
      } catch (err: any) {
        console.error('D1 presets fetch error:', err);
        return jsonResponse({ success: false, error: err.message, presets: [] }, corsHeaders);
      }
    }

    return jsonResponse(
      { success: true, d1_connected: false, presets: [], message: 'D1 not bound; client local storage active' },
      corsHeaders
    );
  }

  // POST: Save or Update single preset or Bulk Sync
  if (method === 'POST') {
    const body: any = await request.json();

    // Check if bulk sync payload
    if (pathname.includes('/bulk') || Array.isArray(body)) {
      const presetsList = Array.isArray(body) ? body : body.presets || [];
      if (db && presetsList.length > 0) {
        try {
          await ensureDbSchema(db);
          for (const item of presetsList) {
            const id = item.id || `preset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            const name = item.name || 'Custom Preset';
            const code = item.code || id;
            const sport = item.sport || 'soccer';
            const category = item.category || 'custom';
            const description = item.description || '';
            const configJson = JSON.stringify(item);

            await db
              .prepare(
                `INSERT INTO design_presets (id, name, code, sport, category, description, config_json, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                 ON CONFLICT(id) DO UPDATE SET
                   name = excluded.name,
                   code = excluded.code,
                   sport = excluded.sport,
                   category = excluded.category,
                   description = excluded.description,
                   config_json = excluded.config_json,
                   updated_at = CURRENT_TIMESTAMP`
              )
              .bind(id, name, code, sport, category, description, configJson)
              .run();
          }
          return jsonResponse({ success: true, synced: presetsList.length }, corsHeaders);
        } catch (err: any) {
          console.error('Bulk sync failed:', err);
          return jsonResponse({ success: false, error: err.message }, corsHeaders, 500);
        }
      }
      return jsonResponse({ success: true, synced: presetsList.length, note: 'Saved client-side' }, corsHeaders);
    }

    // Single Preset Save
    const id = body.id || `preset_${Date.now()}`;
    const name = body.name || 'Custom Preset';
    const code = body.code || id;
    const sport = body.sport || 'soccer';
    const category = body.category || 'custom';
    const description = body.description || '';
    const configJson = JSON.stringify(body);

    if (db) {
      try {
        await ensureDbSchema(db);
        await db
          .prepare(
            `INSERT INTO design_presets (id, name, code, sport, category, description, config_json, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
             ON CONFLICT(id) DO UPDATE SET
               name = excluded.name,
               code = excluded.code,
               sport = excluded.sport,
               category = excluded.category,
               description = excluded.description,
               config_json = excluded.config_json,
               updated_at = CURRENT_TIMESTAMP`
          )
          .bind(id, name, code, sport, category, description, configJson)
          .run();
      } catch (err: any) {
        console.error('Failed to save to D1:', err);
        return jsonResponse({ success: false, error: err.message }, corsHeaders, 500);
      }
    }

    return jsonResponse(
      { success: true, id, d1_saved: Boolean(db), message: 'Preset saved successfully to cloud' },
      corsHeaders
    );
  }

  // DELETE: Remove preset
  if (method === 'DELETE') {
    const url = new URL(request.url);
    const id = url.searchParams.get('id') || pathname.replace('/api/presets/', '').replace('/api/presets', '');

    if (db && id) {
      try {
        await ensureDbSchema(db);
        await db.prepare('DELETE FROM design_presets WHERE id = ?').bind(id).run();
      } catch (err: any) {
        console.error('Failed to delete from D1:', err);
        return jsonResponse({ success: false, error: err.message }, corsHeaders, 500);
      }
    }

    return jsonResponse({ success: true, id, message: 'Preset deleted' }, corsHeaders);
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
  const db = getD1(env);

  if (method === 'POST') {
    const body: any = await request.json();
    const id = body.id || `order_${Date.now()}`;
    const orderNumber = body.orderNumber || `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const teamName = body.teamName || 'Team';
    const sport = body.sport || 'baseball';
    const garmentType = body.garmentType || 'baseball_jersey';
    const garmentColor = body.garmentColor || '#0F172A';
    const rollWidthInches = body.rollWidthInches || 39.0;
    const gapInches = body.gapInches || 0.375;
    const rosterJson = JSON.stringify(body.roster || []);
    const gangSheetJson = body.gangSheet ? JSON.stringify(body.gangSheet) : null;
    const totalItems = body.roster?.length || 0;
    const totalLengthInches = body.gangSheet?.totalLengthInches || 0;

    if (db) {
      try {
        await ensureDbSchema(db);
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
      } catch (err: any) {
        console.error('Order save error in D1:', err);
      }
    }

    return jsonResponse(
      {
        success: true,
        id,
        orderNumber,
        totalItems,
        message: 'Order saved successfully',
      },
      corsHeaders
    );
  }

  if (method === 'GET') {
    if (db) {
      try {
        await ensureDbSchema(db);
        const orders = await db.prepare('SELECT * FROM orders ORDER BY updated_at DESC LIMIT 50').all();
        return jsonResponse({ success: true, orders: orders.results }, corsHeaders);
      } catch (err: any) {
        return jsonResponse({ success: false, error: err.message, orders: [] }, corsHeaders);
      }
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
  const bucket = getR2(env);
  const key = pathname.replace('/api/assets/', '').replace(/^\/+/, '');

  if (!bucket) {
    return jsonResponse(
      { success: false, bound: false, message: 'R2 bucket is not bound in current environment; falling back' },
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

  // Get / Stream asset
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

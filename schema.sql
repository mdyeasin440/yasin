-- Spidey Jersey DTF Pro (spd-dtf) - Cloudflare D1 Database Schema

-- Table: design_presets
CREATE TABLE IF NOT EXISTS design_presets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'custom',
    sport TEXT NOT NULL DEFAULT 'baseball',
    description TEXT,
    config_json TEXT NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table: orders
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL,
    team_name TEXT NOT NULL,
    preset_id TEXT,
    sport TEXT NOT NULL DEFAULT 'baseball',
    garment_type TEXT NOT NULL DEFAULT 'baseball_jersey',
    garment_color TEXT NOT NULL DEFAULT '#1E293B',
    roll_width_inches REAL NOT NULL DEFAULT 22.0,
    gap_inches REAL NOT NULL DEFAULT 0.375,
    roster_json TEXT NOT NULL,
    gang_sheet_json TEXT,
    total_items INTEGER NOT NULL DEFAULT 0,
    total_length_inches REAL NOT NULL DEFAULT 0.0,
    status TEXT NOT NULL DEFAULT 'draft',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (preset_id) REFERENCES design_presets (id) ON DELETE SET NULL
);

-- Table: asset_uploads (for R2 tracking metadata)
CREATE TABLE IF NOT EXISTS asset_uploads (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    file_name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    width_px INTEGER,
    height_px INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_design_presets_sport ON design_presets (sport);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_asset_uploads_key ON asset_uploads (key);

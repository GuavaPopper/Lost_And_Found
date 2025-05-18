-- Create admin table
CREATE TABLE IF NOT EXISTS admin (
  id_admin UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create satpam (security) table
CREATE TABLE IF NOT EXISTS satpam (
  id_satpam UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user table
CREATE TABLE IF NOT EXISTS "user" (
  id_user UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nama TEXT NOT NULL,
  nim_nip TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create barang_hilang (lost items) table
CREATE TABLE IF NOT EXISTS barang_hilang (
  id_hilang UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_user UUID NOT NULL REFERENCES "user"(id_user) ON DELETE CASCADE,
  nama_barang TEXT NOT NULL,
  kategori TEXT NOT NULL,
  deskripsi TEXT,
  lokasi TEXT NOT NULL,
  tanggal_hilang DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('reported', 'verified', 'matched', 'returned')),
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create barang_temuan (found items) table
CREATE TABLE IF NOT EXISTS barang_temuan (
  id_temuan UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_user UUID NOT NULL REFERENCES "user"(id_user) ON DELETE CASCADE,
  nama_barang TEXT NOT NULL,
  kategori TEXT NOT NULL,
  deskripsi TEXT,
  lokasi TEXT NOT NULL,
  tanggal_temuan DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('reported', 'verified', 'matched', 'returned')),
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create log_aktivitas (activity log) table
CREATE TABLE IF NOT EXISTS log_aktivitas (
  id_log UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_user UUID REFERENCES "user"(id_user) ON DELETE SET NULL,
  aktivitas TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create view to combine lost and found items for searching and matching
CREATE OR REPLACE VIEW all_items AS
SELECT 
  id_hilang AS id,
  'lost' AS type,
  id_user,
  nama_barang,
  kategori,
  deskripsi,
  lokasi,
  tanggal_hilang AS tanggal,
  status,
  image,
  created_at
FROM 
  barang_hilang
UNION ALL
SELECT 
  id_temuan AS id,
  'found' AS type,
  id_user,
  nama_barang,
  kategori,
  deskripsi,
  lokasi,
  tanggal_temuan AS tanggal,
  status,
  image,
  created_at
FROM 
  barang_temuan;

-- Create function to log activities
CREATE OR REPLACE FUNCTION log_activity() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO log_aktivitas (id_user, aktivitas)
  VALUES (NEW.id_user, TG_ARGV[0] || ' ' || NEW.nama_barang);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for logging
CREATE TRIGGER log_lost_item_insert
AFTER INSERT ON barang_hilang
FOR EACH ROW
EXECUTE FUNCTION log_activity('reported lost item');

CREATE TRIGGER log_found_item_insert
AFTER INSERT ON barang_temuan
FOR EACH ROW
EXECUTE FUNCTION log_activity('reported found item');

-- Create function to match items based on similarity
CREATE OR REPLACE FUNCTION match_items() 
RETURNS TRIGGER AS $$
BEGIN
  -- For lost items, look for matching found items
  IF TG_TABLE_NAME = 'barang_hilang' THEN
    UPDATE barang_hilang 
    SET status = 'matched'
    WHERE id_hilang = NEW.id_hilang
    AND EXISTS (
      SELECT 1 FROM barang_temuan
      WHERE 
        nama_barang ILIKE '%' || NEW.nama_barang || '%'
        AND kategori = NEW.kategori
        AND status = 'verified'
    );
    
    UPDATE barang_temuan
    SET status = 'matched'
    WHERE 
      nama_barang ILIKE '%' || NEW.nama_barang || '%'
      AND kategori = NEW.kategori
      AND status = 'verified';
      
  -- For found items, look for matching lost items
  ELSIF TG_TABLE_NAME = 'barang_temuan' THEN
    UPDATE barang_temuan 
    SET status = 'matched'
    WHERE id_temuan = NEW.id_temuan
    AND EXISTS (
      SELECT 1 FROM barang_hilang
      WHERE 
        nama_barang ILIKE '%' || NEW.nama_barang || '%'
        AND kategori = NEW.kategori
        AND status = 'verified'
    );
    
    UPDATE barang_hilang
    SET status = 'matched'
    WHERE 
      nama_barang ILIKE '%' || NEW.nama_barang || '%'
      AND kategori = NEW.kategori
      AND status = 'verified';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for matching
CREATE TRIGGER match_lost_items
AFTER UPDATE ON barang_hilang
FOR EACH ROW
WHEN (NEW.status = 'verified')
EXECUTE FUNCTION match_items();

CREATE TRIGGER match_found_items
AFTER UPDATE ON barang_temuan
FOR EACH ROW
WHEN (NEW.status = 'verified')
EXECUTE FUNCTION match_items(); 
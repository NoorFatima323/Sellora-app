-- schema.sql

CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             VARCHAR(255) UNIQUE NOT NULL,
  password_hash     TEXT NOT NULL,
  name              VARCHAR(100),
  plan              VARCHAR(20) DEFAULT 'free',
  preferred_language VARCHAR(5) DEFAULT 'en',
  analyses_used     INTEGER DEFAULT 0,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analyses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES users(id) NULL,
  product_name     VARCHAR(255) NOT NULL,
  category         VARCHAR(100) NOT NULL,
  selling_price    NUMERIC(12,2),
  cost_price       NUMERIC(12,2),
  platforms        TEXT[],
  description      TEXT,
  image_url        TEXT,
  competitor_url   TEXT,
  status           VARCHAR(20) DEFAULT 'pending',
  overall_score    INTEGER,
  share_slug       VARCHAR(100) UNIQUE,
  report_language  VARCHAR(5) DEFAULT 'en',
  started_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at     TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS agent_results (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id    UUID REFERENCES analyses(id) ON DELETE CASCADE,
  agent_name     VARCHAR(100) NOT NULL,
  status         VARCHAR(20) DEFAULT 'waiting',
  result_json    JSONB,
  error_message  TEXT,
  started_at     TIMESTAMP WITH TIME ZONE,
  completed_at   TIMESTAMP WITH TIME ZONE,
  duration_ms    INTEGER
);

CREATE TABLE IF NOT EXISTS report_sections (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id   UUID REFERENCES analyses(id) ON DELETE CASCADE,
  section_name  VARCHAR(100),
  content_en    JSONB,
  content_ur    JSONB,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  expires_at  TIMESTAMP WITH TIME ZONE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

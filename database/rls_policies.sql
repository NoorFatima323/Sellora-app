-- rls_policies.sql

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_sections ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users read own data"
  ON users FOR SELECT USING (auth.uid() = id);

-- Analyses policies (allows reading own analyses or public shared ones)
CREATE POLICY "Users read own analyses"
  ON analyses FOR SELECT
  USING (user_id = auth.uid() OR share_slug IS NOT NULL);

-- Agent results policies
CREATE POLICY "Users read own agent results"
  ON agent_results FOR SELECT
  USING (analysis_id IN (
    SELECT id FROM analyses WHERE user_id = auth.uid()
  ));

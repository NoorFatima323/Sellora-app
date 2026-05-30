-- indexes.sql

CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
CREATE INDEX IF NOT EXISTS idx_analyses_share_slug ON analyses(share_slug);
CREATE INDEX IF NOT EXISTS idx_agent_results_analysis_id ON agent_results(analysis_id);
CREATE INDEX IF NOT EXISTS idx_agent_results_status ON agent_results(status);
CREATE INDEX IF NOT EXISTS idx_report_sections_analysis_id ON report_sections(analysis_id);

-- seed.sql

-- Insert a mock user (password_hash is bcrypt for 'password123')
INSERT INTO users (id, email, password_hash, name, plan, preferred_language)
VALUES (
  'a3c7ef2b-4bb8-41ff-8610-d85c88b22a01',
  'test@sellora.com',
  '$2b$12$D24mI2FvG0wWc3H/P9Bpe.s0jA4oM2u/R5fV0c2r1l8b2gZ7n6e8q',
  'Test Seller',
  'free',
  'en'
) ON CONFLICT (email) DO NOTHING;

-- Insert a mock analysis in 'done' status
INSERT INTO analyses (
  id,
  user_id,
  product_name,
  category,
  selling_price,
  cost_price,
  platforms,
  description,
  status,
  overall_score,
  share_slug,
  report_language
)
VALUES (
  'b5d8ef2b-4bb8-41ff-8610-d85c88b22a02',
  'a3c7ef2b-4bb8-41ff-8610-d85c88b22a01',
  'Wireless Bluetooth Earphones',
  'Electronics',
  2500.00,
  1200.00,
  ARRAY['Daraz', 'Amazon'],
  'High quality wireless earphones with noise cancellation and long battery life.',
  'done',
  85,
  'wireless-earphones-test',
  'en'
) ON CONFLICT (share_slug) DO NOTHING;

-- Insert mock agent results for the done analysis
INSERT INTO agent_results (analysis_id, agent_name, status, result_json)
VALUES 
  ('b5d8ef2b-4bb8-41ff-8610-d85c88b22a02', 'category_classifier', 'done', '{"confirmed_category": "Electronics", "sub_niche": "Audio Equipment", "confidence": 0.95, "reasoning": "Determined from name and description."}'),
  ('b5d8ef2b-4bb8-41ff-8610-d85c88b22a02', 'price_spy', 'done', '{"average_market_price": 2400, "lowest_price": 1800, "highest_price": 3200, "competitors": []}')
ON CONFLICT DO NOTHING;

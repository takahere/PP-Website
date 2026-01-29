-- analysis_sheets テーブル作成
-- AI Native データ分析シート機能用

CREATE TABLE IF NOT EXISTS analysis_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  data JSONB DEFAULT '{
    "columns": ["A", "B", "C", "D", "E"],
    "rows": [],
    "chart": null
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 更新日時を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_analysis_sheets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_analysis_sheets_updated_at ON analysis_sheets;
CREATE TRIGGER trigger_update_analysis_sheets_updated_at
  BEFORE UPDATE ON analysis_sheets
  FOR EACH ROW
  EXECUTE FUNCTION update_analysis_sheets_updated_at();

-- RLS (Row Level Security) ポリシー
ALTER TABLE analysis_sheets ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは全ての操作が可能
CREATE POLICY "Allow all for authenticated users" ON analysis_sheets
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Service Role は全ての操作が可能
CREATE POLICY "Allow all for service role" ON analysis_sheets
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_analysis_sheets_created_at ON analysis_sheets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_sheets_updated_at ON analysis_sheets(updated_at DESC);

COMMENT ON TABLE analysis_sheets IS 'AI Native データ分析シート';
COMMENT ON COLUMN analysis_sheets.data IS 'シートデータ（columns, rows, chart設定を含むJSON）';















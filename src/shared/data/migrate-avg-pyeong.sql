ALTER TABLE apt_meta ADD COLUMN avg_pyeong REAL;
ALTER TABLE apt_meta ADD COLUMN avg_price  REAL;

CREATE INDEX IF NOT EXISTS idx_apt_meta_pyeong ON apt_meta(avg_pyeong);
CREATE INDEX IF NOT EXISTS idx_apt_meta_price  ON apt_meta(avg_price);

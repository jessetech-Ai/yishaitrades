-- YishaiEdge production PostgreSQL schema
-- Enable UUID generation first.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  display_name VARCHAR(120),
  account_size DECIMAL(14,2),
  currency VARCHAR(3) DEFAULT 'USD',
  timezone VARCHAR(80) DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TYPE trade_status AS ENUM ('open', 'closed', 'pending', 'cancelled');
CREATE TYPE trade_side AS ENUM ('long', 'short');

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  broker VARCHAR(120),
  starting_balance DECIMAL(14,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
  symbol VARCHAR(30) NOT NULL,
  side trade_side NOT NULL DEFAULT 'long',
  entry_price DECIMAL(18,8) NOT NULL CHECK (entry_price > 0),
  exit_price DECIMAL(18,8) CHECK (exit_price > 0),
  quantity DECIMAL(18,6) DEFAULT 1 CHECK (quantity > 0),
  fees DECIMAL(12,2) DEFAULT 0 CHECK (fees >= 0),
  entry_date TIMESTAMPTZ NOT NULL,
  exit_date TIMESTAMPTZ,
  status trade_status DEFAULT 'closed',
  strategy VARCHAR(120),
  notes TEXT,
  emotion VARCHAR(60),
  discipline_rating INT CHECK (discipline_rating BETWEEN 1 AND 5),
  stop_loss DECIMAL(18,8),
  take_profit DECIMAL(18,8),
  external_id VARCHAR(160),
  source VARCHAR(40) DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(user_id, source, external_id)
);

CREATE TABLE trade_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trade_id UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  tag_name VARCHAR(60) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trade_id, tag_name)
);

CREATE TABLE user_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  date_range VARCHAR(40) NOT NULL,
  total_trades INT DEFAULT 0,
  winning_trades INT DEFAULT 0,
  losing_trades INT DEFAULT 0,
  breakeven_trades INT DEFAULT 0,
  net_pnl DECIMAL(14,2) DEFAULT 0,
  gross_profit DECIMAL(14,2) DEFAULT 0,
  gross_loss DECIMAL(14,2) DEFAULT 0,
  win_rate DECIMAL(6,2) DEFAULT 0,
  profit_factor DECIMAL(10,2) DEFAULT 0,
  avg_win DECIMAL(12,2) DEFAULT 0,
  avg_loss DECIMAL(12,2) DEFAULT 0,
  max_drawdown DECIMAL(12,2) DEFAULT 0,
  max_drawdown_pct DECIMAL(6,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, account_id, date_range)
);

-- Common query indexes
CREATE INDEX idx_trades_user_exit_date ON trades(user_id, exit_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_trades_user_symbol ON trades(user_id, symbol) WHERE deleted_at IS NULL;
CREATE INDEX idx_trades_user_strategy ON trades(user_id, strategy) WHERE deleted_at IS NULL;
CREATE INDEX idx_trades_user_status ON trades(user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_trades_user_external ON trades(user_id, source, external_id) WHERE deleted_at IS NULL;

-- Useful production query examples
-- 1. Date-range trade list:
-- SELECT * FROM trades WHERE user_id = $1 AND deleted_at IS NULL
--   AND exit_date BETWEEN $2 AND $3 ORDER BY exit_date DESC LIMIT $4 OFFSET $5;

-- 2. Strategy stats:
-- SELECT strategy, COUNT(*) AS trades,
--   AVG(CASE WHEN ((exit_price - entry_price) * CASE WHEN side='long' THEN 1 ELSE -1 END * quantity - fees) > 0 THEN 1 ELSE 0 END) * 100 AS win_rate,
--   SUM((exit_price - entry_price) * CASE WHEN side='long' THEN 1 ELSE -1 END * quantity - fees) AS pnl
-- FROM trades WHERE user_id = $1 AND deleted_at IS NULL AND status = 'closed'
-- GROUP BY strategy ORDER BY pnl DESC;

-- 3. Hour/day heatmap:
-- SELECT EXTRACT(DOW FROM exit_date) AS dow, EXTRACT(HOUR FROM exit_date) AS hour,
--   COUNT(*) AS trades,
--   SUM((exit_price - entry_price) * CASE WHEN side='long' THEN 1 ELSE -1 END * quantity - fees) AS pnl
-- FROM trades WHERE user_id = $1 AND deleted_at IS NULL AND status = 'closed'
-- GROUP BY dow, hour ORDER BY dow, hour;
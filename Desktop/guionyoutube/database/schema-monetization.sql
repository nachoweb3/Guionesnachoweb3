-- ============================================
-- SCHEMA DE MONETIZACIÓN
-- Sistema de usuarios, suscripciones y usage tracking
-- ============================================

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tier VARCHAR(20) DEFAULT 'free', -- free, pro, enterprise
  stripe_customer_id VARCHAR(255),
  INDEX idx_email (email),
  INDEX idx_tier (tier)
);

-- Tabla de suscripciones
CREATE TABLE IF NOT EXISTS subscriptions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255),
  tier VARCHAR(20) NOT NULL, -- pro, enterprise
  status VARCHAR(20) NOT NULL, -- active, canceled, past_due, trialing
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_stripe_subscription_id (stripe_subscription_id)
);

-- Tabla de tracking de uso
CREATE TABLE IF NOT EXISTS usage_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36),
  session_id VARCHAR(255), -- Para usuarios anónimos (basado en IP/fingerprint)
  action_type VARCHAR(50) NOT NULL, -- generar_guion, generar_libro, etc.
  content_duration INT, -- Duración del contenido generado (minutos)
  words_generated INT, -- Palabras generadas
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_session_id (session_id),
  INDEX idx_created_at (created_at),
  INDEX idx_action_type (action_type)
);

-- Tabla de límites diarios (caché para performance)
CREATE TABLE IF NOT EXISTS daily_usage (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(36),
  session_id VARCHAR(255),
  date DATE NOT NULL,
  generation_count INT DEFAULT 0,
  last_reset TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_date (user_id, date),
  UNIQUE KEY unique_session_date (session_id, date),
  INDEX idx_date (date)
);

-- Tabla de API keys (para tier Enterprise)
CREATE TABLE IF NOT EXISTS api_keys (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  key_prefix VARCHAR(20) NOT NULL, -- Primeros caracteres para identificación
  name VARCHAR(100), -- Nombre descriptivo de la key
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_key_hash (key_hash),
  INDEX idx_is_active (is_active)
);

-- Configuración de tiers
CREATE TABLE IF NOT EXISTS tier_limits (
  tier VARCHAR(20) PRIMARY KEY,
  daily_generations INT NOT NULL,
  max_duration_minutes INT NOT NULL,
  can_remove_watermark BOOLEAN DEFAULT FALSE,
  can_access_api BOOLEAN DEFAULT FALSE,
  can_export_advanced BOOLEAN DEFAULT FALSE,
  support_level VARCHAR(20) DEFAULT 'none', -- none, email, priority
  price_monthly_cents INT,
  price_yearly_cents INT
);

-- Insertar configuración inicial de tiers
INSERT INTO tier_limits (tier, daily_generations, max_duration_minutes, can_remove_watermark, can_access_api, can_export_advanced, support_level, price_monthly_cents, price_yearly_cents) VALUES
('free', 3, 30, FALSE, FALSE, FALSE, 'none', 0, 0),
('pro', 50, 120, TRUE, FALSE, TRUE, 'email', 1900, 19000),
('enterprise', -1, -1, TRUE, TRUE, TRUE, 'priority', 9900, 99000);
-- -1 significa ilimitado

-- Tabla de pagos (para historial)
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  amount_cents INT NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) NOT NULL, -- succeeded, failed, pending
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);

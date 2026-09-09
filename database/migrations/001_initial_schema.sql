-- Create tables
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_hi VARCHAR(100),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category, name)
);

CREATE TABLE IF NOT EXISTS providers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    category_id INTEGER REFERENCES services(id),
    description TEXT,
    verification_status VARCHAR(20) DEFAULT 'pending',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS provider_services (
    provider_id INTEGER REFERENCES providers(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
    PRIMARY KEY (provider_id, service_id)
);

CREATE TABLE IF NOT EXISTS provider_areas (
    provider_id INTEGER REFERENCES providers(id) ON DELETE CASCADE,
    area VARCHAR(100) NOT NULL,
    PRIMARY KEY (provider_id, area)
);

CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    service_id INTEGER REFERENCES services(id),
    area VARCHAR(100) NOT NULL,
    description TEXT,
    source VARCHAR(50) DEFAULT 'web',
    status VARCHAR(20) DEFAULT 'NEW',
    assigned_provider_id INTEGER REFERENCES providers(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lead_events (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_service_id ON leads(service_id);
CREATE INDEX idx_leads_assigned_provider ON leads(assigned_provider_id);
CREATE INDEX idx_provider_services_provider ON provider_services(provider_id);
CREATE INDEX idx_provider_areas_provider ON provider_areas(provider_id);

-- Create initial admin user (password: admin123 — CHANGE THIS after first login in production)
INSERT INTO admin_users (username, password_hash) 
VALUES ('admin', '$2a$10$DYp/ldcDs3UcIOHnBGZt6eDnL590jJIVmxVV.oXFk7fQpeMk6LYkO')
ON CONFLICT (username) DO NOTHING;
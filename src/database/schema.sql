CREATE DATABASE sistema;

CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(20) UNIQUE NOT NULL
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(50) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL
);

INSERT INTO roles (name) VALUES
('ADMIN'),
('TECNICO'),
('OBSERVADOR')

INSERT INTO users (name, email, password, role_id) VALUES
('ADMIN', 'admin@admin.com', 'admin', 1);


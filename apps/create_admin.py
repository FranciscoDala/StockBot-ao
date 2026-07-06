-- 1. Ativa o pgcrypto se ainda não estiver
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Apaga se já existir um admin com esse email pra não dar conflito
DELETE FROM usuarios WHERE email = 'admin@stockbot.ao';

-- 3. Cria o admin com senha 'admin123' já em bcrypt
INSERT INTO usuarios (id, nome, email, hashed_password, is_superuser, is_active)
VALUES (
    gen_random_uuid(),           -- gera ID sozinho
    'StockBot Master',           -- nome
    'admin@stockbot.ao',         -- email pra login
    crypt('admin123', gen_salt('bf', 12)), -- <- aqui gera o $2a$12$... compatível
    true,                        -- is_superuser = true
    true                         -- is_active = true
);

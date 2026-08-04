forçar logout no console do navegador

document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/");
});
location.href = "/login"





sh -c "uvicorn app.main:app --host 0.0.0.0 --port $PORT & python scheduler.py"



DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename NOT IN ('usuarios', 'usuarios_lojas', 'lojas', 'produtos', 'alembic_version')
    )
    LOOP
        -- 1. Apaga tudo
        EXECUTE 'TRUNCATE TABLE public.' || quote_ident(r.tablename) || ' CASCADE';

        -- 2. Reseta a sequence só se ela existir
        EXECUTE format(
            'SELECT setval(pg_get_serial_sequence(''public.%I'', ''id''), 1, false)',
            r.tablename
        );
    END LOOP;
END $$;




PORT="8000"
BASE_URL="https://gentle-playfulness-production-d333.up.railway.app"
ALLOWED_ORIGINS="http://localhost:3000,http://127.0.0.1:3000,https://stockbot-ao-production.up.railway.app,https://whatsapp-production-e056.up.railway.app"
DATABASE_URL="postgresql+asyncpg://neondb_owner:npg_CGnUbs41DYfV@ep-solitary-haze-at4kcyv7-pooler.c-9.us-east-1.aws.neon.tech/neondb?ssl=true"
ENVIRONMENT="production"
JWT_SECRET="stockbot-dev-secret-2026"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES="10080"
TELEGRAM_BOT_TOKEN="COLA_SEU_TOKEN_AQUI"
CLOUDINARY_CLOUD_NAME="d7dtiurw"
CLOUDINARY_API_KEY="598914546743518"
CLOUDINARY_API_SECRET="GxBW2UtKsSr2nDDc0WwztUWU3w8"
BOT_URL="https://whatsapp-production-e056.up.railway.app"
TIMEZONE="Africa/Luanda"

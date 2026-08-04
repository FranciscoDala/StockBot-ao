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

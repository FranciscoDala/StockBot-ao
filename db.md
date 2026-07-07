db - neon
pass - postgresql://neondb_owner:npg_CGnUbs41DYfV@ep-solitary-haze-at4kcyv7-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require


    DATABASE_URL=postgresql://neondb_owner:npg_CGnUbs41DYfV@ep-solitary-haze-at4kcyv7-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
    SECRET_KEY=chave-super-secreta-aqui-muda-isso-123456
    PORT=8000

DATABASE_URL=postgresql+asyncpg://neondb_owner:npg_CGnUbs41DYfV@ep-solitary-haze-at4kcyv7-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=stockbot-dev-secret-2026
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
ALLOWED_ORIGINS=https://*.vercel.app,http://localhost:3000
PORT=8000



fastapi==0.115.4
uvicorn[standard]==0.32.0
sqlalchemy[asyncio]==2.0.36
asyncpg==0.29.0
pydantic==2.9.2
pydantic-settings==2.5.2
python-jose[cryptography]==3.3.0
python-multipart==0.0.12
alembic==1.13.2
httpx==0.27.2 # Pra chamar UltraMSG



fastapi
uvicorn[standard]
pydantic
python-multipart
python-dotenv




variavel de ambiente

DATABASE_URL=postgresql+asyncpg://neondb_owner:npg_CGnUbs41DYfV@ep-solitary-haze-at4kcyv7-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=stockbot-dev-secret-2026
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
ALLOWED_ORIGINS=["http://localhost:3000"]
PORT=8000

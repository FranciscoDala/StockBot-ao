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








Backend

DATABASE_URL="postgresql+asyncpg://neondb_owner:npg_CGnUbs41DYfV@ep-solitary-haze-at4kcyv7-pooler.c-9.us-east-1.aws.neon.tech/neondb?ssl=true"
JWT_SECRET="stockbot-dev-secret-2026"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES="10080"
ALLOWED_ORIGINS="https://stockbot-ao-production.up.railway.app"
BASE_URL="https://gentle-playfulness-production-d333.up.railway.app"
PORT="8000"

# Telegram
TELEGRAM_BOT_TOKEN="COLA_SEU_TOKEN_AQUI"

# Cloudinary
CLOUDINARY_CLOUD_NAME="d7dtiurw"
CLOUDINARY_API_KEY="598914546743518"
CLOUDINARY_API_SECRET="GxBW2UtKsSr2nDDc0WwztUWU3w8"




local

# ========== AMBIENTE ==========
ENVIRONMENT="development"
PORT="8000"
BASE_URL="http://localhost:8000"

# ========== BANCO LOCAL ==========
DATABASE_URL="postgresql+asyncpg://postgres:12345@localhost:5432/stockbot_db"

# ========== CORS ==========
ALLOWED_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"

# ========== JWT ==========
JWT_SECRET="stockbot-dev-secret-2026-local"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES="10080"

# ========== TELEGRAM - pode deixar vazio em dev ==========
TELEGRAM_BOT_TOKEN=""

# ========== CLOUDINARY - pode deixar vazio em dev ==========
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# ========== BOT / OUTROS ==========
BOT_URL="http://localhost:8000"
TIMEZONE="Africa/Luanda"

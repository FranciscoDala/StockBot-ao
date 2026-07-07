from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
import logging

from  app.core.config import settings
from  app.models.usuario import Usuario

logger = logging.getLogger(__name__)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password or not hashed_password.startswith("$2"):
        logger.error(f"VERIFY FAIL >>> hash invalido ou vazio")
        return False
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.error(f"VERIFY EXCEPTION >>> {e}")
        return False

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | int | None = None) -> str:
    to_encode = data.copy()

    if isinstance(expires_delta, int): # se mandar 5 = 5 minutos
        delta = timedelta(minutes=expires_delta)
    else:
        delta = expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    expire = datetime.now(timezone.utc) + delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    logger.info(f"TOKEN CREATED >>> sub={data.get('sub')} role={data.get('role')} exp={expire}")
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    """Decodifica e valida. Se der ruim, 401 na hora"""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            options={"verify_exp": True}
        )
        logger.info(f"TOKEN DECODED >>> sub={payload.get('sub')} role={payload.get('role')}")
        return payload
    except JWTError as e:
        logger.error(f"TOKEN INVALID >>> {e}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido ou expirado")

async def authenticate_user(db: AsyncSession, email: str, password: str) -> Usuario:
    stmt = select(Usuario).where(Usuario.email == email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    logger.error(f"LOGIN ATTEMPT >>> email={email} user_found={user is not None}")

    if not user:
        logger.error(f"LOGIN FAIL >>> motivo=usuario_nao_encontrado email={email}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou senha incorretos")

    senha_ok = verify_password(password, user.senha_hash)
    logger.error(f"LOGIN ATTEMPT >>> email={email} senha_ok={senha_ok} is_active={user.is_active} is_verified={user.is_verified}")

    if not senha_ok:
        logger.error(f"LOGIN FAIL >>> motivo=senha_errada email={email}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou senha incorretos")
    if not user.is_active:
        logger.error(f"LOGIN FAIL >>> motivo=inativo email={email}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuario inativo")
    if not user.is_verified:
        logger.error(f"LOGIN FAIL >>> motivo=nao_verificado email={email}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Usuario nao verificado")

    logger.info(f"LOGIN OK >>> email={email}")
    return user

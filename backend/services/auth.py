"""Authentication dependency: verifies the Supabase JWT from the Authorization header."""
import logging

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from config import settings

logger = logging.getLogger(__name__)
bearer_scheme = HTTPBearer(auto_error=False)

SUPABASE_JWT_SECRET = ""  # Set via env SUPABASE_JWT_SECRET if using HS256


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    """
    Verifies the Supabase access token and returns the authenticated user id.
    Supabase signs JWTs with HS256 using the project's JWT secret, or RS256
    (did:key / JWK) on newer projects. We support both.
    """
    if credentials is None or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Missing authorization token")

    token = credentials.credentials
    try:
        if settings.supabase_jwt_secret:
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
                options={"verify_aud": True},
            )
        else:
            # RS256: fetch and cache the project JWKS
            key = _get_jwks_key(token)
            payload = jwt.decode(
                token,
                key,
                algorithms=["RS256"],
                audience="authenticated",
                options={"verify_aud": True},
            )
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return user_id
    except JWTError as exc:
        logger.warning("JWT verification failed: %s", exc)
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        logger.exception("Auth error")
        raise HTTPException(status_code=401, detail="Authentication failed") from exc


_jwks_cache: dict | None = None


def _get_jwks_key(token: str) -> dict:
    """Fetch the Supabase JWKS and return the signing key for this token."""
    global _jwks_cache
    import httpx
    from jose import jwk

    if _jwks_cache is None:
        url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
        response = httpx.get(url, timeout=10)
        response.raise_for_status()
        _jwks_cache = response.json()

    header = jwt.get_unverified_header(token)
    kid = header.get("kid")
    for key in _jwks_cache.get("keys", []):
        if key.get("kid") == kid:
            return jwk.construct(key)
    raise HTTPException(status_code=401, detail="Unknown signing key")

"""
Security middleware for VibeConnect API
Includes rate limiting, security headers, and request validation
"""
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable
import logging
import time

# Configure logging for security events
security_logger = logging.getLogger("vibeconnect.security")
security_logger.setLevel(logging.INFO)

# Create console handler
handler = logging.StreamHandler()
handler.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
security_logger.addHandler(handler)


# Rate limiter configuration
# Uses in-memory storage by default, can be configured to use Redis
limiter = Limiter(key_func=get_remote_address)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add security headers to all responses
    """
    async def dispatch(self, request: Request, call_next: Callable):
        response = await call_next(request)

        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(self), microphone=(), camera=()"

        # Content Security Policy
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"

        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log all requests for security auditing
    """
    async def dispatch(self, request: Request, call_next: Callable):
        start_time = time.time()

        # Log incoming request
        security_logger.info(
            f"Request: {request.method} {request.url.path} "
            f"from {request.client.host if request.client else 'unknown'}"
        )

        try:
            response = await call_next(request)

            # Log response time
            process_time = time.time() - start_time
            response.headers["X-Process-Time"] = str(process_time)

            # Log response status
            if response.status_code >= 400:
                security_logger.warning(
                    f"Response: {request.method} {request.url.path} "
                    f"Status: {response.status_code} Time: {process_time:.3f}s"
                )

            return response
        except Exception as e:
            security_logger.error(
                f"Error processing request: {request.method} {request.url.path} "
                f"Error: {str(e)}"
            )
            raise


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """
    Custom handler for rate limit exceeded errors
    """
    security_logger.warning(
        f"Rate limit exceeded: {request.url.path} "
        f"from {request.client.host if request.client else 'unknown'}"
    )

    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "error": "Rate limit exceeded",
            "message": "Too many requests. Please try again later.",
            "retry_after": exc.detail
        }
    )

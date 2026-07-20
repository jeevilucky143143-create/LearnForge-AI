import unittest
from unittest.mock import patch
from jose import jwt
from app.auth.jwt import verify_jwt

class TestAuthJWT(unittest.TestCase):
    def test_verify_jwt(self):
        """Test decoding a valid JWT token."""
        secret = "supersecretjwtkeyforlocaltesttesting"
        payload = {"sub": "user-id-123", "email": "test@example.com"}
        
        # Encode a valid token using jose
        token = jwt.encode(payload, secret, algorithm="HS256")
        
        with patch("app.auth.jwt.settings") as mock_settings:
            mock_settings.SUPABASE_JWT_SECRET = secret
            
            decoded = verify_jwt(token)
            self.assertEqual(decoded["sub"], "user-id-123")
            self.assertEqual(decoded["email"], "test@example.com")

    def test_invalid_token(self):
        """Test that invalid token raises JWTError."""
        from jose import JWTError
        with patch("app.auth.jwt.settings") as mock_settings:
            mock_settings.SUPABASE_JWT_SECRET = "secret"
            
            with self.assertRaises(JWTError):
                verify_jwt("invalid.token.string")

if __name__ == "__main__":
    unittest.main()

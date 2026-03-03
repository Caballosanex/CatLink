import bcrypt

def get_password_hash(password: str) -> str:
    """Genera el hash bcrypt a partir de una contraseña en texto plano"""
    # Truncamos a 72 bytes máximo porque es el límite de bcrypt
    pwd_bytes = password[:72].encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_password.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Comprueba si la contraseña en texto plano coincide con el hash"""
    try:
        password_byte_enc = plain_password[:72].encode('utf-8')
        hashed_password_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_byte_enc, hashed_password_bytes)
    except Exception:
        return False

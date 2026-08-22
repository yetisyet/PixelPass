from argon2.low_level import hash_secret_raw, Type
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from pyshamir import split, combine

import os

SALT_LEN = 16
NONCE_LEN = 12
KEY_LEN = 32 # AES-256

"""
Crypto layer for the password manager.

NOTE: This layer defines ciphertext as being *prepended* by the salt and nonce.
salt + nonce + ciphertext
"""


def derive_key(password: str, salt: bytes):
    """
    Uses Argon2 to turn a human-readable password and salt into a
    key that can be used in AES-256.
    """
    return hash_secret_raw(secret=password.encode('utf-8'),
                    salt=salt,
                    time_cost=3,
                    memory_cost=64 * 1024,
                    parallelism=4,
                    hash_len=KEY_LEN,
                    type=Type.ID,
                    )

def encrypt(data: bytes, password: str) -> bytes:
    """
    Encrypts raw data with AES-256 using a human-readable password. This
    function generates a salt that will be stored with the ciphertext.
    """

    salt = os.urandom(SALT_LEN)
    key = derive_key(password, salt)

    nonce = os.urandom(NONCE_LEN)
    aes = AESGCM(key)

    ciphertext = aes.encrypt(nonce, data, None)
    return salt + nonce + ciphertext

def decrypt(blob: bytes, password: str) -> bytes:
    """
    Decrypts a AES-256 encrypted ciphertext using a human-readable password.
    """

    salt = blob[:SALT_LEN]
    nonce = blob[SALT_LEN:SALT_LEN+NONCE_LEN]
    data = blob[SALT_LEN+NONCE_LEN:]

    key = derive_key(password, salt)
    aes = AESGCM(key)

    plaintext = aes.decrypt(nonce, data, None)
    return plaintext

def distribute_data(data: bytes, password: str, majority: int, total: int) -> list[bytes]:
    """
    Takes some data, encrypts it, and uses Shamir Secret Sharing to split the ciphertext
    """

    assert majority <= total

    ciphertext = encrypt(data, password)

    shares = split(ciphertext, total, majority)
    return [bytes(share) for share in shares]

def collect_data(parts: list[bytes], password: str) -> bytes:
    """
    Takes multiple encrypted ciphertexts and returns the plaintext
    """

    parts_array = [bytearray(part) for part in parts]
    ciphertext = bytes(combine(parts_array))

    plaintext = decrypt(ciphertext, password)
    return plaintext

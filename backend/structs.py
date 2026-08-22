# this file listst all the dataclasses.
from typing import TypedDict


class Entry(TypedDict):
    """class for holding the entries"""

    id: int
    service_name: str
    username: str
    password: str
    is_fav: bool


class Vault(TypedDict):
    total_images: int
    majority_images: int
    password_entries: list[Entry]
    passcode_entries: list[dict]
    passkey_entries: list[dict]


class StorageOptions(TypedDict):
    individual_passwords: bool
    majority: int
    total: int
    read_only: bool


class Config(TypedDict):
    mode: int
    pool: list[str]
    storage_options: StorageOptions

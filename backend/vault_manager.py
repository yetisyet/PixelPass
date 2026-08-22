from status_manager import load_vault, save_vault
from structs import Entry, Vault, Config, StorageOptions


def store_master_password(master_password):
    """Store in memory somewhere"""

def get_password(id: int, config: Config, password: str):
    """
    Get the password from a specific entry.
    """
    
    # Load vault state
    vault: Vault = load_vault(config, password)

    passwords: list[Entry] = vault['password_entries']

    for entry in passwords:
        if entry['id'] == id:
                return entry['password']

    return None


def add_entry(entry: Entry, config: Config, password: str):
    """
    Add an entry to the vault.
    """

    # Load vault state
    vault: Vault = load_vault(config, password)

    passwords: list[Entry] = vault['password_entries']

    # Check if entry already exists
    exists = False
    for i, existing_entry in enumerate(passwords):
        if existing_entry['id'] == entry['id']:
            # This already exists, so we should just update it.
            exists = True
            passwords[i] = entry

    if not exists:
            passwords.append(entry)

    # At this point, the password list will now have the new (or updated) entry
    save_vault(vault, config, password)

def remove_entry(entry_id: int, config: Config, password: str):
    """
    Remove an entry from the vault.
    """

    # Load vault state
    vault: Vault = load_vault(config, password)

    vault["password_entries"] = [
        entry
        for entry in vault["password_entries"]
        if entry["id"] != entry_id
    ]

    save_vault(vault, config, password)


def get_services(config: Config, password: str):
    """
    Get all of the existing password entries with passwords redacted.
    """

    # Load vault state
    vault: Vault = load_vault(config, password)

    passwords: list[Entry] = vault['password_entries']

    # clear out the passwords
    for entry in passwords:
        entry['password'] = ""

    return passwords

def init_vault(mode):
    """ just store this number in memory"""
    
def populate_vault_path_images(list[folder]):
    """this is like a list of file paths that we make our pool from"""

def populate_vault_path_folder(path):
    """this would be like a actual folder we load image paths from"""

def populate_vault_raw(list[image]):
    """this is user provided images, from ctrl v from frontend"""

def populate_vault_self():
    """this is where we can choose what to use, maybe pull images from internet"""

def export_vault():
    """actually return image data to frontend"""


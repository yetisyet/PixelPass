from stegano import lsb
from crypto_manager import collect_data, distribute_data
import json

"""
Vault schema:

{
    total_images: int,
    majority_images: int,
    password_entries: [
        {
            id: int, 
            service: str,
            username: str,
            password: str,
        },
    ],

    passcode_entries: [
        ...
    ],

    passkey_entries: [
        ...
    ],
}
"""


def save_vault(vault: object, config, password) -> int:
    """
    Takes a vault configuration and saves it to the pool depending on storage modes.
    REQUIRES !read_only
    """

    pool = config['pool']
    storage_config = config['storage_options']
    read_only = storage_config['read_only']
    individual_passwords = storage_config['individual_passwords']
    majority = storage_config['majority']

    if not read_only:
        return 1

    if not individual_passwords:
        json_vault = json.dumps(vault)
        distributed_vault = distribute_data(json_vault.encode('utf-8'), password, majority, len(pool))

        assert len(distributed_vault) == len(pool)
        for i, path in enumerate(pool):
            lsb.hide(path, distributed_vault[i].hex()).save(path)
    else:
        raise NotImplemented
    
    return 0

def load_vault(config, password) -> object:
    """
    Takes a pool and storage mode and generates a vault configuration.
    """

    pool = config['pool']
    storage_config = config['storage_options']
    individual_passwords = storage_config['individual_passwords']

    shamirs = []
    vault = None
    if not individual_passwords:
        for path in pool:
            hidden = lsb.reveal(path)

            if hidden is None:
                raise ValueError(f"Unable to find data in {path}")
            shamirs.append(bytes.fromhex(hidden))

        json_vault = collect_data(shamirs, password)
        vault = json.loads(json_vault)
    else:
        raise NotImplemented


    return vault 

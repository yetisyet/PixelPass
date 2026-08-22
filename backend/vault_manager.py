from status_manager import load_vault, save_vault
from structs import Entry, Vault, Config, StorageOptions
import json
from PIL import Image
import os
import zipfile
from typing import TypedDict
from pathlib import Path

config_file = "config.json"


def check_master_password(config: Config, password: str) -> bool:
    """
    We check the master password is accurate, and then set the
    majority and totals inside the config.
    """

    # To check if the master password works, we attempt to decrypt
    # and get a vault back, if we were able to decrypt, assume it works!

    try:
        vault = load_vault(config, password)
        config["storage_options"]["majority"] = vault["majority_images"]
        config["storage_options"]["total"] = vault["total_images"]
    except:
        # Something went wrong when loading the vault, we are assuming
        # that it was an incorrect master password.
        return False

    return True


def get_password(id: int, config: Config, password: str):
    """
    Get the password from a specific entry.
    """

    # Load vault state
    vault: Vault = load_vault(config, password)

    passwords: list[Entry] = vault["password_entries"]

    for entry in passwords:
        if entry["id"] == id:
            return entry["password"]

    return None


def add_entry(entry: Entry, config: Config, password: str):
    """
    Add an entry to the vault.
    """

    # Load vault state
    vault: Vault = load_vault(config, password)

    passwords: list[Entry] = vault["password_entries"]

    # Check if entry already exists
    exists = False
    for i, existing_entry in enumerate(passwords):
        if existing_entry["id"] == entry["id"]:
            # This already exists, so we should just update it.
            exists = True
            passwords[i] = entry

    if not exists:
        passwords.append(entry)

    # At this point, the password list will now have the new (or updated) entry
    save_vault(vault, config, password)
    return 0


def remove_entry(entry_id: int, config: Config, password: str):
    """
    Remove an entry from the vault.
    """

    # Load vault state
    vault: Vault = load_vault(config, password)

    vault["password_entries"] = [
        entry for entry in vault["password_entries"] if entry["id"] != entry_id
    ]

    save_vault(vault, config, password)
    return 0


def get_services(config: Config, password: str):
    """
    Get all of the existing password entries with passwords redacted.
    """

    # Load vault state
    vault: Vault = load_vault(config, password)

    passwords: list[Entry] = vault["password_entries"]

    # clear out the passwords
    for entry in passwords:
        entry["password"] = ""

    return passwords


def init_vault(mode: int, total: int, majority: int):
    """1: User will pass images (not paths) to seed with
    2: User will choose folder (and send the file path!!)
    3: User will pass images (paths) to seed with
    4: Randomly choose files on yogitur PC
    """
    # check if in recover mode -> read only
    s_ops: StorageOptions = {
        "individual_passwords": False,
        "majority": majority,
        "total": total,
        "read_only": False,
    }
    settings = {"mode": mode, "pool": [], "storage_options": s_ops}
    initial: Vault = {
        "total_images": total,
        "majority_images": majority,
        "password_entries": [],
        "passcode_entries": [],
        "passkey_entries": [],
    }
    with open(config_file, "w") as config:
        config.write(json.dumps(settings))

    return initial

def get_pool_from_folder(folder: str) -> list[str]:
    return [str(path) for path in Path(folder).rglob("*.png")]

def populate_vault_path_images(folders: list[str]):
    """this is like a list of file paths that we make our pool from"""

    try:
        config = open(config_file)
        settings = json.load(config)
        config.close()
        # checking everything is a png
        non_image_count = 0
        for file in folders:
            if os.path.isfile(file):
                try:
                    Image.open(file, formats=["PNG"])
                except:
                    non_image_count += 1
        if non_image_count != 0:
            return -1

        settings["pool"] = folders

        with open(config_file, "w") as config:
            config.write(json.dumps(settings))
        set_total(len(folders))
    except:
        return -1
    return 0


def populate_vault_path_folder(path: str):
    """this would be like a actual folder we load image paths from"""

    try:
        config = open(config_file)
        settings = json.load(config)
        config.close()

        """
        dir = os.listdir(path)
        print(dir)

        # check the path has only images
        image_count = 0
        non_image_count = 0
        for file in dir:
            if os.path.isfile(file):
                try:
                    Image.open(file, formats=["PNG"])
                    image_count += 1
                except:
                    non_image_count += 1
        if non_image_count != 0:
            return -1
        """

        dir = get_pool_from_folder(path)
        image_count = len(dir)

        settings["pool"] = dir # [path]
        with open(config_file, "w") as config:
            config.write(json.dumps(settings))

        set_total(image_count)
        return 0
    except Exception as e:
        return -1


def populate_vault_raw(images: list[Image]):
    """this is user provided images, from ctrl v from frontend"""
    try:
        config = open(config_file)
        settings = json.load(config)
        config.close()
        if not os.path.exists("images"):
            os.mkdir("images")

        saved_paths = []
        for image in images:
            image_path = Path("images") / image.filename
            image.save(image_path)
            saved_paths.append(str(image_path))

        settings["pool"] = saved_paths

        with open(config_file, "w") as config:
            config.write(json.dumps(settings))
        set_total(len(images))
        return 0
    except:
        return -1


def populate_vault_self():
    """this is where we can choose what to use, maybe pull images from internet"""
    if not os.path.exists("images"):
        os.mkdir("images")
    with zipfile.ZipFile("photos.zip") as zip_ref:
        zip_ref.extractall("images")

    pool = get_pool_from_folder("images")
    set_total(len(pool))

    config = open(config_file)
    settings = json.load(config)
    config.close()

    settings['pool'] = pool

    with open(config_file, "w") as config:
        config.write(json.dumps(settings))
    return 0


def set_majority(num: int):
    try:
        config = open(config_file)
        settings = json.loads(config.read())
        config.close()
        settings["storage_options"]["majority"] = num
        with open(config_file, "w") as config:
            config.write(json.dumps(settings))
    except:
        return -1


def set_total(num: int):
    try:
        config = open(config_file)
        settings = json.loads(config.read())
        config.close()
        settings["storage_options"]["total"] = num
        with open(config_file, "w") as config:
            config.write(json.dumps(settings))
    except Exception as e:
        return -1

from status_manager import load_vault, save_vault
from structs import Entry, Vault, Config, StorageOptions
import json
from PIL import Image
import os
import zipfile

config_file = "config.json"

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


def init_vault(mode: int):
    """1: User will pass images (not paths) to seed with
       2: User will choose folder (and send the file path!!)
       3: User will pass images (paths) to seed with
       4: Randomly choose files on your PC 
    """
    settings = {
        "mode" : mode
    }
    with open(config_file, "w") as config:
        config.write(json.dumps(settings))

    return 0    



def populate_vault_path_images(folders: list[str]):
    """this is like a list of file paths that we make our pool from"""

    try:
        config = open(config_file)
        settings = json.load(config.read())
        # checking everything is a png
        non_image_count = 0
        for file in folders:
            if(os.path.isfile(file)):
                try:
                    pic = Image.open(file, formats = ["PNG"])
                    image_count += 1
                except:
                    non_image_count += 1
        if non_image_count != 0:
            return -1
            
        settings["pool"] = folders
        with open(config_file, "w") as config:
            config.write(json.dumps(settings))
    except:
        return (-1)

    return 0

def populate_vault_path_folder(path: str):
    """this would be like a actual folder we load image paths from"""

    try:
        config = open(config_file)
        settings = json.load(config.read())
        config.close()
        dir = os.listdir("path")

        # check the path has only images 
        non_image_count = 0
        for file in dir:
            if(os.path.isfile(file)):
                try:
                    pic = Image.open(file, formats = ["PNG"])
                    image_count += 1
                except:
                    non_image_count += 1
        if non_image_count != 0:
            return -1

        settings["pool"] = [path]
        with open(config_file, "w") as config:
            config.write(json.dump(settings))
        return 0
    except:
        return -1
        
def populate_vault_raw(images: list[Image]):
    """this is user provided images, from ctrl v from frontend"""
    try:
        config = open(config_file)
        settings = json.load(config.read())
        config.close()
        os.mkdir("images")

        for image in images:
            image.save("images/" + image.filename)

        settings["pool"] = ["images"]
        with open(config_file, "w") as config:
            config.write(json.dump(settings))

        return 0
    except:
        return -1
    
def populate_vault_self():
    """this is where we can choose what to use, maybe pull images from internet"""
    os.mkdir("images")
    with zipfile.ZipFIle("photos.zip") as zip_ref:
        zip_ref.extractall("images")
    return 0
def export_vault():
    """actually return image data to frontend"""


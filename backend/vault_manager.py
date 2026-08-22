import json
from PIL import Image
import os
import zipfile
from typing import TypedDict

config_file = "config.json"

def init_vault(mode: int, total: int, majority: int):
    """1: User will pass images (not paths) to seed with
       2: User will choose folder (and send the file path!!)
       3: User will pass images (paths) to seed with
       4: Randomly choose files on your PC 
    """
    # check if in recover mode -> read only
    s_ops: StorageOptions = {"individual_passwords" : False, "majority": majority, "total": total, "read_only": False}
    settings = {
        "mode" : mode,
        "pool" : [],
        "storage_options": s_ops
    }
    initial: Vault = {"total_images" : total, "majority_images" : majority, "password_entries" : [], "passcode_entries" : [], "passkey_entries" : []}
    with open(config_file, "w") as config:
        config.write(json.dumps(settings))
    
    return initial

def populate_vault_path_images(folders: list[str]):
    """this is like a list of file paths that we make our pool from"""

    try:
        config = open(config_file)
        settings = json.load(config.read())
        config.close()
        # checking everything is a png
        non_image_count = 0
        for file in folders:
            if(os.path.isfile(file)):
                try:
                    Image.open(file, formats = ["PNG"])
                except:
                    non_image_count += 1
        if non_image_count != 0:
            return -1
            
        settings["pool"] = folders

        with open(config_file, "w") as config:
            config.write(json.dumps(settings))
        set_total(folders.count)
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
        image_count = 0
        non_image_count = 0
        for file in dir:
            if(os.path.isfile(file)):
                try:
                    Image.open(file, formats = ["PNG"])
                    image_count += 1
                except:
                    non_image_count += 1
        if non_image_count != 0:
            return -1

        settings["pool"] = [path]
        with open(config_file, "w") as config:
            config.write(json.dumps(settings))
        set_total(image_count)
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
            config.write(json.dumps(settings))
        set_total(images.count)
        return 0
    except:
        return -1
    
def populate_vault_self():
    """this is where we can choose what to use, maybe pull images from internet"""
    os.mkdir("images")
    with zipfile.ZipFIle("photos.zip") as zip_ref:
        zip_ref.extractall("images")
    set_total(24)
    return 0

def set_majority(num: int):
    try:
        config = open(config_file)
        settings = json.load(config.read())
        config.close()
        settings["StorageOptions"]["majority"] = num
        with open(config_file, "w") as config:
            config.write(json.dumps(settings))
    except:
        return -1

def set_total(num: int):
    try:
        config = open(config_file)
        settings = json.load(config.read())
        config.close()
        settings["StorageOptions"]["total"] = num
        with open(config_file, "w") as config:
            config.write(json.dumps(settings))
    except:
        return -1
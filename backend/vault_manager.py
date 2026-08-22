from stegano import lsb
from stegano import generators
import json
from PIL import Image
import os
import zipfile

config_file = "config.json"

def store_master_password(master_password):
    """Store in memory somewhere"""

def get_password(service_name, username):
    """will need to read from pool (depending on settings)"""

def add_entry(entry):
    """add something to pool depending on settings"""

def get_services():
    """read from pool"""


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

def save_vault():
    """flush any changes to disk if not flushed"""
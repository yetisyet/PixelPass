from stegano import lsb
from stegano import generators

def store_master_password(master_password):
    """Store in memory somewhere"""

def get_password(service_name, username):
    """will need to read from pool (depending on settings)"""

def add_entry(entry):
    """add something to pool depending on settings"""

def get_services():
    """read from pool"""

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

def save_vault():
    """flush any changes to disk if not flushed"""
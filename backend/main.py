# the main python file
import json
import base64
import vault_manager
import status_manager
from structs import Vault, Entry, Config

""""
    Function that runs the entire backend.
    Acts like a server, waiting for the frontend to send something. 
    This function WILL NOT initiate (return something) unless initiated first. (NIUI)
    See google doc for what this funciton will send 
"""

mode = -1
mPassword = "pee"


"""
    The check config function
    Check if the config file exists and then
    if no config file) the mode is 0 and then (not in this function) vault_init is called to start up
    if there is a config file) sets the mode ( a global variable) to whatever is specified
    this function does not take in anything, only sets the mode variable and returns nothing
    if mode = -1 this means that there is no config file and hence vault_init needs to be called
    if mode != -1, this means that there is a mode and it goes as normal. 
"""


def check_config():
    global mode
    try:
        with open("config.json") as f:
            raw = json.loads(f.read())
            parsedMode = raw["mode"]
            if 0 < parsedMode < 6:  # 1-5 range
                mode = parsedMode
            else:
                mode = -1
    except:  # mode hasn't been detected
        mode = -1  # remove this and replace it with the return val above
    return startup()


def retrieve_all_pass_ent(usrInput, config):
    global mPassword
    passwords = vault_manager.get_services(
        config, mPassword
    )  # passwords is a list of Entry struct
    payload = {
        "elecID": usrInput["elecID"],
        "action": 1,
        "success": True,
        "data": {
            "entries": [
                {
                    "id": entry["id"],
                    "serviceName": entry["service_name"],
                    "username": entry["username"],
                    "isFav": entry["is_fav"],
                }
                for entry in passwords
            ]
        },
    }

    print(json.dumps(payload))


def reveal_password(usrInput, config):
    global mPassword
    password = vault_manager.get_password(usrInput["data"]["id"], config, mPassword)
    payload = {
        "elecID": usrInput["elecID"],
        "action": 2,
        "success": True,
        "data": {"password": password},
    }
    print(json.dumps(payload))


def create_password(usrInput, config):
    global mPassword
    thisEntry = Entry(
        id=usrInput["data"]["id"],
        service_name=usrInput["data"]["serviceName"],
        username=usrInput["data"]["username"],
        password=usrInput["data"]["password"],
        is_fav=usrInput["data"]["isFav"],
    )
    vault_manager.add_entry(thisEntry, config, mPassword)
    payload = {"elecID": usrInput["elecID"], "action": 3, "success": True}
    print(json.dumps(payload))


def remove_password(usrInput, config):
    global mPassword
    status = vault_manager.remove_entry(usrInput["data"]["id"], config, mPassword)
    if status == 0:
        payload = {"elecID": usrInput["elecID"], "action": 4, "success": True}
    else:
        payload = {"elecID": usrInput["elecID"], "action": 4, "success": False}
    print(json.dumps(payload))


def edit_password(usrInput, config):
    global mPassword
    thisEntry = Entry(
        id=usrInput["data"]["id"],
        service_name=usrInput["data"]["serviceName"],
        username=usrInput["data"]["username"],
        password=usrInput["data"]["password"],
        is_fav=usrInput["data"]["isFav"],
    )
    status = vault_manager.add_entry(thisEntry, config, mPassword)
    if status == 0:
        payload = {"action": 5, "success": True}
    else:
        payload = {"action": 5, "success": False}
    print(json.dumps(payload))


def startup():  # should return a config instance
    global mode
    global mPassword
    payload = {"mode": mode}
    print(json.dumps(payload))
    returnVal = json.loads(input())
    mPassword = returnVal["password"]
    if mode == -1:
        vault = vault_manager.init_vault(
            returnVal["mode"], returnVal["majority"], returnVal["total"]
        )
        mode_populate(returnVal)
        conf = get_config()
        status_manager.save_vault(vault, conf, mPassword)
    else:
        conf = get_config()
    print(json.dumps({"status": True, "elecID": returnVal["elecID"]}))

    return conf


def get_config():
    with open("config.json") as f:
        raw: Config = json.loads(f.read())  # raw is a python dictionary
    return raw


# mode populate function is activated when there is no config file
# it gets the mode and then parses what is from Front end
def mode_populate(returnVal):
    mode = returnVal["mode"]
    match mode:
        case 1:
            images = []
            for obj in returnVal["data"]:
                images.append(Image.open(base64.b64decode(obj)))
            vault_manager.populate_vault_raw(images)
        case 2:
            vault_manager.populate_vault_path_folder(returnVal["path"])
        case 3:
            vault_manager.populate_vault_path_images(returnVal["paths"])
        case 4:
            vault_manager.populate_vault_self()
        case 5:
            raise ("Not implemented")


def main_server(config):
    while 1:  # add something
        usrInput = json.loads(input())
        action = usrInput["action"]
        match action:
            case 1:
                retrieve_all_pass_ent(usrInput, config)
            case 2:
                reveal_password(usrInput, config)
            case 3:
                create_password(usrInput, config)
            case 4:
                remove_password(usrInput, config)
            case 5:
                edit_password(usrInput, config)
            case _:
                print("ERR, unknown operation")  # REALLY shouldn't happen!!


# makes sure that it only runs when it is not called from another function, hence the __init__ thing
if __name__ == "__main__":
    config = check_config()
    main_server(config)

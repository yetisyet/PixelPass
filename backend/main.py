# the main python file
import json
import vault_manager
from structs import Entry

""""
    Function that runs the entire backend.
    Acts like a server, waiting for the frontend to send something. 
    This function WILL NOT initiate (return something) unless initiated first. (NIUI)
    See google doc for what this funciton will send 
"""

mode = -1


def check_config():
    global mode
    try:
        with open("config.json") as f:
            raw = json.loads(f.read())
            parsedMode = raw["mode"]
            if 0 < parsedMode < 5:
                mode = parsedMode
            else:
                mode = -1
    except:  # mode hasn't been detected
        mode = -1  # remove this and replace it with the return val above


def retrieve_all_pass_ent():
    passwords = vault_manager.get_services()  # passwords is a list of Entry structs
    payload = {
        "action": 1,
        "success": True,
        "data": {
            "entries": [
                {
                    "id": entry.id,
                    "serviceName": entry.service_name,
                    "username": entry.username,
                    "isFav": entry.is_fav,
                }
                for entry in passwords
            ]
        },
    }
    print(json.dumps(payload)


def reveal_password(serviceName, userName):
    password = vault_manager.get_password(serviceName, userName)
    payload = {
        "action": 2,
        "success": True,
        "data": {"password": password},
    }
    print(json.dumps(payload))


def create_password(usrInput):
    thisEntry = Entry(
        usrInput["data"]["id"],
        usrInput["data"]["serviceName"],
        usrInput["data"]["username"],
        usrInput["data"]["password"],
        usrInput["data"]["isFav"],
    )
    vault_manager.add_entry(thisEntry)
    payload = {"action": 3, "success": True}
    print(json.dumps(payload))


def remove_password(usrInput):
    status = vault_manager.remove_password(
        usrInput["data"]["serviceName"], usrInput["data"]["username"]
    )
    if status == 0:
        payload = {"action": 4, "success": True}
    else:
        payload = {"action": 4, "success": False}
    print(json.dumps(payload))


def edit_password(usrInput):
    thisEntry = Entry(
        usrInput["data"]["id"],
        usrInput["data"]["serviceName"],
        usrInput["data"]["username"],
        usrInput["data"]["password"],
        usrInput["data"]["isFav"],
    )
    status = edit_password(thisEntry)
    if status == 0:
        payload = {"action": 5, "success": True}
    else:
        payload = {"action": 5, "success": False}
    print(json.dumps(payload))


def main_server():
    global mode
    if mode == -1:
        x = {"mode": 0}
        print(json.dumps(x))
        # ask the frontend
        mode = json.loads(input())["mode"]
    while 1:  # add something
        usrInput = json.loads(input())
        action = usrInput["action"]
        match action:
            case 1:
                retrieve_all_pass_ent()
            case 2:
                reveal_password(
                    usrInput["data"]["serviceName"], usrInput["data"]["username"]
                )
            case 3:
                create_password(usrInput)
            case 4:
                remove_password(usrInput)
            case 5:
                edit_password(usrInput)
            case _:
                print("ERR, unknown operation")  # REALLY shouldn't happen!!


# makes sure that it only runs when it is not called from another function, hence the __init__ thing
if __name__ == "__main__":
    check_config()
    # mode = vault_manager.check_config()
    main_server()

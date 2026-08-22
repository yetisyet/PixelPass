# the main python file
import json  # very important!!

try:
    from structs import *
except ImportError:
    print("Unable to import the structs, check if they exist")
# try:
#   from pyfileName import * #(fuck yeah)
# except ImportError:
#   print("Unable to import scripts, something's gone really wrong")

""""
    Function that runs the entire backend.
    Acts like a server, waiting for the frontend to send something. 
    This function WILL NOT initiate (return something) unless initiated first. (NIUI)
    See google doc for what this funciton will send 
"""


def main_server():
    while 1:  # add something
        usrInput = json.loads(input())
        action = usrInput["action"]
        match action:
            case "create_master_password":
                print("create_master_password")
            case "login_master_password":
                print("login_master_password")
            case "create_entry":
                print("create_entry")
            case "retrieve_all_passwords":
                print("retrieve_all_passwords")
            case _:
                print("ERR, unknown operation")  # REALLY shouldn't happen!!


# makes sure that it only runs when it is not called from another function, hence the __init__ thing
if __name__ == "__main__":
    main_server()

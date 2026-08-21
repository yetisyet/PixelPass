# the main python file
try:
    from structs import *
except ImportError:
    print("Unable to import the structs, check if they exist")
# try:
#   from pyfileName import * #(fuck yeah)
# except ImportError:
#   print("Unable to import scripts, something's gone really wrong")


def main_server():
    while 1:  # add something
        usr_input = input()
        case = int(usr_input[0])
        # gets the first element of the string, which SHOULD be the enum
        match case:
            case 0:
                print("piss")
            case 1:
                print("shit")
            case 2:
                print("2")
            case 3:
                print("3")


if __name__ == "__main__":
    main_server()

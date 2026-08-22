# this file listst all the dataclasses.
from dataclasses import dataclass


@dataclass
class Entry:
    """class for holding the entries"""

    service_name: str
    username: str
    password: str
    has_password: bool

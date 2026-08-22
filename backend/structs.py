# this file listst all the dataclasses.
from dataclasses import dataclass


@dataclass
class Entry:
    """class for holding the entries"""

    id: int
    service_name: str
    username: str
    password: str
    is_fav: bool

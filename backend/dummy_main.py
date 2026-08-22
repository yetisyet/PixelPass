"""In-memory PixelPass backend used to test the Electron transport.

The process speaks newline-delimited JSON (NDJSON): it reads one request per
line from stdin and writes one response per line to stdout. Protocol output is
kept separate from diagnostic output, which is written to stderr.
"""

import json
import sys
from typing import Any


ENTRIES: dict[int, dict[str, Any]] = {
    1: {
        "id": 1,
        "serviceName": "GitHub",
        "username": "user@example.com",
        "password": "dummy-github-password",
        "isFav": True,
    },
    2: {
        "id": 2,
        "serviceName": "Discord",
        "username": "another-user",
        "password": "dummy-discord-password",
        "isFav": False,
    },
}

next_entry_id = 3


class RequestError(Exception):
    """An error caused by an invalid or unsuccessful client request."""


def public_entry(entry: dict[str, Any]) -> dict[str, Any]:
    """Return entry metadata without exposing its password."""

    return {
        "id": entry["id"],
        "serviceName": entry["serviceName"],
        "username": entry["username"],
        "isFav": entry["isFav"],
    }


def require_data(request: dict[str, Any]) -> dict[str, Any]:
    data = request.get("data")
    if not isinstance(data, dict):
        raise RequestError("Request must include a data object")
    return data


def require_entry(data: dict[str, Any]) -> dict[str, Any]:
    entry_id = data.get("id")
    if isinstance(entry_id, bool) or not isinstance(entry_id, int):
        raise RequestError("data.id must be an integer")

    entry = ENTRIES.get(entry_id)
    if entry is None:
        raise RequestError(f"Password entry {entry_id} was not found")
    return entry


def require_text(data: dict[str, Any], field: str) -> str:
    value = data.get(field)
    if not isinstance(value, str) or not value.strip():
        raise RequestError(f"data.{field} must be a non-empty string")
    return value


def require_bool(data: dict[str, Any], field: str) -> bool:
    value = data.get(field)
    if not isinstance(value, bool):
        raise RequestError(f"data.{field} must be a boolean")
    return value


def handle_request(request: dict[str, Any]) -> dict[str, Any]:
    """Handle one of the five password-entry actions."""

    global next_entry_id

    action = request.get("action")
    base_response = {
        "elecID": request.get("elecID"),
        "action": action,
    }

    try:
        if action == 1:
            return {
                **base_response,
                "success": True,
                "data": {
                    "entries": [public_entry(entry) for entry in ENTRIES.values()]
                },
            }

        data = require_data(request)

        if action == 2:
            entry = require_entry(data)
            return {
                **base_response,
                "success": True,
                "data": {"password": entry["password"]},
            }

        if action == 3:
            entry = {
                "id": next_entry_id,
                "serviceName": require_text(data, "serviceName"),
                "username": require_text(data, "username"),
                "password": require_text(data, "password"),
                "isFav": require_bool(data, "isFav"),
            }
            ENTRIES[next_entry_id] = entry
            next_entry_id += 1
            return {
                **base_response,
                "success": True,
                "data": {"id": entry["id"]},
            }

        if action == 4:
            entry = require_entry(data)
            del ENTRIES[entry["id"]]
            return {**base_response, "success": True}

        if action == 5:
            entry = require_entry(data)
            entry.update(
                {
                    "serviceName": require_text(data, "serviceName"),
                    "username": require_text(data, "username"),
                    "password": require_text(data, "password"),
                    "isFav": require_bool(data, "isFav"),
                }
            )
            return {**base_response, "success": True}

        raise RequestError(f"Unknown action: {action}")
    except RequestError as error:
        return {
            **base_response,
            "success": False,
            "error": str(error),
        }


def send_response(response: dict[str, Any]) -> None:
    print(json.dumps(response, separators=(",", ":")), flush=True)


def main_server() -> None:
    print("Dummy backend ready", file=sys.stderr, flush=True)

    for raw_line in sys.stdin:
        line = raw_line.strip()
        if not line:
            continue

        request: Any = None
        try:
            request = json.loads(line)
            if not isinstance(request, dict):
                raise RequestError("Request must be a JSON object")
            response = handle_request(request)
        except (json.JSONDecodeError, RequestError) as error:
            response = {
                "elecID": None,
                "action": None,
                "success": False,
                "error": str(error),
            }
        except Exception as error:  # Keep unexpected failures inside the protocol.
            print(f"Unexpected dummy backend error: {error}", file=sys.stderr)
            response = {
                "elecID": request.get("elecID") if isinstance(request, dict) else None,
                "action": request.get("action") if isinstance(request, dict) else None,
                "success": False,
                "error": "Unexpected backend error",
            }

        print(
            f"Handled action {response.get('action')} "
            f"for {response.get('elecID')}: success={response.get('success')}",
            file=sys.stderr,
            flush=True,
        )
        send_response(response)


if __name__ == "__main__":
    main_server()

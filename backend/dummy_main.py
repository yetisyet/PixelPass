"""In-memory PixelPass backend used to test the Electron transport.

The process speaks newline-delimited JSON (NDJSON): it reads one request per
line from stdin and writes one response per line to stdout. Protocol output is
kept separate from diagnostic output, which is written to stderr.
"""

import json
import os
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

try:
    PREDETERMINED_MODE = int(os.environ.get("PIXELPASS_DUMMY_MODE", "-1"))
except ValueError:
    PREDETERMINED_MODE = -1

if PREDETERMINED_MODE != -1 and PREDETERMINED_MODE not in range(1, 6):
    PREDETERMINED_MODE = -1

DUMMY_CONFIG: dict[str, Any] = {
    "mode": PREDETERMINED_MODE,
    "vaultPassword": (
        os.environ.get("PIXELPASS_DUMMY_PASSWORD", "Password1!")
        if PREDETERMINED_MODE != -1
        else None
    ),
    "majority": None,
    "sourceType": None,
    "total": None,
}

next_entry_id = 3
vault_unlocked = False


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


def require_setup_integer(request: dict[str, Any], field: str) -> int:
    value = request.get(field)
    if isinstance(value, bool) or not isinstance(value, int) or value < 1:
        raise RequestError(f"{field} must be a positive integer")
    return value


def require_setup_mode(request: dict[str, Any]) -> int:
    mode = request.get("Mode")
    if isinstance(mode, bool) or not isinstance(mode, int) or mode not in range(1, 6):
        raise RequestError("Mode must be an integer from 1 to 5")
    return mode


def validate_setup_images(request: dict[str, Any]) -> None:
    images = request.get("Data")
    if not isinstance(images, list) or not images:
        raise RequestError("Data must be a non-empty array")

    for index, image in enumerate(images):
        if not isinstance(image, dict):
            raise RequestError(f"Data[{index}] must be an object")
        if not isinstance(image.get("name"), str) or not image["name"]:
            raise RequestError(f"Data[{index}].name must be a non-empty string")
        if not isinstance(image.get("dataBase64"), str) or not image["dataBase64"]:
            raise RequestError(
                f"Data[{index}].dataBase64 must be a non-empty string"
            )


def validate_setup_payload(mode: int, request: dict[str, Any]) -> str:
    if mode == 1:
        validate_setup_images(request)
        return "uploadedImages"
    elif mode == 2:
        directory_path = request.get("Path")
        if not isinstance(directory_path, str) or not directory_path:
            raise RequestError("Path must be a non-empty string")
        return "directory"
    elif mode == 3:
        image_paths = request.get("Paths")
        if (
            not isinstance(image_paths, list)
            or not image_paths
            or any(not isinstance(path, str) or not path for path in image_paths)
        ):
            raise RequestError("Paths must be a non-empty array of strings")
        return "imagePaths"
    elif mode == 4:
        return "selfPopulate"
    elif mode == 5:
        validate_setup_images(request)
        return "recoveryImages"

    raise RequestError("Mode must be an integer from 1 to 5")


def handle_request(request: dict[str, Any]) -> dict[str, Any]:
    """Handle startup, vault state, and the five password-entry actions."""

    global next_entry_id, vault_unlocked

    action = request.get("action")
    base_response = {"elecID": request.get("elecID")}
    if "action" in request:
        base_response["action"] = action

    try:
        if action == "startup":
            return {
                **base_response,
                "success": True,
                "data": {
                    "mode": DUMMY_CONFIG["mode"],
                    "configured": DUMMY_CONFIG["mode"] != -1,
                    "unlocked": vault_unlocked,
                },
            }

        if "Mode" in request:
            if DUMMY_CONFIG["mode"] != -1:
                raise RequestError("PixelPass has already been initialized")

            elec_id = request.get("elecID")
            if not isinstance(elec_id, str) or not elec_id:
                raise RequestError("elecID must be a non-empty string")

            mode = require_setup_mode(request)
            majority = require_setup_integer(request, "Majority")
            total = require_setup_integer(request, "Total")
            if total > 24:
                raise RequestError("Total cannot exceed 24")
            if majority > total:
                raise RequestError("Majority cannot be greater than Total")
            password = request.get("Password")
            if not isinstance(password, str) or not password.strip():
                raise RequestError("Password must be a non-empty string")
            source_type = validate_setup_payload(mode, request)

            DUMMY_CONFIG.update(
                {
                    "majority": majority,
                    "mode": mode,
                    "total": total,
                    "vaultPassword": password,
                    "sourceType": source_type,
                }
            )
            vault_unlocked = True
            print(
                "Received initialization: "
                f"elecID={elec_id}, Mode={mode}, Majority={majority}, "
                f"Total={total}, Password=[received], source={source_type}",
                file=sys.stderr,
                flush=True,
            )
            return {
                **base_response,
                "success": True,
                "Mode": mode,
                "sourceType": source_type,
            }

        if action == "unlock":
            if DUMMY_CONFIG["mode"] == -1:
                raise RequestError("PixelPass has not been initialized")

            data = require_data(request)
            password = require_text(data, "vaultPassword")
            if password != DUMMY_CONFIG["vaultPassword"]:
                raise RequestError("Incorrect vault password")

            vault_unlocked = True
            print(
                f"Received unlock for mode {DUMMY_CONFIG['mode']}: "
                "password=[received]",
                file=sys.stderr,
                flush=True,
            )
            return {
                **base_response,
                "success": True,
                "data": {"mode": DUMMY_CONFIG["mode"]},
            }

        if action == "lock":
            vault_unlocked = False
            return {**base_response, "success": True}

        if action in {1, 2, 3, 4, 5} and not vault_unlocked:
            raise RequestError("Vault is locked")

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
    send_response({"mode": DUMMY_CONFIG["mode"]})

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

        request_kind = response.get("action")
        if isinstance(request, dict) and "Mode" in request:
            request_kind = f"setup mode {request.get('Mode')}"
        print(
            f"Handled {request_kind} for {response.get('elecID')}: "
            f"success={response.get('success')}",
            file=sys.stderr,
            flush=True,
        )
        send_response(response)


if __name__ == "__main__":
    main_server()

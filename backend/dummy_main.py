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
    PREDETERMINED_MODE = int(os.environ.get("PIXELPASS_DUMMY_MODE", "0"))
except ValueError:
    PREDETERMINED_MODE = 0

if PREDETERMINED_MODE not in range(0, 6):
    PREDETERMINED_MODE = 1

DUMMY_CONFIG: dict[str, Any] = {
    "mode": PREDETERMINED_MODE,
    "vaultPassword": (
        os.environ.get("PIXELPASS_DUMMY_PASSWORD", "Password1!")
        if PREDETERMINED_MODE != 0
        else None
    ),
    "sourceType": None,
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


def require_mode(data: dict[str, Any]) -> int:
    mode = data.get("mode")
    if isinstance(mode, bool) or not isinstance(mode, int) or mode not in range(1, 6):
        raise RequestError("data.mode must be an integer from 1 to 5")
    return mode


def validate_image_source(source: dict[str, Any], source_type: str) -> None:
    if source.get("type") != source_type:
        raise RequestError(f"data.source.type must be {source_type}")

    images = source.get("images")
    if not isinstance(images, list) or not images:
        raise RequestError("data.source.images must be a non-empty array")

    for index, image in enumerate(images):
        if not isinstance(image, dict):
            raise RequestError(f"data.source.images[{index}] must be an object")
        if not isinstance(image.get("name"), str) or not image["name"]:
            raise RequestError(
                f"data.source.images[{index}].name must be a non-empty string"
            )
        if not isinstance(image.get("dataBase64"), str) or not image["dataBase64"]:
            raise RequestError(
                f"data.source.images[{index}].dataBase64 must be a non-empty string"
            )


def validate_source(mode: int, raw_source: Any) -> dict[str, Any]:
    if mode == 4 and raw_source is None:
        return {"type": "selfPopulate"}

    if not isinstance(raw_source, dict):
        raise RequestError("data.source must be an object")

    if mode == 1:
        validate_image_source(raw_source, "uploadedImages")
    elif mode == 2:
        if raw_source.get("type") != "directory":
            raise RequestError("data.source.type must be directory")
        directory_path = raw_source.get("directoryPath")
        if not isinstance(directory_path, str) or not directory_path:
            raise RequestError(
                "data.source.directoryPath must be a non-empty string"
            )
    elif mode == 3:
        if raw_source.get("type") != "imagePaths":
            raise RequestError("data.source.type must be imagePaths")
        image_paths = raw_source.get("imagePaths")
        if (
            not isinstance(image_paths, list)
            or not image_paths
            or any(not isinstance(path, str) or not path for path in image_paths)
        ):
            raise RequestError(
                "data.source.imagePaths must be a non-empty array of strings"
            )
    elif mode == 4:
        if raw_source.get("type") != "selfPopulate":
            raise RequestError("data.source.type must be selfPopulate")
    elif mode == 5:
        validate_image_source(raw_source, "recoveryImages")

    return raw_source


def handle_request(request: dict[str, Any]) -> dict[str, Any]:
    """Handle startup, vault state, and the five password-entry actions."""

    global next_entry_id, vault_unlocked

    action = request.get("action")
    base_response = {
        "elecID": request.get("elecID"),
        "action": action,
    }

    try:
        if action == "startup":
            return {
                **base_response,
                "success": True,
                "data": {
                    "mode": DUMMY_CONFIG["mode"],
                    "configured": DUMMY_CONFIG["mode"] != 0,
                    "unlocked": vault_unlocked,
                },
            }

        if action == "initialize":
            if DUMMY_CONFIG["mode"] != 0:
                raise RequestError("PixelPass has already been initialized")

            data = require_data(request)
            mode = require_mode(data)
            password = require_text(data, "vaultPassword")
            source = validate_source(mode, data.get("source"))

            DUMMY_CONFIG.update(
                {
                    "mode": mode,
                    "vaultPassword": password,
                    "sourceType": source["type"],
                }
            )
            vault_unlocked = True
            print(
                "Received initialization: "
                f"mode={mode}, source={source['type']}, password=[received]",
                file=sys.stderr,
                flush=True,
            )
            return {
                **base_response,
                "success": True,
                "data": {
                    "mode": mode,
                    "sourceType": source["type"],
                },
            }

        if action == "unlock":
            if DUMMY_CONFIG["mode"] == 0:
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

        print(
            f"Handled action {response.get('action')} "
            f"for {response.get('elecID')}: success={response.get('success')}",
            file=sys.stderr,
            flush=True,
        )
        send_response(response)


if __name__ == "__main__":
    main_server()

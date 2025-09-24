from atproto import Client
import os
from typing import List, Dict, Any, Optional

try:
    from dotenv import load_dotenv
except ModuleNotFoundError as exc:
    raise ModuleNotFoundError(
        "Missing dependency 'python-dotenv'. Install with: pip install python-dotenv\n"
        "or: pip install -r requirements.txt (run this in the backend folder/venv you're using)"
    ) from exc


load_dotenv()


def get_client() -> Client:
    handle = os.getenv("BSY_HANDLE")
    password = os.getenv("BSY_PASSWORD")
    if not handle or not password:
        raise RuntimeError(
            "Please set BSY_HANDLE and BSY_PASSWORD environment variables (copy .env.example to .env and fill values)"
        )

    client = Client()
    client.login(handle, password)
    return client


def main() -> None:
    client = get_client()
    post = client.post("Second test post from atproto-python")
    print(post.uri)
    print(post.cid)


if __name__ == "__main__":
    main()
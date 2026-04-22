import asyncio
import getpass
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

import bcrypt
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


async def main() -> None:
    mongo_url = os.environ["MONGO_URL"]
    db_name = os.environ["DB_NAME"]

    email = input("Admin email: ").strip().lower()
    name = input("Admin name: ").strip()
    password = getpass.getpass("Admin password: ").strip()

    if not email or not name or not password:
        raise SystemExit("Email, name, and password are required.")

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    try:
        existing = await db.admins.find_one({"email": email})
        if existing:
            raise SystemExit("An admin with that email already exists.")

        await db.admins.insert_one(
            {
                "id": str(uuid.uuid4()),
                "email": email,
                "password": hash_password(password),
                "name": name,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        print("Admin created successfully.")
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())

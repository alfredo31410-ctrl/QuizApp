import asyncio
import getpass
import os
from pathlib import Path

import bcrypt
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


async def main() -> None:
    email = input("Admin email: ").strip().lower()
    password = getpass.getpass("New password: ").strip()

    if not email or not password:
        raise SystemExit("Email and password are required.")

    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]

    try:
        result = await db.admins.update_one(
            {"email": email},
            {"$set": {"password": hash_password(password)}},
        )

        if result.matched_count == 0:
            raise SystemExit("Admin not found.")

        print("Password updated successfully.")
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())

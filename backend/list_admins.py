import asyncio
import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")


async def main() -> None:
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]

    try:
        admins = await db.admins.find({}, {"_id": 0, "email": 1, "name": 1, "created_at": 1}).to_list(100)
        if not admins:
            print("No admins found.")
            return

        for admin in admins:
            print(f"email={admin.get('email')} | name={admin.get('name')} | created_at={admin.get('created_at')}")
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())

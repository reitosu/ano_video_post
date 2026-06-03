import cloudinary.api
import environ
from pathlib import Path

env = environ.Env()
env.read_env(Path(__file__).resolve().parent / '.env.test')

cloudinary.config(
    cloud_name=env('CLOUDINARY_NAME'),
    api_key=env('CLOUDINARY_API_KEY'),
    api_secret=env('CLOUDINARY_API_SECRET'),
)
res = cloudinary.api.resources(resource_type="video", max_results=500, type="upload")
for i in res["resources"]:
    print(i)

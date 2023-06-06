import cloudinary.api

cloudinary.config(
    cloud_name='dhlsaygev', 
    api_key='932842344172783',
    api_secret='-bdYmhdNdYjVoJXBxi_yDnM2qFM',
)
res = cloudinary.api.resources(resource_type="video",max_results=500,type="upload")
for i in res["resources"]:
    print(i)
    
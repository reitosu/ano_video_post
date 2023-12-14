import requests
import base64


class Cloudinary():
    @staticmethod
    def get_cloudinary_data(video_object):
        video = video_object["fields"]["video"]
        if not video.endswith(".mp4"):
            video += ".mp4"
        if len(video.split("/")) == 1:
            url = 'https://res.cloudinary.com/dhlsaygev/video/upload/' + video
        else:
            url = 'https://res.cloudinary.com/dhlsaygev/' + video
        print(url)
        r = requests.get(url)
        print(base64.b64encode(r.content).decode())
        video_object["fields"]["video"] = base64.b64encode(r.content).decode()
        return video_object

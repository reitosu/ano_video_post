from django.conf import settings
from django.shortcuts import render, redirect
from django.views.generic import TemplateView, CreateView, ListView
from django.http import JsonResponse
from django.urls import reverse
from django.db.models import Count
from django.core.paginator import Paginator
from django.core.serializers import serialize
from .storage import UpdateFileSystemStorage
from .models import Video, Tag, whenClick, TagMap, Account
from .forms import VideoForm
from .nft import Nft
from .aescrypt import aes_gcm_decrypt, aes_gcm_encrypt
from .rsacrypto import generate_key, encrypt, decrypt
from .utils import Cloudinary
from django.utils import timezone
import os
import base64
import moviepy.editor
import uuid
import shutil
import json
from itertools import chain
from cloudinary.uploader import upload
from cloudinary.api import resource
from cloudinary import CloudinaryResource
import requests

# Create your views here.


def get_cloudinary_source(video_name):
    if len(split := video_name.split("/")) != 1:
        print(split)
        video_name = split[2]
    source = resource(video_name, resource_type="video")
    print(source)
    cr = CloudinaryResource(
        source["public_id"], type=source["type"], resource_type=source["resource_type"])
    return cr


def assign_unique_id(request):
    if request.method == "GET":
        public_key, private_key = generate_key()
        public_key = public_key.decode()
        with open("./videopost/temp/private.pem", "wb") as f:
            f.write(private_key)
        return JsonResponse({"public_key": public_key})
    elif request.method == "POST":
        user_id = request.POST.get("userId")
        with open("./videopost/temp/private.pem", "rb") as f:
            private_key = f.read()
            Account.objects.create(
                accountid=user_id, privatekey=private_key.decode())
        return JsonResponse({"response": "success"})


def get_account_list_from_wallet_address_of_user_id(user_id):
    account = Account.objects.get(accountid=user_id)
    return Account.objects.filter(walletaddress=account.walletaddress)


class IndexView(ListView):
    model = Video
    template_name = 'index.html'

    def get_context_data(self, **kwargs):
        print(self.request.session.get("user_id"))
        context = super().get_context_data(**kwargs)
        context["title"] = "インデックス"
        context["video_list"] = serialize("json", self.model.objects.all().exclude(
            ispublic=False).order_by('-uploaded'))

        return context

    def get_queryset(self):
        return self.model.objects.all().exclude(ispublic=False).order_by('-uploaded')


def pagenate_video_query(request):
    objects = Video.objects.all().exclude(ispublic=False).order_by('-uploaded')
    paginator = Paginator(objects, 5)

    page_number = request.GET.get('page')
    if int(page_number) in paginator.page_range:
        page_obj = paginator.get_page(page_number)
        return JsonResponse({'results': serialize('json', page_obj.object_list)})
    else:
        return JsonResponse({'results': False})


class SerchView(TemplateView):
    template_name = 'serch.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["title"] = "サーチ"
        return context


class EditView(CreateView):
    model = Video
    form_class = VideoForm
    template_name = 'edit.html'

    def get_context_data(self, **kwargs):
        context = super(EditView, self).get_context_data(**kwargs)
        context["title"] = "エディット"
        return context

    def get_success_url(self):
        return reverse('videopost:check')


class CheckView(TemplateView):
    template_name = 'check.html'

    def get_context_data(self, **kwargs):
        context = super(CheckView, self).get_context_data(**kwargs)
        context['title'] = "チェック"
        return context


def save_draft(request):
    if request.method == "POST":
        print(request.POST.get("draft"))
        request.session["draft"] = request.POST.get("draft")
    return JsonResponse({"draft": "success"})


def get_tags(request):
    tags = list(Tag.objects.values_list("name", flat=True))
    print(tags)
    video = Video()
    print(TagMap.objects.filter(tagid__exact="test1(t100,c1500)").count())
    return JsonResponse({"tags": tags})


def trim_video(request):
    if request.method == "POST":
        video_path = request.POST.get("videoPath")
        start_time = request.POST.get("startTime")
        end_time = request.POST.get("endTime")
        path = os.path.join(settings.STATIC_ROOT, video_path[8:].split("?")[0])
        print(start_time)
        print(end_time)
        clip = moviepy.editor.VideoFileClip(path)
        trimed = clip.subclip(float(start_time), float(end_time))
        trimed_path = os.path.join(os.path.dirname(path), "trimed.mp4")
        trimed.write_videofile(trimed_path)
        trimed_path = trimed_path.split("videopost")[1]
        return JsonResponse({"path": trimed_path})


def posting_video(request):
    if request.method == "POST":
        video_path = request.POST.get("path")
        is_delete_one_day = request.POST.get("isDeleteOneDay")
        is_delete_one_day = False if is_delete_one_day == "false" else True
        print(request.POST)
        tags = request.POST.get("tags")
        user_id = request.session.get("user_id")
        print(user_id)
        account = Account.objects.get(accountid=user_id)
        video_path = os.path.join(
            settings.STATIC_ROOT, video_path.split("static/")[1])
        print(video_path)
        upload_response = upload(file=video_path, resource_type="video")
        video_id = upload_response["public_id"]
        created = Video.objects.create(
            video=video_id, onedaydelete=is_delete_one_day)
        if account.walletaddress:
            account_list = Account.objects.filter(
                walletaddress=account.walletaddress)
            created.uploader.add(*account_list)
        else:
            created.uploader.add(account)
        if tags:
            tag_objects_list = Tag.objects.append_tag(tags.split(","))
            created.tags.add(*tag_objects_list)
        return JsonResponse({"response": "success"})


class AccountView(ListView):
    template_name = 'account.html'
    context_object_name = "video_list"
    model = Video

    def get_context_data(self, **kwargs):
        context = super(AccountView, self).get_context_data(**kwargs)
        context['title'] = "アカウント"
        user_id = self.request.session.get("user_id")
        nft_list = self.model.objects.filter(
            uploader__accountid=user_id).exclude(tokenid=None)
        # nft = Nft()
        # print(nft_list.values_list("tokenid")[0][0])
        # metadata_list = [nft.get_nft_metadata(token_id[0]) for token_id in video_list.values_list("tokenid")]
        # print(metadata_list)
        print(nft_list)
        print(self.request.session["user_id"])
        context['nft_list'] = serialize("json", nft_list)
        account = Account.objects.get(accountid=user_id)
        context['address'] = account.walletaddress if account.walletaddress else ""
        context['name'] = account.name if account.name else ""

        user_id = self.request.session.get("user_id")
        account = Account.objects.get(accountid=user_id)
        # context['test'] = json.dumps(list(map(Cloudinary.get_cloudinary_data, json.loads(serialize("json", self.model.objects.filter(
        #     uploader=account).order_by('-uploaded'))))))
        context['test'] = serialize("json", self.model.objects.filter(
            uploader=account).order_by('-uploaded'))

        return context

    def get_queryset(self, **kwargs):
        user_id = self.request.session.get("user_id")
        account = Account.objects.get(accountid=user_id)
        return serialize("json", self.model.objects.filter(uploader=account).order_by('-uploaded'))


def saveNameOrAddress(request):
    name = request.POST.get('name')
    address = request.POST.get('address')
    user_id = request.session.get("user_id")
    print(address, name)
    account = Account.objects.get(accountid=user_id)
    before_address_list = Account.objects.filter(
        walletaddress=account.walletaddress)
    # before_address_list = get_account_list_from_wallet_address_of_user_id(user_id)
    if address:
        before_address_list.update(walletaddress=address)
        after_account_list = Account.objects.filter(walletaddress=address)
        # print(set([video_object for acc in after_account_list if (
        #     video_object := Video.objects.filter(uploader=acc))]))
        user_video_queryset = Video.objects.filter(uploader=account)
        user_video_queryset = Video.objects.filter(
            uploader=after_account_list[0])
        all_video_list = [video_object for acc in after_account_list if (
            video_object := Video.objects.filter(uploader=acc))]
        print(240, user_video_queryset)
        print(241, all_video_list)
        print(242, [user_video_queryset |
              video_object for video_object in all_video_list])
        print(243, all_video_list)
        [obj.uploader.add(*after_account_list) for obj in user_video_queryset]

    if name:
        before_address_list.update(name=name)
    return JsonResponse({"response": "success"})


def delete_video(request):
    video_name = request.POST.get('videoName')
    print(video_name)
    cloudinary_resource = get_cloudinary_source(video_name)
    obj = Video.objects.get(video=cloudinary_resource).delete()
    return JsonResponse({"response": str(obj)})


def mint_video(request):
    video_name = request.POST.get('videoName')
    name = request.POST.get('name')
    description = request.POST.get('description')
    wallet_address = request.POST.get('walletAddress')
    print(video_name)
    nft = Nft()
    token_id, address = nft.mint_nft(
        video_name, name, description, wallet_address)
    cloudinary_resource = get_cloudinary_source(video_name)
    video_object = Video.objects.get(video=cloudinary_resource)
    video_object.title = name
    video_object.description = description
    video_object.tokenid = token_id
    video_object.address = address
    video_object.save()
    return JsonResponse({"response": {"token_id": token_id, "address": address}})


def change_video_ispublic(video_name):
    cloudinary_resource = get_cloudinary_source(video_name)
    video_object = Video.objects.get(video=cloudinary_resource)
    print(video_object.ispublic)
    video_object.ispublic = not video_object.ispublic
    video_object.save()


def change_public_or_private(request):
    if request.method == "POST":
        video_name = request.POST.get("videoName")
        change_video_ispublic(video_name)
        return JsonResponse({"response": "to public"})
    elif request.method == "GET":
        video_name = request.GET.get("videoName")
        change_video_ispublic(video_name)
        return JsonResponse({"response": "to private"})


def sell_and_cancel_nft(request):
    video = request.POST.get("video")
    price = request.POST.get("price")
    cloudinary_resource = get_cloudinary_source(video)
    video_object = Video.objects.get(video=cloudinary_resource)
    if price:
        video_object.price = price
    else:
        video_object.price = 0
    video_object.save()
    print(video_object.price)
    return JsonResponse({"res": video_object.price})


def video_post(request):
    if request.method == 'POST':
        video_file = request.FILES.get('videoData')  # 動画ファイルを取得
        id = request.session.get("user_id")
        print(request.POST)
        print(request.FILES)
        print(video_file)
        print(type(settings.STATIC_ROOT))
        if video_file:
            path = os.path.join(settings.STATIC_ROOT, 'materials', id)
            fs = UpdateFileSystemStorage(location=path)
            re = fs.save(video_file.name, video_file)
            print(re)
            path = fs.path(video_file.name)
            clip = moviepy.editor.VideoFileClip(path)
            clip.write_videofile(os.path.join(
                os.path.dirname(path), video_file.name+".mp4"))
            path = path+'.mp4'
            if 'starttime' in list(request.POST):
                start_time = request.POST.get('starttime')
                end_time = request.POST.get('endtime')
                video = moviepy.editor.VideoFileClip(path)
                clipped_video = video.subclip(start_time, end_time)
                clipped_video.write_videofile(path)
            path = "\\"+os.path.join(*path.split('\\')[3:])
        return JsonResponse({'path': path})


"""def image_post(request):
    if request.method == 'POST':
        image_data = request.POST.get('photo')
        format, imgstr = image_data.split(';base64,')
        ext = format.split('/')[-1]
        image_data = base64.b64decode(imgstr)
        file = ContentFile(image_data)
        name = request.POST.get('name')+'.'+ext
        id = request.session.get('user_id')
        path = os.path.join(settings.STATIC_ROOT, 'materials', id)
        fs = FileSystemStorage(location=path)
        fs.save(name, file)
        path = fs.path(name)
        path = "\\"+os.path.join(*path.split('\\')[3:])

        return JsonResponse({'path': path})


def delete_materials(request):
    id = request.session.get('user_id')
    path = os.path.join(settings.STATIC_ROOT, 'materials', id)
    if os.path.exists(path):
        shutil.rmtree(path)
    print("deleted")
    return redirect('/videopost/edit')


def save_backup(request):
    print("r")
    if request.method == "POST":
        print(request.POST)
        print(request.POST.get("backup_materials"))
        print(request.POST.get("backup_previews"))
        request.session["backup_materials"] = request.POST.get(
            "backup_materials")
        request.session["backup_previews"] = request.POST.get(
            "backup_previews")
        request.session["backup_width"] = request.POST.get("backup_width")
        return JsonResponse({"backup": "success"})"""


def test_ipfs(request):
    n = Nft()
    cid = n.mint_nft()
    return JsonResponse({"response": cid})


def test(request):
    url = request.GET.get("url")
    print(request.GET)
    print(url)
    r = requests.get(url)
    print(str(r.content)[2:])
    return JsonResponse({"response": str(r.content)[2:]})

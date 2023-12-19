from .models import Account, DeviceMap, BrowserMap
import uuid
from ua_parser.user_agent_parser import Parse
from pprint import pprint


class CheckUserIdMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if 'user_id' not in request.session:
            user_id = self.create_user_id()
            request.session["user_id"] = user_id
            account = Account.objects.create(accountid=user_id)
        # else:
        #     user_id = request.session["user_id"]
        #     account = Account.objects.get(accountid=user_id)
        """user_agent = request.META.get("HTTP_USER_AGENT")
        if user_agent:
            user_agent = Parse(user_agent)
            os = user_agent["os"]["family"]
            browser = user_agent["user_agent"]["family"]
            print(os)
            print(type(os))
            print(browser)
            print(type(browser))
            DeviceMap.objects.get_or_create(accountid=account, device=os)
            BrowserMap.objects.get_or_create(accountid=account, browser=browser)"""
        response = self.get_response(request)
        return response

    def create_user_id(self):
        user_id = uuid.uuid4()
        return str(user_id)

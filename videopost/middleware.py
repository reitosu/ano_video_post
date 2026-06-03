from .models import Account
import uuid


class CheckUserIdMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if 'user_id' not in request.session:
            user_id = self.create_user_id()
            request.session["user_id"] = user_id
            Account.objects.create(accountid=user_id)
        response = self.get_response(request)
        return response

    def create_user_id(self):
        user_id = uuid.uuid4()
        return str(user_id)

from django.core.files.storage import FileSystemStorage
from os import path,remove

class UpdateFileSystemStorage(FileSystemStorage):
    def get_available_name(self, name, max_length):
        if path.exists(self.path(name)):
            remove(self.path(name))
        return name
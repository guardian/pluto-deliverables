from django.core.management.base import BaseCommand
import base64
import re
from django.contrib.auth.models import User


class Command(BaseCommand):
    """
    management command that will create a user with the given name in the django system and give it a randomised password
    """
    help = "Create a user with the given name for the purposes of sending log updates"

    def add_arguments(self, parser):
        parser.add_argument("name", type=str, help="user name to create")
        parser.add_argument("-r","--rotate", nargs='?', type=bool, default=False,
                            help="specify `-r true` to rotate (i.e. change to a new one) the password of the existing user")

    def genpwd(self):
        with open("/dev/urandom","rb") as f:
            raw_bytes = f.read(12)
            pre_string = base64.b64encode(raw_bytes).decode("UTF-8")
            return re.sub(r'[^\w\d]', "", pre_string)

    def handle(self, *args, **options):
        if "name" not in options:
            print("You must specify the username to create with --name")

        try:
            u = User.objects.get(username=options["name"])
            if options["rotate"]:
                #rotate the password
                pw = self.genpwd()
                u.set_password(pw)
                u.save()
                print("Updated password for {0} to {1}. This password won't be shown again, so make sure you make a note of it!".format(options["name"], pw))
            else:
                print("User {0} already exists".format(options["name"]))
        except User.DoesNotExist:
            newuser = User(username=options["name"])
            pw = self.genpwd()
            newuser.set_password(pw)
            newuser.save()
            print("Create user {0} with password {1}. This password won't be shown again, so make sure you make a note of it!".format(options["name"], pw))
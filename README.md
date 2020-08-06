# pluto-deliverables

An interface that allows for storage and retrieval of finished media
products, masters, audio stems, post scripts etc.

## Local dev setup

pluto-deliverables is a django project, so the usual method of setting up
a django project applies; but there are a couple of specific twists.

### Frontend
The frontend is a standard React/webpack build. The final bundle is directly
output into the django static assets folder at gnm_deliverables/static/app.js.
```bash
$ cd frontend
$ yarn install
$ yarn dev
```

This will put webpack into watching mode, rebuilding a dev (debugging) build
of the app bundle every time the frontend source changes.

### Backend
Once you have the project checked out, you'll need to set up your Python
environment.  The app is developed in Python 3.8 but any recent python
should do.
1. Set up a virtualenv, normally this is put into a venv/ directory in the
project root.  Gitignore is already set up on this folder. Point to the base
python interpreter you want to use.
    ```bash
    $ virtualenv --python=python3.8 venv/
    ```
2. Activate your virtualenv:
    ```bash
    $ source venv/bin/activate
    (venv) $
    ```
3. Install requirements:
    ```bash
    (venv) $ pip -r requirements.txt
    ```
4. **IMPORTANT** pluto-deliverables depends on a library called gnmvidispine
that is linked in as a submodule.  You need to check this out and
install it into your virtualenv too:
    ```bash
    (venv) $ git submodule init
    (venv) $ git submodule update
    (venv) $ cd gnmvidispine
    (venv) $ pip -r requirements.txt
    (venv) $ python ./setup.py install
    (venv) $ cd ..
    ```

5. You need to have a database running in order to use the app:
    ```bash
    $ cd scripts/
    $ ./setup_docker_postgres.sh 
   ```
   This will set up a postgres instance running on port 5432 with appropriate default-configured database, username and password.
   It will fail if you already have something on port 5432; in this case, you can adjust the port in the script and
   set an environment variable to tell the app where to find it. See the `DATABASES` section of `settings.py` for the
   names of the variables to set
   
6. Now you need to make sure that the database is in-sync:
    ```bash
    (venv) $ ./manage.py migrate
    ```

7. Now you are ready to run the dev server:
    ```bash
   (venv) $ ./manage.py runserver 0.0.0.0:9000 
   ```
   If you see an error about a library not found, check that gnmvidispine is 
   correctly installed in your virtualenv as per stage 4.

### Local admin user

When you try to access anything as above, you'll find you get permission denied.
Proper (bearer-token) auth is not configured yet, so the easiest way is to create
a local superuser in the database (e.g. admin/admin):
```bash
(venv) $ ./manage.py createsuperuser
```
In order to log in, with the dev server running, go to `http://localhost:9000/admin` and
enter the credentials.  This gets you to a django admin screen, but also gives
you a session which your browser should then be able to use to access all the endpoints.
Just take your browser back to `http://localhost:9000/` and it should work.

You can use basic-auth for REST only access, e.g.
```bash
$ curl http://localhost:9000/api/bundle/new -X POST -d '{"name":"fred","project_id":12345}' -u admin:admin
```

### Hey, the tests are broken!
You need to set the environment variable CI (to anything, but conventionally 1) in order for the tests to work.
This is because normally the app attempts to connect to rabbitmq at startup and fails if it isn't there.  With CI
set in the environment, this stage is skipped.
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

### Using bearer auth token locally
1. Set up the [prexit-local](https://gitlab.com/codmill/customer-projects/guardian/prexit-local) development environment
2. Get the key that was generated when Keycloak was set up and save the blob with a PEM header/footer on it like this:
    ```
    -----BEGIN CERTIFICATE-----
    {paste-blob-here}
    -----END CERTIFICATE-----
    ```
   Add this file to the app root i.e.`/gnm_deliverables/{certificate_name}.pem`.
   
   Make sure the `JWT_VALIDATION_KEY` variable has the correct path to the PEM file.
3. Make sure that Docker is pointing to minikube before you build the container 
    ```bash
    $ eval $(minikube docker-env)  
    ```
    Build the docker container: 
    ```bash
    $ docker build . -t guardianmultimedia/pluto-deliverables:DEV
    ```
4. Go to ``https://prexit.local/deliverables/`` 

## Other setup

In order to ingest and proxy media, gnm-deliverables relies on Vidispine.
The following environment variables configure the Vidispine settings, with defaults supplied in `settings.py`:
 - VIDISPINE_URL - location that the _backend_ expects to find Vidispine. In a containerised Kubernetes environment this
 is often different to where a frontend component would expect to find it
 - VIDISPINE_USER - user account for backend access. Admin rights are required; `run_as` is used internally to apply a
 user's permissions to a VS request when performing a request that will be relayed abck to a client
 - VIDISPINE_PASSWORD - password for the user account
 - CALLBACK_ROOT - this is the base url where Vidispine should find the backend, in order to send notifications.  In a
 containerised Kubernetes environment this is normally the name of the service that is fronting the backend (e.g. if the
 backend is deployed behind a service called "pluto-deliverables" on port 9000, then this would be
  `http://pluto-deliverables:9000`)
  
There is another Vidispine-relevant setting in the settings file, which is not configurable in the environment:
 - TRANSCODE_PRESETS - this is a mapping table from media MIME type (expressed as a regex) to required transcode preset.
 
The following environment variables configure the RabbitMQ settings.  The software _works_ without rabbitmq, but you get
a lot of errors cluttering up the logs:
 - RABBITMQ_HOST - hostname that the backend can find rabbitmq at
 - RABBITMQ_PORT - port that rabbitmq is serving amqp on. Defaults to 5672, shouldn't need to change it
 - RABBITMQ_VHOST - rabbitmq virtual host to communicate with
 - RABBITMQ_EXCHANGE - exchange name that we should publish messages to
 - RABBITMQ_USER - user name to access the server with. Must be able to declare exchanges and write data
 - RABBITMQ_PASSWD - password associated with RABBITMQ_USER

## CDS integration

We use a system called the Content Delivery System ([CDS](https://github.com/guardian/content-delivery-system)) for
performing syndication tasks to 3rd party clients.

In order that the user can receive feedback, and endpoint is provided that can receive log updates 
(api/bundle/<int:project_id>/asset/<int:asset_id>/<platform>/logupdate) and a CDS method is implemented that sends updates
to this endpoint (notify_pluto_deliverables.rb).  In order to keep communication secure, Basic Auth is implemented (it's
assumed that pluto-deliverables is running behind HTTPS); so the `notify_pluto_deliverables` setup requires a username 
and password.

These can be provided by connecting to any pluto-deliverables instance (e.g. `kubectl -n namespace get pods | grep deliverables`
 to get the pod names then `kubectl exec -n namespace -it {pod-name} -- /bin/sh` to connect) and running from within the
 pod:
 ```
$ ./manage.py create_logs_user {username}
we started up!
Create user cds with password {some-password}. This password won't be shown again, so make sure you make a note of it!
$
```
where `{username}` is the name of the user you want to create.  Conventionally `cds` is used.
If this user exists already, the password is reset; if it does not exist then it is created.
You can't specify the password yourself, a randomised password is generated and shown on the console. Take this and put
it into your CDS configuration so that the routes can communicate with pluto-deliverables.
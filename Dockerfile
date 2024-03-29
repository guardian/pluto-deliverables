FROM python:3.8-alpine3.16

COPY requirements.txt /opt/pluto-deliverables/requirements.txt
ADD gnmvidispine /tmp/gnmvidispine
WORKDIR /opt/pluto-deliverables
     #workaround for build issues on Mac
RUN apk add --no-cache alpine-sdk linux-headers openssl-dev libffi-dev mailcap postgresql-dev postgresql-libs && \
    pip install -r /tmp/gnmvidispine/requirements.txt && \
    cd /tmp/gnmvidispine && python /tmp/gnmvidispine/setup.py install && cd /opt/pluto-deliverables && \
    pip install -r requirements.txt uwsgi && \
    rm -rf /root/.cache && \
    rm -rf /tmp/gnmvidispine && \
    apk --no-cache del alpine-sdk linux-headers openssl-dev libffi-dev postgresql-dev
COPY manage.py /opt/pluto-deliverables/manage.py
ADD --chown=nobody:root gnm_deliverables /opt/pluto-deliverables/gnm_deliverables/
ADD --chown=nobody:root rabbitmq /opt/pluto-deliverables/rabbitmq/
ENV PYTHONPATH=/opt/pluto-deliverables
RUN mkdir static && python manage.py collectstatic --noinput
USER nobody
CMD uwsgi --http :9000 --enable-threads --static-map /static=/opt/pluto-deliverables/static --static-expires-type application/javascript=3600 -L --module gnm_deliverables.wsgi
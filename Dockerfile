FROM python:3.8-alpine

COPY requirements.txt /opt/pluto-deliverables/requirements.txt
ADD gnmvidispine /tmp/gnmvidispine
WORKDIR /opt/pluto-deliverables
RUN apk add --no-cache alpine-sdk linux-headers openssl-dev libffi-dev mailcap postgresql-dev postgresql-libs && \
    pip install -r /tmp/gnmvidispine/requirements.txt && \
    cd /tmp/gnmvidispine && python /tmp/gnmvidispine/setup.py install && cd /opt/pluto-deliverables && \
    pip install -r requirements.txt uwsgi && \
    rm -rf /tmp/gnmvidispine && \
    apk --no-cache del alpine-sdk linux-headers openssl-dev libffi-dev postgresql-dev
COPY manage.py /opt/pluto-deliverables/manage.py
ADD --chown=nobody:root gnm_deliverables /opt/pluto-deliverables/gnm_deliverables/
ADD --chown=nobody:root rabbitmq /opt/pluto-deliverables/rabbitmq/
##annoying, but until my Mac gets upgraded to support later Docker I can't use chown-in-copy :(
#RUN chown -R nobody /opt/pluto-deliverables
ENV PYTHONPATH=/opt/pluto-deliverables
RUN mkdir static && python manage.py collectstatic --noinput
USER nobody
CMD uwsgi --http :9000 --enable-threads --static-map /static=/opt/pluto-deliverables/static --static-expires-type application/javascript=3600 -L --module gnm_deliverables.wsgi
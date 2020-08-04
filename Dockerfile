FROM python:3.8-alpine

COPY requirements.txt /opt/pluto-deliverables/requirements.txt
WORKDIR /opt/pluto-deliverables
ADD gnm_deliverables /opt/pluto-deliverables/gnm_deliverables
ADD gnmvidispine /tmp/gnmvidispine
RUN apk add --no-cache alpine-sdk linux-headers openssl-dev && \
    pip install -r /tmp/gnmvidispine/requirements.txt && \
    cd /tmp/gnmvidispine && python /tmp/gnmvidispine/setup.py install && cd /opt/pluto-deliverables && \
    pip install -r requirements.txt uwsgi && \
    rm -rf /tmp/gnmvidispine && \
    apk --no-cache del alpine-sdk linux-headers openssl-dev
COPY manage.py /opt/pluto-deliverables/manage.py
#annoying, but until my Mac gets upgraded to support later Docker I can't use chown-in-copy :(
RUN chown -R nobody /opt/pluto-deliverables
ENV PYTHONPATH=/opt/pluto-deliverables
WORKDIR /opt/pluto-deliverables
USER nobody
CMD uwsgi --http :9000 --enable-threads -L --module gnm_deliverables.wsgi
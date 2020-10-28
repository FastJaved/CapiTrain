FROM tiangolo/uwsgi-nginx-flask:python3.8

COPY ./app /app

RUN apt-get update && \
    apt-get -y install \
    gcc tcpdump libpcap-dev && \
    apt-get clean

RUN pip install -r requirements.txt
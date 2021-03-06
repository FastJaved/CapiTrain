from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from firebase import firebase
from scapy.all import *
import requests
import json
app = Flask(__name__) 
CORS(app)

@app.route("/") 
def home_view(): 
    return render_template('index.html')

@app.route("/get_traceroute_ips", methods=["GET"])
def get_traceroute_ips():
    target = ["www.google.fr"]
    ip_list = []
    result, unans = traceroute(target, l4=UDP(sport=RandShort())/DNS(qd=DNSQR(qname="www.google.com")))
    for snd, rcv in result :
        ip_list.append(rcv.src)
    return jsonify({'ip_list': ip_list}), 200

@app.route("/get_traceroute/<ip>", methods=["GET"])
def get_traceroute(ip):
    target = [ip]
    ip_list = []
    location_list = []
    result, unans = traceroute(target, l4=UDP(sport=RandShort())/DNS(qd=DNSQR(qname="www.google.com")))
    for snd, rcv in result :
        ip_list.append(rcv.src)
    url = "https://ipinfo.io/?token=1ec60bcab59f26"
    call_for_ip = requests.get(url)
    server_ip = call_for_ip.json()['ip']
    ip_list.insert(0, server_ip)
    ip_list.append(ip)
    for ips in ip_list :
        url = "https://ipinfo.io/" + ips + "?token=1ec60bcab59f26"
        #url = "http://ipwhois.app/json/" + ip
        call = requests.get(url)
        if 'bogon' not in call.json() :
            location_list.append({"ip" : ips, "provider": call.json().get('org', ''), "location" : {"longitude" : call.json()['loc'].split(',')[1], "latitude" : call.json()['loc'].split(',')[0], "city" : call.json()['city']}})

    db = firebase.FirebaseApplication('https://capitrain.firebaseio.com/', None)
    result = db.post('/traceroute/', location_list)

    return jsonify({'location_list': location_list}), 200

@app.route("/get_filters", methods=["GET"])
def get_filters():
    db = firebase.FirebaseApplication('https://capitrain.firebaseio.com/', None)
    result = db.get('/traceroute', None)

    from_cities = set()
    to_cities = set()
    from_providers = set()
    to_providers = set()

    for traceroute in result:
        from_city = result[traceroute][0]['location']['city']
        to_city = result[traceroute][-1]['location']['city']

        from_provider = result[traceroute][0].get('provider', "")
        to_provider = result[traceroute][-1].get('provider', "")

        from_cities.add(from_city.encode().decode('unicode_escape'))
        to_cities.add(to_city.encode().decode('unicode_escape'))

        if from_provider:
            from_providers.add(from_provider.encode().decode('unicode_escape'))
        if to_provider:
            to_providers.add(to_provider.encode().decode('unicode_escape'))

    filters_object = {}
    filters_object['from_cities'] = list(from_cities)
    filters_object['to_cities'] = list(to_cities)
    filters_object['from_providers'] = list(from_providers)
    filters_object['to_providers'] = list(to_providers)

    return jsonify({'filters': filters_object}), 200

@app.route("/get_traceroutes", methods=["GET"])
def get_traceroutes():
    db = firebase.FirebaseApplication('https://capitrain.firebaseio.com/', None)
    result = db.get('/traceroute', None)

    from flask import request

    from_city_filter = request.args.get("from_city", "")
    to_city_filter = request.args.get("to_city", "")
    from_provider_filter = request.args.get("from_provider", "")
    to_provider_filter = request.args.get("to_provider", "")

    traceroutes = list()

    for traceroute in result:
        from_city = result[traceroute][0]['location']['city']
        to_city = result[traceroute][-1]['location']['city']

        from_provider = result[traceroute][0].get('provider', "")
        to_provider = result[traceroute][-1].get('provider', "")

        if from_city_filter and from_city != from_city_filter:
            continue
        if to_city_filter and to_city != to_city_filter:
            continue
        if from_provider_filter and from_provider != from_provider_filter:
            continue
        if to_provider_filter and to_provider != to_provider_filter:
            continue
        
        traceroutes.append(result[traceroute])

    return jsonify({'traceroutes': traceroutes}), 200

if __name__ == "__main__":
    # Only for debugging while developing
    app.run(host='0.0.0.0', port=80)
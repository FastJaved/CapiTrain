from flask import Flask, jsonify, request, render_template
from firebase import firebase
from scapy.all import *
import requests
app = Flask(__name__) 

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
            location_list.append({"ip" : ips, "location" : {"longitude" : call.json()['loc'].split(',')[1], "latitude" : call.json()['loc'].split(',')[0], "city" : call.json()['city']}})

    from firebase import firebase
    firebase = firebase.FirebaseApplication('https://capitrain.firebaseio.com/', None)
    result = firebase.post('/traceroute/', location_list)

    return jsonify({'location_list': location_list}), 200

if __name__ == "__main__":
    # Only for debugging while developing
    app.run(host='0.0.0.0', port=80)
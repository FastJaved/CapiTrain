var map;
var greenIcon;
var redIcon;
var mainLayer = new L.LayerGroup();

function init() {
    map = L.map('map', {
        center: [52.0, -11.0],
        zoom: 5,
        layers: [
            L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            })
        ]
    });

    mainLayer.addTo(map);

    greenIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    redIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
}

function drawPolyline(points) {
    mainLayer.clearLayers();

    var coordinates = [];

    var ipByPosition = new Map();
    var positionByKey = new Map();

    points.forEach(function (point) {
        position = getPosition(point);
        if (!ipByPosition.has(position)) {
            ipByPosition.set(position, []);
        }

        positionByKey.set(position, point);
        ipByPosition.get(position).push(point.ip);
        coordinates.push([point.latitude, point.longitude]);
    });

    for(let position of ipByPosition.keys()) {
        var point = positionByKey.get(position);
        var marker = new L.marker([point.latitude, point.longitude]);

        var ipsText = "";
        ipByPosition.get(position).forEach(function (ip) {
            ipsText += ip + "<br>";
        });
        marker.bindTooltip(ipsText, { permanent: true, className: "my-label", offset: [0, 0] });
        mainLayer.addLayer(marker);
    }

    var arrow = L.polyline(coordinates, {});
    mainLayer.addLayer(arrow);
    var arrowHead = L.polylineDecorator(arrow, {
        patterns: [
            { offset: 25, repeat: 50, symbol: L.Symbol.arrowHead({ pixelSize: 15, pathOptions: { fillOpacity: 1, weight: 0 } }) }
        ]
    });
    mainLayer.addLayer(arrowHead);

    mainLayer.addLayer(L.marker(coordinates.shift(), { icon: greenIcon }));
    mainLayer.addLayer(L.marker(coordinates.pop(), { icon: redIcon }));

    map.fitBounds(arrow.getBounds());
}

function getPosition(point) {
    return new pairKey(point.latitude, point.longitude).key;
}

function drawTrajectory() {
    fetch('https://api.ipify.org/?format=json')
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            fetch('http://golmole.ddns.net:8000/get_traceroute/' + data.ip)
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    dataOk = data.location_list;
                    console.log(dataOk)
                    var tempArray = [];
                    dataOk.forEach(function (arrayItem) {
                        tempArray.push({
                            ip: arrayItem.ip,
                            latitude: arrayItem.location.latitude,
                            longitude: arrayItem.location.longitude
                        });
                    });
                    drawPolyline(tempArray);
                });
        });



    var points = [
        {
            latitude: 48,
            longitude: 2,
            ip: "142.234.21.21"
        },
        {
            latitude: 47.7,
            longitude: 2.1,
            ip: "191.1.0.3"
        },
        {
            latitude: 47.65,
            longitude: 2.4,
            ip: "192.168.1.0000000"
        },
        {
            latitude: 47.65,
            longitude: 2.4,
            ip: "81.12.321.9271"
        },
        {
            latitude: 47.4,
            longitude: 2.5,
            ip: "127.0.0.1"
        }
    ];

    //drawPolyline(points);

}

function traceroute() {


    drawTrajectory()

    console.log(getIpAdress())
}

class Point {
    constructor(longitude, latitude, ip) {
        this.longitude = longitude;
        this.latitude = latitude;
        this.ip = ip;
    }
}


function getIpAdress() {
    fetch('https://api.ipify.org/?format=json')
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            console.log(data.ip);
        });
}

class pairKey {
    constructor(x_pos, y_pos) {
      this._X = x_pos;
      this._Y = y_pos;
    }
  
    get latitude() {
      return this._X;
    }
    set latitude(x_pos) {
      this._X = x_pos;
    }
  
    get longitude() {
      return this._Y;
    }
    set longitude(y_pos) {
      this._Y = y_pos;
    }
  
    get key() {
      return Symbol.for(`pairKey[${this.latitude}:${this.longitude}]`);
    }
  }
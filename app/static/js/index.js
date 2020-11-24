var map;
var greenIcon;
var redIcon;
var mainLayer = new L.LayerGroup();
var alreadyPresentMarkers = new Set();

function init() {
    fillFilters()

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

function drawPolyline(points, showIps = true) {
    var coordinates = [];

    var ipByPosition = new Map();
    var positionByKey = new Map();

    points.forEach(function (point) {
        position = getPosition(point);

        console.log(alreadyPresentMarkers.has(position))
        if (!alreadyPresentMarkers.has(position)) {
            alreadyPresentMarkers.add(position)
            if (!ipByPosition.has(position)) {
                ipByPosition.set(position, []);
            }

            positionByKey.set(position, point);
            ipByPosition.get(position).push(point.ip);
        }

        coordinates.push([point.location.latitude, point.location.longitude]);
    });

    for (let position of ipByPosition.keys()) {
        var point = positionByKey.get(position);
        var marker = new L.marker([point.location.latitude, point.location.longitude]);

        if (showIps) {
            var ipsText = "";
            ipByPosition.get(position).forEach(function (ip) {
                ipsText += ip + "<br>";
            });
            marker.bindTooltip(ipsText, { permanent: true, className: "my-label", offset: [0, 0] });
        }

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

function fillFilters() {
    fetch('http://golmole.ddns.net:8000/get_filters')
        .then(function (response) {
            return response.json()
        })
        .then(function (data) {
            var from_cities = data.filters.from_cities
            var to_cities = data.filters.to_cities
            var from_providers = data.filters.from_providers
            var to_providers = data.filters.to_providers

            //cities
            if (from_cities !== undefined) {
                var select_from = document.getElementById('from-city'),
                    option,
                    i = 0,
                    il = from_cities.length;

                for (; i < il; i += 1) {
                    option = document.createElement('option');
                    option.setAttribute('value', from_cities[i]);
                    option.appendChild(document.createTextNode(from_cities[i]));
                    select_from.appendChild(option);
                }
            }

            if (to_cities !== undefined) {
                var select_to = document.getElementById('to-city'),
                    option,
                    i = 0,
                    il = to_cities.length

                for (; i < il; i += 1) {
                    option = document.createElement('option');
                    option.setAttribute('value', to_cities[i]);
                    option.appendChild(document.createTextNode(to_cities[i]));
                    select_to.appendChild(option);
                }
            }


            //providers
            if (from_providers !== undefined) {
                var select_from = document.getElementById('from-provider'),
                    option,
                    i = 0,
                    il = from_providers.length;

                for (; i < il; i += 1) {
                    option = document.createElement('option');
                    option.setAttribute('value', from_providers[i]);
                    option.appendChild(document.createTextNode(from_providers[i]));
                    select_from.appendChild(option);
                }
            }

            if (to_providers !== undefined) {
                var select_to = document.getElementById('to-provider')
                i = 0
                il = to_providers.length

                for (; i < il; i += 1) {
                    option = document.createElement('option');
                    option.setAttribute('value', to_providers[i]);
                    option.appendChild(document.createTextNode(to_providers[i]));
                    select_to.appendChild(option);
                }
            }
        })
}

function showTraceroutes() {
    resetMap()

    var select_from_city = document.getElementById('from-city')
    var select_to_city = document.getElementById('to-city')
    var select_from_provider = document.getElementById('from-provider')
    var select_to_provider = document.getElementById('to-provider')

    var from_city = select_from_city.value
    var to_city = select_to_city.value
    var from_provider = select_from_provider.value
    var to_provider = select_to_provider.value

    var parameters = "?"

    if (from_city) {
        parameters += "from_city=" + from_city
    }
    if (from_provider) {
        parameters += "&from_provider=" + from_provider
    }
    if (to_city) {
        parameters += "&to_city=" + to_city
    }
    if (to_provider) {
        parameters += "&to_provider=" + to_provider
    }

    fetch('http://golmole.ddns.net:8000/get_traceroutes' + parameters)
        .then(function (response) {
            return response.json()
        })
        .then(function (data) {
            var traceroutes = data.traceroutes
            traceroutes.forEach(function (traceroute) {
                drawPolyline(traceroute, false)
            })

            if (traceroutes.length == 0) {
                window.alert("No traceroute found!");
            }
        })
}

function resetMap() {
    mainLayer.clearLayers();
    alreadyPresentMarkers = new Set()
}

function getPosition(point) {
    return new pairKey(point.location.latitude, point.location.longitude).key;
}

function drawSingleTraceroute() {
    resetMap()

    fetch('https://api.ipify.org/?format=json')
        .then(function (response) {
            var ipValue = document.getElementById('ipTxt').value
            if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipValue)) {
                var data = {};
                var data = { ip: ipValue };
                return data;
            }
            else {
                return response.json();
            }

        })
        .then(function (data) {
            console.log("Traceroute to " + data.ip);
            fetch('http://golmole.ddns.net:8000/get_traceroute/' + data.ip)
                .then(function (response) {
                    return response.json();
                })
                .then(function (data) {
                    dataOk = data.location_list;
                    console.log(dataOk)
                    var tempArray = [];
                    dataOk.forEach(function (arrayItem) {
                        console.log(arrayItem)
                        tempArray.push({
                            ip: arrayItem.ip,
                            latitude: arrayItem.location.latitude,
                            longitude: arrayItem.location.longitude
                        });

                    });
                    drawPolyline(dataOk);
                });
        });



    var points = [
        {
            location: {
                latitude: 48,
                longitude: 2
            },
            ip: "142.234.21.21"
        },
        {
            location: {
                latitude: 47.7,
                longitude: 2.1
            },
            ip: "191.1.0.3"
        },
        {
            location: {
                latitude: 47.65,
                longitude: 2.4
            },
            ip: "192.168.1.0000000"
        },
        {
            location: {
                latitude: 47.65,
                longitude: 2.4
            },
            ip: "81.12.321.9271"
        },
        {
            location: {
                latitude: 47.4,
                longitude: 2.5
            },
            ip: "129.0.0.1"
        }
    ];

    //drawPolyline(points);

}

function traceroute() {

    drawSingleTraceroute()
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
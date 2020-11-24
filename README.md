# Traceroute - Python Edition (Server approach)

This project is a web server made in Python with Flask that allows you to traceroute from the server to the client. It also displays the path on a map. <br>
>Server : http://golmole.ddns.net:8000/ <br>
>API : http://golmole.ddns.net:8000/get_traceroute/{IP_ADDRESS}
## Installation

Use Docker to deploy the image on your server.

```
docker pull fastjaved/traceroutedbnew
docker run -d --name traceroutecontainer -p 8000:80 traceroutedbnew:latest
```

## Continuous deployment (CD)

You only need to commit to this repo to deploy on the server. <br>
Every push will trigger a new image build on dockerhub and will automatically reload the container on the server thanks to WatchTower.
> 1) Push to github : this will build the image (see image below)

![Docker](https://user-images.githubusercontent.com/26760102/98347591-e13add00-2017-11eb-9f41-ff4434b97ed8.png)


> 2) New image on dockerhub will restart containers with the right image

![Container](https://user-images.githubusercontent.com/26760102/98348326-e187a800-2018-11eb-800a-1a81894e4f88.png)

## Interface usage
### Traceroute from server
You can execute a traceroute from the server (located in Nantes) to a specific IP adress (it uses your own IP adress if the text area is left blank).

![Traceroute](https://user-images.githubusercontent.com/26633173/100119264-f5376900-2e76-11eb-919d-905ebc07e938.png)

### Show all traceroutes with filters
You can display existing traceroutes in the database by choosing filters (cities, and/or providers).

![Filter traceroute](https://user-images.githubusercontent.com/26633173/100119310-01bbc180-2e77-11eb-827d-788b69da206f.png)


## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)

# Osu Peak
> Generates an image of your osu peak rank and accuracy

_NOTE: This will only track from the first time you see your image, historical implementation may be coming later. If you wish to update your peak rank, message Jam#0001 and provide proof of that rank._ 

![](https://osu.jamieyoung.tech/u/2836231)
![](https://osu.jamieyoung.tech/u/7671790?mode=mania&theme=light)
![](https://osu.jamieyoung.tech/u/7528639?mode=taiko)
![](https://osu.jamieyoung.tech/u/6472042?mode=ctb&theme=light)

##  Usage
Insert your osu user id into this link <https://osu.jamieyoung.tech/u/[userid]> and add it to your user page.

Optional parameters are
|Param|required|Description      |Options           |
|-----|--------|-----------------|------------------|
|theme|❌|changes the theme|light / other|
|mode |❌|changes the mode |refer to the mode chart below|


###  Mode chart
|Mode|Options|
|---|---|
|standard|0, standard, std, osu|
|taiko|1, taiko|
|ctb|2, ctb, catch|
|mania|3, mania|

## Example Osu Userpage
Dark theme standard:
```bbcode
[img]https://osu.jamieyoung.tech/u/2836231[/img]
```

Light theme taiko:
```bbcode
[img]https://osu.jamieyoung.tech/u/2836231?mode=taiko&theme=light[/img]
```


## Setup
If you wish to set this up yourself, make sure you have [node](https://nodejs.org/en/), [npm](https://www.npmjs.com/) and [sqlite3](https://sqlite.org/download.html) installed, then clone the repository.

Install all the required packages by running
```sh
npm i
```
and to setup the configuration/databases by using
```sh
npm run prestart
```

then fill in the required fields in the configs and run
```sh
npm start
```
which will check the config and database again and then start the server at http://localhost:7527/

## Contributing

1. Fork it (<https://github.com/jamiegyoung/osu-peak/fork>)
2. Create your feature branch (`git checkout -b feature/coolFeature`)
3. Commit your changes (`git commit -am 'Add some coolFeature'`)
4. Push to the branch (`git push origin feature/coolFeature`)
5. Create a new Pull Request

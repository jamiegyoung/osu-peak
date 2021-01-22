# Osu Peak
> Generates an image of your osu peak rank and accuracy

You can put this on your userpage or have it as a signature.

![](https://i.imgur.com/NpDbTWD.png)

![](https://i.imgur.com/iOKP2nz.png)

![](https://i.imgur.com/XeOmXVS.png)

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

Then to install all the required packages run
```sh
npm i
```
 and to start the local development server on port 3000, run
```sh
npm start
```




## Contributing

1. Fork it (<https://github.com/jamiegyoung/osu-peak/fork>)
2. Create your feature branch (`git checkout -b feature/coolFeature`)
3. Commit your changes (`git commit -am 'Add some coolFeature'`)
4. Push to the branch (`git push origin feature/coolFeature`)
5. Create a new Pull Request
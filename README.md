# Osu Peak
> Generates an image of your osu peak rank and accuracy

_NOTE: This will check [osu!track](https://www.ameobea.me/osutrack/) for your previous peak rank / accuracy._ 

![](https://osu.jamieyoung.tech/u/2836231)
![](https://osu.jamieyoung.tech/u/7671790?mode=mania&theme=light)
![](https://osu.jamieyoung.tech/u/7528639?mode=taiko)
![](https://osu.jamieyoung.tech/u/6472042?mode=ctb&theme=light)

##  Usage
Insert your osu user id into this link <https://osu.jamieyoung.tech/u/[userid]> and add it to your user page.

Optional parameters are
| Param | Description       | Options                       |
| ----- | ----------------- | ----------------------------- |
| theme | changes the theme | light / other                 |
| mode  | changes the mode  | refer to the mode chart below |


###  Mode chart
| Mode     | Options               |
| -------- | --------------------- |
| standard | 0, standard, std, osu |
| taiko    | 1, taiko              |
| ctb      | 2, ctb, catch         |
| mania    | 3, mania              |

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
If you need a database/config refer to the [database / config setup](#database-and-config-setup)


## Dev setup
Run the following commands to setup the repo for development
```sh
npm install
```

If you need a database/config refer to the [database / config setup](#database-and-config-setup)

To start the development server run
```sh
npm run build; npm run start-dev
```

## Database and config setup
If you have not installed the npm packages, do so now
```sh
npm install
```

To generate the database in the normal directory run
```sh
npm run make-db
```

To generate the config run
```sh
npm run make-config
```
and make sure to populate it

## Contributing

1. Fork it (<https://github.com/jamiegyoung/osu-peak/fork>)
2. Create your feature branch (`git checkout -b feature/coolFeature`)
3. Commit your changes (`git commit -am 'Add some coolFeature'`)
4. Push to the branch (`git push origin feature/coolFeature`)
5. Create a new Pull Request

const fetch = require('node-fetch')
const fs = require('node:fs');
require('dotenv').config();

//is running as dev branch
const dev = (process.env.ISDEV == 'true')
const webhooks = [process.env.PROD, //prod
                  process.env.DEV] //dev
const messageIDs = ["1268699252142506056", //prod
                    "1268699067526025340"] //dev

const filename = dev ? "calendar-dev.json" : "calendar.json"


const news = "JERRY <:stjerry:1268243619928870982> i wiecej eventow"









const updateInterval = 30_000

const lastRestart = new Date();

const fetchur = ["20x Yellow Stained Glass", "1x Compass", " 20x Mithril", "1x Firework Rocket", 
    "1x Cheap Coffee, Decent Coffee or Black Coffee", "1x Iron Door or Wood Door", "3x Rabbit's Foot", 
    "1x Superboom TNT", "1x Pumpkin", "1x Flint and Steel", "50x Emerald", "50x Red Wool"]

const seasons = ["Early Spring", "Spring", "Late Spring",
                "Early Summer", "Summer", "Late Summer",
                "Early Autumn", "Autumn", "Late Autumn",
                "Early Winter", "Winter", "Late Winter"
]

const ed = ["st", "nd", "rd", "th"]

//hardcoded discord role ids
const roles = {"Cocoa Beans": "1267926635420844093",
                "Carrot": "1267926050596458617",
                "Melon": "1267926926962593864",
                "Cactus": "1267926264191254528",
                "Wheat": "1267927086270779454",
                "Potato": "1267927169984626811",
                "Nether Wart": "1267927176381206558",
                "Mushroom": "1267927180181246025",
                "Sugar Cane": "1267927585820508190",
                "Pumpkin": "1267928112495333446",
}

const GAME_DAY = 20 * 60;
const GAME_MONTH = GAME_DAY * 31;
const GAME_YEAR = GAME_MONTH * 12;
const SERVER_START_UTC = 1560275700;
const SERVER_START_GAME_DATE = GAME_YEAR * 1 + GAME_MONTH * 1 + GAME_DAY * 1;

var date = ""
var data = {}

try{
    data = JSON.parse(fs.readFileSync(filename, 'utf8'));
} catch {console.log("failed to read data")}

var gametime


var contentForMentions = []

async function ftch(_url){
	try {
		const response = await fetch(_url, {
		  headers: {
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
		  },
		});
		if (!response.ok) {
			throw new Error(`Response status: ${response.status}`);
		}

		return await response.json();
		//console.log(json);
	} catch (error) {
		console.error(error.message);
	}
}

async function updateData(){
    // removing past mentions
    if(data?.["mentions"]){
        data["mentions"].forEach(message => {
            fetch((dev ? webhooks[1] : webhooks[0] ) + `/messages/${message}`, {
                method: "DELETE",
                headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
                },
            })
        });
    }
    data["mentions"] = []

    dev && console.log(data.fetchur)
    
    //let ms = (SERVER_START_UTC - SERVER_START_GAME_DATE + GAME_DAY * get("day") + GAME_MONTH * get("month") + GAME_YEAR * get("year")) * 1000;
    // (GAME_DAY * get("day") + GAME_DAY*31 * get("month") + GAME_DAY*31*12 * get("year")) = ms/1000 - (SERVER_START_UTC - SERVER_START_GAME_DATE)
    gametime = (Math.floor(Date.now()/1000) - (SERVER_START_UTC - SERVER_START_GAME_DATE))
    //gametime = GAME_YEAR*data?.farming?.year + GAME_DAY*23 //uncomment and set gametime for testing
    
    const day = Math.floor(gametime/(20*60) - Math.floor(gametime/(20*60*31))*31)
    const month = Math.floor(gametime/(20*60*31) - Math.floor(gametime/(20*60*31*12))*12)
    const year = Math.floor(gametime/(20*60*31*12))
    if(day != 0)
        //        determine season from array                  determine number suffix for day (st,nd,rd,th)
        date = `${seasons[month > 0 ? month-1 : 11]} ${day}${(day%10 < 3 && day%10!=0) ? ed[day%10-1] : ed[3]} ${year}`
    else
        date = `${seasons[month > 0 ? month > 1 ? month-2 : 11 : 10]} ${31}${ed[0]} ${year}`
    

    tillNextSBDay = (Math.floor(gametime/(20*60))+1)*20*60 - gametime
    dev && console.log(tillNextSBDay + "s till next sb day")

    //fetchur
    const fetchurPromise = new Promise((resolve, reject) => {
        if(Date.now() > new Date(data?.["fetchur"]?.["reset"]).valueOf()){
            if(data?.["fetchur"]?.["current"] == undefined || data.fetchur.current > 10) {data["fetchur"] = {}; data["fetchur"]["current"] = 0}
            data.fetchur.current += 1
            data.fetchur.reset = new Date()
            data.fetchur.reset.setUTCHours(7,0,0,0)
            data.fetchur.reset.setDate(data.fetchur.reset.getDate()+1).valueOf()
        }
        resolve();
    })

    //farming calendar api
    const farmingPromise = new Promise((resolve, reject) => {
        if(data["farming"]["year"] < year){
            dev && console.log("fetching...")
            ftch("https://api.elitebot.dev/contests/at/now").then(json => {
                //console.log(json["contests"])
                dev && console.log("fetched")
                data["farming"] = json
                resolve()
            }).catch((error) => reject(error))
        } else resolve()
    })

    //wait for all apis
    Promise.all([fetchurPromise, farmingPromise])
        .then(() => {
            sendWebhook()
        })
        .catch((error) => {
            console.error("Error:", error);
        });
}

function sendWebhook(){
    //console.log(data)
    if (data != null){
        var farming = ""
        var mention_it = 0
        var i = 0
        for (const [key, value] of Object.entries(data["farming"]["contests"])) {
            if(farming.length < 1000 && (parseInt(key) + 60*20) * 1000 > Date.now() && i < 6){
                var val_formatted = `${value[0]}, ${value[1]}, ${value[2]}`
                for (const [rkey, rval] of Object.entries(roles)) {
                    val_formatted = val_formatted.replace(rkey, `<@&${rval}>`);
                };
                if(parseInt(key) * 1000 > Date.now() && Date.now() > parseInt(key) * 1000 - 60000) mention_it = key
                if(parseInt(key) * 1000 > Date.now())
                    farming += `> \t\t<t:${key}:R>\t\t ${val_formatted}\n`
                else
                    farming += `> <:WHAT:1082407334510350368> LIVE, end <t:${parseInt(key) + 60*20}:R> ${val_formatted}\n`
                i++
            }
        }
    
        //console.log(farming);
        (async () => {
            let method = (dev ? messageIDs[1] : messageIDs[0]).length < 17 ? "POST" : "PATCH"
            const rawResponse = await fetch((dev ? webhooks[1] : webhooks[0]) + (method == "PATCH" ? `/messages/${dev ? messageIDs[1] : messageIDs[0]}` : ""), {
              method: method,
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(
                {
                    'content': "",
                    'username':'kalendarz adwentowy',
                    "embeds": [
                        {
                            "title": "kupic",
                            "color": 0x006688,
                            "description": "ice, packed ice, fish, pufferfish, salmon, dandelion, string"
                        },
                        {
                            "title": "zrobic ",
                            "color": 0x0088bb,
                            "description": "heavy pearl, experimentation, comission, fraction quest"
                        },
                        {
                            "color": 0x0099ff,
                            "description": `# ${date}\n## Next day <t:${Math.floor(Date.now()/1000) + tillNextSBDay}:R>\n`,
                            "fields": [
                                {
                                    name: "<:ta:1095767584189726870> FARMING CALENDAR",
                                    value: farming,
                                    inline: false,
                                },
                                {
                                    name: "<:PepoG:781852032213581866> EVENTS",
                                    value: `> <:stjerry:1268243619928870982> Jerry's Workshop\n> ${getEventTimer(GAME_MONTH*11 + GAME_DAY, GAME_YEAR)}\n` +
                                           `> :birthday: New Year Celebration\n> ${getEventTimer(GAME_MONTH*11 + GAME_DAY*29, GAME_MONTH*11 + GAME_DAY*31)}\n` +
                                           `> :skull: Spooky Festival\n> ${getEventTimer(GAME_MONTH*7 + GAME_DAY*29, GAME_MONTH*7 + GAME_DAY*31)}\n` +
                                           `> <:a_bunwink:1253677488891236443> Hoppity's Hunt\n> ${getEventTimer(GAME_MONTH*1 + GAME_DAY*1, GAME_MONTH*1 + GAME_DAY*1 + 3600*31)}\n` +
                                           `> <:homik:692062324965638235> Election\n> ${getEventTimer(GAME_MONTH*5 + GAME_DAY*27, GAME_YEAR + GAME_MONTH*2 + GAME_DAY*26)}\n`,
                                    inline: true,
                                },
                                {
                                    name: "<:fetchur:1267972967925809213> FETCHUR\n",
                                    value: `> ${fetchur[ data.fetchur.current ]}\n> next <t:${Math.floor(new Date(data.fetchur.reset).valueOf()/1000)}:R>`,
                                    inline: true,
                                },
                                {
                                    name: '\u200b',
                                    value: '\u200b',
                                    inline: false,
                                },
                                {
                                    name: "Updejty",
                                    value: `> ${news}\n> Last refresh <t:${Math.floor(Date.now()/1000)}:R>`,
                                    inline: true,
                                },
                                
                            ],
                            image: {
                                url: 'https://cdn.discordapp.com/attachments/993848864232714270/1268187135270457414/image.png',
                            },
                            timestamp: new Date().toISOString(),
                            "footer": {
                                text: lastRestart.toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' }),
                                icon_url: 'https://cdn.discordapp.com/attachments/1142397058720993320/1266414023172161576/IMG20240726181621.jpg',
                            },
                        },
                        
                    ],
                }
              )
            })
            const content = await rawResponse;
          
            dev && console.log(`${content.status} ${content.statusText}`);
        })();

        if(mention_it != 0 && (data?.["last-farming-mention"] == undefined || data["last-farming-mention"] < Date.now() - 60000*5)){
            mention(farming.split('\n')[0])
            data["last-farming-mention"] = Date.now()
        }
        
        if(contentForMentions.length > 0)
            mentionAll()

        if(dev){
            const end = process.hrtime(start);
            console.log(`Execution time: ${end[0]}s ${end[1] / 1000000}ms`);
        }
    }
}

function mention(_data){
    contentForMentions.push(_data)
}

function getEventTimer(timeOffsetStart, timeOffsetEnd){
    let timeOfYear = (gametime - GAME_MONTH - GAME_DAY) % GAME_YEAR
    if(timeOfYear < timeOffsetStart - GAME_DAY)
        return `<t:${Math.floor(Date.now()/1000) - timeOfYear + timeOffsetStart - GAME_DAY}:R>`
    else if(timeOfYear < timeOffsetEnd)
        return `<:WHAT:1082407334510350368> LIVE, end <t:${Math.floor(Date.now()/1000) - timeOfYear + timeOffsetEnd}:R>`
    else
        return `<t:${Math.floor(Date.now()/1000) - timeOfYear + timeOffsetStart - GAME_DAY + GAME_YEAR}:R>`
}

async function mentionAll(){
    //contentForMentions is array
    dev && console.log(contentForMentions)
    const promises = contentForMentions.map(async _m => {
        const response = await fetch((dev ? webhooks[1] : webhooks[0]) + "?wait=true", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'content': _m,
                'username': 'pingin deez nuts',
            })
        });

        const res = await response.json();
        data["mentions"].push(res.id);
    });

    await Promise.all(promises).then(() => {
        contentForMentions = []
    })
}

function saveData(){
    dev && console.log("saved")
    fs.writeFileSync(filename, JSON.stringify(data))
}

if (updateInterval <= 5000)
    throw new Error("updateInterval must be greater than 5000ms")

//main

//checks if fields exist, if not - create them
if(data?.["fetchur"]?.["current"] == undefined){
    data["fetchur"] = {};
    data["fetchur"]["current"] = 0
}

if(data?.["farming"]?.["year"] == undefined){
    dev && console.log("fetching...")
    ftch("https://api.elitebot.dev/contests/at/now").then(json => {
        //console.log(json["contests"])
        dev && console.log("fetched")
        data["farming"] = json
        sendWebhook()
    })
}

//to start at a fixed time
const now = new Date();
const millisecondsUntilNextFullMinute = ((Math.floor(updateInterval/1000) - (now.getSeconds() % Math.floor(updateInterval/1000))) * 1000) - now.getMilliseconds();
var start = 0;

setTimeout(() => {
    start = process.hrtime();
    updateData()

    setInterval(() => {
        start = process.hrtime();
        updateData()
    }, updateInterval);
}, millisecondsUntilNextFullMinute);


process.stdin.resume();//so the program will not close instantly

function exitHandler(options, exitCode) {
    if (options.cleanup) {console.log(`saving data at ${new Date}`); saveData()}
    if (exitCode || exitCode === 0) console.log(exitCode);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));
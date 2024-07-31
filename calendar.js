const fetch = require('node-fetch')
const fs = require('node:fs');
require('dotenv').config();

//is running as dev branch
const dev = (process.env.ISDEV == 'true')
const webhooks = [process.env.PROD, //prod
                  process.env.DEV] //dev
const messageIDs = ["1267915993510973563", //prod
                    "1267973335657222195"] //dev

const filename = dev ? "calendar-dev.json" : "calendar.json"

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

var date = ""
var data = {}
var initialData = null

var contentForMentions = []

const start = process.hrtime();

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

    try{
        data = JSON.parse(fs.readFileSync(filename, 'utf8'));
        initialData = JSON.parse(JSON.stringify(data));
    } catch {console.log("failed to read data")}

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
    
    const GAME_DAY = 20 * 60;
    const GAME_MONTH = GAME_DAY * 31;
    const GAME_YEAR = GAME_MONTH * 12;
    const SERVER_START_UTC = 1560275700;
    const SERVER_START_GAME_DATE = GAME_YEAR * 1 + GAME_MONTH * 1 + GAME_DAY * 1;
    //let ms = (SERVER_START_UTC - SERVER_START_GAME_DATE + GAME_DAY * get("day") + GAME_MONTH * get("month") + GAME_YEAR * get("year")) * 1000;
    // (GAME_DAY * get("day") + GAME_DAY*31 * get("month") + GAME_DAY*31*12 * get("year")) = ms/1000 - (SERVER_START_UTC - SERVER_START_GAME_DATE)
    let gametime = (Math.floor(Date.now()/1000) - (SERVER_START_UTC - SERVER_START_GAME_DATE))
    
    const day = Math.floor(gametime/(20*60) - Math.floor(gametime/(20*60*31))*31)
    const month = Math.floor(gametime/(20*60*31) - Math.floor(gametime/(20*60*31*12))*12)
    const year = Math.floor(gametime/(20*60*31*12))
    if(day != 0)
        date = `${seasons[month-1]} ${day}${(day%10 < 3 && day%10!=0) ? ed[day%10-1] : ed[3]} ${year}`
    else
        date = `${seasons[month-2]} ${31}${ed[0]} ${year}`
    

    tillNextSBDay = (Math.floor(gametime/(20*60))+1)*20*60 - gametime
    dev && console.log(tillNextSBDay + "s till next sb day")

    //fetchur
    if(Date.now() > new Date(data?.["fetchur"]?.["reset"]).valueOf() && Date.now() - new Date(data?.["fetchur"]?.["reset"]).valueOf() > 60000 || !data?.["fetchur"]?.["current"]){
        if(!data?.["fetchur"]?.["current"] || data.fetchur.current > 10) {data["fetchur"] = {}; data["fetchur"]["current"] = 0}
        data.fetchur.current += 1
        data.fetchur.reset = new Date()
        data.fetchur.reset.setUTCHours(7,0,0,0)
        data.fetchur.reset.setDate(data.fetchur.reset.getDate()+1).valueOf()
    }

    //farming calendar api
    if(!data?.["farming"]?.["year"] || data["farming"]["year"] < year){
        dev && console.log("fetching...")
        ftch("https://api.elitebot.dev/contests/at/now").then(json => {
            //console.log(json["contests"])
            dev && console.log("fetched")
            data["farming"] = json
            sendWebhook()
        })
    } else {
        sendWebhook()
    }
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
                    farming += `> <:WHAT:1082407334510350368> LIVE, koniec <t:${parseInt(key) + 60*20}:R> ${val_formatted}\n`
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
                    'content': `# ${date}\tNext day <t:${Math.floor(Date.now()/1000) + tillNextSBDay}:R>\n` + 
                                "## <:ta:1095767584189726870> FARMING CALENDAR\n" + farming +
                                "## <:fetchur:1267972967925809213> FETCHUR\n> " + fetchur[ data.fetchur.current ] + `\nnext <t:${Math.floor(new Date(data.fetchur.reset).valueOf()/1000)}:R>` +
                                "\n\n> *Updejty: pingi do farminga powinny dzialac*" +
                                `\n> Ostatni refresh <t:${Math.floor(Date.now()/1000)}:R>`,
                    'username':'kalendarz adwentowy',
                }
              )
            })
            const content = await rawResponse;
          
            dev && console.log(`${content.status} ${content.statusText}`);
        })();

        if( mention_it != 0 &&
            (!data?.["last-farming-mention"] || data["last-farming-mention"] < Date.now() - 60000*5)){
            mention(farming.split('\n')[0])
            data["last-farming-mention"] = Date.now()
        }
        
        if(contentForMentions.length == 0){
            if(JSON.stringify(initialData) != JSON.stringify(data))
                saveData()
        } else {
            mentionAll()
        }
        if(dev){
            const end = process.hrtime(start);
            console.log(`Execution time: ${end[0]}s ${end[1] / 1000000}ms`);
        }
    }
}

function mention(_data){
    contentForMentions.push(_data)
}

async function mentionAll(){
    //contentForMentions is array
    dev && console.log(contentForMentions)
    let completed = 0
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
    await Promise.all(promises).then(e => {
        saveData()
    })
}

function saveData(){
    dev && console.log("saved")
    fs.writeFileSync(filename, JSON.stringify(data))
}

updateData()

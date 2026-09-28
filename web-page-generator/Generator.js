const fs = require("node:fs");
const { commands, port } = require("../config.json");
const templates = "./web-page-generator/templates";
const MemorySystem = require("../memory/MemorySystem");

MemorySystem.ensureDirectoryExists("cache");

function generateMainPage() {
    var html = fs.readFileSync(`${templates}/main.html`).toString();
    var js = fs.readFileSync(`${templates}/main.js`).toString()
    .replaceAll("PORT_HERE", port);
    var buttons = "";
    var register = "";
    Object.keys(commands).forEach((cmd) => {
        register = `${register}\nregisterCommand("${cmd}",${commands[cmd].parameters == undefined})`;
        buttons = `${buttons}<button id="${cmd}">${commands[cmd].title}</button><br>`;
    });
    html = html.replace("BODY_INNER", buttons).replaceAll("PORT_HERE", port);
    MemorySystem.writeRaw("cache/main.js", js.replace("REGISTER_HERE", register));
    return html;
}
function generateCommandPage(command) {
    const data = commands[command];
    if (data.parameters == undefined)
        return null;
    var html = fs.readFileSync(`${templates}/command.html`).toString().replaceAll("COMMAND_TITLE_HERE", data.title);
    var js = fs.readFileSync(`${templates}/command.js`).toString().replaceAll("PORT_HERE", port).replaceAll("ID_HERE", command);
    var inputTable = "";
    var htmlInputs = "";
    Object.keys(data.parameters).forEach((param,idx) => {
        inputTable = `${inputTable}${idx>0?",":""}${param}:document.getElementById("input-${param}")`;
        htmlInputs = `${htmlInputs}\n<br><label for="input-${param}">${param}</label><input id="input-${param}" type="${data.parameters[param]}">`;
    });
    js = js.replace("INPUT_TABLE_HERE", inputTable);
    html = html.replace("INPUTS", htmlInputs).replaceAll("PORT_HERE", port).replace("CMD_ID", command);
    MemorySystem.writeRaw(`cache/command-${command}.js`, js);
    return html;
}
function generateRobloxEventsPage() {
    var html = fs.readFileSync(`${templates}/roblox-events.html`).toString();
    var js = fs.readFileSync(`${templates}/roblox-events.js`).toString();
    const events = MemorySystem.fileList("roblox");
    let eventsList = "";
    let elementsList = "";
    let timesList = "";
    let namesList = "";
    let statesList = "";
    events.forEach((path, index) => {
        let data = MemorySystem.readJson(path);
        let eventId = path.split("/")[path.split("/").length-1];
        eventsList = `${eventsList}<a id="${eventId}"><b>${data.universeName}: ${data.eventName}</b><br>- ???<br></a><br>`;
        if (index > 0) {
            elementsList = `${elementsList},`;
            timesList = `${timesList},`;
            namesList = `${namesList},`;
            statesList = `${statesList},`;
        }
        elementsList = `${elementsList}["${eventId}"]: document.getElementById("${eventId}")`;
        timesList = `${timesList}["${eventId}"]: ${Date.now() > data.startTime ? data.endTime : data.startTime}`;
        namesList = `${namesList}["${eventId}"]: "${data.universeName.replaceAll("\"", "\\\"")}: ${data.eventName.replaceAll("\"", "\\\"")}"`;
        statesList = `${statesList}["${eventId}"]: ${Date.now() > data.startTime}`;
    });
    let updateList = "";
    const games = MemorySystem.fileList("roblox-games");
    games.forEach((path, index) => {
        let data = MemorySystem.readJson(path);
        updateList = `${updateList}<a><b>${data.displayName}</b><br>- Last updated on ${new Date(data.updateTime).toDateString()} @ ${new Date(data.updateTime).toTimeString().split(" ")[0]}<br>- (${Math.floor((Date.now()-Date.parse(data.updateTime))/86400000)} days ago)</a><br><br>`
    })
    js = js.replace("ELEMENTS_LIST", elementsList).replace("TIMES_LIST", timesList).replace("NAMES_LIST", namesList).replace("STATES_LIST", statesList);
    html = html.replaceAll("PORT_HERE", port).replace("BODY_INNER", eventsList).replace("UPDATE_TRACKER", updateList);
    MemorySystem.writeRaw("cache/roblox-events.js", js);
    return html;
}

module.exports = {
    generateMainPage,
    generateCommandPage,
    generateRobloxEventsPage
}
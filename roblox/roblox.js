const { EventEmitter } = require("node:events");
const MemorySystem = require("../memory/MemorySystem");
const fs = require("node:fs");

MemorySystem.ensureDirectoryExists("roblox");
MemorySystem.ensureDirectoryExists("roblox-games");

var rblxApiKey;
if (!MemorySystem.exists("rblx-api-key")) {
    rblxApiKey = "";
    MemorySystem.writeRaw("rblx-api-key", "");
    console.log("Roblox: set api key in memory storage");
} else
    rblxApiKey = MemorySystem.readRaw("rblx-api-key").toString();

/**
 * @param {string|URL|Request} url 
 * @param {RequestInit|undefined} init
 * @returns {Promise<any>}
 */
async function rblxfetch(url, init) {
    if (init == null || init == undefined) {
        init = {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": rblxApiKey
            }
        }
    } else {
        if (init.headers == null) { init.headers = {}; }
        if (init.headers["x-api-key"] == null) { init.headers["x-api-key"] = robloxDefaultKey; }
    }
    const response = await fetch(url, init);
    if (!response.ok) {
        console.log("failed");
        console.error(`HTTP ${response.status}: ${await response.text()}`);
        if (response.status == 429) {
            console.log("ratelimited: waiting 1 minute to continue");
            console.log(url);
            return new Promise((resolve,reject) => {
                setTimeout(() => {
                    resolve(rblxfetch(url, init));
                }, 60000);
            })
        }
        return {failed: true};
    }
    const json = await response.json();
    //console.log(json);
    return json;
}

class Roblox extends EventEmitter {
    async checkApiKey() {
        if (!MemorySystem.exists("roblox-valid-key") || MemorySystem.readRaw("roblox-valid-key").toString() != rblxApiKey || !MemorySystem.exists("logged-roblox-user-data")) {
            console.log("checking roblox api key...");
            const response = await fetch("https://apis.roblox.com/api-keys/v1/introspect", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    apiKey: rblxApiKey
                })
            });
            const data = await response.json();
            if (data.authorizedUserId != undefined) {
                console.log("valid api key provided");
                MemorySystem.writeRaw("roblox-valid-key", rblxApiKey);
                const userInfo = await rblxfetch(`https://apis.roblox.com/cloud/v2/users/${data.authorizedUserId}`);
                MemorySystem.writeJson("logged-roblox-user-data", userInfo);
            } else
                throw new Error("invalid api key provided; cannot continue");
        }
        var user = MemorySystem.readJson("logged-roblox-user-data");
        console.log(`Welcome, ${user.displayName}!`);
    }
    async checkForEvents() {
        let gameFiles = MemorySystem.fileList("roblox");
        let eventStateChanges = [];
        const now = Date.now();
        const index = MemorySystem.exists("roblox-index") ? MemorySystem.readJson("roblox-index") : [];
        for (let i = 0; i < index.length; i++) {
            const universeId = index[i];
            this.addGame(universeId);
        }
        for (let i = 0; i < gameFiles.length; i++) {
            const path = gameFiles[i];
            const eventId = path.split("/")[2];
            const universeId = path.split("/")[1];
            const event = MemorySystem.readJson(path);
            const timeUntilStart = event.startTime - now;
            const timeUntilEnd = event.endTime - now;
            if (event.notifiedEnd) {
                MemorySystem.deleteFile(path);
                continue;
            }
            if (!event.notified1HourStart && timeUntilStart < 3600000) {
                eventStateChanges.push({
                    eventId,
                    universeId,
                    state: "1HourStart"
                });
                event.notified1HourStart = true;
            } else if (!event.notifiedStart && timeUntilStart <= 0) {
                eventStateChanges.push({
                    eventId,
                    universeId,
                    state: "Start"
                });
                event.notifiedStart = true;
            } else if (!event.notified1HourEnd && timeUntilEnd < 3600000) {
                eventStateChanges.push({
                    eventId,
                    universeId,
                    state: "1HourEnd"
                });
                event.notified1HourEnd = true;
            } else if (timeUntilEnd <= 0) {
                eventStateChanges.push({
                    eventId,
                    universeId,
                    state: "End"
                });
                event.notifiedEnd = true;
            }
            MemorySystem.writeJson(path, event);
        }
        if (eventStateChanges.length > 0 && this.listeners("stateChange").length > 0)
            this.emit("stateChange", eventStateChanges);
    }
    constructor() {
        super();
    }

    init() {
        setInterval(() => {
            this.checkForEvents();
        }, 120000);
        this.checkForEvents();
    }

    async getEvents(universeId) {
        const eventsList = await rblxfetch(`https://apis.roblox.com/virtual-events/v3/universes/${universeId}/game-events?pageSize=100`);
        if (eventsList.failed) {
            console.log(`failed to get events of ${universeId}`);
            return;
        }
        return eventsList.gameEvents;
    }
    async getData(universeId) {
        const universeData = await rblxfetch(`https://apis.roblox.com/cloud/v2/universes/${universeId}`);
        if (universeData.failed) {
            console.log(`failed to get data of ${universeId}`);
            return;
        }
        return universeData;
    }

    async universeIdFromPlaceId(placeId) {
        const response = await rblxfetch(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`);
        if (response.failed) { return 0; }
        return response.universeId;
    }

    async addGameFromPlaceId(placeId) {
        const universeId = await this.universeIdFromPlaceId(placeId);
        if (universeId == 0 || universeId == null) {
            console.error(`failed to add events of place ${placeId} to tracker: couldnt get universe id`);
            return {
                error: `failed to add events of place ${placeId} to tracker: couldnt get universe id`
            };
        }
        return await this.addGame(universeId);
    }
    async addGame(universeId) {
        MemorySystem.ensureDirectoryExists(`roblox/${universeId}`);
        const data = await this.getData(universeId);
        if (data == undefined) {
            console.log("failed to fetch data; returning");
            this.emit("error", {stage: "addGame-data", universeId});
            return;
        }
        const events = await this.getEvents(universeId);
        if (events == undefined) {
            console.log("failed to fetch events; returning");
            this.emit("error", {stage: "addGame-events", universeId});
            return;
        }
        if (MemorySystem.exists(`roblox-games/${universeId}`)) {
            const existingData = MemorySystem.readJson(`roblox-games/${universeId}`);
            if (Date.parse(existingData.updateTime) < Date.parse(data.updateTime))
                this.emit("gameUpdated", {id: universeId, ...data});
        }
        MemorySystem.writeJson(`roblox-games/${universeId}`, data);
        //console.log(data);
        //console.log(events);
        for (let i = 0; i < events.length; i++) {
            const event = events[i];
            //console.log(`checking event: ${event.displayTitle}`);
            if (Date.parse(event.endTime) < Date.now())
                continue;
            if (!MemorySystem.exists(`roblox/${universeId}/${event.id}`))
                this.emit("eventAdded", {eventName: event.displayTitle, universeName: data.displayName});
            else {
                const oldData = MemorySystem.readJson(`roblox/${universeId}/${event.id}`)
                if (
                    Date.parse(event.startTime) != oldData.startTime ||
                    Date.parse(event.endTime) != oldData.endTime ||
                    event.displayTitle != oldData.eventName
                )
                    this.emit("eventChanged", {eventName: event.displayTitle, universeName: data.displayName});
            }
            MemorySystem.writeJson(`roblox/${universeId}/${event.id}`, {
                startTime: Date.parse(event.startTime),
                endTime: Date.parse(event.endTime),
                notified1HourStart: Date.parse(event.startTime)-3600000 < Date.now(),
                notifiedStart: Date.parse(event.startTime) < Date.now(),
                notified1HourEnd: Date.parse(event.endTime)-3600000 < Date.now(),
                notifiedEnd: false,

                eventName: event.displayTitle,
                universeName: data.displayName
            });
        }
        const index = MemorySystem.exists("roblox-index") ? MemorySystem.readJson("roblox-index") : [];
        if (!index.includes(universeId)) {
            index.push(universeId);
            MemorySystem.writeJson("roblox-index", index);
        }
        return {};
    }
}

module.exports = Roblox;
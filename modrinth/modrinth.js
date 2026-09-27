const { EventEmitter } = require("node:events");
const MemorySystem = require("../memory/MemorySystem");

MemorySystem.ensureDirectoryExists("modrinth/mods");
MemorySystem.ensureDirectoryExists("modrinth/teams");

class Modrinth extends EventEmitter {
    async checkForUpdates() {
        let modFiles = MemorySystem.fileList("modrinth/mods");
        let updates = [];
        for (let i = 0; i < modFiles.length; i++) {
            const path = modFiles[i];
            const tracking = MemorySystem.readJson(path);
            const response = await fetch(`https://api.modrinth.com/v3/project/${tracking.id}`);
            if (!response.ok) {
                console.log(`failed to check updates for "${path}"\n${response.status} ${await response.text()}`);
                continue;
            }
            const lastUpdate = new Date((await response.json()).updated).getTime();
            if (lastUpdate > tracking.lastUpdate) {
                console.log(`${tracking.id} update detected`);
                updates.push(tracking.id);
                tracking.lastUpdate = lastUpdate;
                MemorySystem.writeJson(path, tracking);
            }
        }
        if (updates.length > 0 && this.listeners("update").length > 0)
            this.emit("update", updates);
    }

    constructor() {
        super();
    }

    init() {
        setInterval(this.checkForUpdates, 60000);
        this.checkForUpdates();
    }

    /**
     * Adds a project to the tracker
     * @param {string} id 
     */
    async add(id) {
        const response = await fetch(`https://api.modrinth.com/v3/project/${id}`);
        if (!response.ok) {
            return {
                error: `failed to add ${id} to tracker\n${response.status} ${await response.text()}`
            };
        }
        const json = await response.json();
        MemorySystem.writeJson(`modrinth/mods/${id}`, {
            id,
            lastUpdate: new Date(json.updated).getTime(),
            name: json.name,
            summary: json.summary,
            teamid: json.team_id
        });
        if (!MemorySystem.exists(`modrinth/teams/${json.team_id}`)) {
            // no real reason to save teams as of now
            // this is here to simplify implementation if needed
        }
        return {};
    }
}

module.exports = Modrinth;
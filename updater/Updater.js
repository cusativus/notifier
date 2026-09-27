const fs = require("node:fs");
const AdmZip = require('adm-zip');

async function latestRelease() {
    const response = await fetch(`https://api.github.com/repos/cusativus/notifier/releases/latest`, {
        headers: {
            "X-GitHub-Api-Version": "2026-03-10",
            "Accept": "application/vnd.github+json"
        }
    });
    const resJson = await response.json();
    if (fs.existsSync("./info")) {
        var oldDate = Date.parse(fs.readFileSync("./info").toString());
        var curDate = Date.parse(resJson.published_at);
        if (curDate <= oldDate) {
            console.log("up to date!");
            return;
        }
    }
    console.log("detected update; installing...");
    fs.writeFileSync("./info", resJson.published_at);
    const zipBuffer = await (await fetch(resJson.zipball_url)).bytes();
    fs.writeFileSync("./update.zip", zipBuffer);
    const zip = new AdmZip("./update.zip");
    const fileCount = zip.getEntryCount();
    zip.getEntries().forEach((entry, index) => {
        // construct correct path
        var split = entry.entryName.split("/");
        split[0] = "..";
        var destinationPath = split.join("/");
        if (destinationPath.startsWith("./updater"))
            return;
        // write data (or create directory)
        if (destinationPath.endsWith("/")) {
            if (!fs.existsSync(destinationPath))
                fs.mkdirSync(destinationPath);
        } else {
            fs.writeFileSync(destinationPath, entry.getData());
        }
        console.log(`extracting: ${Math.floor(index/fileCount*100)}%`);
    });
    fs.rmSync("./update.zip");
    console.log("finished updating");
}

latestRelease();
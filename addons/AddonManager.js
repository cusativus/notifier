const AdmZip = require("adm-zip");
const fs = require("node:fs");
const { exec } = require('child_process');

const storagePath = "./addons/files";

if (!fs.existsSync(storagePath))
    fs.mkdirSync(storagePath);

async function fetchAddons() { fs.writeFileSync("./addons/addons.zip", await (await fetch((await (await fetch(`https://api.github.com/repos/cusativus/notifier-addons/releases/latest`, { headers: { "X-GitHub-Api-Version": "2026-03-10", "Accept": "application/vnd.github+json" } })).json()).zipball_url)).bytes()); }
async function installAddon(name) {
    if (!fs.existsSync("./addons/addons.zip"))
        await fetchAddons();
    console.log(`installing "${name}" addon...`);
    try {
        const zip = new AdmZip("./addons/addons.zip");
        const folderPath = `${zip.getEntries()[0].entryName.split("/")[0]}/${name}`;
        const baseFolder = zip.getEntry(`${folderPath}/`);
        //zip.getEntries().forEach((entry) => console.log(entry.entryName));
        //console.log(`checking for: ${folderPath}`);
        if (baseFolder != null) {
            const packages = zip.getEntry(`${folderPath}/packages`);
            if (packages != null) {
                console.log("installing packages...");
                var packageList = packages.getData().toString().split(",");
                var cmd = `cd ${__dirname.replaceAll("\\","/")}`;
                packageList.forEach((package) => cmd = `${cmd} | npm install ${package}`);
                await new Promise(resolve => exec(cmd).on("close", resolve));
            }
            console.log("copying files...");
            if (!fs.existsSync(`${storagePath}/${name}`))
                fs.mkdirSync(`${storagePath}/${name}`);
            zip.getEntries().forEach((entry) => {
                if (entry.entryName.startsWith(folderPath) && entry.entryName != `${folderPath}/` && !entry.entryName.endsWith("packages"))
                    fs.writeFileSync(entry.entryName.replace(folderPath,`${storagePath}/${name}`), entry.getData());
            });
            console.log(`successfully installed "${name}"`);
        } else
            throw new Error(`addon "${name}" does not exist`);
    } catch (err) {
        console.error(err);
    }
}

module.exports = {
    fetchAddons,
    installAddon
}
const fs = require("node:fs");
const zlib = require("node:zlib");

/**
 * Reads from a memory file
 * @param {string} path File path
 * @returns {NonSharedBuffer}
 */
function read(path) {
    const fullPath = `./memory/storage/${path}.sat`;
    if (!fs.existsSync(fullPath))
        throw new Error(`No memory file exists at ${path}`);
    const metadata = fs.readFileSync(`${fullPath}.meta`).buffer;
    const fileData = fs.readFileSync(fullPath);
    try {
        if (metadata.toString() == "c")
            return zlib.brotliDecompressSync(fileData);
        else
            return fileData;
    } catch (err) {
        console.log(`Reading: ${fullPath}`);
        const markedAsCompressed = metadata.toString() == "c";
        console.log(`Marked as compressed? ${markedAsCompressed}`);
        if (markedAsCompressed && err.toString().includes("Decompression failed")) {
            fs.writeFileSync(`${fullPath}.meta`, "u");
            console.log(`Detected false compression marking; corrected to uncompressed`);
            return fileData;
        }
        console.warn(err);
        return fileData;
    }
}
/**
 * Reads from a JSON memory file
 * @param {string} path File path
 * @returns {any}
 */
function readJson(path) {
    var decompressed = read(path);
    if (!decompressed.toString().startsWith("{")) {
        try {
            decompressed = zlib.brotliDecompressSync(decompressed);
        } catch (err) {}
    }
    return JSON.parse(decompressed.toString());
}
/**
 * Writes a memory file 
 * @param {string} path File path (will auto-create directories if necessary)
 * @param {any} data Data to write
 */
function write(path, data) {
    const fullPath = `./memory/storage/${path.replaceAll("\\","/")}.sat`;

    var builtPath = ".";
    fullPath.split("/").forEach((name, idx, array) => {
        if (idx == 0 || idx == array.length-1) return;
        builtPath = `${builtPath}/${name}`;
        if (!fs.existsSync(builtPath))
            fs.mkdirSync(builtPath);
    });

    const compressed = zlib.brotliCompressSync(data);
    var shouldUseCompressed = true;
    switch (typeof data) {
        case "string":
            shouldUseCompressed = new TextEncoder().encode(data).byteLength > compressed.byteLength;
            break;
        case "number":
            if (Math.floor(data) != data) {
                // floating point
                if (Math.abs(data) <= 65504)
                    shouldUseCompressed = false;
                else if (Math.abs(data) <= 3.4028235*10^38)
                    shouldUseCompressed = 8 > compressed.byteLength;
                else if (Math.abs(data) <= 1.79*10^308)
                    shouldUseCompressed = 16 > compressed.byteLength;
            } else {
                // integer
                if (Math.abs(data) <= 127)
                    shouldUseCompressed = false;
                else if (Math.abs(data) <= 32767)
                    shouldUseCompressed = false;
                else if (Math.abs(data) <= 2147483647)
                    shouldUseCompressed = 8 > compressed.byteLength;
            }
            break;
        case "bigint":
            shouldUseCompressed = 16 > compressed.byteLength;
            break;
        case "boolean":
            shouldUseCompressed = false;
            break;
        case "function":
            throw new Error("cant write a function");
        case "object":
            if (data.byteLength != undefined) {
                shouldUseCompressed = data.byteLength > compressed.byteLength;
                break;
            } else
                throw new Error("cant write an object");
        case "symbol":
            throw new Error("unknown data type");
        case "undefined":
            throw new Error("cant write an undefined value");
    }

    fs.writeFileSync(fullPath, shouldUseCompressed ? compressed : data);
    //console.log(`wrote ${compressed.byteLength} bytes to ${fullPath}`);
    fs.writeFileSync(`${fullPath}.meta`, shouldUseCompressed ? "c" : "u");
}
/**
 * Writes a JSON memory file
 * @param {string} path File path (will auto-create directories if necessary)
 * @param {any} json JSON data to write
 */
function writeJson(path, json) { write(path, JSON.stringify(json)); }
/**
 * Reads all files in memory or in the provided directory if there is one
 * @param {string?} directory Directory to read from (Optional)
 * @returns {string[]} Paths of all files relative to the given directory
 */
function fileList(directory="") {
    const fullPath = `./memory/storage/${directory}`;
    var list = [];
    if (!fs.existsSync(fullPath))
        return list;
    fs.readdirSync(fullPath).forEach((path) => {
        if (!path.endsWith(".sat") && !path.endsWith(".meta")) {
            var secondaryList = fileList(`${directory}/${path}`);
            secondaryList.forEach((value) => list.push(`${value}`));
        } else if (!path.endsWith(".meta")) {
            var name = path.split(".")[0];
            list.push(`${directory.endsWith("/") ? directory : `${directory}/`}${name}`);
        }
    });
    return list;
}
function ensureDirectoryExists(directory) {
    const fullPath = `./memory/storage/${directory}`;
    var builtPath = ".";
    fullPath.split("/").forEach((name, idx, array) => {
        if (idx == 0) return;
        builtPath = `${builtPath}/${name}`;
        if (!fs.existsSync(builtPath))
            fs.mkdirSync(builtPath);
    });
}
function exists(path) { return fs.existsSync(`./memory/storage/${path}.sat`); }

function deleteFile(path) {
    if (!exists(path))
        return;
    fs.rmSync(`./memory/storage/${path}.sat`);
    fs.rmSync(`./memory/storage/${path}.meta`)
}

module.exports = {
    read,
    readJson,
    write,
    writeJson,
    fileList,
    ensureDirectoryExists,
    exists,
    deleteFile
}
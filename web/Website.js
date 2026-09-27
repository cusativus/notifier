const fs = require("node:fs");
const express = require("express");
const notifier = require('node-notifier');
const WebPageGenerator = require("../web-page-generator/Generator");
const config = require("../config.json");

/** @type {(id: string, body: any) => {status: number, response: any}} */
var callback = undefined;

function init() {
    const app = express();

    app.get('/web/home', async (req, res) => {
        res.send(WebPageGenerator.generateMainPage());
    });
    app.get(`/web/cmd/*cmdname`, async (req, res) => {
        res.send(WebPageGenerator.generateCommandPage(req.params.cmdname));
    });
    app.get(`/web/roblox-events`, async (req, res) => {
        res.send(WebPageGenerator.generateRobloxEventsPage());
    })
    app.get(`/file/*filename`, async (req, res) => {
        res.sendFile(fs.readFileSync(`./${req.params.filename.join("/")}`));
    });
    app.get(`/text/*filename`, async (req, res) => {
        res.send(fs.readFileSync(`./${req.params.filename.join("/")}`));
    });
    app.post('/cmd', async (req, res) => {
        const id = req.query.id;
        if (id == undefined) {
            res.status(404).send(`You need to provide a command id.`);
            return;
        }
        console.log(`received command: ${id}`);
        const { status, response } = await callback(id, req.query);
        res.status(status).send(response);
    });
    app.get('/favicon.ico', async (req, res) => {
        res.sendFile(`${__dirname}/favicon.ico`);
    });

    return new Promise((resolve, reject) => {
        app.listen(config.port, () => {
            console.log("control panel ready");
            resolve();
        })
    })
}

/**
 * @param {(id: string, body: any) => {status: number, response: any}} cb 
 */
function command(cb) {
    callback = cb;
}

module.exports = {
    init,
    command
}
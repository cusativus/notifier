const AddonManager = require("./addons/AddonManager");

(async () => {
    await AddonManager.fetchAddons();
    await AddonManager.installAddon("twitch-tts");
})();
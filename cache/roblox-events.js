window.onload = () => {
    const elements = {["2158475119163474563"]: document.getElementById("2158475119163474563"),["382911937220051536"]: document.getElementById("382911937220051536")};
    const times = {["2158475119163474563"]: 1793508903613,["382911937220051536"]: 1790964029029};
    const names = {["2158475119163474563"]: "DOORS 👔: THE ARCHIVES UPDATE",["382911937220051536"]: "DOORS 👔: ??? Update"};
    const states = {["2158475119163474563"]: true,["382911937220051536"]: false};
    setInterval(() => {
        Object.keys(times).forEach((key) => {
            var time = Math.floor((times[key]-Date.now())/1000);
            var seconds = time % 60;
            var minutes = Math.floor(time/60) % 60;
            var hours = Math.floor(time/3600) % 24;
            var days = Math.floor(time/86400);
            elements[key].innerHTML = `<b>${names[key]}</b><br>-${states[key] ? " Ends in" : ""} ${days} Days, ${hours} Hours, ${minutes} Minutes, ${seconds} Seconds<br>`;
        });
    }, 1000);
}
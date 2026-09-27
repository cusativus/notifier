window.onload = () => {
    const elements = {["2355391646335631961"]: document.getElementById("2355391646335631961"),["7304111092471562800"]: document.getElementById("7304111092471562800"),["2158475119163474563"]: document.getElementById("2158475119163474563"),["382911937220051536"]: document.getElementById("382911937220051536"),["2830314013387260688"]: document.getElementById("2830314013387260688"),["8346630683938128535"]: document.getElementById("8346630683938128535")};
    const times = {["2355391646335631961"]: 1791050450164,["7304111092471562800"]: 1791050741913,["2158475119163474563"]: 1793508903613,["382911937220051536"]: 1790964029029,["2830314013387260688"]: 1790953215674,["8346630683938128535"]: 4101686354563};
    const names = {["2355391646335631961"]: "Animal Hospital (Anomaly) 🧪: Next Update",["7304111092471562800"]: "Animal Hospital (Anomaly) 🧪: X2 Coins",["2158475119163474563"]: "DOORS 👔: THE ARCHIVES UPDATE",["382911937220051536"]: "DOORS 👔: ??? Update",["2830314013387260688"]: "Project: Afternight: \"Cutie Beam\" Update",["8346630683938128535"]: "Nullscape [DOOM IN BLOOM]: Dɘlusional Descent¡on"};
    const states = {["2355391646335631961"]: false,["7304111092471562800"]: false,["2158475119163474563"]: true,["382911937220051536"]: false,["2830314013387260688"]: false,["8346630683938128535"]: false};
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
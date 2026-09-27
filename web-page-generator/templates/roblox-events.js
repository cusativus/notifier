window.onload = () => {
    const elements = {ELEMENTS_LIST};
    const times = {TIMES_LIST};
    const names = {NAMES_LIST};
    const states = {STATES_LIST};
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
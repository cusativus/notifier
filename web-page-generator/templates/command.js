window.onload = () => {
    const inputs = {INPUT_TABLE_HERE};
    const statusDisplay = document.getElementById("status-text");

    document.getElementById("execute").onclick = async () => {
        var body = ``;
        const keys = Object.keys(inputs);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            body = `${body}&${key}=${inputs[key].value}`;
        }
        console.log(`posting body: ${body}`);
        const response = await fetch(`http://localhost:PORT_HERE/cmd?id=ID_HERE${body}`, {
            method: "POST"
        });
        statusDisplay.innerText = `${response.status}: ${await response.text()}`;
    }
}
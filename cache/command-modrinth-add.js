window.onload = () => {
    const inputs = {slug:document.getElementById("input-slug")};
    const statusDisplay = document.getElementById("status-text");

    document.getElementById("execute").onclick = async () => {
        var body = ``;
        const keys = Object.keys(inputs);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            body = `${body}&${key}=${inputs[key].value}`;
        }
        console.log(`posting body: ${body}`);
        const response = await fetch(`http://localhost:2471/cmd?id=modrinth-add${body}`, {
            method: "POST"
        });
        statusDisplay.innerText = `${response.status}: ${await response.text()}`;
    }
}
var statusDisplay = null;
function registerCommand(id,oneclick) {
    const element = document.getElementById(id);
    if (element == null) {
        console.log(`couldn't find element by id "${id}"`);
        return;
    }
    if (oneclick) {
        element.onclick = async () => {
            const response = await fetch(`http://localhost:PORT_HERE/cmd?id=${id}`, {method: "POST"});
            statusDisplay.innerText = `${response.status}: ${await response.text()}`;
        }
    } else {
        element.onclick = () => {
            window.location.href = `http://localhost:PORT_HERE/web/cmd/${id}`;
        }
    }
}

window.onload = () => {
    statusDisplay = document.getElementById("status-text");
    REGISTER_HERE
}
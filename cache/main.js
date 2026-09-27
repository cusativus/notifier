var statusDisplay = null;
function registerCommand(id,oneclick) {
    const element = document.getElementById(id);
    if (element == null) {
        console.log(`couldn't find element by id "${id}"`);
        return;
    }
    if (oneclick) {
        element.onclick = async () => {
            const response = await fetch(`http://localhost:2471/cmd?id=${id}`, {method: "POST"});
            statusDisplay.innerText = `${response.status}: ${await response.text()}`;
        }
    } else {
        element.onclick = () => {
            window.location.href = `http://localhost:2471/web/cmd/${id}`;
        }
    }
}

window.onload = () => {
    statusDisplay = document.getElementById("status-text");
    
registerCommand("modrinth-add",false)
registerCommand("notify",true)
registerCommand("roblox-add",false)
}
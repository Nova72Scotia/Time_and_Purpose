document.querySelector("#settings").addEventListener("click", async () => {
    window.location.href = "../options/options.html";
});

document.querySelector("#create_account").addEventListener("click", async () => {
    window.location.href = "./create_account.html";
});

document.querySelector("#login").addEventListener("click", async () => {
    window.location.href = "./login.html";
});

document.querySelector("#logout").addEventListener("click", async () => {
    chrome.runtime.sendMessage({
        message: "logout",
        sender: "home.js",
        target: "service-worker.js",
    });
    window.location.reload();
});

false_current_user_buttons = "<button id=\"create_account\">Create Account</button><button id=\"login\">Login</button>";
true_current_user_buttons = "<button id=\"logout\">Logout</button>";

document.addEventListener("DOMContentLoaded", async () => {
    chrome.runtime.sendMessage({
        message: "check_login_status",
        sender: "home.js",
        target: "service-worker.js",
    });
});

chrome.runtime.onMessage.addListener(async (message) => {
    if (message.response.sender == "service-worker.js" && message.response.target == "home.js") {
        if (message.response.user_bool == true) {
            document.querySelector("header").innerHTML = true_current_user_buttons;
        } else if (message.response.user_bool == false) {
            document.querySelector("header").innerHTML = false_current_user_buttons;
        }
    }
});

//Navigates user to options page
document.querySelector("#settings").addEventListener("click", async () => {
    window.location.href = "../options/options.html";
});

false_current_user_buttons = "<button id=\"create_account\">Create Account</button><button id=\"login\">Login</button>";
true_current_user_buttons = "<button id=\"logout\">Logout</button>";

//Sends message to service worker to check if a user is logged in
document.addEventListener("DOMContentLoaded", async () => {
    chrome.runtime.sendMessage({
        message: "check_login_status",
        sender: "home.js",
        target: "service-worker.js",
    });
});

//Listens for response to first message and adds corresponding buttons to home header
chrome.runtime.onMessage.addListener(async (message) => {
    if (message.sender == "service-worker.js" && message.target == "home.js") {
        //If user is logged in, add logout button and listener for button click
        if (message.user_bool == true) {
            document.querySelector("header").innerHTML = true_current_user_buttons;
            //Send message to service worker to log user out
            document.querySelector("#logout").addEventListener("click", async () => {
                chrome.runtime.sendMessage({
                    message: "logout",
                    sender: "home.js",
                    target: "service-worker.js",
                });
                window.location.reload();
            });
        //If no user is logged in, add create account and login buttons and their listeners
        } else if (message.user_bool == false) {
            document.querySelector("header").innerHTML = false_current_user_buttons;
            //Navigate user to create account page on click
            document.querySelector("#create_account").addEventListener("click", async () => {
                window.location.href = "./create_account.html";
            });
            //Navigate user to login page on click
            document.querySelector("#login").addEventListener("click", async () => {
                window.location.href = "./login.html";
            });

        }
    }
});

//Adds listener for clicks on submit button, sends message to service worker
document.querySelector("#submit").addEventListener("click", async () => {
    //Sends message containing email and password to service worker
    const sending = chrome.runtime.sendMessage({
        credentials: {
            email: document.querySelector("#email").value,
            password: document.querySelector("#password").value
        },
        sender: "create_account.js"
    });
});

//Listens for response from service worker, updates create account page p element based on success or fail
chrome.runtime.onMessage.addListener((message) => {
    console.log("here", message, message.sender, message.target);
    if (message.sender == "service-worker.js" && message.target == "create_account.js") {
        document.querySelector("#status").textContent = message.message;
    }
});

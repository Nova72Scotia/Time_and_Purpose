//Add listener for clicking on submit button
document.querySelector("#submit").addEventListener("click", async () => {
    //Sends service worker email and password of user
    chrome.runtime.sendMessage({
        credentials: {
            email: document.querySelector("#email").value,
            password: document.querySelector("#password").value
        },
        sender: "login.js"
    });
});

//Listens for response from service worker, updates login page p element based on success or fail
chrome.runtime.onMessage.addListener((message) => {
    if (message.sender == "service-worker.js" && message.target == "login.js") {
        document.querySelector("#status").textContent = message.message;
    }
});

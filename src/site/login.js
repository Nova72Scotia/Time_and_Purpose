document.querySelector("#submit").addEventListener("click", async () => {
    console.log("submitted");
    chrome.runtime.sendMessage({
        credentials: {
            email: document.querySelector("#email").value,
            password: document.querySelector("#password").value
        },
        sender: "login.js"
    });
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.sender == "service-worker.js" && message.target == "login.js") {
        document.querySelector("#status").textContent = message.message;
    }
});

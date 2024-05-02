document.querySelector("#submit").addEventListener("click", async () => {
    console.log("submitted");
    const sending = chrome.runtime.sendMessage({
        credentials: {
            email: document.querySelector("#email").value,
            password: document.querySelector("#password").value
        },
        sender: "create_account.js"
    });
});

chrome.runtime.onMessage.addListener((message) => {
    console.log("here", message, message.sender, message.target);
    if (message.sender == "service-worker.js" && message.target == "create_account.js") {
        document.querySelector("#status").textContent = message.message;
    }
});

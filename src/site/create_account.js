document.querySelector("#submit").addEventListener("click", async () => {
    console.log("submitted");
    const sending = chrome.runtime.sendMessage({
        credentials: {
            email: document.querySelector("#email").value,
            password: document.querySelector("#password").value
            },
        sender: "create_account.js"
        });
    /*sending.then((response) => {
        console.log(response.response);
    });*/
});

chrome.runtime.onMessage.addListener((message) => {
    console.log("here", message, message.response.sender, message.response.target);
    if (message.response.sender == "service-worker.js" && message.response.target == "create_account.js") {
        document.querySelector("#status").textContent = message.response.message;
    }
});

console.log("here");



document.querySelector("#form").addEventListener("submit", async (event) => {
    console.log("submitted");
    event.preventDefault();
    let social_media_timer = (await chrome.storage.local.get("social_media_timer")).social_media_timer;
    let streaming_timer = (await chrome.storage.local.get("streaming_timer")).streaming_timer;
    social_media_timer.restriction_type = document.querySelector("#social_media").value;
    streaming_timer.restriction_type = document.querySelector("#streaming").value;
    await chrome.storage.local.set({"social_media_timer": social_media_timer, "streaming_timer": streaming_timer});
});

document.addEventListener("DOMContentLoaded", async () => {
    let text_value_key = {"none": "None", "timed":"Partial", "restricted":"Complete"}
    console.log("loaded");
    let social_media_timer = (await chrome.storage.local.get("social_media_timer")).social_media_timer;
    let streaming_timer = (await chrome.storage.local.get("streaming_timer")).streaming_timer;
    let social_media_select = document.querySelector("#social_media");
    for (let i = 0; i < social_media_select.length; i++) {
        console.log(i);
        let current_option = social_media_select[i];
        if (current_option.value == social_media_timer.restriction_type) {
            current_option.selected = true;
        }
    }
    let streaming_select = document.querySelector("#streaming");
    for (let i = 0; i < streaming_select.length; i++) {
        console.log(i);
        let current_option = streaming_select[i];
        if (current_option.value == streaming_timer.restriction_type) {
            current_option.selected = true;
        }
    }
});

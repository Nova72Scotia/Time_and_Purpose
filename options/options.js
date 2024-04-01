console.log("here");



document.querySelector("#form").addEventListener("submit", async (event) => {
    console.log("submitted");
    event.preventDefault();
    let social_media_timer = (await chrome.storage.local.get("social_media_timer")).social_media_timer;
    let streaming_timer = (await chrome.storage.local.get("streaming_timer")).streaming_timer;
    //console.log(await document.querySelector("#social_media").value);
    social_media_timer.restriction_type = document.querySelector("#social_media").value;
    streaming_timer.restriction_type = document.querySelector("#streaming").value;
    await chrome.storage.local.set({"social_media_timer": social_media_timer, "streaming_timer": streaming_timer});
});

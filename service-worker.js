async function send_notification(current_timer, time_limit) {
        chrome.notifications.create('test', {
        type: 'basic',
        iconUrl: 'images/temp_icon.png',
        title: 'Chump',
        message: `You have ${time_limit - current_timer} minutes left`,
        priority: 1
    });
}

async function create_alarm() {
    const timer_alarm = await chrome.alarms.get("timer_update");
    if (typeof alarm === "undefined") {
        chrome.alarms.create("timer_update", {
            delayInMinutes: 1,
            periodInMinutes: 1
        });
    }
}

create_alarm();

chrome.runtime.onInstalled.addListener(async () => {
    await chrome.storage.local.set({
        "scaling_timer": {
            "timer": 0,
            "buffer_timer": 0,
            "current_stage": "use",
            "cycle_num": 0,
            "time_stamp": Date.now(),
            "use_periods": [8, 5, 3, 1, 1],
            "suspend_periods": [1, 2, 3, 4, 5]
        },
        "category_lists": {
            "social_media": ["facebook", "myspace", "twitter", "flickr", "linkedin", "photobucket", "digg", "ning", "tagged", "squidoo", "instagram", "whatsapp", "tiktok", "reddit", "pinterest", "vk", "discord", "ok", "zhihu", "line", "telegram", "peachavocado", "snapchat", "namu", "tumblr", "ameblo", "nextdoor", "wibo", "xiaohongshu", "heylink", "slack", "kwai", "zalo", "threads", "hatenablog", "atid", "slideshare", "livejournal", "discordapp", "ssstik", "otakudesu", "bukusai", "fb", "ptt", "snaptik", "zaloapp", "dcard", "youtubekids", "ameba", "groupme", "wechat", "messenger", "imo", "fbsbx"],
            "streaming": ["youtube", "twitch", "netflix", "max", "disneyplus", "primevideo", "miguvideo", "nicovideo", "fmoviesz", "kinopoisk", "hulu", "dailymotion", "xfinity", "aniwatch", "tenki", "crunchyroll", "hbomax", "hotstar", "tapmad", "nhk", "rutube", "mediaset", "programme-tv", "sky", "bfmtv", "zorox", "nrk", "peacocktv", "rezka", "jiocinema", "paramountplus", "vimeo", "yandex", "itponytaa", "iqiyi", "starplus", "afreecatv", "zdf", "hdrezka", "tver", "nos", "abema", "raiplay", "orf", "tvn24", "dramacool", "starz"] 
        }
    });
    let timers = {};
    let category_lists = (await chrome.storage.local.get("category_lists")).category_lists;
        for (const ele in category_lists) {
            timers[ele] = {
                "timer": 0,
                "buffer_timer": 0,
                "current_stage": "use",
                "cycle_num": 0,
                "time_stamp": Date.now(),
                "use_periods": [8, 5, 3, 1, 1],
                "suspend_periods": [1, 2, 3, 4, 5],
                "tab_active": false
            }
        }
    console.log(timers);
    await chrome.storage.local.set({"timers": timers});
});

// add alarm creation to onStartup

chrome.alarms.onAlarm.addListener(async (alarm) => {
    let scaling_timer = (await chrome.storage.local.get("scaling_timer")).scaling_timer;
    //combine two get statements into one
    let category_lists = (await chrome.storage.local.get("category_lists")).category_lists;
    let timers = (await chrome.storage.local.get("timers")).timers;
    //console.log(scaling_timer.timer, scaling_timer.current_stage, scaling_timer.cycle_num, scaling_timer.time_stamp);
    let categories = {"test": ["wikipedia", "facebook", "fbsbx"]};
    let active_tabs = await chrome.tabs.query({active: true});
    //let limited = false;
    for (const i in active_tabs) {
        for (const j of active_tabs[i].url.split(".")) {
            /*if (categories.test.includes(j)) {
                limited = true;
            }*/
            for (const ele in category_lists) {
                if (category_lists[ele].includes(j) {
                    timers[ele].tab_active = true
                }
            }
        }
    }
    // figure this out next
    let needed_periods = "use_periods";
    if (scaling_timer.current_stage == "suspend") {
        needed_periods = "suspend_periods";
    }
   if (56000 < (Date.now() - scaling_timer.time_stamp)) {
        scaling_timer.time_stamp = Date.now();
        let needed_periods = "use_periods";
        if (scaling_timer.current_stage == "suspend") {
            needed_periods = "suspend_periods";
        }
        if (limited) {
            console.log("in limited");
            scaling_timer.timer += 1;
            scaling_timer.buffer_timer = 0;
            if (scaling_timer.timer >= scaling_timer[needed_periods][scaling_timer.cycle_num]) {
                scaling_timer.current_stage = "suspend";
                scaling_timer.timer = 0;
            //send notification of time out?
            //update tabs to not be limited urls
            }
        } else if (scaling_timer.current_stage == "use") {
            console.log("in use")
            if (scaling_timer.timer > 0) {
                scaling_timer.timer -= 1;
            } else if (scaling_timer.timer == 0 && scaling_timer.cycle_num != 0) {
                scaling_timer.buffer_timer += 1;
                if (scaling_timer.buffer_timer == (scaling_timer.use_periods[scaling_timer.cycle_num - 1] - scaling_timer.use_periods[scaling_timer.cycle_num])) {
                    scaling_timer.buffer_timer = 0;
                    scaling_timer.cycle_num -= 1;
                }
            }
        } else {
            console.log("in suspend");
            scaling_timer.timer += 1;
            if (scaling_timer.timer >= scaling_timer.suspend_periods[scaling_timer.cycle_num]) {
                scaling_timer.current_stage = "use";
                //need to limit to max length of cycles
                scaling_timer.cycle_num += 1;
                scaling_timer.timer = 0;
            }
        }
        console.log("cycle_num: ", scaling_timer.cycle_num, "current_stage: ", scaling_timer.current_stage, "timer: ", scaling_timer.timer, "buffer_timer: ", scaling_timer.buffer_timer);
        await chrome.storage.local.set({"scaling_timer": scaling_timer});
        send_notification(scaling_timer.timer, scaling_timer[needed_periods][scaling_timer.cycle_num]);
    }
});

chrome.webNavigation.onCompleted.addListener(async (result) => {
    // Use sets in categories to speed up search?
    let categories = {"test": ["wikipedia", "facebook", "fbsbx"]};
    let censored = false;
    for (const ele of result.url.split(".")) {
        if (categories.test.includes(ele)) {
            censored = true;
        }
    }
    if (censored) {
        chrome.notifications.create('test2', {
            type: 'basic',
            iconUrl: 'images/temp_icon.png',
            title: 'Chump',
            message: `You navigated to ${result.url}`,
            priority: 1
        });
        //chrome.tabs.update({url: "site/home.html"});
    }
});

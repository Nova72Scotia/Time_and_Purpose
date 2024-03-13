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
        "active_limited_tabs": []
    });
    //let scaling_timer = (await chrome.storage.local.get("scaling_timer")).scaling_timer;
});

// add alarm creation to onStartup

chrome.alarms.onAlarm.addListener(async (alarm) => {
    let scaling_timer = (await chrome.storage.local.get("scaling_timer")).scaling_timer;
    //let active_limited_tabs = (await chrome.storage.local.get("active_limited_tabs")).active_limited_tabs;
    //console.log(scaling_timer.timer, scaling_timer.current_stage, scaling_timer.cycle_num, scaling_timer.time_stamp);
    let categories = {"test": ["wikipedia", "facebook", "fbsbx"]};
    let active_tabs = await chrome.tabs.query({active: true});
    let limited = false;
    for (const i in active_tabs) {
        for (const j of active_tabs[i].url.split(".")) {
            if (categories.test.includes(j)) {
                limited = true;
            }
        }
    }
    let needed_periods = "use_periods";
    if (scaling_timer.current_stage == "suspend") {
        needed_periods = "suspend_periods";
    }
    /*let tabs_used = false;
    for (const ele in active_limited_tabs) {
        console.log((await chrome.tabs.get(active_limited_tabs[ele])).lastAccessed, scaling_timer.time_stamp) 
        if ((await chrome.tabs.get(active_limited_tabs[ele])).lastAccessed > scaling_timer.time_stamp) {
        //console.log(ele, active_limited_tabs, active_limited_tabs[ele]);
            tabs_used = true;
            console.log('here');
            break;
        }
    }
    console.log(tabs_used);
    */
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
    //let active_limited_tabs = (await chrome.storage.local.get("active_limited_tabs")).active_limited_tabs;
    if (censored) {
        chrome.notifications.create('test2', {
            type: 'basic',
            iconUrl: 'images/temp_icon.png',
            title: 'Chump',
            message: `You navigated to ${result.url}`,
            priority: 1
        });
       /* if (!active_limited_tabs.includes(result.tabId)) {
            active_limited_tabs.push(result.tabId);
        }*/
        //chrome.tabs.update({url: "site/home.html"});
    } else {
        //if (active_limited_tabs.includes(result.tabId)) {
        //    active_limited_tabs.splice(active_limited_tabs.indexOf(result.tabId), 1);
        //}
    }
    //await chrome.storage.local.set({"active_limited_tabs": active_limited_tabs});
});

/*chrome.tabs.onRemoved.addListener(async (result) => {    let active_limited_tabs = (await chrome.storage.local.get("active_limited_tabs")).active_limited_tabs;
    if (active_limited_tabs.includes(result)) {
        active_limited_tabs.splice(active_limited_tabs.indexOf(result.tabId), 1);
    }
    await chrome.storage.local.set({"active_limited_tabs": active_limited_tabs});
});*/

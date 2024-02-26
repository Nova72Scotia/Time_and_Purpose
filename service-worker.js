async function send_notification() {
    let current_counter = null;
    current_counter = await chrome.storage.local.get("counter")
    if (JSON.stringify(current_counter) === "{}") {
        current_counter = 0;
    } else {
        current_counter = current_counter.counter;
        current_counter = current_counter + 1;
    }
    chrome.storage.local.set({"counter": current_counter});
    chrome.notifications.create('test', {
        type: 'basic',
        iconUrl: 'images/temp_icon.png',
        title: 'Chump',
        message: `You have ${20 - current_counter} minutes left`,
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


chrome.alarms.onAlarm.addListener((alarm) => {
    send_notification();
});

chrome.webNavigation.onBeforeNavigate.addListener((result) => {
    chrome.notifications.create('test2', {
        type: 'basic',
        iconUrl: 'images/temp_icon.png',
        title: 'Chump',
        message: `You navigated to ${result.url}`,
        priority: 1
    });
    chrome.tabs.update({url: "site/home.html"});
},
{url: [{hostContains: 'facebook'}, {hostContains: 'wikipedia'}]}
);

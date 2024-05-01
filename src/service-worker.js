// add differnent notifications for various events
async function send_notification(current_timer, time_limit, use_or_suspend, category) {
        chrome.notifications.create(`${category}test`, {
        type: 'basic',
        iconUrl: 'images/temp_icon.png',
        title: 'Chump',
        message: `You have ${time_limit - current_timer} minutes left of ${use_or_suspend} time on ${category} sites.`,
        priority: 1
    });
}

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth/web-extension';
import { getFirestore } from 'firebase/firestore'

const firebase_config = {
    apiKey: "AIzaSyASxztBbPt8oc1mJCZujLtQvy7Dmm4-qlo",
    authDomain: "time-and-purpose.firebaseapp.com",
    projectId: "time-and-purpose",
    storageBucket: "time-and-purpose.appspot.com",
    messagingSenderId: "893046344011",
    appId: "1:893046344011:web:83bb1b660db193c89380ce",
    measurementId: "G-31CRKZMK8H"
};
const app = initializeApp(firebase_config);
const auth = getAuth(app);
let logged_in_bool = false;
const firestore = getFirestore(app);


async function create_alarm() {
    const timer_alarm = await chrome.alarms.get("timer_update");
    if (typeof alarm === "undefined") {
        chrome.alarms.create("timer_update", {
            delayInMinutes: 1,
            periodInMinutes: 1
        });
    }
}

async function update_timer(timer_name) {
    let timer = (await chrome.storage.local.get(timer_name))[timer_name];
    if (timer.restriction_type == "timed") {
        let category_list = [];
        if (timer_name == "social_media_timer") {
            category_list = (await chrome.storage.local.get("category_lists")).category_lists.social_media;
        } else if (timer_name == "streaming_timer") {
            category_list = (await chrome.storage.local.get("category_lists")).category_lists.streaming;
        }
        let active_tabs = await chrome.tabs.query({active: true});
        timer.tab_active = false;
        let active_limited_tabs = [];
        for (const i in active_tabs) {
            for (const j of active_tabs[i].url.split(".")) {
                if (category_list.includes(j)) {
                    timer.tab_active = true;
                    active_limited_tabs.push(active_tabs[i].id);
                }
            }
        }
        console.log(active_limited_tabs);
        let needed_periods = "use_periods";
        if (timer.current_stage == "suspend") {
            needed_periods = "suspend_periods";
        }
        if (56000 < (Date.now() - timer.time_stamp)) {
            timer.time_stamp = Date.now();
            let needed_periods = "use_periods";
            if (timer.current_stage == "suspend") {
                needed_periods = "suspend_periods";
            }
            if (timer.tab_active) {
                timer.timer += 1;
                timer.buffer_timer = 0;
                if (timer.timer >= timer[needed_periods][timer.cycle_num]) {
                    timer.current_stage = "suspend";
                    timer.timer = 0;
                    for (const ele in active_limited_tabs) {
                        chrome.tabs.update(active_limited_tabs[ele], {url: "site/home.html"});
                    }
                //send notification of time out?
                //update tabs to not be limited urls
                }
            } else if (timer.current_stage == "use") {
                if (timer.timer > 0) {
                    timer.timer -= 1;
                } else if (timer.timer == 0 && timer.cycle_num != 0) {
                    timer.buffer_timer += 1;
                    if (timer.buffer_timer == (timer.use_periods[timer.cycle_num - 1] - timer.use_periods[timer.cycle_num])) {
                        timer.buffer_timer = 0;
                        timer.cycle_num -= 1;
                    }
                }
            } else {
                timer.timer += 1;
                if (timer.timer >= timer.suspend_periods[timer.cycle_num]) {
                    timer.current_stage = "use";
                    //need to limit to max length of cycles
                    timer.cycle_num += 1;
                    timer.timer = 0;
                }
            }
            console.log("cycle_num: ", timer.cycle_num, "current_stage: ", timer.current_stage, "timer: ", timer.timer, "buffer_timer: ", timer.buffer_timer);
            if (timer_name == "social_media_timer") {
                await chrome.storage.local.set({"social_media_timer": timer});
            } else if (timer_name == "streaming_timer") {
                await chrome.storage.local.set({"streaming_timer": timer});
            }
            send_notification(timer.timer, timer[needed_periods][timer.cycle_num], timer.current_stage, timer.name);
        }
    }
}

create_alarm();

chrome.runtime.onInstalled.addListener(async () => {
    await chrome.storage.local.set({
        "category_lists": {
            "social_media": ["facebook", "myspace", "twitter", "flickr", "linkedin", "photobucket", "digg", "ning", "tagged", "squidoo", "instagram", "whatsapp", "tiktok", "reddit", "pinterest", "vk", "discord", "ok", "zhihu", "line", "telegram", "peachavocado", "snapchat", "namu", "tumblr", "ameblo", "nextdoor", "wibo", "xiaohongshu", "heylink", "slack", "kwai", "zalo", "threads", "hatenablog", "atid", "slideshare", "livejournal", "discordapp", "ssstik", "otakudesu", "bukusai", "fb", "ptt", "snaptik", "zaloapp", "dcard", "youtubekids", "ameba", "groupme", "wechat", "messenger", "imo", "fbsbx"],
            "streaming": ["youtube", "twitch", "netflix", "max", "disneyplus", "primevideo", "miguvideo", "nicovideo", "fmoviesz", "kinopoisk", "hulu", "dailymotion", "xfinity", "aniwatch", "tenki", "crunchyroll", "hbomax", "hotstar", "tapmad", "nhk", "rutube", "mediaset", "programme-tv", "sky", "bfmtv", "zorox", "nrk", "peacocktv", "rezka", "jiocinema", "paramountplus", "vimeo", "yandex", "itponytaa", "iqiyi", "starplus", "afreecatv", "zdf", "hdrezka", "tver", "nos", "abema", "raiplay", "orf", "tvn24", "dramacool", "starz"] 
        },
        "social_media_timer": {
            "name": "social_media",
            "timer": 0,
            "buffer_timer": 0,
            "current_stage": "use",
            "cycle_num": 0,
            "time_stamp": Date.now(),
            "use_periods": [25, 20, 15, 10, 5],
            "suspend_periods": [8, 15, 20, 25, 30],
            "tab_active": false,
            "restriction_type": "timed"
        },
        "streaming_timer": {
            "name": "streaming",
            "timer": 0,
            "buffer_timer": 0,
            "current_stage": "use",
            "cycle_num": 0,
            "time_stamp": Date.now(),
            "use_periods": [25, 20, 25, 10, 5],
            "suspend_periods": [8, 15, 20, 25, 30],
            "tab_active": false,
            "restriction_type": "restricted"
        }
    });
});

// add alarm creation to onStartup

chrome.alarms.onAlarm.addListener(async (alarm) => {
    update_timer("social_media_timer");
    update_timer("streaming_timer");
});

chrome.webNavigation.onCompleted.addListener(async (result) => {
    let category_lists = (await chrome.storage.local.get("category_lists")).category_lists;
    let category = "";
    console.log(result.url);
    for (const ele of result.url.split(".")) {
        if (category_lists.social_media.includes(ele) && !result.url.includes("/embed/")) {
            category = "social_media";
        } else if (category_lists.streaming.includes(ele) && !result.url.includes("/embed/")) {
            category = "streaming";
        }
    }
    let timer = {};
    if (category == "social_media") {
        timer = (await chrome.storage.local.get("social_media_timer")).social_media_timer;
    } else if (category == "streaming") {
        timer = (await chrome.storage.local.get("streaming_timer")).streaming_timer;
    }
    if (timer.restriction_type == "restricted" || timer.current_stage == "suspend") {
        chrome.tabs.update(result.id, {url: "site/home.html"});
    }
});

chrome.runtime.onMessage.addListener((message) => {
    if (message.sender == "create_account.js") {
        createUserWithEmailAndPassword(auth, message.credentials.email, message.credentials.password)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log(user);
                chrome.runtime.sendMessage({
                    response: {
                        message: "Account Created Successfully",
                        sender: "service-worker.js",
                        target: "create_account.js"
                    }
                });
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.log("Code", errorCode, "Message", errorMessage);
                chrome.runtime.sendMessage({
                    response: {
                        message: `Account Creation failed. Error Message: ${errorMessage}`,
                        sender: "service-worker.js",
                        target: "create_account.js"
                    }
                });
            });
    } else if (message.sender == "login.js") {
        signInWithEmailAndPassword(auth, message.credentials.email, message.credentials.password)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log("logged in", user);
                chrome.runtime.sendMessage({
                    response: {
                        message: "Account Logged In",
                        sender: "service-worker.js",
                        target: "login.js"
                    }
                });
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.log("Code", errorCode, "Message", errorMessage);
                chrome.runtime.sendMessage({
                    response: {
                        message: `Login failed. Error Message: ${errorMessage}`,
                        sender: "service-worker.js",
                        target: "login.js"
                    }
                });
            });
    } else if (message.sender == "home.js") {
        if (message.message == "check_login_status") {
            chrome.runtime.sendMessage({
                response: {
                    sender: "service-worker.js",
                    target: "home.js",
                    user_bool: logged_in_bool
                }
            });
        } else if (message.message == "logout") {
            signOut(auth)
                .then(() => {
                    console.log("User signed out successfully");
                }).catch(() => {
                    console.log("Sign out Failed");
                });
        }
    }
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User currently logged in");
        logged_in_bool = true;
        console.log(user);
    } else {
        console.log("No user currently logged in");
        logged_in_bool = false;
    }
});

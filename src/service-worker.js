//npm imports for firebase, needed code will be added to service-worker by rollup bundler
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth/web-extension';
import { getFirestore, doc, collection, setDoc, getDoc } from 'firebase/firestore'

//Firebase config details
const firebase_config = {
    apiKey: "AIzaSyASxztBbPt8oc1mJCZujLtQvy7Dmm4-qlo",
    authDomain: "time-and-purpose.firebaseapp.com",
    projectId: "time-and-purpose",
    storageBucket: "time-and-purpose.appspot.com",
    messagingSenderId: "893046344011",
    appId: "1:893046344011:web:83bb1b660db193c89380ce",
    measurementId: "G-31CRKZMK8H"
};
//Due to nonpersisting variables in service-workers, these vars are created everytime the service worker activates, not ideal but neccessary for functions such as onAuthStateChanged
const app = initializeApp(firebase_config);
const auth = getAuth(app);
const firestore = getFirestore(app);

//Function which sends browser notifications specifying the amount of time the user has left
async function send_notification(current_timer, time_limit, use_or_suspend, category) {
    //Message displays the time limit minus the current timer, note that current_timer increments during use
    chrome.notifications.create(`${category}test`, {
        type: 'basic',
        iconUrl: 'images/Time_Purpose72.png',
        title: `${category} Timer`,
        message: `You have ${time_limit - current_timer} minutes left of ${use_or_suspend} time on ${category} sites.`,
        priority: 1
    });
}

//Function checks to see if alarm exists, and if it doesn't it creates the alarm to signal every minute
async function create_alarm() {
    const timer_alarm = await chrome.alarms.get("timer_update");
    if (typeof alarm === "undefined") {
        chrome.alarms.create("timer_update", {
            delayInMinutes: 1,
            periodInMinutes: 1
        });
    }
}
//Calls function (happens at least once a minute)
create_alarm();

//Function performs much of the work of the scaling time system, called every minute for both categories
async function update_timer(timer_name) {
    let timer;
    let firebase_vars = (await chrome.storage.local.get("firebase_vars")).firebase_vars;
    //Checks if user is logged into Firebase, if yes then loads the Firebase data and saves it locally, if no then uses local data
    if (firebase_vars.logged_in_bool) {
        const doc_snap = await getDoc(doc(firestore, "users", firebase_vars.user_id));
        if (doc_snap.exists()) {
            timer = doc_snap.data()[timer_name];
            await chrome.storage.local.set({timer_name: timer});
        } else {
        }
    } else {
        timer = (await chrome.storage.local.get(timer_name))[timer_name];
    }
    //If category is under timed restriction, proceed with rest of function
    if (timer.restriction_type == "timed") {
        let category_list = [];
        //Retrieves the current category's sites
        if (timer_name == "social_media_timer") {
            category_list = (await chrome.storage.local.get("category_lists")).category_lists.social_media;
        } else if (timer_name == "streaming_timer") {
            category_list = (await chrome.storage.local.get("category_lists")).category_lists.streaming;
        }
        //Gets currently focused browser tabs, checks if their url matches a site in the category list for restriction,
        // and toggles the tab_active value which is used to check activity in the last minute
        let active_tabs = await chrome.tabs.query({active: true});
        let active_limited_tabs = [];
        for (const i in active_tabs) {
            for (const j of active_tabs[i].url.split(".")) {
                if (category_list.includes(j)) {
                    timer.tab_active = true;
                    active_limited_tabs.push(active_tabs[i].id);
                }
            }
        }
        //sets value for later JSON indexing
        let needed_periods = "use_periods";
        if (timer.current_stage == "suspend") {
            needed_periods = "suspend_periods";
        }
        //If it has been at least 56 seconds since last timer update
        if (56000 < (Date.now() - timer.time_stamp)) {
            timer.time_stamp = Date.now();
            let needed_periods = "use_periods";
            //If restricted site has been used in the last minute
            if (timer.tab_active) {
                timer.tab_active = false;
                timer.timer += 1;
                timer.buffer_timer = 0;
                //If the time limit has passed, move to suspend
                if (timer.timer >= timer[needed_periods][timer.cycle_num]) {
                    timer.current_stage = "suspend";
                    timer.timer = 0;
                }
            //If currently in a user period and restricted site not currently in use
            } else if (timer.current_stage == "use") {
                //Decrement by one if timer not at 0
                if (timer.timer > 0) {
                    timer.timer -= 1;
                //If timer is at 0, a background buffer timer is incremented. If this buffer timer reaches the difference between this period and the one before it
                // the cycle will be decremented, giving the user a greater time limit (assuming user is not in first cycle)
                } else if (timer.timer == 0 && timer.cycle_num != 0) {
                    timer.buffer_timer += 1;
                    if (timer.buffer_timer == (timer.use_periods[timer.cycle_num - 1] - timer.use_periods[timer.cycle_num])) {
                        timer.buffer_timer = 0;
                        timer.cycle_num -= 1;
                    }
                }
            //If currently under suspend period
            } else {
                timer.timer += 1;
                //If timer reaches limit, switch to use period
                if (timer.timer >= timer.suspend_periods[timer.cycle_num]) {
                    timer.current_stage = "use";
                    //Prevent the user from passing the array index limit
                    timer.cycle_num = Math.min(timer.cycle_num + 1, timer.suspend_periods.length - 1);
                    timer.timer = 0;
                }
            }
        }
        //Send notification
        send_notification(timer.timer, timer[needed_periods][timer.cycle_num], timer.current_stage, timer.name);
        //redirects user to Browser Extension Home page
        if (timer.current_stage == "suspend") {
            for (const ele in active_limited_tabs) {
                chrome.tabs.update(active_limited_tabs[ele], {url: "site/home.html"});
            }
        }
        //Saves modifications to social media timer JSON to local storage and cloud firestore storage if connected
        if (timer_name == "social_media_timer") {
            await chrome.storage.local.set({"social_media_timer": timer});
            if (firebase_vars.logged_in_bool) {
                try {
                    await setDoc(doc(firestore, "users", firebase_vars.user_id), {social_media_timer: timer}, {merge: true});
                } catch (error) {
                    console.log("Error updating from timer update", error);
                }
            }
        //Same as above for streaming timer
        } else if (timer_name == "streaming_timer") {
            await chrome.storage.local.set({"streaming_timer": timer});
            if (firebase_vars.logged_in_bool) {
                try {
                    await setDoc(doc(firestore, "users",firebase_vars.user_id), {streaming_timer: timer}, {merge: true});
                } catch (error) {
                    console.log("Error updating from timer update", error);
                }
            }
        }
    }
}

//Runs whenever the extension is first installed, default values
chrome.runtime.onInstalled.addListener(async () => {
    let logged_in_bool = false;
    let user_id = null;
    await chrome.storage.local.set({
        "category_lists": {
            "social_media": ["facebook", "myspace", "twitter", "flickr", "linkedin", "photobucket", "digg", "ning", "tagged", "squidoo", "instagram", "whatsapp", "tiktok", "reddit", "pinterest", "vk", "discord", "ok", "zhihu", "line", "telegram", "peachavocado", "snapchat", "namu", "tumblr", "ameblo", "nextdoor", "wibo", "xiaohongshu", "heylink", "slack", "kwai", "zalo", "threads", "hatenablog", "atid", "slideshare", "livejournal", "discordapp", "ssstik", "otakudesu", "bukusai", "fb", "ptt", "snaptik", "zaloapp", "dcard", "youtubekids", "ameba", "groupme", "wechat", "messenger", "imo", "fbsbx"],
            "streaming": ["youtube", "twitch", "netflix", "max", "disneyplus", "primevideo", "miguvideo", "nicovideo", "fmoviesz", "kinopoisk", "hulu", "dailymotion", "xfinity", "aniwatch", "tenki", "crunchyroll", "hbomax", "hotstar", "tapmad", "nhk", "rutube", "mediaset", "programme-tv", "sky", "bfmtv", "zorox", "nrk", "peacocktv", "rezka", "jiocinema", "paramountplus", "vimeo", "yandex", "itponytaa", "iqiyi", "starplus", "afreecatv", "zdf", "hdrezka", "tver", "nos", "abema", "raiplay", "orf", "tvn24", "dramacool", "starz"] 
        },
        "social_media_timer": {
            "name": "social_media",
            "timer": 0,
            "buffer_timer": 0,
            "used_in_last_minute": false,
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
            "used_in_last_minute": false,
            "current_stage": "use",
            "cycle_num": 0,
            "time_stamp": Date.now(),
            "use_periods": [25, 20, 25, 10, 5],
            "suspend_periods": [8, 15, 20, 25, 30],
            "tab_active": false,
            "restriction_type": "timed"
        },
        "firebase_vars": {
            "logged_in_bool": logged_in_bool,
            "user_id": user_id
        }
    });
});

//Listens for alarm to go off (happens every minute), calls timer update function
chrome.alarms.onAlarm.addListener(async (alarm) => {
    update_timer("social_media_timer");
    update_timer("streaming_timer");
});

//Listens for a tab navigation to complete (any time the url is changed)
chrome.webNavigation.onCompleted.addListener(async (result) => {
    //checks current url for match in category lists
    let category_lists = (await chrome.storage.local.get("category_lists")).category_lists;
    let category = "";
    for (const ele of result.url.split(".")) {
        if (category_lists.social_media.includes(ele) && !result.url.includes("/embed/")) {
            category = "social_media";
        } else if (category_lists.streaming.includes(ele) && !result.url.includes("/embed/")) {
            category = "streaming";
        }
    }
    //If match is found and category is either restricted or timed and under suspend, redirects user to extension home page
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

//Listens for message passing from other javascript files, often sends responses
chrome.runtime.onMessage.addListener(async (message) => {
    let firebase_vars = (await chrome.storage.local.get("firebase_vars")).firebase_vars;
    //If message comes from create account page, create account for user and send response of success or error, update firestore data with local data
    if (message.sender == "create_account.js") {
        createUserWithEmailAndPassword(auth, message.credentials.email, message.credentials.password)
            .then(async (userCredential) => {
                const user = userCredential.user;
                firebase_vars.user_id = user.uid;
                chrome.runtime.sendMessage({
                    message: "Account Created Successfully",
                    sender: "service-worker.js",
                    target: "create_account.js"
                });
                try {
                    let category_lists = (await chrome.storage.local.get("category_lists")).category_lists;
                    let social_media_timer = (await chrome.storage.local.get("social_media_timer")).social_media_timer;
                    let streaming_timer = (await chrome.storage.local.get("streaming_timer")).streaming_timer;
                    await setDoc(doc(firestore, "users", firebase_vars.user_id), {
                        category_lists: category_lists,
                        social_media_timer: social_media_timer,
                        streaming_timer: streaming_timer
                    });
                } catch (error) {
                    console.log("Firestore doc creation failed", error);
                }
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.log("Code", errorCode, "Message", errorMessage);
                chrome.runtime.sendMessage({
                    message: `Account Creation failed. Error Message: ${errorMessage}`,
                    sender: "service-worker.js",
                    target: "create_account.js"
                });
            });
    //If message from login page, sign user in to existing account, send success or failure response
    } else if (message.sender == "login.js") {
        signInWithEmailAndPassword(auth, message.credentials.email, message.credentials.password)
            .then((userCredential) => {
                const user = userCredential.user;
                chrome.runtime.sendMessage({
                    message: "Account Logged In",
                    sender: "service-worker.js",
                    target: "login.js"
                });
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.log("Code", errorCode, "Message", errorMessage);
                chrome.runtime.sendMessage({
                    message: `Login failed. Error Message: ${errorMessage}`,
                    sender: "service-worker.js",
                    target: "login.js"
                });
            });
    //If message from home page, send bool value for whether a user is logged in
    } else if (message.sender == "home.js") {
        if (message.message == "check_login_status") {
            chrome.runtime.sendMessage({
                sender: "service-worker.js",
                target: "home.js",
                user_bool: firebase_vars.logged_in_bool
            });
        } else if (message.message == "logout") {
            signOut(auth)
                .then(() => {
                    console.log("User signed out successfully");
                }).catch(() => {
                    console.log("Sign out Failed");
                });
        }
    //If message from options page, get updated local storage and save to firestore storage
    } else if (message.sender == "options.js") {
        try {
            let category_lists = (await chrome.storage.local.get("category_lists")).category_lists;
            let social_media_timer = (await chrome.storage.local.get("social_media_timer")).social_media_timer;
            let streaming_timer = (await chrome.storage.local.get("streaming_timer")).streaming_timer;
            await setDoc(doc(firestore, "users", firebase_vars.user_id), {
                category_lists: category_lists,
                social_media_timer: social_media_timer,
                streaming_timer: streaming_timer
            });
        } catch (error) {
            console.log("Firestore doc creation failed", error);
        }
    }
    await chrome.storage.local.set({"firebase_vars": firebase_vars});
});

//Occurs on first run of script and anytime the user signs in or out, so occurs every minute at least, saves firebase storage to corresponding local storage
onAuthStateChanged(auth, async (user) => {
    let firebase_vars = (await chrome.storage.local.get("firebase_vars")).firebase_vars;
    //If user is logged in
    if (user) {
        firebase_vars.logged_in_bool = true;
        firebase_vars.user_id = user.uid;
        console.log(firebase_vars.logged_in_bool);
        const doc_snap = await getDoc(doc(firestore, "users", firebase_vars.user_id));
        if (doc_snap.exists()) {
            await chrome.storage.local.set({"category_lists": doc_snap.data().category_lists});
            await chrome.storage.local.set({"social_media_timer": doc_snap.data().social_media_timer});
            await chrome.storage.local.set({"streaming_timer": doc_snap.data().streaming_timer});
        } else {
            console.log("Doc getting failed");
        }
    } else {
        firebase_vars.logged_in_bool = false;
    }
    await chrome.storage.local.set({"firebase_vars": firebase_vars});
});

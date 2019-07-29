let waitingForStartMap = {};
let itemList = [];
let timerMap = {};
let preference = {
    showNotificationAfterSuccess: true,
    showNotificationAfterFailed: true
};
const QUERY_STATE_INTERVAL = 500;

main();


function main() {
    chrome.downloads.setShelfEnabled(false);
    chrome.storage.local.get(['preference', 'history'], result => {
        // console.log(`loadHistory, ${result.history}`);

        if (result.preference) {
            preference = Object.assign(preference, result.preference);
        }

        let itemList = [];
        if (result.history) {
            itemList = result.history;
        }

        itemList.forEach(item => {
            if (item.state === 'in_progress') {
                startTimerById(item.id);
            }
        });
        updateBadge();

        chrome.downloads.onCreated.addListener(item => onItemCreated(item));
        chrome.downloads.onErased.addListener(id => onItemRemoved(id));
        chrome.downloads.onChanged.addListener(delta => onItemChanged(delta));
        chrome.storage.onChanged.addListener(changes => {
            if (changes.preference) {
                preference = Object.assign(preference, changes.preference.newValue);
            }
        });
    });
}

function updateBadge() {
    let downloadingCount = 0;
    itemList.forEach(item => {
        if (item.state === 'in_progress') downloadingCount++;
    });
    chrome.browserAction.setBadgeText({text: `${downloadingCount === 0 ? '' : (downloadingCount + '')}`});
}

function onItemCreated(item) {
    /**
     * {
     *     "bytesReceived": 0,
     *     "canResume": false,
     *     "danger": "safe",
     *     "exists": true,
     *     "fileSize": 3165,
     *     "filename": "",
     *     "finalUrl": "https://ss0.baidu.com/73x1bjeh1BF3odCf/it/u=1681391545,4187928589&fm=85",
     *     "id": 171,
     *     "incognito": false,
     *     "mime": "image/jpeg",
     *     "paused": false,
     *     "referrer": "https://www.baidu.com/baidu?isource=infinity&iname=baidu&itype=web&tn=02003390_42_hao_pg&ie=utf-8&wd=vue",
     *     "startTime": "2019-07-26T05:55:40.770Z",
     *     "state": "in_progress",
     *     "totalBytes": 3165,
     *     "url": "https://ss0.baidu.com/73x1bjeh1BF3odCf/it/u=1681391545,4187928589&fm=85"
     * }
     */
    waitingForStartMap[item.id] = item;
}


function onItemRemoved(id) {
    let index = getItemIndexById(id);
    if (index === -1) return;

    itemList.splice(index, 1);
    saveList();
}

function onItemChanged(delta) {
    // console.log(`delta, ${JSON.stringify(delta, null, 4)}`);
    if (delta.filename) {
        let item = null;
        if (waitingForStartMap.hasOwnProperty(delta.id)) {
            item = waitingForStartMap[delta.id];
            delete waitingForStartMap[delta.id];
        }
        if (item == null) return;

        item.filename = delta.filename.current;
        item.basename = item.filename.substr(item.filename.lastIndexOf('/') + 1);
        chrome.downloads.getFileIcon(item.id, url => {
            item.icon = url;
            itemList.unshift(item);
            updateBadge();
            startTimerById(item.id);
            saveList();
        });
    }

    if (delta.state) {
        if (delta.state.current === 'interrupted') {
            if (waitingForStartMap.hasOwnProperty(delta.id)) {
                delete waitingForStartMap[delta.id];
            }
        }
    }

    let item = getItemById(delta.id);
    if (item === null) return;

    if (delta.state) {
        item.state = delta.state.current;
        updateBadge();
    }

    if (delta.endTime) {
        item.endTime = delta.endTime.current;
    }

    if (delta.paused) {
        item.paused = delta.paused.current;
        if (!item.paused) {
            startTimerById(item.id);
        }
    }

    if (delta.canResume) {
        item.canResume = delta.canResume.current;
    }

    saveList();
}

function saveList() {
    // console.log(`saveList, ${JSON.stringify(itemList, null, 4)}`);
    chrome.storage.local.set({history: itemList});
}

function getItemById(id) {
    for (let i = 0; i < itemList.length; ++i) {
        if (itemList[i].id === id) return itemList[i];
    }
    return null;
}

function getItemIndexById(id) {
    for (let i = 0; i < itemList.length; ++i) {
        if (itemList[i].id === id) return i;
    }
    return -1;
}

function startTimerById(id) {
    if (timerMap.hasOwnProperty(id)) {
        clearTimerById(id);
    }
    timerMap[id] = setInterval(() => {
        chrome.downloads.search({id}, results => {
            // console.log(`timer, ${JSON.stringify(results, null, 4)}`);
            if (results.length === 0) {
                clearTimerById(id);
                return;
            }

            let newItem = results[0];
            let index = getItemIndexById(id);
            if (index === -1) {
                clearTimerById(id);
                return;
            }
            if (newItem.estimatedEndTime) {
                newItem.speed = (newItem.totalBytes - newItem.bytesReceived) / (((new Date(newItem.estimatedEndTime)).valueOf() - (new Date()).valueOf()) / 1000);
            }

            if(newItem.speed < 0) {
                delete newItem.speed;
            }

            itemList[index] = Object.assign(itemList[index], newItem);
            saveList();

            if (newItem.state === 'complete' && preference.showNotificationAfterSuccess) {
                chrome.notifications.create(`state_of_${newItem.id}`, {
                    type: 'basic',
                    iconUrl: itemList[index].icon,
                    title: "Thunder Download Manager", // TODO 多语言
                    message: `Download ${newItem.filename} Finished` // TODO 多语言
                });
            }

            if (newItem.state === 'interrupted' && preference.showNotificationAfterFailed) {
                chrome.notifications.create(`state_of_${newItem.id}`, {
                    type: 'basic',
                    iconUrl: itemList[index].icon,
                    title: "Thunder Download Manager", // TODO 多语言
                    message: `Download ${newItem.filename} Failed` // TODO 多语言
                });
            }

            if (newItem.state !== 'in_progress' || newItem.paused) {
                clearTimerById(id);
            }
        });
    }, QUERY_STATE_INTERVAL);
}

function clearTimerById(id) {
    clearInterval(timerMap[id]);
    delete timerMap[id];
}
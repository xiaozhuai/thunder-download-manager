let waitingForStartMap = {};
let itemList = [];
let timerMap = {};
let preference = {
    showNotificationAfterSuccess: true,
    showNotificationAfterFailed: true,
    playSoundAfterSuccess: true,
    playSoundAfterFailed: true,
};
const QUERY_STATE_INTERVAL = 500;

main();

let tr = (name) => chrome.i18n.getMessage(name);

String.prototype.format = function (kwargs) {
    return this.replace(/\{\{\s*(\w+)\s*\}\}/g, function (k, v) {
        return kwargs[v]
    });
};

function isMac() {
    return /macintosh|mac os x/i.test(navigator.userAgent);
}

function main() {
    chrome.downloads.setShelfEnabled(false);
    chrome.storage.local.get(['preference', 'history'], result => {
        // console.log(`loadHistory, ${JSON.stringify(result.history, null, 4)}`);

        if (result.preference) {
            preference = Object.assign(preference, result.preference);
        }

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
    chrome.notifications.onClicked.addListener(notificationId => {
        if (/^notify_success_/i.test(notificationId)) {
            let itemId = parseInt(notificationId.substr('notify_success_'.length));
            chrome.downloads.open(itemId);
        }
    });
    chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
        if (/^notify_success_/i.test(notificationId)) {
            let itemId = parseInt(notificationId.substr('notify_success_'.length));
            switch (buttonIndex) {
                case 0:
                    chrome.downloads.open(itemId);
                    break;
                case 1:
                    chrome.downloads.show(itemId);
                    break;
            }
        }
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

        if (delta.danger) {
            item.danger = delta.danger.current;
        }

        item.filename = delta.filename.current;
        item.basename = item.filename.split(/[\\/]/).pop();
        item.timestamp = (new Date().valueOf());
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
        if (item.state === 'complete') {
            item.bytesReceived = item.fileSize
        }
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

    if (delta.exists) {
        item.exists = delta.exists.current;
    }

    if (delta.danger) {
        item.danger = delta.danger.current;
    }

    saveList();
}

function saveList() {
    // console.log(`saveList, ${JSON.stringify(itemList, null, 4)}`);
    chrome.storage.local.set({history: itemList});
    chrome.runtime.sendMessage({
        action: 'setItemList',
        data: itemList
    });
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

            newItem.timestamp = (new Date().valueOf());
            newItem.speed = (newItem.bytesReceived - itemList[index].bytesReceived) / ((newItem.timestamp - itemList[index].timestamp) / 1000);

            itemList[index] = Object.assign(itemList[index], newItem);
            saveList();

            if (newItem.state === 'complete') {
                if (preference.showNotificationAfterSuccess) {
                    chrome.notifications.create(`notify_success_${newItem.id}`, {
                        type: 'basic',
                        iconUrl: itemList[index].icon,
                        title: tr('extName'),
                        message: tr('downloadSucMsg').format(itemList[index]),
                        buttons: [
                            {title: tr('openFile')},
                            {title: isMac() ? tr('showFileMac') : tr('showFile')}
                        ]
                    });
                }

                if (preference.playSoundAfterSuccess) {
                    let audio = new Audio(chrome.runtime.getURL('sounds/finish.ogg'));
                    audio.play().then();
                }
            }

            if (newItem.state === 'interrupted') {
                if (preference.showNotificationAfterFailed) {
                    chrome.notifications.create(`notify_failed_${newItem.id}`, {
                        type: 'basic',
                        iconUrl: itemList[index].icon,
                        title: tr('extName'),
                        message: tr('downloadErrMsg').format(itemList[index])
                    });
                }

                if (preference.playSoundAfterFailed) {
                    let audio = new Audio(chrome.runtime.getURL('sounds/error.ogg'));
                    audio.play().then();
                }
            }

            if (newItem.state !== 'in_progress' || newItem.paused) {
                clearTimerById(id);
            }

            updateBadge();
        });
    }, QUERY_STATE_INTERVAL);
}

function clearTimerById(id) {
    clearInterval(timerMap[id]);
    delete timerMap[id];
}
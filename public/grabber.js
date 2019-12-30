function grabAllImgTags(doc) {
    let list = [];
    for (let el of Array.from(doc.getElementsByTagName('img'))) {
        list.push({
            type: 'image',
            url: el.src,
        });
    }
    return list;
}

function grabAllBackgroundImages(doc) {
    let list = [];
    const srcChecker = /url\(\s*?['"]?\s*?(\S+?)\s*?["']?\s*?\)/i;
    for (let el of Array.from(doc.querySelectorAll('*'))) {
        let prop = window.getComputedStyle(el, null).getPropertyValue('background-image');
        let match = srcChecker.exec(prop);
        if (match) {
            list.push({
                type: 'image',
                url: match[1],
            });
        }
    }
    return list;
}

function grabAllVideoTags(doc) {
    let list = [];
    for (let el of Array.from(doc.getElementsByTagName('video'))) {
        list.push({
            type: 'video',
            thumb: el.poster,
            url: el.src,
        });
    }
    return list;
}

function grabAllAudioTags(doc) {
    let list = [];
    for (let el of Array.from(doc.getElementsByTagName('audio'))) {
        list.push({
            type: 'audio',
            url: el.src,
        });
    }
    return list;
}

function getAllDoc(doc = document) {
    let docs = [doc];
    for (let iframe of Array.from(doc.querySelectorAll('iframe'))) {
        try {
            docs = docs.concat(getAllDoc(iframe.contentDocument || iframe.contentWindow.document));
        } catch (e) {

        }
    }
    return docs;
}

function filterList(list) {
    let newList = [];
    let allUrl = [];
    for (let item of list) {
        if (item.url === '') {
            continue;
        }
        if (allUrl.indexOf(item.url) >= 0) {
            continue;
        }
        allUrl.push(item.url);
        newList.push(item);
    }
    return newList;
}

function grabAll() {
    let list = [];
    let docs = getAllDoc();

    for (let doc of docs) {
        list = list
            .concat(grabAllImgTags(doc))
            .concat(grabAllBackgroundImages(doc))
            .concat(grabAllVideoTags(doc))
            .concat(grabAllAudioTags(doc));
    }

    // console.log(JSON.stringify(list, null, 4));
    list = filterList(list);
    // console.log(JSON.stringify(list, null, 4));
    return list;
}

grabAll();
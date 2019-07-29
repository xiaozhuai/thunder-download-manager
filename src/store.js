import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex);

let store = new Vuex.Store({
    state: {
        itemList: [],
    },
    mutations: {
        setItemList(state, list) {
            state.itemList = list;
        },
        removeItemIndexOf(state, index) {
            let list = state.itemList;
            list.splice(index, 1);
            state.itemList = list;
            storeHistory();
        },
        removeItemById(state, id) {
            let list = state.itemList;
            let index = -1;
            for (let i = 0; i < list.length; ++i) {
                if (list[i].id === id) index = i;
            }
            if (index === -1) return;
            list.splice(index, 1);
            state.itemList = list;
            storeHistory();
        }
    },
    actions: {}
});

function storeHistory() {
    chrome.storage.local.set({history: store.state.itemList}, () => {
        console.log("save history to storage");
    });
}

export default store;
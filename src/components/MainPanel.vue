<template>
    <div class="main-panel">
        <div class="header">
            <img class="logo" src="../assets/logo.png" alt="logo"/>
            <div class="title">{{$tr('extName')}}</div>
        </div>
        <div class="body">
            <div class="file-list">
                <template v-for="item of $store.state.itemList">
                    <file-item :item="item"/>
                </template>
            </div>
        </div>
        <div class="footer">
            <el-button :title="$tr('newTaskButtonTitle')" circle icon="el-icon-plus"
                       @click="showNewTaskDialog"/>
            <el-button :title="$tr('settingsButtonTitle')" circle icon="el-icon-setting"
                       @click="preferencePanelVisible = true"/>
            <el-button :title="$tr('aboutButtonTitle')" circle icon="el-icon-coordinate"
                       @click="aboutPanelVisible = true"/>
            <el-popover
                    placement="top"
                    width="160"
                    v-model="clearPopoverVisible">
                <div class="clear-options">
                    <div class="clear-option" @click="clearAllFinished(false)">{{$tr('clearAllFinishedTitle')}}</div>
                    <div class="clear-option" @click="clearAllFailed()">{{$tr('clearAllFailedTitle')}}</div>
                    <div class="clear-option" @click="clearAllDeleted()">{{$tr('clearAllDeletedTitle')}}</div>
                </div>
                <el-button :title="$tr('clearButtonTitle')" circle icon="el-icon-delete" slot="reference"/>
            </el-popover>
            <!--            <el-button :title="$tr('explorerButtonTitle')" circle icon="el-icon-magic-stick"/>-->
        </div>
        <el-drawer
                :title="$tr('settingsPanelTitle')"
                :visible.sync="preferencePanelVisible"
                direction="btt"
                size="100%">
            <preference-panel/>
        </el-drawer>
        <el-drawer
                :title="$tr('aboutPanelTitle')"
                :visible.sync="aboutPanelVisible"
                @open="() => { if($refs.aboutPanel) $refs.aboutPanel.updateRepoInfo(); }"
                direction="btt"
                size="100%">
            <about-panel ref="aboutPanel"/>
        </el-drawer>
    </div>
</template>

<script>
import FileItem from "./FileItem";
import PreferencePanel from "./PreferencePanel";
import AboutPanel from "./AboutPanel";

export default {
    name: "MainPanel",
    components: {AboutPanel, PreferencePanel, FileItem},
    created() {
        this.loadHistory();
        this.registerMessageListener();
    },
    data() {
        return {
            clearPopoverVisible: false,
            preferencePanelVisible: false,
            aboutPanelVisible: false,
            hasShowAcceptDanger: {}
        }
    },
    methods: {
        loadHistory() {
            chrome.storage.local.get(['history'], result => {
                let itemList = [];
                if (result.history) {
                    itemList = result.history;
                }
                this.$store.commit('setItemList', itemList);
                this.autoShowAcceptDanger();
            });
        },
        registerMessageListener() {
            chrome.runtime.onMessage.addListener(msg => {
                if (msg.action === 'setItemList') {
                    this.$store.commit('setItemList', msg.data);
                    this.autoShowAcceptDanger();
                }
            });
        },
        autoShowAcceptDanger() {
            this.$store.state.itemList.forEach(item => {
                if (item.danger !== 'safe' && item.danger !== 'accepted' && !this.hasShowAcceptDanger.hasOwnProperty(item.id)) {
                    console.log(`acceptDanger, id: ${item.id}`);
                    this.hasShowAcceptDanger[item.id] = true;
                    chrome.downloads.acceptDanger(item.id, () => {
                        delete this.hasShowAcceptDanger[item.id];
                    });
                }
            });
        },
        showNewTaskDialog() {
            this.$prompt(this.$tr('pleaseInputUrl'), this.$tr('newTaskDialogTitle'), {
                confirmButtonText: this.$tr('confirm'),
                cancelButtonText: this.$tr('cancel'),
            }).then(({value}) => {
                chrome.downloads.download({
                    url: value,
                }, id => {
                    if (chrome.extension.lastError && chrome.extension.lastError.message === 'Invalid URL') {
                        this.$message.error(this.$tr('invalidUrl'));
                        return;
                    }
                    console.log(`new task created, id: ${id}`);
                });
            }).catch(() => {
            });
        },
        clearAllFinished(removeFile = false) {
            this.clearPopoverVisible = false;
            this.$store.state.itemList.forEach(item => {
                if (item.state === 'complete') {
                    let id = item.id;
                    if (removeFile) {
                        chrome.downloads.removeFile(id, () => {
                            console.log(`removeFile ${id}`);
                            chrome.downloads.erase({id: id}, (ids) => {
                                console.log(`erase ${JSON.stringify(ids, null, 4)}`);
                                this.$store.commit('removeItemById', id);
                            });
                        });
                    } else {
                        chrome.downloads.erase({id: id}, (ids) => {
                            console.log(`erase ${JSON.stringify(ids, null, 4)}`);
                            this.$store.commit('removeItemById', id);
                        });
                    }
                }
            });
        },
        clearAllFailed() {
            this.clearPopoverVisible = false;
            this.$store.state.itemList.forEach(item => {
                if (item.state === 'interrupted') {
                    let id = item.id;
                    chrome.downloads.erase({id: id}, (ids) => {
                        console.log(`erase ${JSON.stringify(ids, null, 4)}`);
                        this.$store.commit('removeItemById', id);
                    });
                }
            });
        },
        clearAllDeleted() {
            this.clearPopoverVisible = false;
            this.$store.state.itemList.forEach(item => {
                if (!item.exists) {
                    let id = item.id;
                    chrome.downloads.erase({id: id}, (ids) => {
                        console.log(`erase ${JSON.stringify(ids, null, 4)}`);
                        this.$store.commit('removeItemById', id);
                    });
                }
            });
        }
    }
}
</script>

<style scoped>
.main-panel {
    width: 100%;
    height: 100%;
}

.main-panel > .header {
    width: 100%;
    height: 40px;
    border-bottom: 1px solid #dddddd;
    box-sizing: border-box;
    padding: 6px 12px;
}

.main-panel > .body {
    width: 100%;
    height: calc(100% - 80px);
}

.main-panel > .footer {
    width: 100%;
    height: 40px;
    border-top: 1px solid #dddddd;
    box-sizing: border-box;
    padding: 5px 12px;
}

.main-panel > .footer > * + * {
    margin-left: 10px;
}

.logo {
    width: 28px;
    height: 28px;
    display: inline-block;
}

.title {
    font-size: 14px;
    margin-left: 18px;
    display: inline-block;
    line-height: 28px;
    vertical-align: top;
}

.file-list {
    width: 100%;
    height: 100%;
    overflow-y: auto;
}

.file-list .file-item:last-child {
    border-bottom: none;
}

.clear-options {
    width: 100%;
}

.clear-option {
    width: 100%;
    line-height: 32px;
    box-sizing: border-box;
    border-bottom: 1px solid #eeeeee;
    padding: 0 6px;
    cursor: pointer;
}

.clear-option:hover {
    background-color: #eeeeee
}

.clear-option:last-child {
    border-bottom: none;
}
</style>

<style>
.el-dialog__wrapper {
    overflow: hidden !important;
}

.el-message-box {
    width: 80%;
}
</style>

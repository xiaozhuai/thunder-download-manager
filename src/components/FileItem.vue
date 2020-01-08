<template>
    <div class="file-item" @dblclick="openFile">
        <div :title="item.state === 'complete' ? $tr('pressToDrag') : ''" style="display: inline-block;">
            <img class="icon" :src="item.icon" draggable="false" alt="icon"/>
        </div>
        <div class="right-container">
            <div class="filename">{{item.basename || '&nbsp;'}}</div>
            <div class="url">{{fileUrl || '&nbsp;'}}</div>
            <div class="buttons">
                <el-button
                        :title="$tr('openFile')"
                        class="button" type="text" icon="el-icon-document"
                        v-if="item.state === 'complete'"
                        @click="openFile"/>

                <el-button
                        :title="isMac ? $tr('showFileMac') : $tr('showFile')"
                        class="button" type="text" icon="el-icon-folder"
                        v-if="item.state === 'complete'"
                        @click="showFileInDir"/>

                <el-button
                        :title="$tr('copyLink')"
                        class="button" type="text" icon="el-icon-link"
                        @click="copyLink"/>

                <el-button
                        :title="$tr('pauseDownload')"
                        class="button" type="text" icon="el-icon-video-pause"
                        v-if="item.state === 'in_progress' && !item.paused"
                        @click="pauseDownload"/>

                <el-button
                        :title="$tr('resumeDownload')"
                        class="button" type="text" icon="el-icon-refresh-right"
                        v-if="item.state === 'in_progress' && item.paused"
                        @click="resumeDownload"/>

                <!--                <el-button-->
                <!--                        :title="$tr('reDownload')"-->
                <!--                        class="button" type="text" icon="el-icon-refresh-left"-->
                <!--                        v-if="item.state !== 'in_progress'"-->
                <!--                        @click="reDownload"/>-->

                <el-popover
                        v-if="item.state === 'complete' && item.exists"
                        v-model="removeFilePopoverVisible"
                        placement="right"
                        width="160"
                        style="margin-left: 8px;">
                    <p>{{$tr('alsoRemoveFile')}}</p>
                    <div style="text-align: right; margin: 0">
                        <el-button size="mini" type="text" @click="deleteItem(true)">{{$tr('yes')}}</el-button>
                        <el-button type="primary" size="mini" @click="deleteItem(false)">{{$tr('no')}}</el-button>
                    </div>
                    <el-button
                            :title="$tr('removeDownload')"
                            slot="reference"
                            class="button" type="text" icon="el-icon-close"/>
                </el-popover>

                <el-button
                        :title="$tr('removeDownload')"
                        class="button" type="text" icon="el-icon-close"
                        v-if="item.state === 'complete' && !item.exists"
                        @click="deleteItem(false)"/>

                <el-button
                        :title="$tr('stopDownload')"
                        class="button" type="text" icon="el-icon-close"
                        v-if="item.state === 'in_progress' || item.state === 'interrupted'"
                        @click="cancelDownload"/>
            </div>
            <div class="info">
                <div class="fileSize">
                    {{item.state === 'in_progress' && item.fileSize === 0 ? $tr('unknownFileSize') : humanReadableSize}}
                </div>
                <el-progress
                        class="progress"
                        :percentage="percentage"
                        :show-text="false"
                        v-if="item.state === 'in_progress' && item.fileSize !== 0"/>
                <div class="right-text">
                    <div class="progressText" v-if="item.state === 'in_progress'">{{humanReadablePercentAndSpeed}}</div>
                    <div class="infoText" v-if="item.state !== 'in_progress' || item.paused">{{infoText}}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "FileItem",
    props: {
        item: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            timer: null,
            removeFilePopoverVisible: false,
        }
    },
    computed: {
        isMac() {
            return /macintosh|mac os x/i.test(navigator.userAgent);
        },
        infoText() {
            switch (this.item.state) {
                case 'complete':
                    if (this.item.exists) {
                        return this.$moment(this.item.endTime).fromNow();
                    } else {
                        return this.$tr('fileRemoved');
                    }
                case 'interrupted':
                    return this.$tr('failedDownload');
                case 'in_progress':
                    if (this.item.paused) return this.$tr('paused');
                    else return '';
            }
        },
        fileUrl() {
            return this.item.finalUrl || this.item.url;
        },
        percentage() {
            return Math.round(this.item.bytesReceived / this.item.fileSize * 100);
        },
        humanReadableSize() {
            return this.bytesHumanReadable(this.item.fileSize);
        },
        humanReadablePercentAndSpeed() {
            if (this.percentage === 100 || this.item.paused || this.item.state !== 'in_progress' || !this.item.hasOwnProperty('speed')) {
                if (this.item.fileSize === 0) {
                    return '';
                } else {
                    return `${this.percentage}%`;
                }
            } else {
                if (this.item.fileSize === 0) {
                    return `${this.bytesHumanReadable(this.item.speed)}/s`;
                } else {
                    return `${this.percentage}%  ${this.bytesHumanReadable(this.item.speed)}/s`;
                }
            }
        }
    },
    watch: {
        item: {
            deep: true,
            handler() {
            }
        }
    },
    mounted() {
        // em......
        chrome.downloads.search({id: this.item.id}, () => {
        });
    },
    methods: {
        bytesHumanReadable(size) {
            if (size === 0) return 0;

            let unit = 'B';

            if (size > 1024) {
                unit = 'KB';
                size /= 1024;
            }

            if (size > 1024) {
                unit = 'MB';
                size /= 1024;
            }

            if (size > 1024) {
                unit = 'GB';
                size /= 1024;
            }

            if (size > 1024) {
                unit = 'TB';
                size /= 1024;
            }

            if (size > 1024) {
                unit = 'PB';
                size /= 1024;
            }

            if (size > 1024) {
                unit = 'EB';
                size /= 1024;
            }

            size = size.toFixed(2);
            if (parseFloat(size) === parseInt(size)) {
                size = parseInt(size);
            }

            return `${size} ${unit}`;
        },
        copyLink() {
            window.navigator.clipboard.writeText(this.fileUrl).then(() => {
                this.$message.success(this.$tr('sucCopyLink'));
            }).catch(() => {
                this.$message.error(this.$tr('errCopyLink'));
            });
        },
        openFile() {
            chrome.downloads.search({id: this.item.id}, items => {
                if (items.length === 0) return;
                let item = items[0];
                if (item.exists) {
                    chrome.downloads.open(this.item.id);
                } else {
                    this.$message.warning(this.$tr('fileNotExists'));
                }
            });
        },
        showFileInDir() {
            chrome.downloads.search({id: this.item.id}, items => {
                if (items.length === 0) return;
                let item = items[0];
                if (item.exists) {
                    chrome.downloads.show(this.item.id);
                } else {
                    this.$message.warning(this.$tr('fileNotExists'));
                }
            });
        },
        pauseDownload() {
            chrome.downloads.pause(this.item.id, () => {
                console.log(`pause download ${this.item.id}`);
            });
        },
        resumeDownload() {
            if (!this.item.canResume) {
                this.$message.error(this.$tr('errResume'));
                return;
            }
            chrome.downloads.resume(this.item.id, () => {
                console.log(`resume download ${this.item.id}`);
            });
        },
        // reDownload() {
        //     console.log(this.item.filename);
        //     chrome.downloads.download({
        //         url: this.fileUrl,
        //         filename: this.item.filename,
        //         conflictAction: 'overwrite'
        //     }, id => {
        //         if (id) {
        //             this.deleteItem();
        //             console.log(`restart download ${this.item.id} ---> ${id}`);
        //         }
        //     });
        // },
        deleteItem(removeFile = false) {
            this.removeFilePopoverVisible = false;
            if (removeFile) {
                chrome.downloads.removeFile(this.item.id, () => {
                    console.log(`removeFile ${this.item.id}`);
                    chrome.downloads.erase({id: this.item.id}, (ids) => {
                        console.log(`erase ${JSON.stringify(ids, null, 4)}`);
                        this.$store.commit('removeItemById', this.item.id);
                    });
                });
            } else {
                chrome.downloads.erase({id: this.item.id}, (ids) => {
                    console.log(`erase ${JSON.stringify(ids, null, 4)}`);
                    this.$store.commit('removeItemById', this.item.id);
                });
            }
        },
        cancelDownload() {
            chrome.downloads.cancel(this.item.id, () => {
                console.log(`cancel download ${this.item.id}`);
                this.deleteItem();
            });
        },
    }
}
</script>

<style scoped>
.file-item {
    width: 100%;
    height: 62px;
    border-bottom: 1px solid #eeeeee;
    overflow: hidden;
}

.file-item:hover {
    background-color: #eeeeee;
}

.icon {
    width: 32px;
    height: 32px;
    margin: 15px 12px;
    display: inline-block;
}

.right-container {
    display: inline-block;
    width: calc(100% - 68px);
    height: calc(100% - 12px);
    vertical-align: top;
    margin: 6px 12px 6px 0;
}

.filename {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
    color: #202020;
    line-height: 16px;
}

.url {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 11px;
    color: #606060;
    line-height: 16px;
}

.buttons {
    height: 18px;
}

.info {
    height: 18px;
}

.button {
    font-size: 16px;
    padding-top: 0;
    padding-bottom: 0;
    color: #202020;
}

.button:hover {
    color: #409EFF;
}

.file-item .buttons {
    display: none;
}

.file-item:hover .buttons {
    display: block;
}

.file-item .info {
    display: block;
}

.file-item:hover .info {
    display: none;
}

.fileSize, .infoText, .progressText {
    line-height: 18px;
    display: inline-block;
    color: #606060;
    vertical-align: top;
}

.right-text {
    display: inline-block;
    float: right;
    right: 12px;
}

.right-text > * + * {
    margin-left: 4px;
}

.progress {
    display: inline-block;
    margin-left: 12px;
    width: 138px;
    vertical-align: top;
    margin-top: 6px;
}
</style>
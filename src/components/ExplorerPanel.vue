<template>
    <div class="explorer-panel" v-loading="loading">
        <el-table :data="tableData" @selection-change="handleSelectionChange" style="width: 100%;" height="458">
            <el-table-column type="selection" width="42" align="center"/>
            <el-table-column width="54" align="center" label="Type">
                <i slot-scope="scope" :class="getIcon(scope.row.type)"></i>
            </el-table-column>
            <el-table-column prop="url" label="Url">
                <template slot-scope="scope">
                    <img-popover v-if="scope.row.type === 'image'" :src="scope.row.url"/>
                    <video-popover v-else-if="scope.row.type === 'video'" :src="scope.row.url"/>
                    <audio-popover v-else-if="scope.row.type === 'audio'" :src="scope.row.url"/>
                    <a v-else class="item-link" target="_blank" :href="scope.row.url">{{scope.row.url}}</a>
                </template>
            </el-table-column>
        </el-table>
        <div class="footer">
            <el-button :title="$tr('downloadSelectedFiles')" circle icon="el-icon-download"
                       @click="downloadSelectedFiles"/>
        </div>
    </div>
</template>

<script>
import ImgPopover from "./ImgPopover";
import VideoPopover from "./VideoPopover";
import AudioPopover from "./AudioPopover";

export default {
    name: "ExplorerPanel",
    components: {AudioPopover, VideoPopover, ImgPopover},
    data() {
        return {
            loading: true,
            tableData: [],
            selectedData: [],
        };
    },
    watch: {},
    mounted() {
        this.updateFiles();
    },
    methods: {
        getIcon(type) {
            switch (type) {
                case 'image':
                    return 'el-icon-picture-outline';
                case 'audio':
                    return 'el-icon-headset';
                case 'video':
                    return 'el-icon-video-camera';
                default:
                    return 'el-icon-document';
            }
        },
        handleSelectionChange(val) {
            this.selectedData = val;
        },
        downloadSelectedFiles() {
            for (let item of this.selectedData) {
                chrome.downloads.download({
                    url: item.url,
                });
            }
            this.$emit('click-download');
        },
        async updateFiles() {
            this.loading = true;
            try {
                this.tableData = await this.grabAllMediaFiles();
            } catch (e) {
                this.tableData = [];
                this.$message.error(e.message);
            }
            this.selectedData = [];
            this.loading = false;
        },
        grabAllMediaFiles() {
            return new Promise((resolve, reject) => {
                chrome.tabs.executeScript({
                    file: 'grabber.js'
                }, result => {
                    if(chrome.extension.lastError) {
                        reject(new Error(chrome.extension.lastError.message));
                    } else {
                        if (result.length === 1) {
                            resolve(result[0]);
                        } else {
                            reject(new Error('run grabber.js failed'));
                        }
                    }
                });
            });
        }
    }
}
</script>

<style scoped>
.item-link {
    text-decoration: none;
    color: #333 !important;
}

.explorer-panel > .footer {
    width: 100%;
    height: 40px;
    padding: 5px 12px;
}

.explorer-panel > .footer > * + * {
    margin-left: 10px;
}
</style>

<style>
.el-table .cell {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
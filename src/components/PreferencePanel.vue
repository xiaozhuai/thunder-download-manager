<template>
    <div class="preference-panel">
        <el-form ref="form" :model="preference" label-width="180px">
            <el-form-item :label="$tr('notifyAfterFinished')">
                <el-switch v-model="preference.showNotificationAfterSuccess"></el-switch>
            </el-form-item>
            <el-form-item :label="$tr('notifyAfterFailed')">
                <el-switch v-model="preference.showNotificationAfterFailed"></el-switch>
            </el-form-item>
            <el-form-item :label="$tr('playSoundAfterFinished')">
                <el-switch v-model="preference.playSoundAfterSuccess"></el-switch>
            </el-form-item>
            <el-form-item :label="$tr('playSoundAfterFailed')">
                <el-switch v-model="preference.playSoundAfterFailed"></el-switch>
            </el-form-item>
        </el-form>
    </div>
</template>

<script>
export default {
    name: "PreferencePanel",
    data() {
        return {
            preference: {
                showNotificationAfterSuccess: true,
                showNotificationAfterFailed: true,
                playSoundAfterSuccess: true,
                playSoundAfterFailed: true,
            }
        };
    },
    watch: {
        preference: {
            deep: true,
            handler() {
                chrome.storage.local.set({preference: this.preference});
            }
        }
    },
    created() {
        chrome.storage.local.get(['preference'], result => {
            if (result.preference) {
                this.preference = Object.assign(this.preference, result.preference);
            }
        });
    }
}
</script>

<style scoped>

</style>
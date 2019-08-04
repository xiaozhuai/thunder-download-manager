<template>
    <div class="about-panel">
        <el-form ref="form" :model="preference" label-width="100px">
            <el-form-item :label="$tr('currentVersion')">
                <span>{{packageInfo.version}}</span>
            </el-form-item>
            <el-form-item :label="$tr('license')">
                <span>{{packageInfo.license}}</span>
            </el-form-item>
            <el-form-item label="github">
                <a :href="packageInfo.repository.url" target="_blank">xiaozhuai/thunder-download-manager</a>
            </el-form-item>
            <el-form-item v-if="currentLocale === 'zh-CN'" label="QQ群">
                <span>773161099</span>
            </el-form-item>
            <el-form-item label="">
                <span>Give me a star if you like it!</span>
            </el-form-item>
        </el-form>
    </div>
</template>

<script>
import packageInfo from '../../package';

export default {
    name: "AboutPanel",
    data() {
        return {
            packageInfo: packageInfo
        }
    },
    computed: {
        currentLocale() {
            return chrome.i18n.getUILanguage();
        }
    }
}
</script>

<style scoped>

</style>
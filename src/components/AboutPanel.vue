<template>
    <div class="about-panel">
        <el-form ref="form" :model="preference" label-width="100px">
            <el-form-item :label="$tr('currentVersion')">
                <span>{{packageInfo.version}}</span>
            </el-form-item>
            <el-form-item :label="$tr('latestVersion')">
                <a :href="latestVersionUrl" target="_blank">{{latestVersion}}</a>
            </el-form-item>
            <el-form-item :label="$tr('license')">
                <a :href="packageInfo.repository.license_url" target="_blank">{{packageInfo.license}}</a>
            </el-form-item>
            <el-form-item label="github">
                <a :href="packageInfo.repository.url" target="_blank">xiaozhuai/thunder-download-manager</a>
            </el-form-item>
            <el-form-item label="">
                <el-badge :value="starsCount">
                    <a :href="packageInfo.repository.url" target="_blank">Give me a star!</a>
                </el-badge>
            </el-form-item>
        </el-form>
    </div>
</template>

<script>
import packageInfo from '../../package';
import axios from 'axios';

export default {
    name: "AboutPanel",
    data() {
        return {
            packageInfo: packageInfo,
            starsCount: '...',
            latestVersion: 'checking...',
            latestVersionUrl: '',
        }
    },
    mounted() {
        this.updateRepoInfo();
    },
    methods: {
        async updateRepoInfo() {
            let res;
            res = await axios.get(this.packageInfo.repository.api_url);
            if (res.status === 200) {
                this.starsCount = res.data.stargazers_count;
            }

            res = await axios.get(this.packageInfo.repository.release_api_url);
            if (res.status === 200) {
                this.latestVersion = res.data[0].tag_name;
                this.latestVersionUrl = res.data[0].html_url;
            } else {
                this.latestVersion = 'unknown';
                this.latestVersionUrl = '';
            }
        }
    }
}
</script>

<style scoped>
a {
    text-decoration: none;
    color: #000 !important;
}
</style>
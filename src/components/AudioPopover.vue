<template>
    <el-popover @show="onShow()" @hide="onHide()" trigger="hover">
        <audio :src="audioSrc" autoplay/>
        <img class="record" src="../assets/record.png" alt="record">
        <div slot="reference">
            <a class="audio-link" target="_blank" :href="src">{{src}}</a>
        </div>
    </el-popover>
</template>

<script>
export default {
    name: 'AudioPopover',
    components: {},
    props: {
        src: {
            type: String,
            default: '',
        },
    },
    data() {
        return {
            audioSrc: '',
        };
    },
    methods: {
        onShow() {
            this.audioSrc = this.src;
        },
        onHide() {
            this.audioSrc = '';
        }
    },
};
</script>

<style scoped>
.audio-link {
    display: inline-block !important;
    vertical-align: bottom;
    width: 100%;
    text-decoration: none;
    color: #333 !important;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}
</style>

<style>
.record {
    width: 160px;
    height: 160px;
    animation: spin 2s linear infinite;
}
@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>

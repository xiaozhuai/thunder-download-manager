<template>
    <el-popover @show="onShow()" @hide="onHide()" trigger="hover">
        <div class="video-back">
            <video :src="videoSrc" width="160" autoplay muted loop>您的浏览器不支持video标签</video>
        </div>
        <div slot="reference">
            <a class="video-link" target="_blank" :href="src">{{src}}</a>
        </div>
    </el-popover>
</template>

<script>
export default {
    name: 'VideoPopover',
    components: {},
    props: {
        src: {
            type: String,
            default: '',
        },
    },
    data () {
        return {
            videoSrc: '',
        };
    },
    methods: {
        onShow () {
            this.videoSrc = this.src;
        },
        onHide () {
            this.videoSrc = '';
        },
    },
};
</script>

<style scoped>
.video-link {
    display: inline-block !important;
    vertical-align: bottom;
    width: 100%;
    text-decoration: none;
    color: #333 !important;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

video {
    vertical-align: bottom;
}

.video-back {
    border: 1px solid #ccc;
    background: url("../assets/transparent_grid_background.png") repeat left top;
    background-size: 8px 8px;
}
</style>

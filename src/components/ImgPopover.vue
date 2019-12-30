<template>
    <el-popover @show="onShow()" @hide="onHide()" trigger="hover">
        <div class="img-back"><img :src="picSrc" class="pic" alt=""></div>
        <div slot="reference">
            <a class="pic-link" target="_blank" :href="src">{{src}}</a>
        </div>
    </el-popover>
</template>

<script>
export default {
    name: 'ImgPopover',
    components: {},
    props: {
        src: {
            type: String,
            default: '',
        },
    },
    data() {
        return {
            picSrc: '',
        };
    },
    methods: {
        onShow() {
            this.picSrc = this.src;
        },
        onHide() {
            this.picSrc = '';
        }
    },
};
</script>

<style scoped>
.pic-link {
    display: inline-block !important;
    vertical-align: bottom;
    width: 100%;
    text-decoration: none;
    color: #333 !important;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.pic {
    display: block;
    margin: auto;
    width: 160px;
    outline: none;
}

.img-back {
    border: 1px solid #ccc;
    background: url("../assets/transparent_grid_background.png") repeat left top;
    background-size: 8px 8px;
}
</style>

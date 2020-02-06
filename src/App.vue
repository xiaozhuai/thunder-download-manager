<template>
    <div id="app">
        <main-panel/>
    </div>
</template>

<script>

import MainPanel from "./components/MainPanel";

export default {
    name: 'app',
    components: {
        MainPanel
    }
}
</script>

<style>
html, body, #app {
    margin: 0;
    padding: 0;
    width: 400px;
    height: 576px;
    overflow: hidden;
}
</style>

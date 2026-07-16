<template>
  <div style="display: flex; flex-direction: column; height: 100vh;">
    <!-- 内容区域 -->
    <div class="main-view">
      <router-view />
    </div>
  </div>
</template>

<script lang="ts" setup>
// 暂时移除 Header, MenuLeft 和自动检测逻辑，排查是否是这些导致了白屏
</script>

<style>
.main-view {
  flex: 1;
  background-color: #F5F5F5;
  overflow-y: auto; /* 允许垂直滚动 */
  /* padding 都去掉，完全占满 */
  padding: 0;
  margin: 0;
}
</style>
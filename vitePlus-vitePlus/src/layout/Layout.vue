<template>
  <div style="display: flex; flex-direction: column; height: 100vh;">
    <!-- 页头：非嵌入模式时显示 -->
    <Header v-if="!isEmbedded" />

    <!-- 主体区域：左侧菜单 + 内容 -->
    <div style="display: flex; flex: 1; overflow: hidden;">
      <!-- 左侧菜单：非嵌入模式时显示 -->
      <MenuLeft v-if="!isEmbedded" />

      <!-- 内容区域 -->
      <div :class="['main-view', { 'embed-mode': isEmbedded }]">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, provide } from 'vue'
import { useRoute } from 'vue-router'
import Header from '../components/Header.vue'
import MenuLeft from '../components/Menu_left.vue'

const route = useRoute()
const isEmbedded = ref(false)

// 提供 isEmbedded 给子组件使用
provide('isEmbedded', isEmbedded)

/**
 * 检测当前是否处于 iframe 嵌入模式：
 * 1. URL 查询参数中包含 ?embed=1 或 ?embed=true
 * 2. window.self !== window.top（在 iframe 中）
 */
function detectEmbedMode(): boolean {
  // 方式1: 通过 URL 查询参数显式指定嵌入模式
  const embedParam = route.query.embed
  if (embedParam === '1' || embedParam === 'true') {
    return true
  }
  // 方式2: 自动检测是否运行在 iframe 中
  try {
    if (window.self !== window.top) {
      return true
    }
  } catch (_e) {
    // 跨域情况下访问 window.top 会抛出异常，也说明在 iframe 中
    return true
  }
  return false
}

onMounted(() => {
  isEmbedded.value = detectEmbedMode()
})

// 监听路由 query 变化（用户可能在应用内从嵌入模式切换到非嵌入模式）
watch(
  () => route.query.embed,
  (newVal) => {
    if (newVal === '1' || newVal === 'true') {
      isEmbedded.value = true
    } else if (newVal === '0' || newVal === 'false' || newVal === undefined) {
      // 显式指定非嵌入模式，或参数被移除时，回退到自动检测
      isEmbedded.value = detectEmbedMode()
    }
  }
)
</script>

<style>
.main-view {
  flex: 1;
  background-color: #F5F5F5;
  overflow-y: auto;
  /* 为左侧固定菜单留出空间（菜单宽度 200px） */
  margin-left: 200px;
  padding: 20px;
  min-height: 0; /* 确保 flex 子元素可以正确收缩 */
}

/* 嵌入模式：全屏显示，无边距 */
.main-view.embed-mode {
  margin-left: 0;
  padding: 0;
}
</style>
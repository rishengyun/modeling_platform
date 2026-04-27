<template>
  <div class="competition-page">
    <section class="hero-card">
      <div>
        <p class="eyebrow">Industry Pivot</p>
        <h1>Linkrisk studio</h1>
        <h2>{{ overview?.industry_name || '产业链金融智能风控与信用评估平台' }}</h2>
        <p class="lead">
          {{ overview?.tagline || '以行业数据、低代码工作流和智能体增强能力为核心，把现有建模平台升级为更贴近真实业务场景的垂直解决方案。' }}
        </p>
        <div class="hero-actions">
          <el-button type="primary" @click="go('/workflowStudio')">进入工作流工坊</el-button>
          <el-button @click="go('/openServiceCenter')">查看开放服务中心</el-button>
        </div>
      </div>
      <div class="metric-grid">
        <div class="metric-card" v-for="item in metricCards" :key="item.label">
          <div class="metric-value">{{ item.value }}</div>
          <div class="metric-label">{{ item.label }}</div>
        </div>
      </div>
    </section>

    <section class="card-section">
      <div class="section-title">
        <el-icon><Opportunity /></el-icon>
        <span>市场痛点与行业机会</span>
      </div>
      <div class="card-grid">
        <div class="info-card" v-for="item in overview?.market_pain_points || []" :key="item.title">
          <h3>{{ item.title }}</h3>
          <p>{{ item.desc }}</p>
        </div>
      </div>
    </section>

    <section class="card-section">
      <div class="section-title">
        <el-icon><SetUp /></el-icon>
        <span>平台能力模块</span>
      </div>
      <div class="card-grid">
        <div class="info-card highlight-card" v-for="item in platformCapabilityModules" :key="item.name">
          <h3>{{ item.name }}</h3>
          <p>{{ item.summary }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { Opportunity, SetUp } from "@element-plus/icons-vue";
import { platformApi } from "@/api/platform";
import type { PlatformOverview } from "@/api/types";

const router = useRouter();
const overview = ref<PlatformOverview | null>(null);
const navCapabilities = [
  { name: "数据集管理", summary: "统一管理训练数据与字段，支持快速选择可用数据资产。" },
  { name: "自动建模", summary: "基于业务目标一键发起训练任务，并跟踪训练进度与结果。" },
  { name: "模型仓库", summary: "集中管理已训练模型，便于版本迭代与模型复用。" },
  { name: "在线服务", summary: "将模型发布为在线推理服务，支持稳定调用与运行监控。" },
  { name: "开放服务中心", summary: "面向外部系统统一开放 API，支持发布、调试与密钥管理。" },
  { name: "低代码工坊", summary: "通过可视化方式编排数据、建模和部署流程，快速搭建方案。" },
  { name: "智能体实验室", summary: "通过智能体能力辅助工作流生成、分析解释与业务协同。" },
  { name: "图谱服务", summary: "基于图谱能力关联企业与风险关系，支持图谱推理与查询。" },
];

const metricCards = computed(() => {
  const metrics = overview.value?.progress_metrics || {};
  return [
    { label: "我的任务", value: metrics.owned_tasks ?? 0 },
    { label: "我的服务", value: metrics.owned_services ?? 0 },
    { label: "公开服务", value: metrics.public_services ?? 0 },
    { label: "开放 API", value: metrics.published_open_services ?? 0 },
  ];
});

const platformCapabilityModules = computed(() => navCapabilities);

function go(path: string) {
  router.push(path);
}

async function loadData() {
  const overviewRes = await platformApi.getOverview();
  overview.value = overviewRes.data;
}

onMounted(() => {
  loadData().catch((error) => {
    console.error("行业工作台加载失败", error);
  });
});
</script>

<style scoped>
.competition-page {
  min-height: calc(100vh - 51px);
  padding: 24px;
  background: #f5f7fb;
}

.hero-card,
.card-section {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 10px 30px rgba(31, 45, 61, 0.08);
}

.hero-card {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 24px;
  padding: 28px;
  background: linear-gradient(135deg, #0f2d52, #185a8f);
  color: #fff;
}

.eyebrow {
  margin: 0 0 8px;
  opacity: 0.8;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.hero-card h1,
.hero-card h2 {
  margin: 0;
}

.hero-card h2 {
  margin-top: 8px;
  font-size: 24px;
  color: #c7edff;
}

.lead {
  margin-top: 16px;
  line-height: 1.7;
  font-size: 15px;
  max-width: 760px;
}

.hero-actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  align-self: center;
}

.metric-card {
  padding: 18px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(10px);
}

.metric-value {
  font-size: 30px;
  font-weight: 700;
}

.metric-label {
  margin-top: 6px;
  color: #d7edff;
}

.card-section {
  margin-top: 20px;
  padding: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
  font-size: 18px;
  font-weight: 700;
  color: #1f2d3d;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.info-card {
  padding: 18px;
  border-radius: 14px;
  border: 1px solid #edf2f7;
  background: #fbfdff;
}

.info-card h3 {
  margin: 0 0 10px;
  color: #103760;
}

.info-card p {
  margin: 0;
  color: #506070;
  line-height: 1.7;
}

.highlight-card {
  border-left: 4px solid #2d8cf0;
}

@media (max-width: 1100px) {
  .hero-card {
    grid-template-columns: 1fr;
  }
}
</style>

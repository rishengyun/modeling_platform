<template>
  <div class="page-shell">
    <section class="page-header">
      <div>
        <p class="eyebrow">Open API Hub</p>
        <h1>开放服务中心</h1>
        <p>把现有在线服务升级成平台级、可调试、可外部调用的统一 API 市场。</p>
      </div>
      <div class="header-actions">
        <el-button @click="loadMarket">刷新市场</el-button>
      </div>
    </section>

    <section class="summary-grid">
      <div class="summary-card">
        <div class="summary-value">{{ market.length }}</div>
        <div class="summary-label">可展示服务</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">{{ publishedCount }}</div>
        <div class="summary-label">已发布开放 API</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">{{ totalCalls }}</div>
        <div class="summary-label">累计调用次数</div>
      </div>
    </section>

    <section class="table-card">
      <el-table :data="market" stripe>
        <el-table-column prop="service_name" label="服务名称" min-width="180" />
        <el-table-column prop="scenario_label" label="业务场景" min-width="180" />
        <el-table-column prop="service_type" label="类型" min-width="120" />
        <el-table-column prop="publish_status" label="发布状态" min-width="120">
          <template #default="{ row }">
            <el-tag :type="row.is_open_api_published ? 'success' : 'warning'">
              {{ row.is_open_api_published ? "已发布" : "未发布" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="call_count" label="调用次数" min-width="120" />
        <el-table-column prop="avg_latency_ms" label="平均耗时(ms)" min-width="140">
          <template #default="{ row }">
            {{ formatLatency(row.avg_latency_ms) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="280" fixed="right">
          <template #default="{ row }">
            <div class="action-row">
              <el-button size="small" @click="openDetail(row.service_id)">详情</el-button>
              <el-button size="small" type="primary" :disabled="row.is_open_api_published" @click="publishService(row)">
                {{ row.is_open_api_published ? "已发布" : "发布" }}
              </el-button>
              <el-button size="small" type="success" :disabled="!row.is_open_api_published" @click="createKey(row)">
                生成密钥
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <el-drawer v-model="detailVisible" size="60%" :title="detail?.service_name || '服务详情'">
      <template v-if="detail">
        <div class="detail-grid detail-grid-full">
          <div class="detail-card">
            <h3>服务信息</h3>
            <div class="kv-row"><span>服务编码</span><code>{{ detail.is_open_api_published ? detail.service_code : "未发布" }}</code></div>
            <div class="kv-row"><span>版本</span><span>{{ detail.service_version }}</span></div>
            <div class="kv-row"><span>调用路径</span><code>{{ detail.is_open_api_published ? detail.invoke_path : "请先发布开放服务" }}</code></div>
            <div class="kv-row"><span>网关代理</span><code>{{ detail.gateway_proxy_path }}</code></div>
            <div class="kv-row"><span>状态</span><el-tag>{{ detail.service_state }}</el-tag></div>
            <div class="kv-row">
              <span>开放发布</span>
              <el-tag :type="detail.is_open_api_published ? 'success' : 'warning'">
                {{ detail.is_open_api_published ? "已发布" : "未发布" }}
              </el-tag>
            </div>
            <div class="kv-row"><span>业务说明</span><span>{{ detail.service_desc }}</span></div>
          </div>
        </div>

        <div class="detail-grid">
          <div class="detail-card">
            <h3>调用调试台</h3>
            <el-alert
              v-if="!detail.is_open_api_published"
              title="当前在线服务尚未发布到开放服务中心，请先点击列表中的“发布”按钮。"
              type="warning"
              :closable="false"
              show-icon
            />
            <el-input
              v-model="invokeForm.payload"
              type="textarea"
              :rows="12"
              placeholder="请输入 JSON 请求体"
              :disabled="!detail.is_open_api_published"
            />
            <div class="debug-actions">
              <el-input v-model="invokeForm.apiKey" placeholder="X-Api-Key（可选）" :disabled="!detail.is_open_api_published" />
              <el-input v-model="invokeForm.apiSecret" placeholder="X-Api-Secret（可选）" :disabled="!detail.is_open_api_published" />
              <el-button type="primary" :disabled="!detail.is_open_api_published" @click="invokeService">调用服务</el-button>
            </div>
            <pre class="result-block">{{ invokeResult }}</pre>
          </div>

          <div class="detail-card">
            <h3>密钥信息</h3>
            <div class="keys-panel">
              <div class="key-item" v-for="(key, index) in detail.api_keys" :key="index">
                <span>{{ key.key_name }} / {{ key.api_key }}</span>
                <el-tag size="small">{{ key.status }}</el-tag>
              </div>
              <div class="key-item" v-if="!detail.api_keys?.length">暂无密钥，可点击“生成密钥”创建平台接入凭证。</div>
            </div>
          </div>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { platformApi } from "@/api/platform";
import type { OpenServiceDetail, OpenServiceMarketItem } from "@/api/types";

const market = ref<OpenServiceMarketItem[]>([]);
const detail = ref<OpenServiceDetail | null>(null);
const detailVisible = ref(false);
const invokeResult = ref("等待调试结果...");
const invokeForm = ref({
  payload: JSON.stringify(
    {
      enterprise_code: "ENT-2026-001",
      invoice_overdue_days: 12,
      payback_volatility: 0.37,
    },
    null,
    2
  ),
  apiKey: "",
  apiSecret: "",
});

const publishedCount = computed(() => market.value.filter((item) => item.publish_status === "published").length);
const totalCalls = computed(() => market.value.reduce((sum, item) => sum + (item.call_count || 0), 0));

function pretty(value: unknown) {
  return JSON.stringify(value || {}, null, 2);
}

function formatLatency(value?: number | null) {
  return value == null ? "--" : value.toFixed(0);
}

async function loadMarket() {
  const res = await platformApi.getOpenServiceMarket();
  market.value = res.data || [];
}

async function openDetail(serviceId: string | number) {
  const res = await platformApi.getOpenServiceDetail({ service_id: serviceId });
  detail.value = res.data;
  invokeForm.value.payload = JSON.stringify(detail.value?.example_request || {}, null, 2);
  detailVisible.value = true;
  invokeResult.value = detail.value?.is_open_api_published
    ? "等待调试结果..."
    : "当前服务尚未发布到开放服务中心，请先点击列表中的“发布”按钮。";
}

async function publishService(row: OpenServiceMarketItem) {
  const payload = {
    service_id: row.service_id,
    service_code: row.service_code,
    scenario_label: row.scenario_label,
    business_domain: row.business_domain,
    service_version: row.service_version || "v1",
    example_request: row.sample_request,
  };
  await platformApi.publishOpenService(payload);
  ElMessage.success("开放服务已发布");
  await loadMarket();
  if (detailVisible.value) {
    await openDetail(row.service_id);
  }
}

async function createKey(row: OpenServiceMarketItem) {
  if (!row.is_open_api_published) {
    ElMessage.warning("请先发布开放服务，再生成 API Key");
    return;
  }
  const res = await platformApi.createOpenServiceKey({
    service_id: row.service_id,
    key_name: `${row.service_name}-平台接入密钥`,
  });
  const data = res.data || {};
  invokeForm.value.apiKey = String(data.api_key || "");
  invokeForm.value.apiSecret = String(data.api_secret || "");
  ElMessage.success("已生成 API Key，请在调试台直接使用");
  if (detailVisible.value) {
    await openDetail(row.service_id);
  }
}

async function invokeService() {
  if (!detail.value) return;
  if (!detail.value.is_open_api_published || !detail.value.invoke_path) {
    invokeResult.value = "当前服务尚未发布到开放服务中心，请先点击列表中的“发布”按钮。";
    return;
  }
  try {
    const response = await fetch(`/api${detail.value.invoke_path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(invokeForm.value.apiKey ? { "X-Api-Key": invokeForm.value.apiKey } : {}),
        ...(invokeForm.value.apiSecret ? { "X-Api-Secret": invokeForm.value.apiSecret } : {}),
      },
      body: invokeForm.value.payload,
    });
    const text = await response.text();
    try {
      invokeResult.value = JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      invokeResult.value = text;
    }
  } catch (error) {
    invokeResult.value = String(error);
  }
}

onMounted(() => {
  loadMarket().catch((error) => {
    console.error("开放服务市场加载失败", error);
  });
});
</script>

<style scoped>
.page-shell {
  min-height: calc(100vh - 51px);
  padding: 24px;
  background: #f5f7fb;
}

.page-header,
.summary-card,
.table-card,
.detail-card {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 10px 30px rgba(31, 45, 61, 0.08);
}

.page-header {
  padding: 24px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
}

.eyebrow {
  margin: 0 0 6px;
  color: #2d8cf0;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 12px;
}

.page-header h1 {
  margin: 0;
  color: #0f2d52;
}

.page-header p {
  margin: 8px 0 0;
  color: #607080;
}

.summary-grid {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.summary-card {
  padding: 20px;
}

.summary-value {
  font-size: 30px;
  font-weight: 700;
  color: #103760;
}

.summary-label {
  margin-top: 6px;
  color: #718096;
}

.table-card {
  margin-top: 20px;
  padding: 20px;
}

.action-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-bottom: 18px;
}

.detail-grid-full {
  grid-template-columns: 1fr;
}

.detail-card {
  padding: 18px;
}

.detail-card h3 {
  margin: 0 0 16px;
  color: #103760;
}

.kv-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px dashed #ebf0f6;
}

.kv-row code {
  font-size: 12px;
}

.json-block {
  margin-bottom: 16px;
}

.json-block h4 {
  margin: 0 0 8px;
  color: #3d5268;
}

.json-block pre,
.result-block {
  margin: 0;
  padding: 14px;
  border-radius: 12px;
  background: #0f1720;
  color: #d8e1eb;
  overflow: auto;
  font-size: 12px;
}

.debug-actions {
  margin: 12px 0;
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 12px;
}

.keys-panel {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.key-item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 12px;
  border-radius: 10px;
  background: #f8fbff;
  border: 1px solid #e6eef6;
}

@media (max-width: 1200px) {
  .summary-grid,
  .detail-grid,
  .debug-actions {
    grid-template-columns: 1fr;
  }
}
</style>

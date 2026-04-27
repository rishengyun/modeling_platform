<template>
  <div class="agent-page">
    <section class="page-header">
      <div>
        <p class="eyebrow">Agent Highlights</p>
        <h1>智能体亮点实验室</h1>
        <p>集中展示 Data Copilot、业务报告生成、RiskGraph Agent 和 Agent 自定义算子四类平台智能能力。</p>
      </div>
    </section>

    <section class="agent-grid">
      <div class="agent-card">
        <h3>Data Copilot</h3>
        <el-form label-width="110px">
          <el-form-item label="样本总量"><el-input v-model="datasetForm.sample_count" /></el-form-item>
          <el-form-item label="正样本"><el-input v-model="datasetForm.positive_count" /></el-form-item>
          <el-form-item label="负样本"><el-input v-model="datasetForm.negative_count" /></el-form-item>
          <el-form-item label="任务类型">
            <el-select v-model="datasetForm.task_type">
              <el-option label="分类" value="classification" />
              <el-option label="回归" value="regression" />
              <el-option label="时间序列预测" value="time_series_prediction" />
              <el-option label="命名实体识别" value="named_entity_recognition" />
            </el-select>
          </el-form-item>
        </el-form>
        <el-button type="primary" @click="analyzeDataset">生成把脉报告</el-button>
        <div v-if="datasetData?.llm_metadata" class="result-meta">
          <el-tag :type="datasetData.llm_metadata.mode === 'live_llm' ? 'success' : 'warning'">
            {{ datasetData.llm_metadata.mode === "live_llm" ? "DeepSeek 实时生成" : "本地规则兜底" }}
          </el-tag>
          <el-tag effect="plain">{{ datasetData.llm_metadata.model }}</el-tag>
          <el-tag v-if="datasetData.session_id" effect="plain">会话 {{ datasetData.session_id }}</el-tag>
        </div>
        <pre class="result-panel">{{ datasetResult }}</pre>
      </div>

      <div class="agent-card">
        <h3>业务解释报告</h3>
        <el-form label-width="110px">
          <el-form-item label="准确率"><el-input v-model="reportForm.accuracy" /></el-form-item>
          <el-form-item label="召回率"><el-input v-model="reportForm.recall" /></el-form-item>
          <el-form-item label="AUC"><el-input v-model="reportForm.auc" /></el-form-item>
          <el-form-item label="KS"><el-input v-model="reportForm.ks" /></el-form-item>
          <el-form-item label="业务场景"><el-input v-model="reportForm.scene" /></el-form-item>
        </el-form>
        <el-button type="primary" @click="generateReport">生成业务报告</el-button>
        <div v-if="reportData?.llm_metadata" class="result-meta">
          <el-tag :type="reportData.llm_metadata.mode === 'live_llm' ? 'success' : 'warning'">
            {{ reportData.llm_metadata.mode === "live_llm" ? "DeepSeek 实时生成" : "本地规则兜底" }}
          </el-tag>
          <el-tag effect="plain">{{ reportData.llm_metadata.model }}</el-tag>
          <el-tag v-if="reportData.session_id" effect="plain">会话 {{ reportData.session_id }}</el-tag>
        </div>
        <pre class="result-panel">{{ reportResult }}</pre>
      </div>

      <div class="agent-card">
        <h3>RiskGraph Agent</h3>
        <el-form label-width="110px">
          <el-form-item label="企业名称"><el-input v-model="graphForm.enterprise_name" /></el-form-item>
          <el-form-item label="关系摘要">
            <el-input v-model="graphForm.relationsText" type="textarea" :rows="4" />
          </el-form-item>
          <el-form-item label="特征重要性">
            <el-input v-model="graphForm.featureText" type="textarea" :rows="4" />
          </el-form-item>
        </el-form>
        <el-button type="primary" @click="explainGraph">生成图谱解释</el-button>
        <div v-if="graphData?.llm_metadata" class="result-meta">
          <el-tag :type="graphData.llm_metadata.mode === 'live_llm' ? 'success' : 'warning'">
            {{ graphData.llm_metadata.mode === "live_llm" ? "DeepSeek 实时生成" : "本地规则兜底" }}
          </el-tag>
          <el-tag effect="plain">{{ graphData.llm_metadata.model }}</el-tag>
          <el-tag v-if="graphData.session_id" effect="plain">会话 {{ graphData.session_id }}</el-tag>
        </div>
        <pre class="result-panel">{{ graphResult }}</pre>
      </div>

      <div class="agent-card">
        <h3>Agent 自定义算子</h3>
        <el-input
          v-model="agentNodePrompt"
          type="textarea"
          :rows="6"
          placeholder="例如：过滤过去 6 个月无有效交易的企业，并保留票据逾期超过 10 天的样本。"
        />
        <div class="prompt-tips">
          <el-tag effect="plain">Prompt to Script</el-tag>
          <el-tag effect="plain">Python / SQL</el-tag>
          <el-tag effect="plain">Sandbox Ready</el-tag>
        </div>
        <el-button type="primary" @click="generateAgentNode">生成算子脚本</el-button>
        <div v-if="agentNodeData?.llm_metadata" class="result-meta">
          <el-tag :type="agentNodeData.llm_metadata.mode === 'live_llm' ? 'success' : 'warning'">
            {{ agentNodeData.llm_metadata.mode === "live_llm" ? "DeepSeek 实时生成" : "本地规则兜底" }}
          </el-tag>
          <el-tag effect="plain">{{ agentNodeData.llm_metadata.model }}</el-tag>
          <el-tag v-if="agentNodeData.session_id" effect="plain">会话 {{ agentNodeData.session_id }}</el-tag>
        </div>
        <pre class="result-panel">{{ agentNodeResult }}</pre>
      </div>
    </section>

    <section class="history-section">
      <div class="page-header">
        <div class="history-head">
          <div>
            <p class="eyebrow">Agent Session Replay</p>
            <h2>智能会话记录</h2>
          </div>
          <el-button @click="loadSessions(activeScene)">刷新记录</el-button>
        </div>
        <el-tabs v-model="activeScene" @tab-change="handleSceneChange">
          <el-tab-pane label="Data Copilot" name="analyze_dataset" />
          <el-tab-pane label="业务报告" name="generate_business_report" />
          <el-tab-pane label="RiskGraph" name="explain_risk_graph" />
          <el-tab-pane label="Agent 算子" name="generate_agent_node" />
        </el-tabs>
      </div>

      <div class="history-grid">
        <div class="agent-card">
          <h3>最近会话</h3>
          <div class="session-list">
            <button
              v-for="item in sessions"
              :key="item.session_id"
              class="session-item"
              :class="{ active: item.session_id === activeSessionId }"
              @click="openSession(item.session_id)"
            >
              <div class="session-title">{{ item.title }}</div>
              <div class="session-preview">{{ item.preview || "暂无摘要" }}</div>
              <div class="session-foot">
                <span>{{ item.create_time }}</span>
                <span>{{ item.llm_metadata?.mode === "live_llm" ? "DeepSeek" : "兜底" }}</span>
              </div>
            </button>
          </div>
        </div>

        <div class="agent-card">
          <h3>消息明细</h3>
          <div v-if="messages.length" class="message-list">
            <div v-for="message in messages" :key="message.message_id" class="message-item">
              <div class="message-head">
                <el-tag size="small" :type="message.role === 'assistant' ? 'success' : 'info'">
                  {{ message.role === "assistant" ? "助手" : "用户" }}
                </el-tag>
                <span>{{ message.create_time }}</span>
              </div>
              <div class="message-content">{{ message.content }}</div>
            </div>
          </div>
          <el-empty v-else description="暂无会话消息" />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { platformApi } from "@/api/platform";
import type { AgentMessage, AgentSession, LlmMetadata } from "@/api/types";

type AgentResult = {
  llm_metadata?: LlmMetadata;
  session_id?: string;
  [key: string]: unknown;
};

const datasetForm = ref({
  sample_count: "1243",
  positive_count: "312",
  negative_count: "931",
  task_type: "classification",
});
const reportForm = ref({
  accuracy: "0.94",
  recall: "0.88",
  auc: "0.91",
  ks: "0.46",
  scene: "供应链金融风控",
});
const graphForm = ref({
  enterprise_name: "苏州某供应商",
  relationsText: "关联企业A：历史逾期；关联企业B：高频票据往来",
  featureText: "最近60天回款波动率；关联企业逾期数量；票据到期集中度",
});
const agentNodePrompt = ref("过滤过去 6 个月无有效交易的企业，并保留票据逾期超过 10 天的样本。");

const datasetResult = ref("等待结果...");
const reportResult = ref("等待结果...");
const graphResult = ref("等待结果...");
const agentNodeResult = ref("等待结果...");
const datasetData = ref<AgentResult | null>(null);
const reportData = ref<AgentResult | null>(null);
const graphData = ref<AgentResult | null>(null);
const agentNodeData = ref<AgentResult | null>(null);

const activeScene = ref("analyze_dataset");
const sessions = ref<AgentSession[]>([]);
const messages = ref<AgentMessage[]>([]);
const activeSessionId = ref("");

function pretty(value: unknown) {
  return JSON.stringify(value || {}, null, 2);
}

async function analyzeDataset() {
  const res = await platformApi.analyzeDataset({
    sample_count: Number(datasetForm.value.sample_count),
    positive_count: Number(datasetForm.value.positive_count),
    negative_count: Number(datasetForm.value.negative_count),
    task_type: datasetForm.value.task_type,
    columns: [
      { name: "invoice_overdue_days", type: "number", missing_rate: 0.08 },
      { name: "payback_volatility", type: "number", missing_rate: 0.21 },
      { name: "contract_text", type: "text", missing_rate: 0.03 },
    ],
  });
  datasetData.value = (res.data || null) as AgentResult | null;
  datasetResult.value = pretty(res.data);
  activeScene.value = "analyze_dataset";
  await loadSessions("analyze_dataset");
  await openSession(datasetData.value?.session_id || sessions.value[0]?.session_id);
}

async function generateReport() {
  const res = await platformApi.generateBusinessReport({
    accuracy: Number(reportForm.value.accuracy),
    recall: Number(reportForm.value.recall),
    auc: Number(reportForm.value.auc),
    ks: Number(reportForm.value.ks),
    scene: reportForm.value.scene,
  });
  reportData.value = (res.data || null) as AgentResult | null;
  reportResult.value = pretty(res.data);
  activeScene.value = "generate_business_report";
  await loadSessions("generate_business_report");
  await openSession(reportData.value?.session_id || sessions.value[0]?.session_id);
}

async function explainGraph() {
  const res = await platformApi.explainRiskGraph({
    enterprise_name: graphForm.value.enterprise_name,
    relations: graphForm.value.relationsText
      .split("；")
      .filter(Boolean)
      .map((item) => ({ name: item, detail: item })),
    feature_importance: graphForm.value.featureText
      .split("；")
      .filter(Boolean)
      .map((item) => ({ name: item })),
  });
  graphData.value = (res.data || null) as AgentResult | null;
  graphResult.value = pretty(res.data);
  activeScene.value = "explain_risk_graph";
  await loadSessions("explain_risk_graph");
  await openSession(graphData.value?.session_id || sessions.value[0]?.session_id);
}

async function generateAgentNode() {
  const res = await platformApi.generateAgentNode({
    prompt: agentNodePrompt.value,
  });
  agentNodeData.value = (res.data || null) as AgentResult | null;
  agentNodeResult.value = pretty(res.data);
  activeScene.value = "generate_agent_node";
  await loadSessions("generate_agent_node");
  await openSession(agentNodeData.value?.session_id || sessions.value[0]?.session_id);
}

async function loadSessions(scene: string) {
  const res = await platformApi.getAgentSessions({ scene_type: scene, limit: 10 });
  sessions.value = res.data || [];
}

async function openSession(sessionId?: string) {
  if (!sessionId) {
    activeSessionId.value = "";
    messages.value = [];
    return;
  }
  activeSessionId.value = sessionId;
  const res = await platformApi.getAgentSessionMessages({ session_id: sessionId });
  messages.value = res.data || [];
}

async function handleSceneChange(name: string | number) {
  const scene = String(name);
  await loadSessions(scene);
  await openSession(sessions.value[0]?.session_id);
}

onMounted(() => {
  loadSessions(activeScene.value).then(() => openSession(sessions.value[0]?.session_id)).catch((error) => {
    console.error("智能体会话加载失败", error);
  });
});
</script>

<style scoped>
.agent-page {
  min-height: calc(100vh - 51px);
  padding: 24px;
  background: #f5f7fb;
}

.page-header,
.agent-card {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 10px 30px rgba(31, 45, 61, 0.08);
}

.page-header {
  padding: 24px 28px;
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
  margin: 10px 0 0;
  color: #607080;
}

.agent-grid {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.agent-card {
  padding: 22px;
}

.agent-card h3 {
  margin: 0 0 16px;
  color: #103760;
}

.prompt-tips {
  margin: 12px 0;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.result-meta {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.result-panel {
  margin: 16px 0 0;
  padding: 16px;
  border-radius: 14px;
  background: #0f1720;
  color: #d8e1eb;
  overflow: auto;
  min-height: 180px;
  font-size: 12px;
}

.history-section {
  margin-top: 20px;
}

.history-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.history-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 18px;
}

.session-list,
.message-list {
  display: grid;
  gap: 12px;
}

.session-item {
  border: 1px solid #dce9f8;
  background: #f8fbff;
  border-radius: 14px;
  padding: 14px;
  text-align: left;
  cursor: pointer;
}

.session-item.active {
  border-color: #2d8cf0;
  box-shadow: inset 0 0 0 1px #2d8cf0;
}

.session-title {
  font-weight: 600;
  color: #103760;
}

.session-preview {
  margin-top: 8px;
  color: #607080;
  line-height: 1.6;
}

.session-foot,
.message-head {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #8091a5;
  font-size: 12px;
}

.message-item {
  border: 1px solid #e7eef7;
  border-radius: 14px;
  padding: 14px;
}

.message-content {
  margin-top: 10px;
  color: #33475b;
  line-height: 1.7;
  white-space: pre-wrap;
}

@media (max-width: 1200px) {
  .agent-grid,
  .history-grid {
    grid-template-columns: 1fr;
  }

  .history-head {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

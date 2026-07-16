<template>
  <div class="studio-page">
    <section class="studio-hero">
      <div>
        <p class="eyebrow">Guided Workflow Studio</p>
        <h1>低代码工作流工坊</h1>
        <p>通过选择场景、数据和字段生成可执行建模流程，也可以拖拽节点调整演示顺序。</p>
      </div>
      <div class="hero-actions">
        <el-button @click="resetWizard">重置</el-button>
        <el-button type="primary" :loading="compileLoading" @click="compileWorkflow">生成配置</el-button>
        <el-button type="success" :loading="runLoading" @click="runWorkflow">执行工作流</el-button>
      </div>
    </section>

    <section class="wizard-grid">
      <div class="panel-card main-wizard">
        <div class="section-head">
          <div>
            <p class="eyebrow">Step 1</p>
            <h2>选择业务场景</h2>
          </div>
          <el-tag effect="plain">{{ selectedScenario?.taskType || "classification" }}</el-tag>
        </div>
        <div class="scenario-grid">
          <button
            v-for="item in scenarios"
            :key="item.id"
            class="scenario-card"
            :class="{ active: wizard.scenarioId === item.id }"
            @click="selectScenario(item.id)"
          >
            <strong>{{ item.name }}</strong>
            <span>{{ item.desc }}</span>
          </button>
        </div>

        <el-divider />

        <div class="section-head">
          <div>
            <p class="eyebrow">Step 2</p>
            <h2>选择数据与字段</h2>
          </div>
          <el-button size="small" @click="loadDatasets">刷新数据集</el-button>
        </div>
        <el-form class="wizard-form" label-width="110px">
          <el-form-item label="工作流名称">
            <el-input v-model="compileForm.workflow_name" placeholder="请输入工作流名称" />
          </el-form-item>
          <el-form-item label="数据集">
            <el-select
              v-model="wizard.setId"
              filterable
              placeholder="请选择数据集"
              :loading="datasetLoading"
              @change="handleDatasetChange"
            >
              <el-option
                v-for="item in datasetOptions"
                :key="item.set_id"
                :label="`${item.set_name}（${item.set_id}）`"
                :value="String(item.set_id)"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="数据表">
            <el-select
              v-model="wizard.tableId"
              filterable
              placeholder="请选择数据表"
              :disabled="!tableOptions.length"
              @change="handleTableChange"
            >
              <el-option
                v-for="item in tableOptions"
                :key="item.table_id"
                :label="`${item.table_name}（${item.table_id}）`"
                :value="String(item.table_id)"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="目标列">
            <el-select
              v-model="compileForm.target_column"
              filterable
              allow-create
              placeholder="请选择或输入标签列"
              :disabled="!dataBindingReady"
            >
              <el-option v-for="col in columnOptions" :key="col" :label="col" :value="col" />
            </el-select>
          </el-form-item>
          <el-form-item label="特征列">
            <el-select
              v-model="compileForm.feature_columns"
              multiple
              filterable
              allow-create
              collapse-tags
              collapse-tags-tooltip
              placeholder="请选择模型输入字段"
              :disabled="!dataBindingReady"
            >
              <el-option
                v-for="col in featureColumnOptions"
                :key="col"
                :label="col"
                :value="col"
              />
            </el-select>
          </el-form-item>
        </el-form>

        <el-alert
          class="hint-alert"
          type="info"
          :closable="false"
          show-icon
          title="如果下拉框没有字段，可以先手动输入字段名；字段名必须和自动建模数据表中的列名一致。"
        />
      </div>
    </section>

    <section class="panel-card">
      <div class="section-head">
        <div>
          <p class="eyebrow">Step 3</p>
          <h2>拖拽式流程编排</h2>
        </div>
        <el-tag effect="plain">拖动节点可调整展示顺序</el-tag>
      </div>
      <div class="node-board">
        <div
          v-for="(node, index) in workflowNodes"
          :key="node.id"
          class="flow-node"
          :class="{ disabled: !node.enabled }"
          draggable="true"
          @dragstart="dragIndex = index"
          @dragover.prevent
          @drop="dropNode(index)"
        >
          <div class="node-index">{{ index + 1 }}</div>
          <div class="node-main">
            <div class="node-title">
              <span>{{ node.label }}</span>
              <el-switch v-model="node.enabled" size="small" />
            </div>
            <p>{{ node.desc }}</p>
            <div class="node-tags">
              <el-tag size="small" effect="plain">{{ node.category }}</el-tag>
              <el-tag v-if="node.config" size="small" type="success" effect="plain">{{ node.config }}</el-tag>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="result-grid">
      <div class="panel-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Step 4</p>
            <h2>配置预览</h2>
          </div>
          <el-switch v-model="compileForm.persist" active-text="保存工作流" />
        </div>
        <div class="summary-list">
          <div><span>场景</span><strong>{{ selectedScenario?.name }}</strong></div>
          <div>
            <span>数据集</span><strong>{{ selectedDataset?.set_name || (wizard.setId ? compileForm.set_id : "未选择") }}</strong>
          </div>
          <div>
            <span>数据表</span><strong>{{ selectedTable?.table_name || (wizard.tableId ? compileForm.table_id : "未选择") }}</strong>
          </div>
          <div><span>目标列</span><strong>{{ compileForm.target_column || "未选择" }}</strong></div>
          <div><span>特征列数量</span><strong>{{ compileForm.feature_columns.length }}</strong></div>
        </div>
        <el-collapse>
          <el-collapse-item title="查看 JSON 配置预览" name="preview">
            <pre class="json-block">{{ compilePreview }}</pre>
          </el-collapse-item>
        </el-collapse>
      </div>

      <div class="panel-card">
        <div class="section-head">
          <div>
            <p class="eyebrow">Runs</p>
            <h2>运行结果</h2>
          </div>
          <el-button size="small" :disabled="!persistedWorkflowId" @click="loadWorkflowRuns()">刷新记录</el-button>
        </div>
        <template v-if="workflowRunDetail">
          <div class="result-meta">
            <el-tag type="success">{{ workflowRunDetail.status }}</el-tag>
            <el-tag effect="plain">任务ID {{ workflowRunDetail.task_id || "待生成" }}</el-tag>
            <el-tag effect="plain">任务状态 {{ workflowRunDetail.task_state || "pending" }}</el-tag>
          </div>
          <div class="run-actions" v-if="workflowRunDetail.task_id">
            <el-button @click="goToTaskList">前往任务列表</el-button>
            <el-button type="primary" @click="goToTaskDetail">查看任务详情</el-button>
          </div>
          <pre class="json-block">{{ pretty(workflowRunDetail.runtime_summary) }}</pre>
        </template>
        <el-empty v-else description="执行后会在这里显示任务编号和运行摘要" />
      </div>
    </section>

    <section class="history-grid">
      <div class="panel-card">
        <div class="section-title">最近运行记录</div>
        <div v-if="workflowRuns.length" class="session-list">
          <button
            v-for="item in workflowRuns"
            :key="item.run_id"
            class="session-item"
            :class="{ active: item.run_id === activeRunId }"
            @click="openWorkflowRun(item.run_id)"
          >
            <div class="session-title">
              <span>{{ item.task_name || item.workflow_name || "未命名运行" }}</span>
              <el-tag size="small" :type="item.status === 'failed' ? 'danger' : item.status === 'submitted' ? 'success' : 'info'">
                {{ item.status }}
              </el-tag>
            </div>
            <div class="session-preview">任务ID：{{ item.task_id || "待生成" }} / {{ item.task_state || "pending" }}</div>
            <div class="session-foot">
              <span>{{ item.create_time }}</span>
              <span>{{ item.run_id }}</span>
            </div>
          </button>
        </div>
        <el-empty v-else description="暂无运行记录" />
      </div>
    </section>

    <button class="ai-float-button" @click="aiDrawerVisible = true">
      <span>AI</span>
      <small>助手</small>
    </button>

    <el-drawer v-model="aiDrawerVisible" size="460px" append-to-body class="ai-chat-drawer" :with-header="false">
      <div class="ai-chat-shell">
        <header class="ai-chat-header">
          <div class="ai-avatar">AI</div>
          <div>
            <h3>工作流 Copilot</h3>
            <p>{{ workflow?.llm_metadata?.model || "DeepSeek-V4-Pro" }} · {{ workflow?.llm_metadata?.mode === "live_llm" ? "实时生成" : "规则兜底可用" }}</p>
          </div>
          <button class="drawer-close" @click="aiDrawerVisible = false">×</button>
        </header>

        <div class="chat-messages">
          <div class="message-row assistant">
            <div class="bubble">
              <strong>你好，我可以帮你生成建模工作流。</strong>
              <p>你可以告诉我业务目标，也可以直接让我基于当前选择的场景生成节点。</p>
            </div>
          </div>
          <div class="message-row user">
            <div class="bubble">{{ prompt }}</div>
          </div>
          <div class="message-row assistant">
            <div class="bubble">
              {{ workflow?.copilot_reply || selectedScenario?.prompt }}
              <div v-if="workflow?.llm_metadata" class="bubble-tags">
                <el-tag size="small" :type="workflow.llm_metadata.mode === 'live_llm' ? 'success' : 'warning'">
                  {{ workflow.llm_metadata.mode === "live_llm" ? "DeepSeek 实时生成" : "本地规则兜底" }}
                </el-tag>
                <el-tag size="small" effect="plain">{{ workflow.llm_metadata.model }}</el-tag>
              </div>
            </div>
          </div>
          <div
            v-for="message in sessionMessages"
            :key="message.message_id"
            class="message-row"
            :class="message.role === 'assistant' ? 'assistant' : 'user'"
          >
            <div class="bubble">
              <div class="message-time">{{ message.create_time }}</div>
              {{ message.content }}
            </div>
          </div>
        </div>

        <div class="quick-actions">
          <button @click="useScenarioPrompt">使用当前场景</button>
          <button @click="startNewConversation">开启新对话</button>
          <button @click="loadWorkflowSessions">刷新记录</button>
        </div>

        <div class="chat-composer">
          <el-input
            v-model="prompt"
            type="textarea"
            :rows="4"
            resize="none"
            placeholder="描述你的建模目标，例如：预测 90 天违约风险，并部署成接口。"
          />
          <el-button type="primary" round :loading="aiGenerating" @click="generateWorkflow">发送并生成节点</el-button>
        </div>

        <el-collapse class="history-collapse">
          <el-collapse-item title="历史会话" name="history">
            <div v-if="workflowSessions.length" class="session-list drawer-session-list">
              <button
                v-for="item in workflowSessions"
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
            <el-empty v-else description="暂无会话记录" />
          </el-collapse-item>
        </el-collapse>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";
import { dataset, dataDetail } from "@/api/data";
import { platformApi } from "@/api/platform";
import type {
  AgentMessage,
  AgentSession,
  DataDetailColumnDTO,
  DataSetInfo,
  DataTableInfo,
  WorkflowGenerateResult,
  WorkflowRunDetail,
  WorkflowRunItem,
  WorkflowTemplate,
} from "@/api/types";

type Scenario = {
  id: string;
  name: string;
  desc: string;
  taskType: string;
  model: string;
  target: string;
  features: string[];
  prompt: string;
};

type FlowNode = {
  id: string;
  label: string;
  category: string;
  desc: string;
  config?: string;
  enabled: boolean;
};

const router = useRouter();
const scenarios: Scenario[] = [
  {
    id: "risk_scoring",
    name: "违约风险预测",
    desc: "预测企业或客户是否存在逾期、违约等风险。",
    taskType: "classification",
    model: "MLP",
    target: "is_default",
    features: ["invoice_overdue_days", "payback_volatility", "trade_amount_growth", "related_risk_count"],
    prompt: "我有一批核心企业上下游供应商的交易与票据数据，帮我做一个预测 90 天违约风险的模型，并部署成接口。",
  },
  {
    id: "payback_regression",
    name: "回款金额预测",
    desc: "根据交易稳定性和履约情况预测信用额度或回款表现。",
    taskType: "regression",
    model: "MLP",
    target: "credit_score",
    features: ["trade_stability", "contract_fulfillment_rate", "overdue_ratio", "cooperation_years"],
    prompt: "帮我基于供应链账期和回款流水做一个回款预测模型，并输出 API。",
  },
  {
    id: "time_series",
    name: "回款趋势预测",
    desc: "用历史回款、票据金额和交易频次预测下一周期表现。",
    taskType: "time_series_prediction",
    model: "LSTM",
    target: "next_period_payback",
    features: ["payback_amount", "invoice_amount", "trade_frequency", "risk_event_count"],
    prompt: "我需要预测未来一个周期的回款金额，帮我生成时间序列建模流程。",
  },
  {
    id: "contract_ner",
    name: "合同实体抽取",
    desc: "从合同或公告文本中抽取企业、金额、日期和担保关系。",
    taskType: "named_entity_recognition",
    model: "GlobalPointer",
    target: "",
    features: [],
    prompt: "我想对合同和公告文本做实体抽取，识别企业、金额和日期并同步到图谱。",
  },
];

const demoWorkflowRuns: WorkflowRunItem[] = [
  {
    run_id: "demo-run-20260427-01",
    workflow_id: "demo-workflow-risk",
    workflow_name: "违约风险预测工作流",
    task_name: "风险评分训练任务",
    status: "completed",
    task_id: "DEMO-TASK-12031",
    task_state: "已完成",
    create_time: "2026-04-27 15:50:12",
    runtime_summary: {
      auc: 0.893,
      f1: 0.781,
      duration_seconds: 128,
    },
  },
  {
    run_id: "demo-run-20260427-02",
    workflow_id: "demo-workflow-regression",
    workflow_name: "回款金额预测工作流",
    task_name: "回款回归训练任务",
    status: "running",
    task_id: "DEMO-TASK-12029",
    task_state: "训练中",
    create_time: "2026-04-27 15:42:08",
    runtime_summary: {
      progress: "72%",
      current_epoch: 18,
      estimated_remaining_seconds: 54,
    },
  },
  {
    run_id: "demo-run-20260427-03",
    workflow_id: "demo-workflow-ner",
    workflow_name: "合同实体抽取工作流",
    task_name: "NER 标注微调任务",
    status: "failed",
    task_id: "DEMO-TASK-12021",
    task_state: "失败",
    create_time: "2026-04-27 15:21:44",
    runtime_summary: {
      error_stage: "数据校验",
      reason: "文本字段中存在空值，建议先做缺失值清洗",
    },
  },
];

const templates = ref<WorkflowTemplate[]>([]);
const workflow = ref<WorkflowGenerateResult | null>(null);
const compilePreview = ref("请选择场景和数据后生成配置。");
const persistedWorkflowId = ref("");
const workflowRuns = ref<WorkflowRunItem[]>([]);
const workflowRunDetail = ref<WorkflowRunDetail | null>(null);
const activeRunId = ref("");
const compileLoading = ref(false);
const runLoading = ref(false);
const datasetLoading = ref(false);
const aiGenerating = ref(false);
const aiDrawerVisible = ref(false);
const datasetOptions = ref<DataSetInfo[]>([]);
const tableColumns = ref<DataDetailColumnDTO[]>([]);
const workflowSessions = ref<AgentSession[]>([]);
const sessionMessages = ref<AgentMessage[]>([]);
const activeSessionId = ref("");
const dragIndex = ref<number | null>(null);
const demoRunIds = new Set(demoWorkflowRuns.map((item) => item.run_id));

const wizard = reactive({
  scenarioId: "risk_scoring",
  setId: "",
  tableId: "",
});

const compileForm = reactive({
  workflow_name: "违约风险预测工作流",
  set_id: "",
  table_id: "",
  table_name: "",
  target_column: "",
  feature_columns: [] as string[],
  persist: true,
});

const workflowNodes = ref<FlowNode[]>([]);

const selectedScenario = computed(() => scenarios.find((item) => item.id === wizard.scenarioId) || scenarios[0]);

const selectedDataset = computed(() => datasetOptions.value.find((item) => String(item.set_id) === wizard.setId));

const tableOptions = computed<DataTableInfo[]>(() => {
  const tables = selectedDataset.value?.tables;
  return Array.isArray(tables) ? tables : [];
});

const selectedTable = computed(() => tableOptions.value.find((item) => String(item.table_id) === wizard.tableId));

const dataBindingReady = computed(() => Boolean(wizard.setId && wizard.tableId));

const columnOptions = computed(() => {
  const detailColumns = tableColumns.value.map((item) => item.fieldName).filter(Boolean);
  const tableCols = selectedTable.value?.columns || [];
  const merged = [...detailColumns, ...tableCols].filter(Boolean) as string[];
  return Array.from(new Set(merged));
});

const featureColumnOptions = computed(() => columnOptions.value.filter((col) => col !== compileForm.target_column));

function pretty(value: unknown) {
  return JSON.stringify(value || {}, null, 2);
}

function buildDefaultNodes(scenario = selectedScenario.value): FlowNode[] {
  return [
    {
      id: "select_data",
      label: "选择数据",
      category: "data",
      desc: "绑定数据集、数据表、目标列和特征列。",
      config: compileForm.table_name || compileForm.table_id,
      enabled: true,
    },
    {
      id: "data_quality",
      label: "数据质量检查",
      category: "copilot",
      desc: "检查缺失值、样本不平衡和字段类型。",
      config: "Data Copilot",
      enabled: true,
    },
    {
      id: "feature_engineering",
      label: "特征工程",
      category: "feature",
      desc: "执行缺失值处理、标准化和类别编码。",
      config: "默认策略",
      enabled: true,
    },
    {
      id: "model_train",
      label: "模型训练",
      category: "model",
      desc: `使用 ${scenario.model} 完成 ${scenario.taskType} 任务。`,
      config: scenario.model,
      enabled: true,
    },
    {
      id: "business_report",
      label: "业务解释报告",
      category: "agent",
      desc: "把训练指标转换成业务可读结论。",
      config: "BusinessReport",
      enabled: true,
    },
    {
      id: "service_publish",
      label: "服务发布准备",
      category: "service",
      desc: "生成开放 API 所需的服务描述和样例参数。",
      config: "可选",
      enabled: true,
    },
  ];
}

function syncScenarioToForm() {
  const scenario = selectedScenario.value;
  compileForm.workflow_name = `${scenario.name}工作流`;
  if (!wizard.setId || !wizard.tableId) {
    compileForm.target_column = "";
    compileForm.feature_columns = [];
  }
  prompt.value = scenario.prompt;
  workflowNodes.value = buildDefaultNodes(scenario);
}

const prompt = ref(scenarios[0].prompt);

function useScenarioPrompt() {
  prompt.value = selectedScenario.value.prompt;
}

function startNewConversation() {
  activeSessionId.value = "";
  sessionMessages.value = [];
  prompt.value = selectedScenario.value.prompt;
  ElMessage.success("已开启新对话");
}

function selectScenario(id: string) {
  wizard.scenarioId = id;
  syncScenarioToForm();
  void handleTableChange();
  workflow.value = null;
  persistedWorkflowId.value = "";
  workflowRuns.value = [];
  workflowRunDetail.value = null;
  compilePreview.value = "场景已切换，请点击“生成配置”或“执行工作流”。";
}

function resetWizard() {
  wizard.scenarioId = "risk_scoring";
  wizard.setId = "";
  wizard.tableId = "";
  compileForm.set_id = "";
  compileForm.table_id = "";
  compileForm.table_name = "";
  compileForm.target_column = "";
  compileForm.feature_columns = [];
  tableColumns.value = [];
  compileForm.persist = true;
  syncScenarioToForm();
  void handleTableChange();
  compilePreview.value = "请选择场景和数据后生成配置。";
  workflow.value = null;
  workflowRuns.value = [];
  workflowRunDetail.value = null;
  persistedWorkflowId.value = "";
}

function dropNode(index: number) {
  if (dragIndex.value === null || dragIndex.value === index) return;
  const nodes = [...workflowNodes.value];
  const [moved] = nodes.splice(dragIndex.value, 1);
  nodes.splice(index, 0, moved);
  workflowNodes.value = nodes;
  dragIndex.value = null;
}

async function loadTemplates() {
  const res = await platformApi.getWorkflowTemplates();
  templates.value = res.data || [];
}

async function loadDatasets() {
  datasetLoading.value = true;
  try {
    const res = await dataset.getAllDataSetDataTableDataColumns();
    datasetOptions.value = res.data || [];
  } catch (error) {
    console.error("加载数据集失败", error);
    ElMessage.warning("数据集下拉加载失败，可手动输入字段后继续编排");
  } finally {
    datasetLoading.value = false;
  }
}

async function handleDatasetChange() {
  if (!wizard.setId) {
    compileForm.set_id = "";
    wizard.tableId = "";
    compileForm.table_id = "";
    compileForm.table_name = "";
    compileForm.target_column = "";
    compileForm.feature_columns = [];
    tableColumns.value = [];
    await handleTableChange();
    return;
  }
  compileForm.set_id = wizard.setId;
  const firstTable = tableOptions.value[0];
  wizard.tableId = firstTable ? String(firstTable.table_id) : "";
  await handleTableChange();
}

async function handleTableChange() {
  if (!wizard.tableId) {
    compileForm.table_id = "";
    compileForm.table_name = "";
    tableColumns.value = [];
    compileForm.target_column = "";
    compileForm.feature_columns = [];
    workflowNodes.value = workflowNodes.value.map((node) =>
      node.id === "select_data" ? { ...node, config: compileForm.table_name || compileForm.table_id } : node
    );
    return;
  }

  compileForm.table_id = wizard.tableId;
  compileForm.table_name = selectedTable.value?.table_name || "";
  tableColumns.value = [];
  try {
    const res = await dataDetail.datadetail(wizard.tableId);
    tableColumns.value = res.data || [];
  } catch (error) {
    console.error("加载字段失败", error);
  }
  const columns = columnOptions.value;
  const scenario = selectedScenario.value;
  if (!columns.length) {
    compileForm.target_column = "";
    compileForm.feature_columns = [];
  } else {
    if (!columns.includes(compileForm.target_column)) {
      compileForm.target_column = columns.includes(scenario.target) ? scenario.target : columns[0] || "";
    }
    const nextFeatures = compileForm.feature_columns.filter((col) => columns.includes(col) && col !== compileForm.target_column);
    if (!nextFeatures.length) {
      const preferred = scenario.features.filter((col) => columns.includes(col) && col !== compileForm.target_column);
      compileForm.feature_columns = preferred.length
        ? preferred
        : columns.filter((col) => col !== compileForm.target_column).slice(0, 8);
    } else {
      compileForm.feature_columns = nextFeatures;
    }
  }
  workflowNodes.value = workflowNodes.value.map((node) =>
    node.id === "select_data" ? { ...node, config: compileForm.table_name || compileForm.table_id } : node
  );
}

async function loadWorkflowSessions() {
  const res = await platformApi.getAgentSessions({ scene_type: "generate_workflow", limit: 10 });
  workflowSessions.value = res.data || [];
}

async function openSession(sessionId?: string) {
  if (!sessionId) {
    sessionMessages.value = [];
    activeSessionId.value = "";
    return;
  }
  activeSessionId.value = sessionId;
  const res = await platformApi.getAgentSessionMessages({ session_id: sessionId });
  sessionMessages.value = res.data || [];
}

function buildWorkflowJson() {
  const scenario = selectedScenario.value;
  const enabledNodes = workflowNodes.value.filter((node) => node.enabled);
  return {
    template_id: scenario.id,
    name: compileForm.workflow_name,
    prompt: prompt.value,
    task_type: scenario.taskType,
    recommended_model: scenario.model,
    business_story: `${scenario.name}用于${scenario.desc}`,
    recommended_kpis: scenario.taskType === "classification" ? ["AUC", "F1", "Recall"] : ["MAE", "RMSE", "R2"],
    nodes: enabledNodes.map((node) => ({ id: node.id, label: node.label, category: node.category })),
    edges: enabledNodes.slice(1).map((node, index) => ({
      source: enabledNodes[index].id,
      target: node.id,
      label: "next",
    })),
  };
}

function buildWorkflowPayload() {
  const workflowJson = workflow.value || buildWorkflowJson();
  return {
    workflow_id: persistedWorkflowId.value || undefined,
    workflow_name: compileForm.workflow_name,
    workflow_json: workflowJson,
    prompt: prompt.value,
    set_id: compileForm.set_id ? Number(compileForm.set_id) : undefined,
    table_id: compileForm.table_id ? Number(compileForm.table_id) : undefined,
    table_name: compileForm.table_name || undefined,
    target_column: compileForm.target_column || undefined,
    feature_columns: compileForm.feature_columns,
    persist: compileForm.persist,
    workflow_nodes: workflowNodes.value,
  };
}

async function generateWorkflow() {
  aiGenerating.value = true;
  try {
    const res = await platformApi.generateWorkflow({
      prompt: prompt.value,
      workflow_name: compileForm.workflow_name,
      set_id: compileForm.set_id ? Number(compileForm.set_id) : undefined,
      table_id: compileForm.table_id ? Number(compileForm.table_id) : undefined,
      table_name: compileForm.table_name || undefined,
      target_column: compileForm.target_column || undefined,
      feature_columns: compileForm.feature_columns,
      session_id: activeSessionId.value || undefined,
    });
    workflow.value = res.data;
    persistedWorkflowId.value = "";
    workflowRuns.value = [];
    workflowRunDetail.value = null;
    activeRunId.value = "";
    const nodes = (workflow.value?.nodes || []).map((node) => ({
      id: node.id,
      label: node.label,
      category: node.category,
      desc: `由 AI 生成的 ${node.category} 节点`,
      enabled: true,
    }));
    if (nodes.length) {
      workflowNodes.value = nodes;
    }
    compilePreview.value = JSON.stringify(workflow.value?.compiled_preview || {}, null, 2);
    await loadWorkflowSessions();
    await openSession(workflow.value?.session_id || workflowSessions.value[0]?.session_id);
  } finally {
    aiGenerating.value = false;
  }
}

async function compileWorkflow() {
  if (!compileForm.target_column && selectedScenario.value.taskType !== "named_entity_recognition") {
    ElMessage.warning("请先选择目标列");
    return;
  }
  compileLoading.value = true;
  try {
    const res = await platformApi.compileWorkflow(buildWorkflowPayload());
    persistedWorkflowId.value = String(res.data?.workflow_id || "");
    compilePreview.value = JSON.stringify(res.data || {}, null, 2);
    if (persistedWorkflowId.value) {
      await loadWorkflowRuns(persistedWorkflowId.value);
    }
    ElMessage.success("配置已生成，可继续执行工作流");
  } finally {
    compileLoading.value = false;
  }
}

async function loadWorkflowRuns(workflowId = persistedWorkflowId.value) {
  if (!workflowId) {
    workflowRuns.value = demoWorkflowRuns;
    workflowRunDetail.value = demoWorkflowRuns[0] as WorkflowRunDetail;
    activeRunId.value = "";
    return;
  }
  const res = await platformApi.getWorkflowRuns({ workflow_id: workflowId, limit: 10 });
  workflowRuns.value = (res.data || []).length ? (res.data || []) : demoWorkflowRuns;
  if (!res.data?.length) {
    workflowRunDetail.value = demoWorkflowRuns[0] as WorkflowRunDetail;
  }
}

async function openWorkflowRun(runId?: string) {
  if (!runId) {
    workflowRunDetail.value = null;
    activeRunId.value = "";
    return;
  }
  if (demoRunIds.has(runId)) {
    const demo = demoWorkflowRuns.find((item) => item.run_id === runId);
    if (demo) {
      activeRunId.value = runId;
      workflowRunDetail.value = demo as WorkflowRunDetail;
    }
    return;
  }
  activeRunId.value = runId;
  const res = await platformApi.getWorkflowRunDetail({ run_id: runId });
  workflowRunDetail.value = res.data || null;
}

async function runWorkflow() {
  if (!compileForm.target_column && selectedScenario.value.taskType !== "named_entity_recognition") {
    ElMessage.warning("请先选择目标列");
    return;
  }
  runLoading.value = true;
  try {
    const res = await platformApi.runWorkflow({
      ...buildWorkflowPayload(),
      persist: true,
    });
    workflowRunDetail.value = res.data || null;
    activeRunId.value = String(res.data?.run_id || "");
    persistedWorkflowId.value = String(res.data?.workflow_id || persistedWorkflowId.value || "");
    await loadWorkflowRuns();
    if (activeRunId.value) {
      await openWorkflowRun(activeRunId.value);
    }
    ElMessage.success("工作流已提交到现有训练链路");
  } finally {
    runLoading.value = false;
  }
}

function goToTaskList() {
  router.push("/taskView");
}

function goToTaskDetail() {
  if (!workflowRunDetail.value?.task_id) return;
  router.push({
    path: "/taskDetails",
    query: {
      taskId: workflowRunDetail.value.task_id,
      taskState: workflowRunDetail.value.task_state || "已提交",
      pageIndex: "3",
    },
  });
}

watch(
  () => compileForm.target_column,
  () => {
    compileForm.feature_columns = compileForm.feature_columns.filter((col) => col !== compileForm.target_column);
  }
);

onMounted(async () => {
  syncScenarioToForm();
  await Promise.all([loadTemplates(), loadDatasets(), loadWorkflowSessions()]);
  await openSession(workflowSessions.value[0]?.session_id);
  await loadWorkflowRuns();
});
</script>

<style scoped>
.studio-page {
  min-height: calc(100vh - 51px);
  padding: 24px;
  background: #f5f7fb;
}

.studio-hero,
.panel-card {
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 10px 30px rgba(31, 45, 61, 0.08);
}

.studio-hero {
  padding: 24px 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.studio-hero h1,
.section-head h2 {
  margin: 0;
  color: #0f2d52;
}

.studio-hero p {
  margin: 10px 0 0;
  color: #607080;
}

.hero-actions,
.prompt-actions,
.run-actions,
.result-meta,
.node-tags {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.eyebrow {
  margin: 0 0 6px;
  color: #2d8cf0;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 12px;
}

.result-grid,
.history-grid {
  margin-top: 20px;
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.8fr);
  gap: 18px;
}

.wizard-grid {
  margin-top: 20px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
}

.history-grid {
  grid-template-columns: 1fr;
}

.panel-card {
  padding: 22px;
}

.section-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.section-title {
  margin-bottom: 14px;
  font-size: 18px;
  font-weight: 700;
  color: #103760;
}

.scenario-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.scenario-card {
  border: 1px solid #dce9f8;
  border-radius: 14px;
  background: #f8fbff;
  padding: 16px;
  text-align: left;
  cursor: pointer;
  display: grid;
  gap: 8px;
  color: #33475b;
}

.scenario-card strong {
  color: #103760;
  font-size: 16px;
}

.scenario-card.active {
  border-color: #2d8cf0;
  box-shadow: inset 0 0 0 1px #2d8cf0;
  background: #eef6ff;
}

.wizard-form :deep(.el-select) {
  width: 100%;
}

.hint-alert,
.prompt-actions,
.assist-copy {
  margin-top: 14px;
}

.assist-copy {
  color: #607080;
  line-height: 1.7;
}

.node-board {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
}

.flow-node {
  display: flex;
  gap: 12px;
  min-height: 130px;
  padding: 16px;
  border: 1px solid #dce9f8;
  border-radius: 16px;
  background: linear-gradient(180deg, #f8fbff, #eef5ff);
  cursor: grab;
}

.flow-node.disabled {
  opacity: 0.55;
}

.node-index {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #2d8cf0;
  color: #fff;
  font-weight: 700;
}

.node-main {
  flex: 1;
}

.node-title {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  font-weight: 700;
  color: #103760;
}

.node-main p {
  color: #607080;
  line-height: 1.6;
}

.summary-list {
  display: grid;
  gap: 10px;
  margin-bottom: 16px;
}

.summary-list div {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  border-bottom: 1px solid #edf2f7;
  padding-bottom: 8px;
}

.summary-list span {
  color: #8091a5;
}

.summary-list strong {
  color: #103760;
  text-align: right;
}

.json-block {
  margin: 12px 0 0;
  padding: 16px;
  border-radius: 14px;
  background: #0f1720;
  color: #d8e1eb;
  overflow: auto;
  font-size: 12px;
}

.session-list {
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
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-weight: 600;
  color: #103760;
}

.session-preview {
  margin-top: 8px;
  color: #607080;
  line-height: 1.6;
}

.session-foot {
  margin-top: 10px;
  font-size: 12px;
  color: #8091a5;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.ai-float-button {
  position: fixed;
  right: 28px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 50;
  width: 64px;
  height: 64px;
  border: 0;
  border-radius: 50%;
  color: #fff;
  background: linear-gradient(135deg, #2d8cf0, #5b6ee1);
  box-shadow: 0 14px 30px rgba(45, 140, 240, 0.34);
  cursor: pointer;
  display: grid;
  place-items: center;
  align-content: center;
}

.ai-float-button span {
  font-weight: 800;
  font-size: 18px;
  line-height: 1;
}

.ai-float-button small {
  font-size: 12px;
  line-height: 1;
  margin-top: 3px;
}

:global(.ai-chat-drawer .el-drawer__body) {
  padding: 0;
  background: #f7f9fc;
}

.ai-chat-shell {
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr auto auto auto;
  background: radial-gradient(circle at top left, rgba(45, 140, 240, 0.12), transparent 34%), #f7f9fc;
}

.ai-chat-header {
  padding: 18px 18px 14px;
  display: grid;
  grid-template-columns: 44px 1fr 32px;
  gap: 12px;
  align-items: center;
  border-bottom: 1px solid #e8eef7;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
}

.ai-avatar {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: #fff;
  font-weight: 800;
  background: linear-gradient(135deg, #2d8cf0, #7c5cff);
  box-shadow: 0 10px 20px rgba(45, 140, 240, 0.24);
}

.ai-chat-header h3 {
  margin: 0;
  color: #10233f;
  font-size: 17px;
}

.ai-chat-header p {
  margin: 4px 0 0;
  color: #718096;
  font-size: 12px;
}

.drawer-close {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: #eef3f9;
  color: #607080;
  font-size: 22px;
  cursor: pointer;
}

.chat-messages {
  padding: 18px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.message-row {
  display: flex;
}

.message-row.user {
  justify-content: flex-end;
}

.message-row.assistant {
  justify-content: flex-start;
}

.bubble {
  max-width: 86%;
  padding: 12px 14px;
  border-radius: 18px;
  line-height: 1.7;
  white-space: pre-wrap;
  box-shadow: 0 8px 20px rgba(31, 45, 61, 0.06);
}

.message-row.assistant .bubble {
  color: #25364d;
  background: #fff;
  border-top-left-radius: 6px;
}

.message-row.user .bubble {
  color: #fff;
  background: linear-gradient(135deg, #2d8cf0, #5b6ee1);
  border-top-right-radius: 6px;
}

.bubble p {
  margin: 6px 0 0;
}

.bubble-tags {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.message-time {
  margin-bottom: 6px;
  font-size: 11px;
  color: #8091a5;
}

.message-row.user .message-time {
  color: rgba(255, 255, 255, 0.76);
}

.quick-actions {
  padding: 0 18px 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-actions button {
  border: 1px solid #dce9f8;
  border-radius: 999px;
  background: #fff;
  color: #2d5f95;
  padding: 7px 12px;
  cursor: pointer;
}

.chat-composer {
  margin: 0 18px 14px;
  padding: 12px;
  border: 1px solid #e1eaf5;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 12px 26px rgba(31, 45, 61, 0.08);
  display: grid;
  gap: 10px;
}

.chat-composer :deep(.el-textarea__inner) {
  border: 0;
  box-shadow: none;
  padding: 4px;
}

.history-collapse {
  margin: 0 18px 18px;
  border: 0;
}

.history-collapse :deep(.el-collapse-item__header),
.history-collapse :deep(.el-collapse-item__wrap) {
  background: transparent;
}

.drawer-session-list {
  max-height: 220px;
  overflow-y: auto;
  padding-right: 4px;
}

@media (max-width: 1200px) {
  .studio-hero,
  .section-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .result-grid,
  .history-grid,
  .scenario-grid {
    grid-template-columns: 1fr;
  }

  .ai-float-button {
    right: 18px;
    bottom: 24px;
    top: auto;
    transform: none;
  }
}
</style>

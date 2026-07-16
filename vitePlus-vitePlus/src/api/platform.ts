import { springGet, springPost } from "@/api/http";
import type {
  AgentMessage,
  AgentSession,
  OpenServiceDetail,
  OpenServiceMarketItem,
  PlatformGuideStep,
  PlatformOverview,
  Result,
  WorkflowCompileResult,
  WorkflowGenerateResult,
  WorkflowRunDetail,
  WorkflowRunItem,
  WorkflowTemplate,
} from "@/api/types";

export const platformApi = {
  getOverview: (): Promise<Result<PlatformOverview>> =>
    springGet<PlatformOverview>("/task/Platform/GetOverview"),

  getOpenServiceMarket: (): Promise<Result<OpenServiceMarketItem[]>> =>
    springGet<OpenServiceMarketItem[]>("/task/Platform/GetOpenServiceMarket"),

  getOpenServiceDetail: (params: { service_id: string | number }): Promise<Result<OpenServiceDetail>> =>
    springGet<OpenServiceDetail>("/task/Platform/GetOpenServiceDetail", { params }),

  publishOpenService: (payload: Record<string, unknown>) =>
    springPost<Record<string, unknown>>("/task/Platform/PublishOpenService", payload),

  createOpenServiceKey: (payload: Record<string, unknown>) =>
    springPost<Record<string, unknown>>("/task/Platform/CreateOpenServiceKey", payload),

  getWorkflowTemplates: (): Promise<Result<WorkflowTemplate[]>> =>
    springGet<WorkflowTemplate[]>("/task/Platform/GetWorkflowTemplates"),

  generateWorkflow: (payload: Record<string, unknown>): Promise<Result<WorkflowGenerateResult>> =>
    springPost<WorkflowGenerateResult>("/task/Platform/GenerateWorkflow", payload),

  compileWorkflow: (payload: Record<string, unknown>): Promise<Result<WorkflowCompileResult>> =>
    springPost<WorkflowCompileResult>("/task/Platform/CompileWorkflow", payload),

  runWorkflow: (payload: Record<string, unknown>): Promise<Result<WorkflowRunDetail>> =>
    springPost<WorkflowRunDetail>("/task/Platform/RunWorkflow", payload),

  getWorkflowRuns: (params: { workflow_id: string; limit?: number }): Promise<Result<WorkflowRunItem[]>> =>
    springGet<WorkflowRunItem[]>("/task/Platform/GetWorkflowRuns", { params }),

  getWorkflowRunDetail: (params: { run_id: string }): Promise<Result<WorkflowRunDetail>> =>
    springGet<WorkflowRunDetail>("/task/Platform/GetWorkflowRunDetail", { params }),

  analyzeDataset: (payload: Record<string, unknown>) =>
    springPost<Record<string, unknown>>("/task/Platform/AnalyzeDataset", payload),

  generateBusinessReport: (payload: Record<string, unknown>) =>
    springPost<Record<string, unknown>>("/task/Platform/GenerateBusinessReport", payload),

  explainRiskGraph: (payload: Record<string, unknown>) =>
    springPost<Record<string, unknown>>("/task/Platform/ExplainRiskGraph", payload),

  generateAgentNode: (payload: Record<string, unknown>) =>
    springPost<Record<string, unknown>>("/task/Platform/GenerateAgentNode", payload),

  getAgentSessions: (params?: { scene_type?: string; limit?: number }): Promise<Result<AgentSession[]>> =>
    springGet<AgentSession[]>("/task/Platform/GetAgentSessions", { params }),

  getAgentSessionMessages: (params: { session_id: string }): Promise<Result<AgentMessage[]>> =>
    springGet<AgentMessage[]>("/task/Platform/GetAgentSessionMessages", { params }),

  getSchemaPlan: (): Promise<Result<Record<string, unknown>>> =>
    springGet<Record<string, unknown>>("/task/Platform/GetSchemaPlan"),

  getGuideSteps: (): Promise<Result<PlatformGuideStep[]>> =>
    springGet<PlatformGuideStep[]>("/task/Platform/GetGuideSteps"),
};

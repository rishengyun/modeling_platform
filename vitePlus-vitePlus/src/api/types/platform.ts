import type { ID } from "./common";

export interface PlatformOverview {
  brand_name: string;
  industry_name: string;
  tagline: string;
  focus_scene: string;
  market_pain_points: Array<{ title: string; desc: string }>;
  platform_highlights: Array<{ name: string; summary: string }>;
  mvp_modules: Array<{ name: string; path: string; status: string }>;
  progress_metrics: Record<string, number>;
  recommended_demo_order: string[];
}

export interface OpenServiceMarketItem {
  service_id: ID;
  service_name: string;
  service_desc: string;
  service_state: string;
  service_type: string;
  is_open_api_published: boolean;
  service_code: string;
  service_version: string;
  business_domain: string;
  scenario_label: string;
  publish_status: string;
  invoke_path: string;
  create_time: string;
  call_count: number;
  avg_latency_ms?: number | null;
  active_key_count: number;
  sample_request: Record<string, unknown>;
}

export interface OpenServiceDetail extends OpenServiceMarketItem {
  gateway_proxy_path: string;
  upstream_url: string;
  resource_profile: Record<string, unknown>;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
  example_request: Record<string, unknown>;
  example_response: Record<string, unknown>;
  call_metrics: Record<string, unknown>;
  api_keys: Array<Record<string, unknown>>;
  sdk_examples: Array<Record<string, unknown>>;
}

export interface WorkflowNode {
  id: string;
  label: string;
  category: string;
}

export interface WorkflowEdge {
  source: string;
  target: string;
  label: string;
}

export interface WorkflowTemplate {
  template_id: string;
  name: string;
  task_type: string;
  recommended_model: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowGenerateResult extends WorkflowTemplate {
  prompt: string;
  copilot_reply: string;
  business_story: string;
  recommended_kpis: string[];
  llm_metadata?: LlmMetadata;
  session_id?: string;
  session_title?: string;
  compiled_preview: {
    task_payload: Record<string, unknown>;
    service_payload: Record<string, unknown>;
    mapping_summary: string[];
  };
}

export interface WorkflowCompileResult {
  workflow_id?: string;
  workflow_name: string;
  workflow_json: Record<string, unknown>;
  task_payload: Record<string, unknown>;
  service_payload: Record<string, unknown>;
  mapping_summary: string[];
}

export interface WorkflowRunItem {
  run_id: string;
  workflow_id: string;
  workflow_name?: string;
  status: string;
  task_id?: string;
  task_name?: string;
  task_state?: string;
  create_time: string;
  runtime_summary: Record<string, unknown>;
}

export interface WorkflowRunDetail extends WorkflowRunItem {
  compiled_payload?: Record<string, unknown>;
}

export interface LlmMetadata {
  capability: string;
  provider: string;
  model: string;
  mode: "live_llm" | "fallback_rule" | string;
}

export interface AgentSession {
  session_id: string;
  scene_type: string;
  title: string;
  create_time: string;
  preview?: string;
  llm_metadata?: LlmMetadata;
}

export interface AgentMessage {
  message_id: number;
  role: string;
  content: string;
  structured_payload: Record<string, unknown>;
  create_time: string;
}

export interface PlatformGuideStep {
  step: number;
  title: string;
  page: string;
  action: string;
}

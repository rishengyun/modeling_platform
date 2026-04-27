\connect task_db

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE TABLE IF NOT EXISTS public.open_service_api (
    service_id bigint PRIMARY KEY,
    service_code character varying(100) NOT NULL UNIQUE,
    service_version character varying(30) DEFAULT 'v1',
    business_domain character varying(100) DEFAULT 'supply_chain_finance',
    scenario_label character varying(255),
    input_schema jsonb,
    output_schema jsonb,
    example_request jsonb,
    example_response jsonb,
    publish_status character varying(30) DEFAULT 'published',
    user_id integer,
    create_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    update_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_delete integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.open_service_api_key (
    key_id bigserial PRIMARY KEY,
    service_id bigint NOT NULL,
    key_name character varying(100),
    api_key character varying(100) NOT NULL UNIQUE,
    api_secret character varying(150) NOT NULL,
    status character varying(30) DEFAULT 'active',
    quota_per_day integer DEFAULT 1000,
    user_id integer,
    create_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expire_at timestamp without time zone
);

CREATE TABLE IF NOT EXISTS public.open_service_usage_stat (
    stat_id bigserial PRIMARY KEY,
    service_id bigint NOT NULL,
    stat_date date NOT NULL,
    call_count integer DEFAULT 0,
    success_count integer DEFAULT 0,
    fail_count integer DEFAULT 0,
    avg_latency_ms double precision DEFAULT 0,
    create_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    update_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (service_id, stat_date)
);

CREATE TABLE IF NOT EXISTS public.open_service_sdk_doc (
    doc_id bigserial PRIMARY KEY,
    service_id bigint NOT NULL,
    language character varying(30) NOT NULL,
    sdk_example text,
    create_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.workflow_definition (
    workflow_id character varying(64) PRIMARY KEY,
    workflow_name character varying(100),
    template_id character varying(50),
    prompt text,
    workflow_json jsonb,
    compiled_task jsonb,
    user_id integer,
    create_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    update_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    is_delete integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.workflow_node (
    node_id character varying(64) PRIMARY KEY,
    workflow_id character varying(64) NOT NULL,
    node_name character varying(100),
    node_type character varying(50),
    node_config jsonb,
    sort_index integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.workflow_edge (
    edge_id character varying(64) PRIMARY KEY,
    workflow_id character varying(64) NOT NULL,
    source_node_id character varying(64),
    target_node_id character varying(64),
    edge_label character varying(50)
);

CREATE TABLE IF NOT EXISTS public.workflow_run (
    run_id character varying(64) PRIMARY KEY,
    workflow_id character varying(64),
    status character varying(30),
    compiled_payload jsonb,
    runtime_summary jsonb,
    user_id integer,
    create_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.workflow_template (
    template_id character varying(50) PRIMARY KEY,
    name character varying(100),
    industry_domain character varying(100),
    template_json jsonb,
    create_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.agent_session (
    session_id character varying(64) PRIMARY KEY,
    scene_type character varying(50),
    title character varying(100),
    context_json jsonb,
    user_id integer,
    create_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.agent_message (
    message_id bigserial PRIMARY KEY,
    session_id character varying(64),
    role character varying(20),
    content text,
    structured_payload jsonb,
    create_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

\connect graph_db

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE TABLE IF NOT EXISTS public.industry_entity_risk_tag (
    tag_id bigserial PRIMARY KEY,
    entity_type character varying(50) NOT NULL,
    entity_key character varying(100) NOT NULL,
    risk_level character varying(30),
    tag_name character varying(100) NOT NULL,
    tag_desc text,
    source_type character varying(50),
    confidence double precision DEFAULT 0,
    user_id integer,
    create_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.industry_relation_snapshot (
    snapshot_id bigserial PRIMARY KEY,
    graph_id bigint,
    relation_summary jsonb,
    scene_type character varying(50),
    user_id integer,
    create_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

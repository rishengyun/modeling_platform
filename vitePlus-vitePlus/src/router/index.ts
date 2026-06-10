import { createRouter, createWebHistory, RouteRecordRaw, type RouteLocationRaw } from 'vue-router'
import { getStoredToken } from "@/utils/token";
import { checkLogin, login } from "@/api/auth";
import { decryptEmbedToken } from "@/utils/crypto";

// 使用动态导入替换静态导入
const Layout = () => import('../layout/Layout.vue')
const Home = () => import('../views/Home.vue')
const Login = () => import('../views/login.vue')
const Register = () => import('../views/register.vue')

// 数据集管理模块
const DataScreen = () => import('../views/DatasetManagement/DataScreen.vue')
const DataView = () => import('../views/DatasetManagement/DataView.vue')
const DataViewDetail = () => import('../views/DatasetManagement/DataViewDetail.vue')
const MultiVisualization = () => import('../views/DatasetManagement/MultiVisualization.vue')
const EntityView = () => import('../views/DatasetManagement/EntityView.vue')
const EntityViewDetail = () => import('../views/DatasetManagement/EntityViewDetail.vue')
const EntityVisualization = () => import('../views/DatasetManagement/EntityVisualization.vue')
const DataAnnotation = () => import('../views/DataAnnotation/DataAnnotation.vue')

// 自动建模模块
const TaskView = () => import("@/views/AutoModel/TaskView.vue")
const TaskCreate = () => import("@/views/AutoModel/TaskCreate.vue")
const TaskModify = () => import("@/views/AutoModel/TaskModify.vue")
const taskDetails = () => import("@/views/AutoModel/taskDetails.vue")

// 模型仓库模块
const ModelList = () => import("@/views/ModelRepository/ModelList.vue")

// 在线服务模块
const OnlineServiceList = () => import("@/views/OnlineService/OnlineServiceList.vue")
const OnlineServiceDeploy = () => import("@/views/OnlineService/OnlineServiceDeploy.vue")
const OnlineServiceDetails = () => import("@/views/OnlineService/OnlineServiceDetails.vue")
const OnlineServiceLog = () => import("@/views/OnlineService/OnlineServiceLog.vue")
const OnlineServiceLogVisualization = () => import("@/views/OnlineService/OnlineServiceLogVisualization.vue")

// 镜像仓库模块
const ImageList = () => import("@/views/ImageRepository/ImageList.vue")

// 图谱服务模块
const RelationalGraph = () => import("@/views/Graph/RelationalGraph.vue")
const GraphList = () => import("@/views/Graph/GraphList.vue")

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Layout',
    component: Layout,
    redirect: '/home',
    children: [
      { path: 'home', name: 'Home', component: Home },
      { path: '/datascreen', name: 'Datascreen', component: DataScreen },
      { path: '/dataView', name: 'DataView', component: DataView },
      { path: '/entityView', name: 'EntityView', component: EntityView },
      { path: '/dataView/detail', name: 'DataViewDetail', component: DataViewDetail },
      { path: '/entityView/detail', name: 'EntityViewDetail', component: EntityViewDetail },
      { path: '/MultiVisualization', name: 'MultiVisualization', component: MultiVisualization },
      { path: '/entityVisualization', name: 'EntityVisualization', component: EntityVisualization },
      { path: '/dataAnnotation', name: 'DataAnnotation', component: DataAnnotation },
      { path: '/taskView', name: 'TaskView', component: TaskView },
      { path: '/taskCreate', name: 'TaskCreate', component: TaskCreate },
      { path: '/taskDetails', name: 'TaskDetails', component: taskDetails },
      { path: '/taskModify', name: 'TaskModify', component: TaskModify },
      { path: '/modelList', name: 'ModelList', component: ModelList },
      { path: '/onlineServiceList', name: 'OnlineServiceList', component: OnlineServiceList },
      { path: '/onlineServiceDeploy', name: 'OnlineServiceDeploy', component: OnlineServiceDeploy },
      { path: '/onlineServiceDetails', name: 'OnlineServiceDetails', component: OnlineServiceDetails },
      { path: '/onlineServiceLogVisualization', name: 'OnlineServiceLogVisualization', component: OnlineServiceLogVisualization },
      { path: '/imageList', name: 'ImageList', component: ImageList },
      { path: '/onlineServiceLog', name: 'OnlineServiceLog', component: OnlineServiceLog },
      { path: '/graphList', name: 'GraphList', component: GraphList },
      { path: '/graph/:lastPos?', name: 'GraphService', component: RelationalGraph }
    ]
  },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
]

// 创建路由实例
const router = createRouter({
  // 使用环境变量
  history: createWebHistory(import.meta.env.VITE_BASE_URL),
  routes
})

function getQueryStringValue(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] || "");
  return value === undefined || value === null ? "" : String(value);
}

interface EmbedCredentials {
  username: string
  password: string
}

/**
 * 从 URL query 参数提取登录凭证，支持两种模式：
 * 1. 加密模式：?token=<AES-256-GCM 加密的 username:password>（优先）
 * 2. 明文模式：?username=xxx&password=yyy（向后兼容）
 */
/** 嵌入登录默认密钥，env 未配置时兜底，与父系统约定一致 */
const DEFAULT_EMBED_SECRET = 'tB70xG5_1T3j2doRFJ1LUW1EKZk4bpmkKCpAJ9gBYqs'

async function getEmbedCredentials(to: { query: Record<string, unknown> }): Promise<EmbedCredentials | null> {
  const query = to.query || {};

  // 优先：加密 token 模式
  const token = getQueryStringValue(query.token) || getQueryStringValue(query.Token);
  if (token) {
    const secret = import.meta.env.VITE_EMBED_SECRET_KEY || DEFAULT_EMBED_SECRET
    try {
      const cred = await decryptEmbedToken(token, secret);
      return { username: cred.username, password: cred.password };
    } catch (err) {
      console.error('[embed-auth] token 解密失败:', err);
      return null;
    }
  }

  // 降级：明文 username + password 模式（向后兼容）
  const username =
    getQueryStringValue(query.username) ||
    getQueryStringValue(query.Username) ||
    getQueryStringValue(query.userName);
  const password =
    getQueryStringValue(query.password) ||
    getQueryStringValue(query.Password);

  if (username && password) {
    return { username, password };
  }

  return null;
}

function buildSanitizedQuery(query: Record<string, unknown>) {
  const sanitized = { ...query };
  // 清除加密 token
  delete sanitized.token;
  delete sanitized.Token;
  // 清除明文凭证（向后兼容）
  delete sanitized.username;
  delete sanitized.Username;
  delete sanitized.userName;
  delete sanitized.password;
  delete sanitized.Password;
  return sanitized;
}

// 路由守卫：嵌入自动登录（加密 token 优先，明文降级兼容）→ Token 校验 → 跳转
router.beforeEach(async (to, from) => {
  const embedCredentials = await getEmbedCredentials(to);
  if (embedCredentials) {
    try {
      const res = await login({
        Username: embedCredentials.username,
        Password: embedCredentials.password,
      });
      if (res.code === '0') {
        localStorage.setItem("Username", res.data.Username || embedCredentials.username);
        if (res.data.user_id !== undefined && res.data.user_id !== null) {
          localStorage.setItem("user_id", String(res.data.user_id));
          localStorage.setItem("UserId", String(res.data.user_id));
        }
        return {
          path: to.path,
          query: buildSanitizedQuery(to.query as Record<string, unknown>),
          hash: to.hash,
          replace: true,
        } as RouteLocationRaw;
      } else {
        return { path: "/login", query: { redirect: to.fullPath }, replace: true };
      }
    } catch {
      return { path: "/login", query: { redirect: to.fullPath }, replace: true };
    }
  }

  // 开发环境跳过认证：用于无后端服务时预览前端样式
  if (import.meta.env.VITE_SKIP_AUTH === 'true') {
    return true;
  }
  const myToken = getStoredToken();
  if (to.path === '/login' || to.path === '/register') {
    return true;
  }
  if (!myToken) {
    return "/login";
  }
  try {
    const res = await checkLogin(myToken);
    if (res.code === '0') {
      return true;
    } else {
      return "/login";
    }
  } catch (err: unknown) {
    // 网络/网关/服务不可用时放行，由具体页面请求失败时再根据 40100 等跳登录
    const ax = err as { response?: { status?: number }; message?: string };
    if (ax?.response?.status === 404 || ax?.response?.status === 502 || ax?.message === 'Network Error') {
      return true;
    } else {
      return "/login";
    }
  }
});

export default router

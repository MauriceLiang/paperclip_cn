# Paperclip CN 简体中文本地化 — 开发交接文档

Date: 2026-10-19
Branch: `feat/zh-cn-i18n-foundation`（本地 Fork，尚未提交）
读者: 接手继续完成 L2–L7 的开发者/Agent

本文记录**截止到当前工作区**的真实状态，包括已完成内容、未完成范围、已确认的根因和下一步执行顺序。所有结论以本机实际运行结果为准；未运行的检查会明确标注。

---

## 0. TL;DR

- **L0 / L1 已完成**：语言架构、严格/部分校验、语言持久化与切换、`<html lang>`、语言选择器、审计/分片工具、术语表、测试基础设施均已落地。
- **L2–L5 已覆盖大部分主要业务界面，但全站中文目标尚未完成验收**：当前 `en` / `zh-CN` 各有 **17,919** 个键且完全对齐。主要页面已接入翻译，仍不能据此视为全部路由及状态都已验收。
- **剩余工作是逐路由、逐状态复核**：重点仍包括 Issue 详情/聊天、Task Chat、Routine、AI Connections、内置设置与可达页面，以及静态扫描确认的真实硬编码文案；适配器字段和生产导航已继续补齐，不能再作为完全未做模块描述。
- **测试范围**：较早全量 UI 基线为 8,529 个测试、0 失败。最近本地化相关定向 UI 测试 **175/175** 通过，UI typecheck 与 UI build 通过；全量 UI/全仓测试未重跑。
- **`Trans` 链接标签问题已修复**：已将翻译资源中的自定义 `<link>` 标签统一替换为 `<lnk>`，链接子节点回归测试通过。
- 当前三个模块翻译命名空间共 **3,439** 个叶子键：`issuesPage`（982）、`taskChatPage`（1,227）及 `agentSetupPage`（1,230）均已部分接入；不应删除这些翻译资产。
- 最近 UI 类型检查、i18n 键审计、UI build 和 token gates **均已通过**；最新源码扫描覆盖 1,278 个文件，报告 6,644 条启发式候选及 59 条“与英文相同、需复核”项（含误报）；源码中 13,950 个唯一字面量翻译键引用均命中中英文资源。此前静态浏览器快照覆盖 106 个页面，本次另抽查了 39 个路由入口；这些检查不代表全部 253 条声明路由及其动态状态均已验收。
- 工作区保留了已有的大量本地化改动，**尚未提交、推送或创建 PR**。

### 2026-10-20 路由抽查与当前进度 checkpoint

- 新跑 `pnpm i18n:check`：**通过**，`en` / `zh-CN` 各 17,919 键，13,950 个字面量翻译键引用无缺失。
- 新跑 `pnpm i18n:audit`：扫描 1,278 个源文件，列出 6,644 条启发式硬编码候选和 59 个与英文相同的复核项。抽查确认 Task Chat 的标准工具动作词已有中译键，Provider 详情的 `Severity` / `Query` / `Target` 等字段在渲染层映射；Issue/Task Chat 文件中的大量候选是类型签名、代码和英文回退值，不应计为已确认漏译。
- 浏览器本轮新增尝试 39 个路由入口，覆盖实例设置、技能、Agent、项目、任务、聊天、Routine、Pipeline、Goal、审批、活动、审计、成本、预算、收件箱和决策等。可见的空态与设置标签为中文；部分路径重定向或受功能/权限门控。任务列表及个人资料页的可见固定文案为中文；`Agent`、`Board`、邮箱和产品/协议名称按术语或用户数据保留。
- **仍不能宣称全站汉化验收完成**：`App.tsx` 有 253 条路由声明、当前清单有 180 种不同路径模式；本次抽查不是所有入口的逐项验收。临时验收组织没有任务、运行和审批数据，未能检查 Issue 详情/聊天交互、Task Chat 的各类运行事件、运行日志与错误状态；首次 Agent 向导需要提供真实模型连接才能完成，未使用或提交任何凭据。
- 当前明确的未覆盖边界包括：用户创建的名称/消息/Prompt/文件内容，Agent/模型输出和原始命令结果，提供商/服务端返回的动态错误，插件自行提供的动态字段，以及尚未建立上游本地化映射的远程公告。这些内容与仓库内固定 UI 文案分开处理。
- 本轮没有新确认一个实际可见的固定英文漏译；这一结果仅适用于已抽查的空态/设置页面，不代表源码全部候选已人工复核。

### 2026-10-20 产品界面补漏与源码翻译键校验 checkpoint

- 修复可达界面中的静态英文：公司设置插件页的选择组织、加载和插件错误提示；Smoke Lab 仪表卡的标题、健康状态和运行时间说明；Grok Bot 工作摘要；外部对象属性行；财务账单/类别卡；技能分支修复操作；设置向导“保存并退出”；插件 SDK 负责人/项目选择器与加载状态默认文案；任务侧栏已持久化的标准标签；Agent 运行错误输出的 stdout/stderr 摘录标签。动态名称、错误详情、路径、命令、协议和插件自定义文案继续保留原值。
- 修正若干静态翻译键调用指向错误/不存在路径的问题，并补齐缺少的中英资源。`scripts/i18n-audit.mjs --check` 现在也检查源码中的字面量 `t()` / `translate()` 键引用，接受 i18next 复数和序数后缀，并生成 `translation-reference-report.json`；当前 13,857 个唯一键引用在中英文资源中均有对应项。
- 验证：`pnpm i18n:check` 通过，`en` / `zh-CN` 各 **17,760** 键，缺键、多余键、空值、占位符和源码引用缺失均为 0；UI typecheck 通过；相关 Vitest **12/12 通过**；UI build 通过（保留现有 Vite/CSS、大 chunk 与动态导入警告）；token gates 四项 CLEAN；`git diff --check` 通过。
- 当前完整候选扫描报告 **6,794** 条启发式候选、59 条与英文相同的复核项；这些数字不是剩余未翻译数。全站目标仍未完成验收：本轮未重跑浏览器全路由或动态状态；253 条路由仍需逐入口和逐状态检查。最近的全仓 typecheck 仍有先前记录的 `packages/db` 临时 IPC socket `EPERM` 阻断，本轮只通过 UI typecheck。

### 2026-10-20 固定英文边界复核与组件补漏 checkpoint

- 修复实际可达页面中剩余的固定界面词条：技能编辑器 Frontmatter、技能工作室与适配器 Alpha 标签、MCP 请求标头、组织标识、Codex 规划/询问模式、Paperclip API / GitHub / Zapier 地址字段、Git 工作树、Webhook 地址及应用凭据字段。冒烟测试台及其关闭提示、运行提示和教程说明统一使用中文名称；助手连接卡片标题和无障碍操作名现通过翻译资源渲染。用户数据、品牌名、协议头、外部门户精确字段名和插件动态 Schema 继续保留。
- API 网关凭据页面统一把认证 Token 称为“令牌”；模型用量的 Token 单位继续保留英文技术术语，并在术语表区分两者。成本运行摘要中的 `api/sub` 也改为“API/订阅”。
- 验证：助手连接及 locale 校验定向测试 **27/27 通过**；UI typecheck **通过**；i18n 完整性 **15,954 / 15,954**（无缺键、多余键、空值或占位符问题）；9 个修改过的资源分片与聚合字典比对 **8,971 项、0 不一致**；完整候选扫描 **1,276 个源文件、8,393 条启发式候选、56 条相同英文复核项**；token gates 四项 CLEAN；`git diff --check` 通过。
- 全站中文目标仍**未完成验收**：本轮没有运行完整测试/构建，也没有可用的本地服务进行 253 条路由的浏览器逐状态验收。完整扫描只提供静态候选，56 条相同词条与 8,393 条硬编码候选仍需按实际渲染上下文继续复核。

### 2026-10-20 连接器标题与系统公告复核 checkpoint

- 交互检查发现连接器目录已显示“本地模型服务”，但打开 `/CMP/apps/connect?source=local` 后 AI 提供商表单仍显示英文 `Local endpoint`。`AiProviderSetup` 现在按已知提供商翻译本地端点和通用自定义网关名称；保留如 `Responses API` 等外部产品/协议名称。定向测试覆盖本地端点传入英文标签时仍使用源字典标签，以及通用网关的回退标签。
- 实际页面上还出现了第一方远程公告 `2026-09-14-connectors`。公告 feed 由外部 Paperclip 服务提供，UI 只对这一已确认的固定 ID 在展示层使用中英文翻译；API payload 不变，其他/未来公告仍显示 feed 原文，需等待上游提供本地化内容或逐条补充映射。当前验收实例之前已隐藏该公告，因此映射由单元测试覆盖，未在浏览器中重新看到译文卡片。
- 浏览器实际检查：连接器目录中的“本地模型服务”名称、连接页标题“连接 本地端点”、`Bearer 令牌`及表单字段均为中文；未提交 API 密钥。此前 106 个唯一路由快照扫描为 0 路由错误、HTTP 错误、浏览器错误和错误语言；114 个英文候选主要是品牌、协议/命令、机器 ID 与动态用户值，交互后发现的 `Local endpoint` 已修复。原始证据：`/private/tmp/paperclip-cn-i18n-evidence-vKjc6R/zh-static-route-scan.json`。
- 验证：`AiProviderSetup`、`AnnouncementCard` 与公告文案映射定向测试 **23/23 通过**；UI typecheck **通过**；`pnpm --filter @paperclipai/ui build` **通过**（有既有 CSS `::highlight`、大 chunk 和动态导入警告）；i18n **17,731 / 17,731**；token gates 四项 CLEAN；`git diff --check` 通过。第一次公告组件测试运行有 3 项因测试仍断言旧无障碍名称 `Dismiss announcement` 而失败；断言已同步到当前字典值 `Dismiss notification`，随后 23/23 通过。
- 本次没有重跑完整 UI/全仓测试、253 条全部路由或所有动态状态。最近的全工作区 typecheck 曾受 `packages/db` 的临时 IPC socket `EPERM` 阻断；本轮 UI typecheck 通过。全站中文目标仍未完成验收，继续逐路由检查表单、弹窗、空态、错误态和外部动态内容。

### 2026-10-20 配额/成本、移动导航、Agent/Goal 属性与工作区卡片 checkpoint

- 账号与提供商配额卡片、成本口径/账单支出/按用户成本表、移动端底部导航、公告无障碍与关闭失败提示已补齐静态中英文案；日期、百分比和数量按当前语言格式化，服务端公告正文与用户数据保持原值。
- Agent 属性面板现翻译固定字段和已知角色；Goal 属性与新建弹窗现翻译状态、层级、所有者和操作文案。Issue 工作区卡片现翻译工作区模式/状态、编辑与复制动作、环境/仓库标签、运行说明和文件浏览入口；工作区运行时命令面板现翻译操作、类型/状态、健康度、HTTPS 暴露提示和空态。机器状态值继续通过显示层映射呈现，命令名和原始运行诊断保持原值。
- 本 checkpoint 的 `en` / `zh-CN` 各 **15,895** 个键。非测试 UI 源文件直接导入 `@/i18n` 共 **468** 个。
- 验证：UI typecheck **通过**；`node scripts/i18n-audit.mjs --check` **通过**（15,895 / 15,895，无缺失/多余/空值/占位符错误）；完整审计扫描 **1,276** 个源文件，报告 **8,447** 个启发式候选（包含误报，不等于未翻译条目数）；`pnpm check:token-gates` **通过**（4 项 CLEAN）；Agent/Issue/Runner 资源分片与聚合子树对齐、`git diff --check` **通过**。未运行测试、构建或浏览器验收。
- 全站简体中文目标仍未完成；继续以实际可见的英文界面为准，逐步完成 Issue 详情/线程、Task Chat、Routine、AI Connections 与其余路由/状态检查。

### 2026-10-19 Agent 设置提示、Dot 配对与任务续接交接 checkpoint

- 共享 `AgentSetupPrompt` 的默认标题/说明/按钮、复制成功与失败状态、可访问性标签及读屏播报现已接入 `agentSetupPage.agentSetupPrompt`；Dot 配对面板的固定说明、已知连接状态、配对操作与提示已接入 `runnerComponents.dotRunnerConnection`。
- `IssueContinuationHandoff` 的回退标题、展开/收起、交接标签、更新时间、续接操作和提示框文案现接入 `issuesPage.continuationHandoff`。动态提示词、任务正文、Agent 名称及未知连接状态继续保留原值。
- 本轮新增 **52** 个中英文键；当前 `en` / `zh-CN` 各 **15,727** 个键。`issuesPage` / `taskChatPage` / `agentSetupPage` 分别有 **865 / 1,166 / 1,130** 个叶子键；非测试 UI 源文件直接导入 `@/i18n` 共 **456** 个。
- 验证：UI typecheck、`node scripts/i18n-audit.mjs --check`（15,727 / 15,727）、完整审计（1,276 个源文件、8,626 个启发式候选）、`pnpm check:token-gates`（4 项 CLEAN）和 `git diff --check` 均通过。未运行测试、构建或浏览器验收。
- 全站简体中文目标仍未完成；后续继续完成 Issue / Task Chat 状态、AI Connections、Routine 和其他内置可达页面的逐状态复核。

### 2026-10-19 全站实时通知 continuation checkpoint

- 全局 WebSocket 通知 Toast 已接入 `liveUpdates` 中英文资源：任务创建/更新/评论摘要、状态与优先级变更、加入请求、Agent 和任务运行状态、操作链接及静态系统/插件/未知操作者标签均按当前界面语言生成。
- 用户评论、任务标题、Agent/用户名称和服务端错误详情继续作为动态内容展示；任务状态和优先级摘要使用已有状态/优先级翻译映射。
- 新增 **38** 个中英键；当前 `en` / `zh-CN` 各 **15,675** 个键，非测试 UI 文件直接引用 `@/i18n` 共 **454** 个。
- 本轮验证：UI typecheck、`node scripts/i18n-audit.mjs --check`（15,675 / 15,675）、完整审计（1,276 个源文件、8,671 个启发式候选）、token gates（4 项 CLEAN）、资源分片/聚合对齐及 `git diff --check` 均通过。未运行测试、构建或浏览器验收。
- 全站简体中文目标仍未完成；继续检查其余可达页面和跨页面动态状态。

### 2026-10-19 Speko 通话记录 continuation checkpoint

- Speko 通话记录与活动条目现已翻译通话方式/状态、时间、费用和时长、文字记录说话人及缺失状态、连接错误、结束通话按钮、未批准来电和历史列表空/加载/错误状态。
- 通话时间使用应用的 `formatDateTime` 本地化格式；费用数值精度和 USD 语义保持不变，动态服务端错误仍保留原文，应用文案包装使用现有 `appsPage.chatDetail` 键。
- 新增 **39** 个中英键；当前 `en` / `zh-CN` 各 **15,637** 个键，非测试 UI 文件直接引用 `@/i18n` 共 **453** 个。
- 本轮验证：UI typecheck、`node scripts/i18n-audit.mjs --check`（15,637 / 15,637）、完整审计（1,276 个源文件、8,685 个启发式候选）、token gates（4 项 CLEAN）、资源分片/聚合对齐和 `git diff --check` 均通过。未运行测试、构建或浏览器验收。
- 全站简体中文目标仍未完成；继续检查 Issue / Task Chat 未映射状态及其他高优先级可达页面。

### 2026-10-19 技能导入与董事会聊天 continuation checkpoint

- 技能来源导入流程已接入翻译：导入进度与状态、选择树、警告说明、包预览操作和计数现由 `skillsPage.sourceImport` 提供中英文文案；用户技能内容、仓库/路径、来源错误和原始扫描警告仍保留原值。
- Board Chat 的空组织提示、面包屑/标题回退、聊天历史/新建聊天控件、欢迎文案、4 个快捷建议、输入区、分隔栏与移动端 Agent 动态入口均已接入 `taskChatPage.boardChat`。快捷建议的发送内容会随当前语言生成；固定流式状态及服务端工具状态、已知错误会在界面层翻译，未知服务端状态和 Agent 回复仍显示原值。
- 本 checkpoint 合计新增 **124** 个中英键；当前 `en` / `zh-CN` 各 **15,598** 个键，`taskChatPage` 有 **1,166** 个叶子键，非测试 UI 文件直接引用 `@/i18n` 共 **452** 个。
- 本轮验证：`pnpm --filter @paperclipai/ui typecheck`、`node scripts/i18n-audit.mjs --check`（15,598 / 15,598）、完整审计（1,276 个源文件、8,724 个启发式候选）、`pnpm check:token-gates`（4 项 CLEAN）、Board Chat 分片/聚合资源对齐及 `git diff --check` 均通过。未运行测试、构建或浏览器验收。
- 全站简体中文目标仍未完成；下一步继续核查 Issue Chat Thread、Task Chat 分类/状态映射和其余可达页面中的真实英文界面文案。

### 2026-10-19 密钥提议与 Agent 访问绑定 continuation checkpoint

- 密钥提议列表、加载/错误/空状态、到期信息、指纹提示、批准/拒绝对话框和操作提示已接入 `settingsPage.secrets`；Agent 密钥访问编辑器的空态、待审批区、API 访问别名、版本选择和校验文案也已接入翻译。
- 共享 `ProposalJustification` 与 Issue 线程中的密钥提议到期标签现使用 `settingsPage` / `issuesPage` 键。用户或 Agent 提交的理由、密钥名/路径、指纹值和 API 返回的原始错误仍保持原值。
- 新增 **72** 个中英翻译键，当前 `en` / `zh-CN` 各 **15,474** 个键；非测试 UI 中有 **446** 个文件直接接入 `@/i18n`。
- 本轮验证：UI typecheck、`node scripts/i18n-audit.mjs --check`（15,474 / 15,474）、完整审计（1,276 个源文件、8,821 个启发式候选）、token gates（4 项 CLEAN）、资源分片与聚合字典一致性检查、`git diff --check` 均通过。未运行测试、构建或浏览器验收。
- 全站简体中文目标仍未完成；继续核查 Issue / Task Chat 实际可见缺口、Adapter 配置、Routine、AI Connections 与其余内置页面状态。

### 2026-10-19 Adapter、Agent Skills 与文件夹控件 continuation checkpoint

- Adapter 展示注册表已将内置适配器的说明、退役/禁用提示、Muse 描述及外部网关后缀接入中英文键；动态插件类型继续按显示层规则生成标签。`getAdapterLabels()` 改为返回当前语言标签，Agent 配置、公司导入、技能页与 Agent 属性展示订阅语言变化。
- 修正 `CompanyImport` 中 Adapter 选择项的局部化接线：特殊 Dot/Muse 选项统一在组件内生成已翻译标签，导入失败来源提示读取当前选项标签。
- Agent Skills 页及其行/版本选择组件接入翻译：保存状态、适配器限制提示、空态、筛选结果、只读/开关无障碍名称、版本默认项、发布日期、来源类别等固定文案均改用资源键。技能名、描述、仓库/主机名和原始 API 错误仍保留原值。
- 技能与定期任务共用的文件夹 rail、面包屑、移动端抽屉、移动/新建/删除对话框、批量工具条、预览路径和保留目录标签已接入翻译；文件夹名称和路径片段继续作为动态数据显示。
- 本轮新增 **133** 个中英词条（Adapter / Agent Skills 69 个，文件夹控件 64 个）；`en` / `zh-CN` 当前各 **15,402** 个键。`issuesPage` / `taskChatPage` / `agentSetupPage` 当前分别有 **856 / 1,134 / 1,113** 个叶子键。
- 本轮验证：`pnpm --filter @paperclipai/ui typecheck` **通过**；`node scripts/i18n-audit.mjs --check` **通过**（15,402 / 15,402）；`pnpm check:token-gates` **通过**（4 项 CLEAN）；`git diff --check` **通过**。未运行测试、构建或浏览器验收。
- 最新完整审计扫描 1,276 个源文件并报告 **8,891** 个启发式候选；其中 Adapter 注册表的英文源字段虽仍被扫描命中，运行时已由映射翻译，候选数不能当作待翻译文本数量。
- 全站简体中文目标仍未完成；下一步继续处理 Issue / Task Chat 余项、Adapter 配置字段、Routine 与 AI Connections，并审查其他真实硬编码文案。

### 2026-10-19 continuation checkpoint

- 修复了状态标签大小写在不同组件中的语义差异，并将恢复提示改为调用时翻译，避免模块加载时把初始中文固定在模块常量中。
- 更新了聊天源码契约测试，使其校验翻译键对应的英文文案，并兼容 `t()` / `translate()` 两种既有调用。
- 完成 `ExternallyConnectedTaskBanner.tsx` 的中英文接线，新增 `chatComponents.externalTaskBanner` 的 **94 个**对应键，覆盖连接提示、发布/文件传输状态、草稿与重试错误、辅助标签。动态状态文案以翻译键保存，切换语言后可重新渲染。
- `MyIssues` 与 `Issues` 页面入口接入现有 `issuesPage` / `nav` 键；新增中英文空组织提示回归用例。
- `IssuesList` 与 `LegacyIssuesList` 的搜索、工具栏/看板辅助标签、排序/分组、空态、子任务摘要、分组回退值、负责人与加载/分页提示接入现有翻译键。
- `IssueProperties.tsx` 已将 Watchdog、Monitor ETA、计划重试、标签/负责人/项目/关系选择器、关于信息及属性侧栏标签接入 `issuesPage.properties` 键；新增 `etaDueNow` / `etaInDuration` / `etaOverdueBy` 中英键，并保留 API 原始错误文本。
- 已验证：i18n 审计 `13,881 / 13,881`；Issue 列表与页面定向测试 97/97 通过；`IssueProperties` 相关定向测试 110/110 通过；UI 与全工作区类型检查通过；全仓构建通过；token gates 4 项 CLEAN。全量 UI 测试的 8,529/8,529 是更早基线。
- `pnpm test:run` 运行约 35 分钟后被停止，未取得最终汇总；停止前曾看到 `server/src/__tests__/workspace-runtime.test.ts` 的 180 个用例中有 2 个远端 Git 分支/base-ref 诊断断言失败，与本地化改动无关。L7 浏览器/人工验收仍未运行。
- `node scripts/i18n-merge-fragments.mjs` 目前会在现有 `agentsPage.prompts.views.read` 中英片段与聚合字典不一致时失败；未使用 `--force`，本轮 ETA 键同时写入 `issuesPage` 分片与 `en.json` / `zh-CN.json` 聚合文件。
- 后续仍需完成 Issue 详情、属性、线程/交互卡、列表剩余区域与 Task Chat（109 个文件），之后还有 New Agent/Adapters、Routine 编辑器、AI Connections 和 P2 区域；本 checkpoint **不代表全站汉化完成**。

### 2026-10-19 Task Chat continuation checkpoint

- Task Chat 新接入队列消息、描述气泡、阻塞/进行中任务链、系统通知、实时运行提示、运行结果、计划预览、活动分组、工具行与消息附件等固定界面文案；暂停原因的本地识别标题也改为按当前语言翻译。
- `ui/src/components/task-chat/` 下 65 个 TS/TSX 源文件中，已有 **22 个**直接导入 `@/i18n`；外层 `TaskChatThread.tsx` 也已连接翻译。Task Chat 仍是部分完成，工具分类、转录映射、状态词、协议动态信息及其他组件仍待继续审查。
- `taskChatPage` 新增 8 个中英键（队列状态、可识别暂停原因及实时工具摘要分隔符），当前 `en` / `zh-CN` 各 **13,894** 个键严格对齐，`issuesPage` / `taskChatPage` / `agentSetupPage` 分别有 853 / 1,028 / 997 个叶子键。
- 本轮验证：`pnpm --filter @paperclipai/ui typecheck` **通过**；`node scripts/i18n-audit.mjs --check` **通过**（13,894 / 13,894）；`pnpm check:token-gates` **通过**（4 项 CLEAN）；`git diff --check` **通过**。测试与浏览器验收未运行。
- 本 checkpoint **不代表 Task Chat 完成，也不代表全站中文目标完成**。后续先继续收敛 P0 的 Issue / Task Chat 核心，再处理 New Agent/Adapters、Routine 编辑器/触发器、AI Connections 和 P2 区域。

### 2026-10-19 全站汉化继续 checkpoint

- `RunTranscriptView.tsx` 已为转录状态、工具卡、运行事件、命令摘要、空态及辅助标签接入中英文翻译；模型名、命令、运行输出等动态数据仍显示原始值。
- `LegacyInbox.tsx` 已补齐审批/加入请求状态、筛选与分组、错误提示、收件箱空态及提醒等固定界面文案。
- 共享侧边面板、移动端标签菜单、属性面板与 `TaskSidePanel.tsx` 已接入翻译。已保存的已知标签会按当前语言显示；动态文档标题、文件路径和技能名继续保留原值。
- Task Chat 的 `TaskChatCompactInteractionCard.tsx` 补齐详情标签；完成活动摘要现在按当前语言生成类别、组合标签和辅助说明。
- Routine 活动行、活动日期分组以及运行/Webhook/修订/文档批注事件已接入现有词条，保留事件 ID、动态详情和数据库值。
- `AgentWorkPanels.tsx` 的任务与交付成果空态、错误、排序、加载、截断提示及日期标签已本地化；`AgentChannelsPanel.tsx`、`ChatDetailSidebar.tsx` 和 `ChatSetupNavigation.tsx` 的固定文案也已接入现有词条，频道七种状态增加中英文映射。
- `transcript-adapter.ts` 的无名工具、思考时长、缺失计划步骤/子 Agent 回退名称和布尔值已翻译；协议字段标签在 `TaskChatProtocolCard` 渲染时用已有词条本地化，内部字段名保持不变。
- `CompanySkills.production.tsx` 的预览/代码切换按钮现复用主版本词条；`AgentDetail.production.tsx` 的运行日志固定错误回退文案复用已有中英键。
- 复核确认 `AgentChat.tsx` / `AgentChats.tsx`、`InvitesSection.tsx`、`ImportSkillsFromProjectDialog.tsx` 与 New Agent 核心流程已接入翻译。`ui/src/adapters/` 中 14 个文件有 i18n 接线，Adapter 区域仍需继续审查。
- 当前 `en` / `zh-CN` 各 **14,709** 个键，`issuesPage` / `taskChatPage` / `agentSetupPage` 分别为 **855 / 1,134 / 1,086** 个叶子键；非测试 UI 源文件中有 412 个直接导入 i18n。
- 本检查点验证：完整 i18n 审计扫描 1,276 个源文件并报告 9,575 个硬编码候选（含大量代码/注释误报）；`--check` 的键一致性、缺键、多余键、空值和占位符检查全部通过；UI typecheck 通过；token gates 四项 CLEAN；locale JSON 均可解析；`git diff --check` 通过。未运行测试或浏览器验收。
- 全站中文目标仍未完成。下一步继续核实 Issue 详情、聊天线程与交互卡的真实可见文案，并审查 Adapter、AI Connections、其他 production 变体及审计中其他高优先级用户界面。审计候选数仅作筛查，不能视为尚未翻译文案的精确数量。

---

## 1. 文档定位

本次任务的目标是：在不改变业务逻辑、数据存储值、协议和设计系统的前提下，为 Paperclip CN Fork 提供可持久化、可切换的简体中文界面，同时保持英文为源语言与回退语言。

原始实施文档：`/Users/mauriceliang/Downloads/Paperclip-CN-全站简体中文支持-实施文档-v1.0.md`。
更早的实施记录：`doc/plans/2026-10-19-zh-cn-localization.md`（本文件是它的交接补充，不替代它）。

---

## 2. 验证现状（真实运行结果）

| 检查 | 命令 | 结果 |
| --- | --- | --- |
| i18n 键、占位符与源码引用 | `pnpm i18n:check` | **通过（本轮）**：`sourceKeys=17,919`，`targetKeys=17,919`；13,950 个唯一字面量翻译键引用无缺失 |
| 完整文案候选扫描 | `pnpm i18n:audit` | **完成（本轮）**：1,278 个源文件、6,644 个启发式候选、59 条与英文相同复核项；含误报，不等于剩余待翻译数 |
| UI 类型检查 | `pnpm --filter @paperclipai/ui typecheck` | **通过**（最近一次本地化 checkpoint） |
| UI 构建 | `pnpm --filter @paperclipai/ui build` | **通过**；有既有 CSS `::highlight`、大 chunk 与动态导入警告 |
| 设计系统 token 门禁 | `pnpm check:token-gates` | **通过**：4 个 gate 全部 CLEAN，cliplab 同步 |
| Diff 空白检查 | `git diff --check` | **通过**（最近一次代码检查；本次文档更新后需重跑） |
| 定向 UI 测试 | 本地化相关 21 个 Vitest 文件 | **通过：175/175**；覆盖复制提示、Pipeline 变更提示、OAuth handoff、Smoke Lab、目录/配置和此前相关组件 |
| 全量 UI 测试 | `pnpm --filter @paperclipai/ui exec vitest run` | 较早基线 **8,529/8,529 通过**；当前版本尚未全量重跑。Issue 列表/页面 97/97 与 IssueProperties 110/110 均为之前 checkpoint 的定向结果 |
| 全仓构建 | `pnpm build` | **通过**（较早 checkpoint；本轮未重跑） |
| 全仓类型检查 | `pnpm -r typecheck` | 较早 checkpoint **通过**；最近一次尝试被 `packages/db` 的临时 IPC socket `EPERM` 阻断，本轮 UI-only 改动后未重跑 |
| 全仓测试 | `pnpm test:run` | 运行约 35 分钟后停止，未取得最终汇总；此前观察到 `workspace-runtime.test.ts` 的 2 个远端分支/base-ref 断言失败 |
| 浏览器验收（L7） | CUA | 此前静态快照 **106 个页面**，本轮又尝试 **39 个入口**；当前确认的空态/设置页显示中文。尚未覆盖全部路由、详情数据、动态状态、窄屏与语言持久化 |

`i18n-audit --check` 校验中英键一致性、占位符、空值及源码中字面量翻译键引用；动态拼接键仍不能由该静态检查确认。硬编码文案扫描继续作为候选报告，不作为失败门禁。

审计报告输出到 `artifacts/i18n/`（已加入 `.gitignore`）：

- `route-inventory.json`：从 `ui/src/App.tsx` 解析出的 253 条路由。
- `component-inventory.json`、`locale-key-parity.json`、`translation-reference-report.json`、`hardcoded-string-report.json`、`coverage-summary.md`。

> 注意：`hardcoded-string-report.json` 是启发式扫描（正则，不是 TS AST，因为 TS 7 原生包不再导出旧的 AST API），会包含大量误报（例如 `(); return`）。它适合排序和定位，不适合当作“剩余待翻译数”直接汇报。真正可信的优先级以第 6 节的热点表为准。

---

## 3. 语言架构（L1，已完成）

### 3.1 三个必须分开的概念

| 概念 | 值 | 含义 |
| --- | --- | --- |
| `SOURCE_LOCALE` | `en` | 所有键的源语言，英文文案的唯一事实来源 |
| `FALLBACK_LOCALE` | `en` | 当前语言缺键时的回退语言 |
| `INITIAL_UI_LOCALE` | `zh-CN` | 本 Fork 首次访问的默认界面语言 |

### 3.2 关键文件

| 文件 | 职责 |
| --- | --- |
| `ui/src/i18n/index.ts` | i18next 初始化、`setLocale()`、`getLocale()`、`<html lang>` 同步、统一导出 `t` / `useTranslation` |
| `ui/src/i18n/locales.ts` | 语言常量、40 个 locale 文件的注册、strict/partial 校验调度 |
| `ui/src/i18n/locale-validation.ts` | `strict` / `partial` 两种校验模式；占位符、原始 HTML、事件属性、`javascript:` / `data:`、URL、长度检查 |
| `ui/src/i18n/locale-preference.ts` | `localStorage["paperclip.ui.locale"]` 安全读写、默认 `zh-CN`、语言选项、`document.lang` |
| `ui/src/i18n/status.ts` | 机器值 → 翻译键的显式 allowlist；未知值回退为把 `_`/`-` 替换成空格的机器值 |
| `ui/src/i18n/formatters.ts` | `Intl` 日期/时间/数字/货币/百分比/相对时间；`en` 映射为 `en-US` |
| `ui/src/i18n/terminology.md` | 统一术语表（Dashboard=工作台、Agent=Agent、Task=任务、Routine=定期任务等） |
| `ui/src/components/LanguagePreferenceControl.tsx` | Profile 设置页的语言选择器 |
| `ui/src/pages/ProfileSettings.tsx` | 语言设置卡片入口 |

### 3.3 校验策略

- `en` 与 `zh-CN`：**strict**。必须与源语言键结构完全一致。
- 其余约 38 个语言：**partial**。允许缺键（回退英文），但：
  - 不允许出现英文源中不存在的“多余键”；
  - 已提供的每个值仍要检查占位符一致性、原始 HTML、事件属性、`javascript:` / `data:`、非预期 URL、长度。
- `UI_LOCALE_OPTIONS` 只展示 `简体中文` 与 `English`；其他语言仍能加载，但不宣称完整。

### 3.4 切换行为

优先级：已保存的浏览器偏好 → `zh-CN` → `en`。

- 切换调用 `i18n.changeLanguage()`，无需刷新页面。
- 同时写入 `localStorage` 并更新 `<html lang>`。
- 存储损坏、写入失败、隐私模式不可访问等情况均静默容错，不阻塞切换。

### 3.5 测试基础设施

- `ui/vitest.setup.ts` **无条件安装** `localStorage` mock（Node 26 自带的实验性 `localStorage` 在未提供 `--localstorage-file` 时会抛错）。
- 测试 locale 被固定为 `en`，以保证既有英文断言仍然有意义。
- i18n / locale-preference / LanguagePreferenceControl 的自有测试覆盖：即时切换、部分语言回退、非法 locale、默认 `zh-CN`、持久化、损坏存储、`<html lang>`、无 `document` 环境。

> 固定测试语言通过 `beforeEach` 清理存储并等待 `i18n.changeLanguage("en")` 完成，不再预写 locale 键。此前出现的 localStorage 污染已修复。

---

## 4. 翻译资产与当前规模

| 指标 | 数值 |
| --- | --- |
| locale JSON 文件 | 40 个（`en.json`、`zh-CN.json` + 38 个其他语言） |
| `en` 键数 | 15,727 |
| `zh-CN` 键数 | 15,727 |
| `en` 与 `zh-CN` 完全相同的值 | 89 个（含品牌名、缩写及技术术语；仍可人工复核） |
| 已接入 `@/i18n` 的非测试 `ui/src` 文件 | 456 |
| 翻译分片目录 | `ui/src/i18n/locales/fragments/`，47 个命名空间 × 2 个文件 + README |
| 工作区状态 | 含大量既有本地化改动及分片；尚未提交、推送或创建 PR |

### 4.1 分片工作流

大型模块通过 `ui/src/i18n/locales/fragments/<namespace>.en.json` 与 `.zh-CN.json` 并行翻译，再合并：

```bash
node scripts/i18n-merge-fragments.mjs
node scripts/i18n-merge-fragments.mjs --force   # 覆盖已有键的更新值
node scripts/i18n-merge-fragments.mjs --clean   # 合并成功后删除分片
```

分片是工作文件，不是发布产物。当前分片仍在工作区中（未跟踪），合并脚本不会自动删除。

### 4.2 已合并但尚未接线的命名空间

以下命名空间的键已经合并进 `en.json` / `zh-CN.json`，当前为未接线或部分接线：

| 命名空间 | 键数 | 目标模块 |
| --- | ---: | --- |
| `issuesPage` | 982 | Issue 列表、页面入口、属性面板、详情/聊天线程/交互卡及任务续接交接均已部分接线；仍待用真实详情/运行数据复核 |
| `taskChatPage` | 1,227 | Task Chat 部分组件已接线；65 个非测试源码文件中 38 个直接导入 `@/i18n`；共享 Agent 工作面板、频道面板及聊天侧栏也已接入 |
| `agentSetupPage` | 1,230 | New Agent 核心流程、Adapter 展示元数据、配置字段及共享 Agent 设置提示已有接线；Provider 登录与动态插件 Schema 仍需边界检查 |

当前三个命名空间合计 **3,439 个叶子键**。三个命名空间都仍有未接线或部分接线内容；精确未使用键数尚未重算。这些是已完成的中英翻译资产，继续直接复用，不要重新翻译或删除。

---

## 5. 已完成模块（已接入 `t()` / `useTranslation()`）

以下按产品区域列出，括号内是已翻译的典型范围：

- **全局框架**：Sidebar、导航项、分组、账户菜单、公司菜单、Agent 列表、项目/星标项目、最近任务、服务端信息、面包屑、Layout、Command Palette、SearchableSelect、Toast、错误边界、主题切换、对话框/Sheet/Command/Breadcrumb 原语。
- **认证与引导**：登录、CLI 认证、Board Claim、邀请落地页、Bootstrap 等待页、Onboarding Wizard（70 处）、Muse 邀请文案。
- **工作台与消息**：Dashboard、Inbox、Activity、Timeline、What Needs Me、搜索、过滤条、Collection Toolbar、分页/标签栏。
- **项目与目标**：Projects、Project Detail、Project Workspace、Goals、Workspaces。
- **Agent 与组织**：Agent Detail（248 处，部分区域）、New Agent 核心流程、Agent Chat 页面、Agent 配置表单、Org、Org Chart、Team Catalog、Agent Capsule、生命周期状态、操作按钮。
- **任务与运行（部分）**：IssuesList / LegacyIssuesList 的过滤标签与状态映射、Issue 过滤弹窗、Issue 属性面板、状态徽章/图标、优先级、运行重试状态、注意力队列、阻塞收件箱、活动文本、系统通知人性化。
- **业务流程**：Routines、Routine Detail、Approvals、Costs、Artifacts、Audit。
- **技能与扩展**：Company Skills（387 处）、Agent Skills Tab 与版本选择器、Skill Studio、Skill Sources、技能/定期任务共用文件夹控件、插件管理/设置/页面。
- **设置**：General、Profile、Company Settings、Access/Secrets（部分）、Plugin Settings、Budgets、Backups、Environments、Notifications。
- **密钥审批与 Agent 访问绑定**：Secrets 提议列表、指纹/到期文案、批准/拒绝对话框、Agent 的 API 访问绑定编辑器及 Issue 密钥提议说明。
- **Apps / Connections / Tools**：63 个 Apps 页面文件、21 个 Tools 页面文件，包括 Apps Browse/Detail/Connect、连接设置流程、Chat Endpoint、Slack/GitHub/Teams/Discord/Telegram/AgentMail 设置、技能/应用目录、Paste Config、Profiles、Smoke Lab 等。
- **Pipelines / Cases**：`Pipelines.tsx`（302 处）、`PipelineSettings.tsx`（192 处）、`Cases.tsx`（56 处）、Pipeline Item、Pipeline Liveness、Status Cards。
- **共享库**：`attention.ts`、`blockedInbox.ts`、`inbox.ts`、`search-filters.ts`、`task-views.ts`、`utils.ts`、`timeAgo.ts`、`issue-chat-messages.ts`、`runRetryState.ts`、`transcriptPresentation.ts`、`external-objects.ts`、`skill-policy-denial.ts`、`issue-change-receipt.ts`、`issue-thread-interactions.ts`、`pipeline-liveness.ts`、`pipeline-item-detail.ts`、`status-card-state.ts`、`app-gallery-copy.ts`、`activity-format.ts`、`recovery-display.ts`、`secret-delivery.ts`、`system-notice-humanizer.ts`。
- **动态值处理**：`statusLabel` / `priorityLabel` allowlist；`formatters.ts` 日期/数字/货币/相对时间；activity 动词；app gallery 文案。
- **转录与侧栏**：`RunTranscriptView.tsx`、`LegacyInbox.tsx`、共享 Side Panel 与任务侧栏已接入当前语言渲染。

---

## 6. 未完成模块（按优先级）

排序依据：文件硬编码候选数（审计热点）+ 业务重要性。候选数是启发式值，可能包含误报，但相对排序有参考价值。

### P0 — Issue 核心（必须先做）

| 文件 | 行数 | 候选数 | 当前状态 |
| --- | ---: | ---: | --- |
| `ui/src/pages/IssueDetail.tsx` | 8,674 | 109 | 已接入 `issuesPage.detail` 的 177 个既有键；当前命中主要是属性类型/注释，需按真实运行路径继续审查 |
| `ui/src/components/issue-properties/IssueProperties.tsx` | 3,284 | 47 | 已接入主要属性、选择器、Monitor/重试及侧栏标签；审计命中仍需逐项确认 |
| `ui/src/components/IssueThreadInteractionCard.tsx` | 4,101 | 91 | 大部分命中为类型/注释示例；主要交互状态与操作已接入翻译，继续查漏真实 JSX 文案 |
| `ui/src/components/IssueChatThread.tsx` | 6,811 | 120 | 已接入 47 处 JSX 文案与 23 处 UI 属性；扫描命中以类型签名为主，继续核对可见文本 |
| `ui/src/components/chat/ExternallyConnectedTaskBanner.tsx` | 912 | 17 | 已接入；新增 `chatComponents.externalTaskBanner` 中英文各 94 键，剩余命中主要是实现细节 |
| `ui/src/components/IssuesList.tsx` | 2,580 | 29 | 搜索、工具栏/看板提示、空态、分组与分页等已接入；审计命中主要是代码片段 |
| `ui/src/components/LegacyIssuesList.tsx` | 2,407 | 29 | 与新列表同步接入上述文案；审计命中主要是代码片段 |
| `ui/src/pages/MyIssues.tsx`、`Issues.tsx` | — | — | 页面入口提示、面包屑、新建任务按钮和组织空态已接入；列表项由列表组件负责 |
| `ui/src/pages/AgentChat.tsx`、`AgentChats.tsx` | — | — | 固定页面文案已接入 i18n；子组件和动态内容仍需整体审查 |

对应翻译资产：`issuesPage`（855 个叶子键，部分使用）。Issue 聊天/交互还可能复用 `issueComponents`、`chatComponents`、`interactions`、`issueFields`。

### P0 — Task Chat

`ui/src/components/task-chat/` 有 **65 个非测试 TS/TSX 源文件，其中 38 个直接导入 i18n**。近期已继续覆盖转录、活动汇总、紧凑交互卡和附件等区域；下列审计数是启发式命中，不能直接等同于未翻译字符串：

- `tool-taxonomy.ts`（154；大量英文是已有翻译键的英文回退文本）
- `task-chat-activity-presentation.ts`（109；需确认动态 provider 值与 UI 标签边界）
- `transcript-adapter.ts`（48；剩余扫描命中主要为类型/注释及 provider 原始字段）
- `TaskChatComposer.tsx`（31）
- `ComposerRunSettingsPicker.tsx`（20）
- `task-chat-attachments.ts`（74；文件类型标签已有翻译映射，需核对所有调用方）

对应翻译资产：`taskChatPage`（1,134 个叶子键，部分使用）。

> 该目录曾有一轮接线在 API 402（Insufficient Balance）中断后整体回退；之后已从现有键逐文件继续。当前未接线模块仍可能显示英文，继续使用 `taskChatPage` 既有词条并逐步补齐，不要把目录级部分接入视为完成。

### P1 — New Agent 与 Adapters

- `ui/src/components/new-agent/` 的 New Agent、外部 Agent 邀请、Provider 连接与 Muse/Grok Bot 主要流程已有翻译接线。
- `ui/src/adapters/` 有 46 个非测试 TS/TSX 文件，其中 15 个直接导入 i18n；固定内置适配器字段已有接线，继续复核其余字段/向导和动态扩展的显示边界，优先复用 `agentSetupPage`（1,230 键）。

### P1 — Routine 编辑器/触发器

- Routine trigger 目录的 5 个非测试 TS/TSX 文件均已有翻译接线；routine sections 中有 3 个文件直接导入 i18n，活动日志与运行区现已接入翻译，剩余 `context.tsx` 仅提供状态/上下文。

### P1 — AI Connections

`ui/src/components/ai-connections/` 的 17 个非测试 TS/TSX 文件中，15 个直接导入 i18n。复核剩余 `model.ts` 与 `useConnectionModels.ts` 是否包含需要本地化的可见文案，并用可用的连接数据检查模型加载/失败状态。

### P2 — 其他未完成区域

- `ui/src/components/chat/` 有 6 个非测试 TS/TSX 文件，其中 5 个直接导入 i18n；`AgentChannelsPanel.tsx`、`AgentWorkPanels.tsx`、`ChatDetailSidebar.tsx`、`ChatSetupNavigation.tsx` 的固定界面文案已接入翻译。剩余文件 `board-send-draft.ts` 是消息草稿处理工具。
- 各 `.production.tsx` 变体：已修复 Company Skills 与 Agent Detail 本轮查到的漏译；继续检查其他变体（例如 `editable-sections.production.tsx`）。

---

## 7. 已确认的根因与高危问题

这一节是交接的核心。52 个失败测试几乎全部由下面 5 类问题导致；先修根因，再逐个修测试，效率最高。

### 7.1 【P0 全局】`<link>` 被 HTML 解析器当作 void 元素

**现象**：使用 `<Trans i18nKey="..." components={{ link: <a ... /> }} />` 且英文/中文值包含 `<link>文字</link>` 时，DOM 渲染为：

```html
<p>Just a URL? <a href="/apps"></a>Browse planned app connections instead.</p>
```

链接文字跑到 `<a>` 外面，导致：

- 链接无可访问名称；
- 测试 `link.textContent` 为空；
- 页面视觉上链接区域没有下划线文字，只有后面一段普通文字。

**根因**：`html-parse-stringify@4.0.1` 在 `VOID_ELEMENTS` 中硬编码了 `link: true`（HTML 的 `<link>` 是 void 元素）。react-i18next 用它解析翻译字符串，因此 `<link>...</link>` 被当成 `<link/>`，内部文字被放到元素之后。

这不是 `Trans` 自闭合写法的问题。用 `<a />` 作为 component 本身是合法的，react-i18next 会注入 children；问题只在**翻译标签名恰好是 `link`**。

**影响范围**：

- `ui/src/i18n/locales/en.json` 与 `zh-CN.json` 各 **26 个键**包含 `<link>`。
- 源码中 **21 处** `components={{ ... link: ... }}` 映射。
- 已确认导致的失败：`PasteConfigTab.test.tsx`、`OnboardingWizard.test.tsx`、`AppDetail.test.tsx`、`AppsConnect.test.tsx`（部分断言）。

**推荐修复（源码级，改动可审计）**：

1. 把翻译标签名从 `link` 改为非 void 名称，例如 `<lnk>...</lnk>`：
   - `en.json`、`zh-CN.json`、`fragments/*.json` 中替换 `<link>` → `<lnk>`、`</link>` → `</lnk>`。
   - 所有 `components={{ link: ... }}` 的 key 改为 `lnk`。
   - 只改翻译字符串和对应 component key，不要全局替换源码里的 `Link` 组件。
2. 重新运行 `node scripts/i18n-audit.mjs --check` 与相关测试。
3. 建议加一个回归测试：渲染一个 `<lnk>` 文案，断言 `a.textContent` 非空。

**备选方案**：用 `pnpm patch html-parse-stringify@4.0.1` 删除 `link: true`。改动更小，但会偏离上游 HTML 语义，且需要维护 patch；只有在不想改 26 个键时才考虑。

**不要做的事**：不要把 `Trans` 改成手写 `t()` + 字符串拼接来绕开；这会破坏占位符/安全校验和中文语序。也不要逐个测试去改断言，因为运行时链接仍然是坏的。

### 7.2 【P0】状态文案的大小写语义被合并

原始 UI 对状态标签有三种不同的大小写策略：

| 组件 | 原始行为 | 示例 |
| --- | --- | --- |
| `StatusBadge`（通用 run/goal/approval） | 小写，保留机器值 | `succeeded`、`in review` |
| `AgentStatusBadge` | 小写 | `idle` |
| `IssueStatusBadge` | 句首大写 | `In review` |
| `StatusIcon` | 每个词首字母大写 | `In Review` |
| `blockedAttentionLabel` | 固定大写开头 | `Blocked · ...` |

当前 `ui/src/i18n/status.ts` 只有一套 `status.*` 映射，且 `en.json` 中值大多为首字母大写（`"in_review": "In review"`），导致通用徽章、aria-label、任务卡片等显示 `In review`/`Succeeded`，而测试和原行为期望 `in review`/`succeeded`。

**推荐修复**：

1. 把 `en.json` / `zh-CN.json` 的 `status.*` 值改为**小写规范形式**（中文不受影响）：`in progress`、`in review`、`succeeded`、`timed out` 等。
2. 在需要原大写行为的地方做显示层变换：
   - `IssueStatusBadge`：对翻译后的标签做句首大写（英文有效，中文无变化）。
   - `StatusIcon`：做词首大写（英文有效，中文无变化）。
   - 或使用 CSS `capitalize`，但注意 `textContent` 仍是小写，测试与 aria 语义更稳定。
3. `priority.*` 保持首字母大写（原始 `PriorityIcon` 就是 `Critical/High/Medium/Low`），不要一起改成小写。
4. 检查所有直接用 `t("status.xxx")` 的地方（如 `ActiveAgentsPanel` 的 `Task {{status}}` aria-label），统一走 `statusLabel()`。

受影响失败（约 18 个）：`AgentDetail.history`、`AgentDetail.instructions`、`CompanyEnvironments`、`Projects`、`ActiveAgentsPanel`、`CaseChildrenTree`、`IssueCasesPanel`、`AgentConfigForm.render`。

### 7.3 【P0】英文源文案必须与改造前逐字一致

`en` 是源语言，`en.json` 的值应当**逐字复现**改造前的英文 literal（除非明确决定改文案）。当前存在三类偏差：

1. **弯/直引号不一致**
   - `AgentChatPicker.test.tsx` 期望 `Couldn’t load agents`（弯引号），当前 en 值是 `Couldn't load agents`（直引号）。
   - `AgentConversationsSidebar.test.tsx` 同理：`Some chat history couldn’t load`。
   - `appsPage...invalidSheetLink` 也存在 `doesn’t` / `doesn't` 两个版本。
   - 规则：以改造前源码中的字符为准；不要用编辑器自动替换引号。

2. **把两个不同原文合并成一个键**
   - `appsPage.browse.poolKept` 同时服务两处原文：
     - `"The connections in the pool are kept."`
     - `"The connections in this pool are kept."`
   - `appsPage.actionTest.cancelRequest` 同时服务：
     - `"Cancel request"`（RunningCard 按钮）
     - `"Cancel this request"`（Ask-first 卡片按钮）
   - `appsPage.permissions.agentAccessHeading` 同时服务：
     - 标题 `"Which agents can use this connection?"`（带问号）
     - radiogroup `aria-label="Which agents can use this connection"`（不带问号）
   - `appsPage.browse.managedBy` 的值已经包含结尾 ` ·`，组件又在后面追加 ` ·`，渲染成 `Managed by Composio · ·“...”`。
   - 修复原则：**不同上下文、不同标点的原文必须使用不同的键**；不要为了少建键而合并。

3. **大小写与空格漂移**
   - 原文 `Back` 被翻成 `Go back`（`common.goBack`），`EmailEndpointSetup` 的测试找不到 `Back`。建议新增 `common.back: "Back"` 并用于该按钮。
   - `AgentDetail.instructions` 的 `read/edit/raw` 按钮原文是小写，靠 CSS `capitalize` 显示大写；当前 en 值写成 `Read/Edit/Raw`，`textContent` 不再是小写。应改回小写。
   - `CompanyEnvironments` 的 driver 选项原文是 `sandbox` 小写，当前为 `Sandbox`。
   - `appsPage.ownSlack.createApp` 原文是 `Create a Slack app`，当前写成 `Create Slack app`，导致 Slack 设置测试找不到按钮。
   - Chat Endpoint 的“暂停”动作按钮误用了状态词 `status.paused`（`Paused`），原文是动作 `Pause`；动作词与状态词必须分开建键。
   - 状态文案见 7.2。

### 7.4 【已修复】测试 locale 固定方式污染 localStorage

`ui/vitest.setup.ts` 通过写入 `paperclip.ui.locale=en` 固定测试语言。副作用：

- `ui/src/lib/muse-invitation-draft.test.ts` 断言 `localStorage.length === 0`，实际为 1（只有 locale 键）。
- 任何“存储为空/只有业务键”的测试都会受影响。

`ui/vitest.setup.ts` 已改为每个测试前清空存储并等待 `i18n.changeLanguage("en")`，不会预置 locale 键。`src/lib/muse-invitation-draft.test.ts` 与全量 UI 测试已通过。

### 7.5 【P1】源码契约测试仍断言英文 literal

以下测试直接读取源码并断言英文字面量，组件改成 `t()` 后必然失败：

- `ui/src/pages/apps/chat/chat-ui-contract.test.ts`（10 个失败 `it`）
- `ui/src/pages/apps/agent-selector-contract.test.ts`（1 个）

**推荐修复**：保留“契约”意图，但把断言从“源码包含英文”改为“源码引用正确的翻译键，且 `en.json` 中该键的值等于原英文”。可以加一个测试辅助函数：

```ts
function sourceCopy(relativePath: string): string {
  const src = readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const keys = [...src.matchAll(/\bt\(\s*["'`]([^"'`]+)["'`]/g)].map((m) => m[1]);
  const values = keys.map((key) => lookup(en, key)).filter(Boolean);
  return [src, ...values].join("\n");
}
```

然后对文案断言使用 `sourceCopy(...)`，对代码模式断言继续使用原始源码。不要直接删除这些测试；它们防的是“文案被悄悄改掉”。

注意：`chat-ui-contract.test.ts` 中还有正则断言（例如 `const retryRunMutation = useMutation({ ... title: "Run retry failed" })`），组件改成 `title: t("...")` 后正则也会失败。应把正则放宽到 `title: t\(`，并另外从 en 字典断言 `Run retry failed`。

---

## 8. 初始 52 个失败测试清单（已全部解决）

以下清单记录本交接建立时的失败基线；之后修复并重跑，全量 UI 测试为 8,529/8,529 通过。保留本节用于说明根因和回归范围，不代表当前仍有这些失败。

运行命令：

```bash
pnpm --filter @paperclipai/ui exec vitest run
```

| 文件 | 失败数 | 直接原因 | 归入 |
| --- | ---: | --- | --- |
| `src/pages/apps/chat/chat-ui-contract.test.ts` | 10 | 源码英文 literal / 正则 | 7.5 |
| `src/pages/AgentDetail.instructions.test.tsx` | 8 | `read/edit/raw` 按钮大小写 | 7.3 |
| `src/pages/AgentDetail.history.test.tsx` | 4 | 状态标签大小写 | 7.2 |
| `src/pages/apps/AppDetail.test.tsx` | 3 | `<link>` void + aria-label 问号被合并 | 7.1 / 7.3 |
| `src/pages/apps/AppsConnect.test.tsx` | 3 | `<link>` void + 引号样式 | 7.1 / 7.3 |
| `src/pages/apps/Browse.test.tsx` | 3 | `managedBy` 重复分隔符 + `poolKept` 合并 | 7.3 |
| `src/pages/apps/chat/ChatEndpoint.clipboard.test.tsx` | 3 | `Create a Slack app` 被写成 `Create Slack app`，以及步骤文案漂移 | 7.3 |
| `src/pages/apps/chat/EmailEndpointSetup.test.tsx` | 3 | `Back` → `Go back` | 7.3 |
| `src/components/ActiveAgentsPanel.test.tsx` | 2 | 状态标签大小写 | 7.2 |
| `src/components/AgentChatPicker.test.tsx` | 1 | 直引号 vs 弯引号 | 7.3 |
| `src/components/AgentConversationsSidebar.test.tsx` | 1 | 直引号 vs 弯引号 | 7.3 |
| `src/components/AgentConfigForm.render.test.tsx` | 1 | 选项标签大小写（`high`/`low`） | 7.3 |
| `src/components/CaseChildrenTree.test.tsx` | 1 | 状态标签大小写 | 7.2 |
| `src/components/IssueCasesPanel.test.tsx` | 1 | 状态标签大小写 | 7.2 |
| `src/components/OnboardingWizard.test.tsx` | 1 | `<link>` void（Sign in to OpenAI 链接为空） | 7.1 |
| `src/pages/CompanyEnvironments.test.tsx` | 1 | driver 标签 `Sandbox` vs `sandbox` | 7.3 |
| `src/pages/Projects.test.tsx` | 1 | 状态标签大小写 | 7.2 |
| `src/pages/tools/PasteConfigTab.test.tsx` | 1 | `<link>` void | 7.1 |
| `src/pages/apps/app-detail/ActionTestDialog.test.tsx` | 1 | `Cancel request` vs `Cancel this request` 合并 | 7.3 |
| `src/pages/apps/chat/ChatEndpointDetail.agentmail.test.tsx` | 1 | 生命周期动作 `Pause` 被译成状态词 `Paused` | 7.3 |
| `src/lib/muse-invitation-draft.test.ts` | 1 | 测试 locale 写入污染 localStorage | 7.4 |
| `src/pages/apps/agent-selector-contract.test.ts` | 1 | 源码 placeholder literal | 7.5 |

初始合计：22 个文件，52 个失败；当前全量 UI 测试 0 失败。

---

## 9. 尚未完成/未运行的验证

以下项目以本轮 continuation checkpoint 为准：

1. 本轮 `pnpm --filter @paperclipai/ui typecheck`、`pnpm check:token-gates`、`git diff --check` 与完整 i18n 审计均已通过；`pnpm -r typecheck`、`pnpm build` 及 IssueProperties 定向测试为较早 checkpoint 结果；全量 UI 测试只有较早的 8,529/8,529 基线，后续模块改动后需重跑。
2. `pnpm test:run` 运行约 35 分钟后停止，未取得最终汇总；停止前观察到 2 个 workspace-runtime 失败。
3. 浏览器级 L7 验收：
   - 中英文切换、刷新后持久化、首次访问默认中文；
   - 表单草稿在切换语言后保留；
   - 浅色/深色主题、窄屏/移动宽度；
   - 所有 feature-gated 路由（253 条路由中实际可达的部分）；
   - 默认、空、加载、错误、暂停、无权限、超时、冲突、提交中、完成等状态；
   - 弹窗、Toast、错误边界、ARIA 名称；
   - 中文长句换行、按钮溢出、表格列宽。
4. 中文排版基线：标点、空格、数字/单位、日期/相对时间、货币、百分比。
5. 与上游同步：每次 merge 后新增英文键必须同时补 `zh-CN`，否则 `pnpm i18n:check` 会失败。

---

## 10. 建议的下一步执行顺序

### P0 — 已完成：恢复“可验收”状态

`<link>` void 标签、状态大小写、英文源文案契约、测试 locale 污染以及源码契约测试均已处理；UI 全量测试、类型检查和构建通过。下面保留原修复顺序作为历史记录。

1. **修 `<link>` void 问题**（7.1）。这是全局缺陷，先修它能让一批失败测试自然恢复。
2. **修状态大小写**（7.2）：`status.*` 改小写，`IssueStatusBadge`/`StatusIcon` 做显示层大写变换。
3. **修英文文案保真**（7.3）：
   - 弯引号；
   - 拆分被合并的键（`poolKept`、`cancelRequest`、`agentAccessHeading`）；
   - 去掉 `managedBy` 的重复 ` ·`；
   - 恢复 `Back`、`read/edit/raw`、`sandbox` 等原始大小写。
4. **修测试 locale 污染**（7.4）。
5. **更新源码契约测试**（7.5）。
6. 当时的验收命令：

```bash
pnpm --filter @paperclipai/ui exec vitest run
```

目标是 **0 failed**。

### P1 — 完成剩余模块

按第 6 节顺序继续：

1. Issue 核心：继续处理 `IssueDetail`、`IssueChatThread`、`IssueThreadInteractionCard` 与 Lists 剩余动态状态；`ExternallyConnectedTaskBanner` 已完成接线。
2. Task Chat：65 个源码文件已有 22 个直接接入；优先处理 `tool-taxonomy.ts`、`transcript-adapter.ts`、状态标签和其余未接线组件。
3. New Agent + Adapters：展示元数据已接入，继续处理 Adapter 配置字段与可达变体。
4. Routine 编辑器/触发器。
5. AI Connections。
6. 其余 P2 区域，以及审计确认的真实固定文案。

每个模块统一执行：读源码 → 用现有 `issuesPage`/`taskChatPage`/`agentSetupPage` 键 → 接入 `useTranslation` → 补空/加载/错误/无权限状态 → 运行该模块测试 → 更新覆盖矩阵。

### P2 — 全量验收

```bash
pnpm -r typecheck
pnpm test:run
pnpm build
pnpm check:token-gates
node scripts/i18n-audit.mjs --check
```

然后执行第 9 节的浏览器验收，更新 `doc/plans/2026-10-19-zh-cn-localization.md` 的最终统计，并输出“完整简体中文覆盖报告”。

### P3 — 清理与提交

1. 删除误生成的 `package-lock.json`（根目录与 `packages/plugins/sandbox-providers/*` 下共 9 个）。本仓库使用 pnpm，不应提交 npm lockfile。
2. 决定分片目录的去留：
   - 如果已经全部合并且不再需要并行工作，运行 `node scripts/i18n-merge-fragments.mjs --clean` 删除分片；
   - 如果希望保留翻译资产，提交分片并在 README 中说明用途。
   - **不要**既提交分片又在文档中说“已清理”。
3. 检查 `.gitignore` 中的 `artifacts/i18n/`。
4. 提交/PR（用户尚未要求提交；提交前按 `.github/PULL_REQUEST_TEMPLATE.md` 填写）。

---

## 11. 工作约定与禁止事项

### 11.1 键与文案

- 键按领域分组：`nav.*`、`common.*`、`status.*`、`priority.*`、`agentsPage.*`、`issuesPage.*`、`settingsPage.*`、`appsPage.*`、`toolsPage.*`、`pipelinesPage.*` 等。
- 一个键只对应一个上下文、一个标点、一个大小写语义；不同原文不要合并。
- 占位符使用 `{{name}}`；复数使用 `_one` / `_other`。
- 中文译文不要包含原始 HTML（`<script>`、事件属性、`javascript:`、`data:`）；`Trans` 允许的标签除外。
- 英文值必须与改造前源码逐字一致，包括弯引号、空格、标点。

### 11.2 不要翻译的内容

- 用户数据：公司/Agent/项目/任务/技能名称、评论、消息、Prompt、文件内容、路径、交付成果内容。
- Agent/模型输出、命令 stdout/stderr、第三方响应体、服务端返回的原始错误信息。
- API 字段名、存储枚举值、ID、URL 路径、CLI 命令、MCP 工具名、模型 ID、环境变量名、Git ref/hash。
- 品牌名与编程语言名：Paperclip、GitHub、Codex、Claude、Cursor、Gemini、OpenClaw、MCP、TypeScript 等。
- 第三方插件内容不保证翻译；仓库内置插件界面需要翻译。

### 11.3 机器值

- 永远不要把枚举值翻译后写回 API/数据库。
- 显示层统一走 `statusLabel()` / `priorityLabel()` 的显式 allowlist；未知值回退为机器值。
- 日期、数字、货币、百分比、相对时间统一走 `ui/src/i18n/formatters.ts`，不要在组件里直接 `toLocaleString()`。

### 11.4 UI 与设计系统

- `ui/` 的颜色、间距、圆角、字体、阴影、动效必须来自 token 层；禁止 hex、raw px、任意 Tailwind bracket 值、裸 `font-size`。
- 每次 UI 改动后运行 `pnpm check:token-gates`。
- 中文长句要检查按钮/表格/窄屏溢出；不要为了塞进布局而缩字号。

### 11.5 测试

- 测试环境 locale 固定为 `en`；不要假设测试会渲染中文。
- 断言优先用角色/`aria-label`/`data-testid`，不要依赖精确英文文本；如果必须依赖，英文值必须与原文一致。
- 组件改成 `t()` 后，源码契约测试要同步改为“键 + en 字典值”，不要删除。
- 新增 i18n 键后运行 `node scripts/i18n-audit.mjs --check`。
- 任何 `<link>` 文案在修复 7.1 之前都不要新增。

### 11.6 其他语言

- 约 38 个其他语言是 partial：缺键回退英文是预期行为。
- 不要为了“让所有语言完整”而批量填充英文；语言选择器只展示 `简体中文` 与 `English`。

---

## 12. 命令速查

```bash
# 安装（首次）
pnpm install

# 本地启动（API + UI，http://localhost:3100）
pnpm dev

# i18n 审计（写报告）
node scripts/i18n-audit.mjs
pnpm i18n:audit

# i18n 门禁（键一致性/占位符）
node scripts/i18n-audit.mjs --check
pnpm i18n:check

# 合并翻译分片
node scripts/i18n-merge-fragments.mjs
node scripts/i18n-merge-fragments.mjs --force
node scripts/i18n-merge-fragments.mjs --clean

# UI 类型检查
pnpm --filter @paperclipai/ui typecheck

# UI 测试
pnpm --filter @paperclipai/ui exec vitest run
pnpm --filter @paperclipai/ui exec vitest run src/pages/apps

# 全仓验收
pnpm -r typecheck
pnpm test:run
pnpm build
pnpm check:token-gates
```

---

## 13. 变更概览与文件索引

### 13.1 Git 状态

- 分支：`feat/zh-cn-i18n-foundation`
- 已修改：469 个文件（`git diff --stat`：+60,071 / −17,784）
- 未跟踪：24 项
- 未提交、未推送

未跟踪项包括：

- 新增 i18n 模块：`ui/src/i18n/status.ts`、`formatters.ts`、`locale-preference.ts`、`terminology.md`、测试文件
- 新增组件：`ui/src/components/LanguagePreferenceControl.tsx` 及测试
- 新增脚本：`scripts/i18n-audit.mjs`、`scripts/i18n-merge-fragments.mjs`
- 新增文档：`doc/plans/2026-10-19-zh-cn-localization.md`、本文件
- 翻译分片目录：`ui/src/i18n/locales/fragments/`
- 9 个未跟踪的 `package-lock.json` 当前仍保留在工作区；归属尚未确认，不应仅凭本交接文档删除。

### 13.2 核心改动文件

- `package.json`：新增 `i18n:audit`、`i18n:check` 脚本。
- `.gitignore`：新增 `artifacts/i18n/`。
- `ui/vitest.setup.ts`：无条件 localStorage mock、测试前切换 locale 到 en，不预写 locale 偏好。
- `ui/src/i18n/locale-validation.ts`：新增 `LocaleValidationMode` / `LocaleValidationOptions`，partial 模式只放宽 missing keys。
- `ui/src/i18n/locales.ts`：三种语言常量、strict/partial 注册。
- `ui/src/i18n/index.ts`：`lng: resolveInitialLocale()`、`fallbackLng: en`、`languageChanged` 更新 `<html lang>`、导出 `setLocale` / `getLocale` / `t`。
- `ui/src/pages/ProfileSettings.tsx`：语言设置卡片。
- `ui/src/components/LanguagePreferenceControl.tsx`：语言下拉。
- 446 个非测试 UI 文件：接入 `useTranslation` / `t`，覆盖第 5 节列出的模块。

### 13.3 参考文档

- 原始实施文档：`/Users/mauriceliang/Downloads/Paperclip-CN-全站简体中文支持-实施文档-v1.0.md`
- 实施记录：`doc/plans/2026-10-19-zh-cn-localization.md`
- 术语表：`ui/src/i18n/terminology.md`
- 分片说明：`ui/src/i18n/locales/fragments/README.md`
- 审计输出：`artifacts/i18n/coverage-summary.md`

---

## 14. 风险与边界

1. **上游同步风险**：英文新增键后，`zh-CN` 必须同步补齐，否则 strict 校验会在启动时抛错。`pnpm i18n:check` 应加入 CI。
2. **未使用键**：`taskChatPage` / `agentSetupPage` 仍待接线；`issuesPage` 已部分接线但未重算精确未用键数。继续使用这些键时需保持英文源和 `zh-CN` 占位符同步。
3. **英语源保真**：初始 52 个 UI 测试失败中有 30 个以上直接由英文文案偏差导致；该失败集已修复，新增键仍需以实际英文 UI 文案为准。
4. **测试基础设施**：locale 固定方式曾影响存储相关测试，现已调整为切换语言前清理存储。
5. **浏览器验收仍不完整**：类型检查与单元测试通过不代表中文布局、弹窗、空态、错误态都正确；106 个唯一页面的静态快照不是 253 条路由和全部动态状态的验收。
6. **动态内容**：外部插件 UI、Agent 输出、服务端原始错误及未知 ID 的远程公告不在当前保证范围内；固定公告 `2026-09-14-connectors` 已在 UI 展示层单独本地化，未来公告仍依赖上游翻译或新增映射。
7. **设计系统**：新增/修改 UI 必须保持 token-only；`pnpm check:token-gates` 当前通过，但后续翻译改动仍可能引入裸值。
8. **提交状态**：当前所有改动都在工作区，未提交。任何人接手前先确认是否需要保留 `package-lock.json` 和分片目录。

---

## 附录 A：包含 `<link>` 的 26 个键（修复 7.1 时逐一核对）

```text
runnerComponents.adapterLoginChrome.signInSubmitted
runnerComponents.adapterLoginChrome.signInDisplayed
appsPage.browserUse.allowedProfilesDescription
appsPage.identities.missingRepo
appsPage.actionTest.inAuditLog
appsPage.actionTest.alsoVisibleInAuditLog
appsPage.actionTest.approveInReview
appsPage.actionTest.turnItOn
appsPage.githubIdentity.renameHint
appsPage.slackIdentity.openSlack
appsPage.slackAvatar.step1
appsPage.slackTools.addPermissionsDescription
appsPage.chatDetail.reviewUnconfirmedDelivery
appsPage.chatDetail.removeSlackSuffix
appsPage.chatSetup.slackRequestStep1
appsPage.chatSetup.openSlackAppSettingsFor
appsPage.githubConfig.blockMergeHelp
appsPage.githubConfig.automaticOnInSettings
appsPage.githubConfig.automaticOffInSettings
toolsPage.advancedGate.description
toolsPage.advancedSetup.description
toolsPage.pasteConfig.justUrl
toolsPage.smokeLab.description
toolsPage.profiles.adminGate.description
toolsPage.connectFlow.enrollment.finishInWindow
toolsPage.mcpConnect.worksAs
```

当前 `en.json`、`zh-CN.json` 各 26 处，其他语言无 `<link>`。

## 附录 B：初始交接快照数字（历史）

本表保留原始交接时的基线；请以第 0 节 continuation checkpoint 和第 2 节验证表为当前结果。

- UI 测试文件：1,965
- 测试总数：8,528
- 通过：8,476
- 失败：52
- 失败文件：22
- `en` / `zh-CN` 键数：13,777 / 13,777
- 严格语言：2（`en`、`zh-CN`）
- 部分语言：38
- 已接入 i18n 的非测试 UI 文件：302
- 审计扫描文件：1,276（排除 16 个内部/开发专用文件）
- 路由：253
- Git：312 modified，22 untracked，+49,671 / −13,405

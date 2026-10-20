# Paperclip CN terminology

Single source of truth for Simplified Chinese UI terms. Keep `en.json` and
`zh-CN.json` aligned; change a term here first, then apply it consistently.

| English concept | Simplified Chinese | Notes |
| --- | --- | --- |
| Dashboard | 工作台 | Do not use 仪表盘 for the main board surface. |
| Agent / Agents | Agent / Agent 成员 | Keep the technical word Agent. Explain as “AI 成员” on first use if needed. |
| API access token | 访问令牌 / 令牌 | Translate Paperclip credential UI; preserve literal protocol headers and external provider field names when users must match them. |
| Model token | Token | Keep as the provider-reported usage unit; distinguish it from an API access credential. |
| Organization / Company | 组织 | UI copy only; the `company` field and API names stay unchanged. |
| Org Chart | 组织关系图 | Shows reporting lines. |
| Task / Issue | 任务 | UI copy only; `issue` API, paths, and TypeScript types stay unchanged. |
| Project | 项目 | |
| Goal | 目标 | |
| Workspace | 工作区 | |
| Run | 运行 / 执行记录 | Prefer 运行 for lists and records; 执行 for the action. |
| Heartbeat | 心跳检查 | 心跳 is acceptable when the architecture term is intended. |
| Routine | 定期任务 | Distinguish the configuration from one run. |
| Inbox / Attention | 待处理 / 收件箱 | Choose by surface; do not mix both labels for the same view. |
| Approval | 审批 | Approve = 批准；Reject = 拒绝. |
| Artifact | 交付成果 | Not a generic attachment (附件). |
| Skill | 技能 | |
| Connector / Connection | 连接器 / 连接 | Connector is the integration; connection is the authorized link. |
| Budget | 预算 | |
| Spend / Cost | 支出 / 成本 | Historical spend versus computed cost. |
| Active / Running | 活跃 / 运行中 | Match the entity's semantics. |
| Blocked | 已阻塞 | Distinct from 已暂停. |
| Queued | 排队中 | Distinct from 等待审批. |
| Paused | 已暂停 | Do not translate as 已终止. |
| Cancel / Stop / Delete | 取消 / 停止 / 删除 | Keep the three actions distinct. |
| Retry | 重试 | Do not imply idempotency. |
| Sign in / Sign out | 登录 / 退出登录 | |

Rules:

- Do not translate user data, agent output, API fields, enum storage values,
  URLs, CLI commands, environment variables, model IDs, or brand names.
- Map machine values to translation keys explicitly; never build keys from
  server values without a known allowlist and fallback.
- Use `{{placeholder}}` interpolation or `Trans` for sentences with embedded
  values; do not concatenate translated fragments in JSX.

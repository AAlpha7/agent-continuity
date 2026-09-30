# Agent Continuity

**用可核对的独立回执和逐字节检查的快照，保留代理工作交接的依据。**

[English README](README.md) · [项目初始化](GUIDE.md) · [回执格式](RECEIPT-SCHEMA.md)

这是 **v0.1.0-rc.2 候选版**，不是稳定 GA。它保存普通报告和原始交接文件，不证明内容真实，也不授予身份、成员资格或执行权限。

## 快速试用

需要已安装的 Node.js 24+ 和 Git；无需安装 npm 依赖、密钥或模型服务。

```sh
git clone https://github.com/AAlpha7/agent-continuity.git
cd agent-continuity
node --test test/*.test.mjs
node scripts/agent-receipt.mjs fixtures/workspace fixtures/receipt.json
node scripts/build-continuity-snapshot.mjs fixtures/workspace demo-project
node scripts/build-continuity-snapshot.mjs fixtures/workspace demo-project --check
```

样例全部为合成数据。已有回执会返回 `duplicate: true`；快照检查返回本地 `current`，远端仍是 `not-attempted`。用于自己的项目时，请先读[初始化指南](GUIDE.md)，将 `.gitattributes` 放入第一次提交，避免 Git 改写证据字节。

## 一次交接

上一个会话留下独立回执 → 操作员审查并显式同步 Git → 下一个会话检查快照和原始证据 → 所有者另行批准后续动作。

快照不会覆盖 `CURRENT_STATE.md`；历史输入按摘要保留。相同 ID 和相同内容可重试，复用 ID 改内容会冲突。`--check` 只核对本地输入，不会自动同步，也不表示远端或身份已验证。

## 边界与证据

- 已实现：本地文件锁、原子发布、独立回执、严格 UTF-8、完整字节及摘要检查、保留原文的快照。
- 未实现：代理身份认证、成员准入、跨租户隔离、签名与撤销、远端执行、自动编排。
- CLI 假设操作员已受本地 OS 信任。自报角色、时间戳、Git 作者名和摘要都不能授权执行。
- 本地实测 **15/15**；包含真实 Git 初始化、`core.autocrlf=true` 全新克隆及证据字节核对。范围和限制见 [TESTING.md](TESTING.md)。

重复认领、中断恢复和过期结论的三代理离线对照仍属未来方向；模拟结果不能当作真实 LLM 评测。

[MIT 许可证](LICENSE)，Copyright © 2026 AAlpha7。图解与文档同样采用 MIT；详见[来源与依赖](RIGHTS-AND-DEPENDENCIES.md)。

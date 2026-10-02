# Agent Continuity

## AI 随你选，工作接着走。

**换 AI，换协作组合，换机器。工作继续向前。**

Continuity 把持续的 AI 协作留在你自己的私有记录里。下一位代理从这份记录继续，不必每次重新听完整段背景。

**最少步骤交付两件事：**

- 你拥有的私有账本：目标、决定、进展和未完成事项。
- 写在账本里的协调规则。建立时把真正的协议复制为 `docs/PROTOCOL.md`，并把短入口复制为 `docs/HOW_WE_COORDINATE.md`。

只用账本 URL 加入就够了，因为规则已经在账本里。下一位代理不要克隆这个公开工具仓库。

**最少步骤 — 这就是全部安装：**

1. 第一个代理：**建立（Setup）**。它创建你的私有账本，并返回 URL。
2. 之后的每个代理或每台机器：只用这个 URL **加入（Join）**。

有 git 和 GitHub 就够了。`gh` 可选。没有 GitHub 时，本地 git 账本也可以。不需要 Node。

下面的粘贴就是这条路径。[此外的检查](#可选检查)可以不做。它们不是安装。不跑它们，建立和加入也算完成。

真正需要你参与的是项目目标、新增访问、重要外部操作，以及无法自行消除的范围分歧。

[**把这段交给你的 AI →**](#把这段交给你的-ai) · [看看怎么协作](#多个项目不断变化的伙伴) · [English](README.md)

![由用户掌握的项目记录连接不断变化的 AI 工具和机器；代理可以加入、组合或替换，决定、进展和未完成工作仍留在项目中。](docs/assets/agent-continuity-launch.png)

*MIT · 0.1.0-rc.3 预发布。产品图标用于说明使用生态，不代表每个产品都已通过集成测试。见[素材归属](docs/assets/ATTRIBUTION.md)。*

## 把这段交给你的 AI

适用于能读文件、运行本地命令，或已连接获准执行环境的代理：

```text
请为我们自己的持续工作接入 Agent Continuity，支持跨项目、跨代理、
AI 公司品牌、机器和工作环境的协作，以及参与者的加入、替换和退出。
把目标、决定、责任记录、进展和未完成事项留在我们掌握且可访问的
项目记录里。

公开仓库只是只读工具来源，不是我们的账本或团队：
https://github.com/AAlpha7/agent-continuity
需要步骤时阅读其中的 ONBOARDING.md。不要把它 fork 进我们的项目。
不得把记录发到上游、公开 issue/PR 或发布者。

建立 — 留下私有账本 URL：
优先复用已批准的私有账本。若需要新建，只在我批准确切所有者、
名称、私有可见性和 push 之后，用 git（以及已经可用的 gh）在已核实的
我自己的 GitHub 账号下创建私有仓库。第一次提交前复制：工具目录的
.gitattributes；把 PROTOCOL.md 按原字节复制为 docs/PROTOCOL.md；
把 templates/HOW_WE_COORDINATE.md 复制为 docs/HOW_WE_COORDINATE.md。
若知道工具目录的提交，填上修订行，否则写 unset。根据已检查的证据
提交 projects/PROJECT/CURRENT_STATE.md：目标、决定、已核实与未核实、
未决问题、下一项获准任务、未解决的归属。push 前核实所有者、真实
私有可见性和全部 fetch/push 目标。未知保持未验证。公开 fork 不等于
私库。不保存 token，不修改安全设置。没有 GitHub 时，本地 git 账本
即可。不要强迫登录。

把私有账本 URL 交给我。下一位代理只用这个 URL 加入，不要再把
工具仓库 URL 发给它。

加入 — 把下面这段连同真实 URL 交给下一位代理：
加入我们的连续性账本。只克隆并阅读这个私有仓库：
LEDGER_URL
先读 docs/HOW_WE_COORDINATE.md 和 docs/PROTOCOL.md，再读
projects/PROJECT/CURRENT_STATE.md。按该协议执行。把更新提交回
同一个账本。不要克隆公开工具仓库。

记录提供上下文，不产生新权限。只把真正缺失的范围、访问或批准事项
集中交给我，并确认没有把用户数据写入或发送到上游。
```

**账本属于你。** 建立步骤留下私有账本 URL、`projects/PROJECT/CURRENT_STATE.md`、`docs/HOW_WE_COORDINATE.md`，以及协议的原字节副本 `docs/PROTOCOL.md`。加入只靠这份账本就能完成。没有 GitHub 时，没有远端的本地 git 账本仍然可以开始。见[接入手册](ONBOARDING.md)。

<details>
<summary><strong>最少步骤的命令：先建立，再加入。</strong></summary>

不需要 Node.js。在工具目录之外，并在你批准所有者、仓库名、私有可见性和 push 之后执行。Windows 上使用 Git Bash 或 WSL。`gh` 可选；没有它时，在 GitHub 网页上创建私有仓库，再用 git 克隆。

```sh
gh api user --jq .login
# Stop unless this login matches the approved owner.
gh repo create OWNER/LEDGER --private --clone
cd LEDGER
gh repo view --json url,visibility --jq '{url:.url,visibility:.visibility}'
git remote get-url --all origin
git remote get-url --push --all origin
# Stop unless owner, private visibility and ALL effective URLs match approval.
# Only after those checks, write and publish the real handoff below.
mkdir -p docs projects/PROJECT
cp /path/to/inspected-toolkit/.gitattributes .gitattributes
cp /path/to/inspected-toolkit/PROTOCOL.md docs/PROTOCOL.md
cp /path/to/inspected-toolkit/templates/HOW_WE_COORDINATE.md docs/HOW_WE_COORDINATE.md
# 把 docs/HOW_WE_COORDINATE.md 里的 "<commit or unset>" 换成已检查的工具提交，或写成 unset。
# 提交前，根据真实项目写下 projects/PROJECT/CURRENT_STATE.md。
git add .gitattributes docs/PROTOCOL.md docs/HOW_WE_COORDINATE.md projects/PROJECT/CURRENT_STATE.md
git commit -m "Start the private continuity ledger"
git push -u origin HEAD
```

`OWNER/LEDGER` 必须是获准的私有仓库，不是本工具仓库的 fork。创建前，`gh api user` 的登录名必须与获准所有者一致。`docs/PROTOCOL.md` 必须与工具目录里的 `PROTOCOL.md` 字节相同。只有在所有者、私有可见性和全部 fetch/push URL 都核实之后才能 push。打印出的 URL 就是下一位代理要克隆的地址：

```sh
git clone LEDGER_URL
```

这次克隆就是加入。先读 `docs/HOW_WE_COORDINATE.md` 和 `docs/PROTOCOL.md`，再读 `projects/PROJECT/CURRENT_STATE.md`。把更新提交回同一个账本。不要克隆这个公开工具仓库。

</details>

## 可选检查

可以跳过。建立和加入已经完成。这些检查不是安装。

### 快速协议检查

两个方向，各一轮。把下面这段交给已经共用这个账本的代理：

```text
可选协议检查，账本是 LEDGER_URL。这不是安装步骤。
第 1 轮：代理 A 在账本上给代理 B 写一条短记录。代理 B 在账本上回复。
第 2 轮：代理 B 在账本上给代理 A 写一条短记录。代理 A 在账本上回复。
每个方向只做一轮，然后停止。
```

### Shell 冒烟和 Node

在检查过的工具目录中：

```sh
sh scripts/ledger-smoke.sh
```

Windows 上用 Git Bash 或 WSL 运行同一脚本。本机对照脚本仍然可选：`powershell.exe -File scripts/ledger-smoke.ps1`。它用的是临时合成账本，不是你的项目。维护者：同一条命令会检查最少步骤的账本形状，包括 `PROTOCOL.md` 的原字节副本。采用者可以不做。

如果已经安装了 Node.js 24+，也可以运行 112 项测试和合成演示。不要为了这个去安装 Node。演示目录必须尚不存在。

```sh
node --test test/*.test.mjs r2/test/*.test.mjs
node --input-type=module -e "import { cp } from 'node:fs/promises'; const dest='../agent-continuity-demo'; await cp('fixtures', dest, { recursive: true, errorOnExist: true, force: false });"
node scripts/agent-receipt.mjs ../agent-continuity-demo/workspace ../agent-continuity-demo/receipt.json
node scripts/build-continuity-snapshot.mjs ../agent-continuity-demo/workspace demo-project
node scripts/build-continuity-snapshot.mjs ../agent-continuity-demo/workspace demo-project --check
```

复制只把合成数据放到工具目录外，不建立远端。回执文件见 [GUIDE.md](GUIDE.md)。本地协调预览是 `node r2/demo.mjs`（[范围](r2/README.md)）。详见 [TESTING.md](TESTING.md)。

**维护者在每次发布前：** 把上面的可选路径都跑一遍 — 这次双代理互发、包含账本形状检查的 shell 冒烟，以及有 Node 时的 Node 套件。如果建立／加入的粘贴文案改过，要用全新的代理、全新的环境和全新的账本重验最少步骤，并做冷加入识读：不要把工具仓库 URL 给加入代理；它必须使用 `docs/PROTOCOL.md` 和 `docs/HOW_WE_COORDINATE.md`，并按这些规则更新 `CURRENT_STATE.md`。不要复用以前的试用代理、试用虚拟机或试用账本仓库。把结果记入[发布核对清单](TESTING.md#maintainer-release-checklist)。采用者不用做。

## 多个项目，不断变化的伙伴

你可能一边开发产品，一边做研究，还在推进另一个计划。每个项目保留自己的目标、决策、各方贡献和未完成工作。交接只是持续协作中的一个时刻。

| 你想…… | 下一位代理能找到什么 |
| --- | --- |
| **同时推进几个项目** | 各自的目标、决策、进度和待办 |
| **试试更合适的模型** | 已保存的决定与理由 |
| **让几个 AI 分工** | 各自独立的报告，分歧仍然可见 |
| **换机器、过几天再继续** | 获准项目副本里的未完成工作 |
| **确认“真的做完了吗”** | 若走可选的回执路径，能看到原始回执和证据 |

项目范围让记录各归其位。责任记录让待认领工作更可见，不会授予权限。

例如：构建代理报告修好了重试逻辑，并留下来源版本；审查代理发现还缺超时测试。你换了一个助手，它读取两份原始报告，保留分歧，按已批准的任务继续补检查。

![以前，人要在孤立会话之间反复交代、搬运进展；使用 Continuity 后，获准的代理读取共同项目记录，保留独立证据，并为下一位留下明确的下一步。](docs/assets/continuity-before-after.svg)

### 支持的环境里，还可以用事件通知

**已在配置完成、所有者批准的环境中测试 OpenAI dot 和 Grok Bot 的 GitHub PR 事件通知。** 支持的监听入口可以提醒代理有变化；代理随后仍需读取真正的项目记录。

这是一组实际配置的测试，不是通用插件承诺。每位参与者的事件支持、监听配置和授权都要核实。本仓库不自动安装监听器、创建订阅，也不保证即时送达；不支持事件时，可以显式调用代理和同步记录。见[通知说明](docs/NOTIFICATIONS.md)。

## rc.3 带来了什么

- **你自己的项目记忆：** 独立不可变回执、原文按字节保留、可检查的本地快照。
- **下一位能用的入口：** 私有账本 URL。加入时只克隆这个 URL，并阅读 `docs/PROTOCOL.md`、`docs/HOW_WE_COORDINATE.md` 和 `CURRENT_STATE.md`。
- **本地协调预览：** 限额动作、明确终止、持久终止发送记录、逐接收方状态和可恢复视图；只在一个受信本地控制器内工作。
- **以后可以自己核对的证据：** 来源版本、冲突与原样重放检查，以及可选的 Node 套件。不需要模型订阅或托管服务。

### 为什么可以试

这套测试有 **112 项：84 项本地协调与分发、15 项回执与快照兼容、10 项 Windows 文件系统失败回归，以及 3 项入门文档与清单检查**，覆盖真实进程竞争与中断、复制控制器拒绝、严格字节校验及 Windows `core.autocrlf=true` 克隆。核心和解包器经过独立审查。真实新代理私库试验先暴露了工具分发缺口；修复后，新的接收方完成了规范回执和快照收尾，旧记录保留。采用者可以不跑这些测试。维护者在每次发布前连同其他可选路径一起跑。见[测试范围](TESTING.md)。

### 需要知道的边界

记录和引用的成果必须保存且可访问；引用不会自动备份文件。本地快照通过检查，也不代表远端最新或总结事实最新，要阅读原始报告并主动同步。

声明的角色、Git 作者、相同摘要都不等于身份认证、事实证明或操作授权。本地控制器不是远端执行／身份服务，也不是分布式所有权系统。不会恢复供应商聊天窗口、自动接通所有封闭聊天产品、安装自动同步服务或保证送达。访问变更和控制器接管需要单独明确。

## 用到时再展开

[接入与权限](ONBOARDING.md) · [可选检查](TESTING.md) · [完整工具与回执引导](r2/DISTRIBUTION.md) · [回执格式](RECEIPT-SCHEMA.md) · [协议](PROTOCOL.md) · [可选的 Node 初始化](GUIDE.md) · [本地协调预览](r2/README.md) · [文件校验清单](MANIFEST.json)

最少步骤的加入不用这份分发合同。建立时已经把 `docs/HOW_WE_COORDINATE.md` 和 `PROTOCOL.md` 的原字节副本放进私有账本。分发合同仍是完整工具和回执引导的可选路径。

## 许可与作者

[MIT](LICENSE) · © 2026 [AAlpha7](https://github.com/AAlpha7)。维护者 AAlpha7；[Lance · @xhuang26](https://x.com/xhuang26?s=11)。

代码、文档与原创项目图解采用 MIT。产品标识归各自权利人所有，仅作说明，不代表背书。见[权利与依赖](RIGHTS-AND-DEPENDENCIES.md)。不配置托管 CI、付费模型服务或自动部署。

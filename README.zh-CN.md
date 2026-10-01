# Agent Continuity

## AI 随你选，工作接着走。

**换 AI，换协作组合，换机器。工作继续向前。**

这家的 AI 擅长写代码，那家的更会审查；明天的新模型，又让你想试一试。你可能同时用几个代理，也会在电脑、服务器和不同工作环境间切换。可它们往往不知道彼此做过什么：换一个就要重新解释，几个一起用就得来回传话。旧会话结束，决定和未完成的工作也可能留在那里。

Continuity 让持续的 AI 协作留在你自己掌握的记录里，**跨项目、跨 AI 团队、跨工具，也跨机器。** 每个项目都有不依赖于某个代理、AI 品牌或机器的共同记录。把**目标、决定、责任记录、进展、成果引用和未完成事项**留在你掌握的文件中，让获准成员围绕同一份已保存证据持续协作。几个代理一起做、职责发生变化、加入新伙伴、停用旧代理，或者换到另一台机器和环境，都不必重建整段项目背景。前提是这些记录已保存，并对获准参与者保持可访问。

[**把这段交给你的 AI →**](#把这段交给你的-ai) · [看看怎么协作](#多个项目不断变化的伙伴) · [English](README.md)

![由用户掌握的项目记录连接不断变化的 AI 工具和机器；代理可以加入、组合或替换，决定、进展和未完成工作仍留在项目中。](docs/assets/agent-continuity-launch.png)

*MIT · 0.1.0-rc.3 预发布。产品图标用于说明使用生态，不代表每个产品都已通过集成测试。见[素材归属](docs/assets/ATTRIBUTION.md)。*

## 少一点转述，多一点继续。

| 你想…… | 下一位代理能找到什么 |
| --- | --- |
| **同时推进几个项目** | 各自的目标、决策、进度和待办；证据与访问范围保持区分 |
| **试试更合适的模型** | 已保存的决定与理由，不必重新做一遍背景介绍 |
| **让几个 AI 分工** | 各自独立的报告和来源版本，分歧不会被最后一份总结抹掉 |
| **换机器、过几天再继续** | 获准项目副本里的未完成工作和原始证据 |
| **确认“真的做完了吗”** | 原始回执、检查过的版本和可核对的成果引用 |

**产品要求：** 建立和加入只需要 git、GitHub，以及一个 POSIX shell。`gh` 可选。不需要 Node.js，也不需要 Python。在 Windows 上，用 Git for Windows 自带的 Git Bash 或 WSL 运行同一份 shell 自检。`scripts/ledger-smoke.ps1` 是可选的本机 PowerShell 对照脚本，仍然只用 git，不用 Node。

**第一步成功路径：** 建立私有账本并返回它的 GitHub URL；加入时只克隆这个 URL。下面的 shell 自检会在临时账本里核对协议要求的回执、哈希和单写者锁。105 项 Node 测试和 Node 演示是可选的维护者命令，不是接入前提，也不作为 CI 门槛。

真正需要你参与的是项目目标、新增访问、重要外部操作，以及无法自行消除的范围分歧。

## 把这段交给你的 AI

适用于能读文件、运行本地命令，或已连接获准执行环境的代理：

```text
请为我们自己的持续工作接入 Agent Continuity，支持跨项目、跨代理、
AI 公司品牌、机器和工作环境的协作，以及参与者的加入、替换和退出。
把目标、决定、责任记录、进展和未完成事项留在我们掌握且可访问的
项目记录里。

产品要求：建立和加入只需要 git、GitHub，以及 POSIX shell。gh 可选。
不要安装 Node.js 或 Python。在 Windows 上用 Git Bash 或 WSL 运行
scripts/ledger-smoke.sh。PowerShell 对照脚本 scripts/ledger-smoke.ps1
可选，仍然不用 Node。

公开仓库只是只读工具来源，不是我们的账本或团队：
https://github.com/AAlpha7/agent-continuity
需要步骤时阅读其中的 ONBOARDING.md。不要把它 fork 进我们的项目。
不得把记录发到上游、公开 issue/PR 或发布者。

如果手头有检查过的工具目录，自检命令是：
sh scripts/ledger-smoke.sh
接入时不要运行 node --test 或 Node 演示，也不要把它们放进 CI。

建立 — 留下私有账本 URL：
优先复用已批准的私有账本。若需要新建，只在我批准确切所有者、
名称、私有可见性和 push 之后，用 git（以及已经可用的 gh）在已核实的
我自己的 GitHub 账号下创建私有仓库。第一次提交前，把工具目录里的
.gitattributes 复制进去。根据已检查的证据提交
projects/PROJECT/CURRENT_STATE.md：目标、决定、未完成事项和
下一项获准任务。push 前核实所有者、真实私有可见性和全部 fetch/push
目标。未知保持未验证。公开 fork 不等于私库。不保存 token，不修改
安全设置。没有 GitHub 时，本地 git 账本即可；不要为了补齐而安装
Node，也不要强迫登录。

把私有账本 URL 交给我。下一位代理只用这个 URL 加入，不要再把
工具仓库 URL 发给它。

加入 — 把下面这段连同真实 URL 交给下一位代理：
加入我们的连续性账本。只克隆并阅读这个私有仓库：
LEDGER_URL
从 projects/PROJECT/CURRENT_STATE.md 继续。把更新提交回同一个账本。
不要克隆公开工具仓库，不要安装 Node.js，不要运行它的测试。

记录提供上下文，不产生新权限。只把真正缺失的范围、访问或批准事项
集中交给我，并确认没有把用户数据写入或发送到上游。
```

**账本属于你。** 建立步骤留下私有 GitHub 账本 URL。下一位代理只用这个 URL 加入，而不是再次打开工具仓库。没有 GitHub 时，没有远端的本地 git 账本仍然可以开始。见[接入手册](ONBOARDING.md)。

<details>
<summary><strong>第一步：建立、私有账本 URL、加入。</strong></summary>

不需要 Node.js。在工具目录之外，并在你批准所有者、仓库名、私有可见性和 push 之后执行。Windows 上使用 Git Bash 或 WSL。`gh` 可选；没有它时，在 GitHub 网页上创建私有仓库，再用 git 克隆。

```sh
gh api user --jq .login
gh repo create OWNER/LEDGER --private --clone
cd LEDGER
cp /path/to/inspected-toolkit/.gitattributes .gitattributes
mkdir -p projects/PROJECT
# 提交前，根据真实项目写下 projects/PROJECT/CURRENT_STATE.md。
git add .gitattributes projects/PROJECT/CURRENT_STATE.md
git commit -m "Start the private continuity ledger"
git push -u origin HEAD
gh repo view --json url,visibility --jq '{url:.url,visibility:.visibility}'
git remote get-url --all origin
git remote get-url --push --all origin
```

`OWNER/LEDGER` 必须是获准的私有仓库，不是本工具仓库的 fork。创建前，`gh api user` 的登录名必须与获准所有者一致。只有在所有者、私有可见性和全部 fetch/push URL 都核实之后才能 push。打印出的 URL 就是下一位代理要克隆的地址：

```sh
git clone LEDGER_URL
```

这次克隆就是加入。阅读 `projects/PROJECT/CURRENT_STATE.md`，并把更新提交回同一个账本。不需要再使用本仓库。

</details>

<details>
<summary><strong>自检：shell 和 git。不用 Node。</strong></summary>

在检查过的工具目录中：

```sh
sh scripts/ledger-smoke.sh
```

Windows 上用 Git Bash 或 WSL（Git for Windows）运行同一脚本。可选的本机 Windows shell 仍然只用 git、不用 Node：

```powershell
powershell.exe -File scripts/ledger-smoke.ps1
```

自检会建立临时合成账本，写入协议描述的样例回执和交接文本，提交后再以 `core.autocrlf=true` 克隆，并核对哈希、预期文件和单写者 `writer.lock` 的形态。它不创建 GitHub 远端，也不是你的账本。不要把其中的合成项目名或时间戳抄进真实记录。不要把这个脚本、PowerShell 对照脚本或 Node 演示放进 CI 当作接入门槛。详见 [TESTING.md](TESTING.md)。

</details>

<details>
<summary><strong>可选的维护者检查。机器上已经有 Node.js 24+。</strong></summary>

采用者停在账本 URL 和 shell 自检。已经安装 Node.js 24+ 的维护者可以在本地运行测试套件和合成演示。不要为了接入去安装 Node，也不要添加把它们变成接入门槛的 workflow。目标目录必须尚不存在；`cp` 会创建它，并拒绝已存在的目录。

```sh
node --test test/*.test.mjs r2/test/*.test.mjs
node --input-type=module -e "import { cp } from 'node:fs/promises'; const dest='../agent-continuity-demo'; await cp('fixtures', dest, { recursive: true, errorOnExist: true, force: false });"
node scripts/agent-receipt.mjs ../agent-continuity-demo/workspace ../agent-continuity-demo/receipt.json
node scripts/build-continuity-snapshot.mjs ../agent-continuity-demo/workspace demo-project
node scripts/build-continuity-snapshot.mjs ../agent-continuity-demo/workspace demo-project --check
```

复制只把合成数据放到工具目录外，不建立远端。机器上已有 Node 时，规范回执文件见 [GUIDE.md](GUIDE.md)。本地协调预览是 `node r2/demo.mjs`，范围见 [r2/README.md](r2/README.md)。

</details>

## 多个项目，不断变化的伙伴

你可能一边开发产品，一边做研究，还在推进另一个计划。每个项目保留自己的目标、决策、各方贡献和未完成工作。让不同 AI 发挥各自长处，加入审查者、停用旧助手或换一台机器；获准的新参与者可以从已保存记录继续，不必每次重新听完整背景。交接只是持续协作中的一个时刻。

项目和任务范围让记录各归其位；多个项目的总览可以链接这些记录。这是一套基于文件的工作约定，不是自动项目调度器。责任记录让待认领工作更可见，不会自动执行分布式所有权或授予权限。

例如：构建代理报告修好了重试逻辑，并留下来源版本；审查代理发现还缺超时测试。你换了一个助手，它读取两份原始报告，保留分歧，按已批准的任务继续补检查。那些保存下来的项目记录，不需要旧聊天窗口一直开着。

![以前，人要在孤立会话之间反复交代、搬运进展；使用 Continuity 后，获准的代理读取共同项目记录，保留独立证据，并为下一位留下明确的下一步。](docs/assets/continuity-before-after.svg)

### 支持的环境里，还可以用事件通知

**已在配置完成、所有者批准的环境中测试 OpenAI dot 和 Grok Bot 的 GitHub PR 事件通知。** 支持的监听入口可以提醒代理有变化；代理随后仍需读取真正的项目记录。

这是一组实际配置的测试，不是通用插件承诺。每位参与者的事件支持、监听配置和授权都要核实。本仓库不自动安装监听器、创建订阅，也不保证即时送达；不支持事件时，可以显式调用代理和同步记录。见[通知说明](docs/NOTIFICATIONS.md)。

## rc.3 带来了什么

- **你自己的项目记忆：** 独立不可变回执、原文按字节保留、可检查的本地快照。
- **下一位能用的入口：** 私有账本 URL。加入时只克隆这个 URL。
- **本地协调预览：** 限额动作、明确终止、持久终止发送记录、逐接收方状态和可恢复视图；只在一个受信本地控制器内工作。
- **维护者可检查的证据：** 来源版本、冲突与原样重放检查，以及可选的 Node 套件。采用者运行 shell 自检。不需要模型订阅或托管服务。

### 为什么可以试

可选的维护者套件有 **105 项测试：80 项本地协调／分发、15 项回执／快照兼容，以及 10 项 Windows 文件系统失败回归**，覆盖真实进程竞争与中断、复制控制器拒绝、严格字节校验及 Windows `core.autocrlf=true` 克隆。核心和解包器经过独立审查。真实新代理私库试验先暴露了工具分发缺口；修复后，新的接收方完成了规范回执和快照收尾，旧记录保留。这些测试是维护者证据。采用者运行[shell 自检](TESTING.md)，不运行这套测试。

### 需要知道的边界

记录和引用的成果必须保存且可访问；引用不会自动备份文件。本地快照通过检查，也不代表远端最新或总结事实最新，要阅读原始报告并主动同步。

声明的角色、Git 作者、相同摘要都不等于身份认证、事实证明或操作授权。本地控制器不是远端执行／身份服务，也不是分布式所有权系统。不会恢复供应商聊天窗口、自动接通所有封闭聊天产品、安装自动同步服务或保证送达。访问变更和控制器接管需要单独明确。

## 用到时再展开

[接入与权限](ONBOARDING.md) · [自检](TESTING.md) · [回执格式](RECEIPT-SCHEMA.md) · [协议](PROTOCOL.md) · [可选的 Node 初始化](GUIDE.md) · [本地协调预览](r2/README.md) · [文件校验清单](MANIFEST.json)

## 许可与作者

[MIT](LICENSE) · © 2026 [AAlpha7](https://github.com/AAlpha7)。维护者 AAlpha7；[Lance · @xhuang26](https://x.com/xhuang26?s=11)。

代码、文档与原创项目图解采用 MIT。产品标识归各自权利人所有，仅作说明，不代表背书。见[权利与依赖](RIGHTS-AND-DEPENDENCIES.md)。不配置托管 CI、付费模型服务或自动部署。

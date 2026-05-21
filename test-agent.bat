@echo off
REM Agent 配置测试脚本 - Windows 版本
REM 用于测试各个 Agent 是否正确激活

echo === 🔍 Agent 配置测试脚本 ===
echo.

REM 项目路径
set BASE_PATH=E:\Chyuan\1.java\project\code

echo 📋 开始测试各个项目的 Agent 配置...
echo.

REM 测试前端 Agent
echo === 🔵 前端开发 Agent 测试 ===
cd /d "%BASE_PATH%\aggregation-support-agent-web"
if exist .claude\settings.json (
    echo ✅ 前端 Agent 配置文件存在
    echo 📍 当前目录: %CD%
    echo 🎯 Agent 职责: UI组件开发 + 状态管理 + API集成
    echo 🌐 服务端口: 3000
    echo.
) else (
    echo ❌ 前端 Agent 配置文件不存在
    echo.
)

REM 测试后端 Agent
echo === 🟢 后端开发 Agent 测试 ===
cd /d "%BASE_PATH%\aggregation-support-agent"
if exist .claude\settings.json (
    echo ✅ 后端 Agent 配置文件存在
    echo 📍 当前目录: %CD%
    echo 🎯 Agent 职责: API开发 + 业务逻辑 + 数据操作
    echo 🌐 服务端口: 8091
    echo.
) else (
    echo ❌ 后端 Agent 配置文件不存在
    echo.
)

REM 测试 MCP 网关 Agent
echo === 🟣 MCP 智能编排网关 Agent 测试 ===
cd /d "%BASE_PATH%\mcp-gateway-agent"
if exist .claude\settings.json (
    echo ✅ MCP 网关 Agent 配置文件存在
    echo 📍 当前目录: %CD%
    echo 🎯 Agent 职责: 对话理解 + 流程编排 + 技能调度
    echo 🌐 服务端口: 8092
    echo ✨ 全自动: 开发 | 调优 | 排错 | 迭代
    echo.
) else (
    echo ❌ MCP 网关 Agent 配置文件不存在
    echo.
)

REM 测试业务 Agent
echo === 🟠 业务集成 Agent 测试 ===
cd /d "%BASE_PATH%\agent-add-oil"
if exist .claude\settings.json (
    echo ✅ 业务 Agent 配置文件存在
    echo 📍 当前目录: %CD%
    echo 🎯 Agent 职责: 业务逻辑 + 跨系统对接 + 数据流转
    echo 🌐 服务端口: 8093
    echo.
) else (
    echo ❌ 业务 Agent 配置文件不存在
    echo.
)

echo === 🎉 Agent 配置测试完成！===
echo.
echo 💡 使用方法:
echo 1. 切换到对应项目目录，Claude Code 会自动激活相应 Agent
echo 2. 在 Claude Code 中直接描述需求，Agent 会自动执行
echo.
echo 🚀 快速切换项目:
echo cd aggregation-support-agent-web     # 前端 Agent
echo cd aggregation-support-agent         # 后端 Agent
echo cd mcp-gateway-agent                 # MCP 网关 Agent
echo cd agent-add-oil                     # 业务 Agent
echo.
echo 💭 测试 Agent 激活:
echo 切换到任意项目目录后，在 Claude Code 中说: "帮我检查一下项目状态"

pause

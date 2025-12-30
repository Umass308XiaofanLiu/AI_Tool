# AI Chat Client

一个支持多种 AI 模型的浏览器端聊天客户端，支持在线 API 和本地 LM Studio 模型。

## 功能特点

- **多模型支持**
  - Google Gemini (2.5 Flash Lite, 3 Flash, 3 Pro)
  - OpenAI GPT-5 (Nano, Mini, 5.2)
  - Anthropic Claude 4.5 (Haiku, Sonnet, Opus)
  - DeepSeek V3.2 (Chat, Reasoner)
  - LM Studio 本地模型

- **现代化界面**
  - 类似 ChatGPT/Claude 的聊天布局
  - 用户消息右对齐气泡
  - AI 回复居中显示
  - 代码块带语言标签和复制按钮
  - **LaTeX 数学公式渲染** (使用 KaTeX)
  - **复制和重新生成按钮**

- **主题切换**
  - 浅色模式
  - 深色模式
  - 跟随系统

- **本地存储**
  - 聊天历史自动保存
  - API 密钥本地存储
  - 设置持久化

## 使用方法

### 方式一：直接使用

1. 打开 `dist/AI_Chat_Client.html` 文件
2. 点击左下角设置按钮
3. 输入所需的 API 密钥
4. 选择模型开始聊天

### 方式二：从源码构建

```bash
# 运行构建脚本
python build.py

# 输出文件位于 dist/AI_Chat_Client.html
```

## 支持的模型

| 服务 | 模型 ID | 显示名称 |
|------|---------|----------|
| Google Gemini | `gemini-2.5-flash-lite` | Gemini 2.5 Flash Lite |
| | `gemini-3-flash-preview` | Gemini 3 Flash |
| | `gemini-3-pro-preview` | Gemini 3 Pro |
| OpenAI | `gpt-5-nano` | GPT-5 Nano |
| | `gpt-5-mini` | GPT-5 Mini |
| | `gpt-5.2` | GPT-5.2 |
| Anthropic Claude | `claude-haiku-4-5-20251001` | Claude Haiku 4.5 |
| | `claude-sonnet-4-5-20250929` | Claude Sonnet 4.5 |
| | `claude-opus-4-5-20251101` | Claude Opus 4.5 |
| DeepSeek | `deepseek-chat` | DeepSeek V3.2 |
| | `deepseek-reasoner` | DeepSeek V3.2 Reasoner |

## 配置说明

### API 密钥

在设置中配置各个服务的 API 密钥：

| 服务 | 说明 |
|------|------|
| Google Gemini | 从 [Google AI Studio](https://aistudio.google.com/) 获取 |
| OpenAI | 从 [OpenAI Platform](https://platform.openai.com/) 获取 |
| Anthropic Claude | 需要 API 密钥 + CORS 代理 URL |
| DeepSeek | 从 [DeepSeek Platform](https://platform.deepseek.com/) 获取 |

### Claude CORS 代理

由于浏览器安全限制，Claude API 需要通过 CORS 代理访问。请在设置中配置代理 URL。

### LM Studio 本地模型

1. 启动 LM Studio 并加载模型
2. 开启 Local Server (默认端口 1234)
3. 在设置中输入 LM Studio URL (如 `http://localhost:1234`)
4. 点击"Connect & Verify"检测可用模型

## 项目结构

```
AI_Tool/
├── build.py              # 构建脚本
├── dist/
│   └── AI_Chat_Client.html  # 构建输出
└── src/
    ├── css/
    │   └── styles.css    # 样式文件
    ├── html/
    │   └── template.html # HTML 模板
    └── js/
        ├── api/          # API 客户端
        │   ├── claude.js
        │   ├── deepseek.js
        │   ├── gemini.js
        │   ├── lmstudio.js
        │   └── openai.js
        ├── ui/           # UI 组件
        │   ├── chat.js
        │   ├── chatHistory.js
        │   ├── main.js
        │   ├── settings.js
        │   └── sidebar.js
        └── utils/        # 工具模块
            ├── markdown.js
            └── storage.js
```

## 技术栈

- 纯 HTML/CSS/JavaScript，无框架依赖
- CSS 变量实现主题切换
- LocalStorage 数据持久化
- SSE 流式响应处理

## License

MIT

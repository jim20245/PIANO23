// AI聊天功能模块
class AIChat {
    constructor() {
        this.chatContainer = null;
        this.chatWindow = null;
        this.chatInput = null;
        this.sendButton = null;
        this.minimizeButton = null;
        this.messageContainer = null;
        this.isMinimized = false;
        this.isExpanded = false;
        this.initialize();
    }

    initialize() {
        // 等待DOM加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', this.createChatWidget.bind(this));
        } else {
            this.createChatWidget();
        }
    }

    createChatWidget() {
        // 创建聊天窗口容器
        this.chatContainer = document.createElement('div');
        this.chatContainer.id = 'ai-chat-container';
        this.chatContainer.className = 'ai-chat-container';
        document.body.appendChild(this.chatContainer);

        // 创建聊天窗口HTML
        this.chatContainer.innerHTML = `
            <div class="ai-chat-header">
                <div class="ai-chat-title">
                    <i class="fa fa-robot"></i> 美食助手
                </div>
                <div class="ai-chat-controls">
                    <button id="ai-chat-minimize" class="ai-chat-btn">
                        <i class="fa fa-window-minimize"></i>
                    </button>
                    <button id="ai-chat-close" class="ai-chat-btn">
                        <i class="fa fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="ai-chat-window">
                <div class="ai-chat-messages" id="ai-chat-messages">
                    <div class="ai-message">
                        <div class="message-content">
                            您好！我是您的美食助手。请问有什么可以帮助您的吗？
                        </div>
                    </div>
                </div>
                <div class="ai-chat-input-container">
                    <input type="text" id="ai-chat-input" placeholder="请输入您的问题..." />
                    <button id="ai-chat-send" class="ai-chat-send-btn">
                        <i class="fa fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;

        // 创建聊天启动按钮
        const chatLauncher = document.createElement('button');
        chatLauncher.id = 'ai-chat-launcher';
        chatLauncher.className = 'ai-chat-launcher';
        chatLauncher.innerHTML = '<i class="fa fa-comment"></i>';
        document.body.appendChild(chatLauncher);

        // 获取元素引用
        this.chatWindow = this.chatContainer.querySelector('.ai-chat-window');
        this.chatInput = document.getElementById('ai-chat-input');
        this.sendButton = document.getElementById('ai-chat-send');
        this.minimizeButton = document.getElementById('ai-chat-minimize');
        this.closeButton = document.getElementById('ai-chat-close');
        this.messageContainer = document.getElementById('ai-chat-messages');

        // 添加事件监听器
        this.sendButton.addEventListener('click', this.sendMessage.bind(this));
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
        this.minimizeButton.addEventListener('click', this.toggleMinimize.bind(this));
        this.closeButton.addEventListener('click', this.hideChat.bind(this));
        chatLauncher.addEventListener('click', this.showChat.bind(this));

        // 添加CSS样式
        this.addStyles();

        // 初始隐藏聊天窗口
        this.hideChat();
    }

    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* AI聊天窗口样式 */
            .ai-chat-container {
                position: fixed;
                bottom: 80px;
                right: 30px;
                width: 350px;
                max-height: 500px;
                background: black;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                overflow: hidden;
                z-index: 10000;
                display: none;
                flex-direction: column;
                transition: all 0.3s ease;
            }

            .ai-chat-container.active {
                display: flex;
            }

            .ai-chat-header {
                background: linear-gradient(135deg, #ff6b6b, #ee5a24);
                color: black;
                padding: 15px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .ai-chat-title {
                font-weight: bold;
                font-size: 16px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .ai-chat-controls {
                display: flex;
                gap: 10px;
            }

            .ai-chat-btn {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: black;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
            }

            .ai-chat-btn:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            .ai-chat-window {
                display: flex;
                flex-direction: column;
                height: 400px;
            }

            .ai-chat-messages {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                background: black;
            }

            .ai-message,
            .user-message {
                margin-bottom: 15px;
                display: flex;
            }

            .ai-message {
                justify-content: flex-start;
            }

            .user-message {
                justify-content: flex-end;
            }

            .message-content {
                max-width: 70%;
                padding: 12px 15px;
                border-radius: 18px;
                word-wrap: break-word;
                font-size: 14px;
                line-height: 1.4;
            }

            .ai-message .message-content {
                background: black;
                border: 1px solid #e9ecef;
                border-bottom-left-radius: 4px;
            }

            .user-message .message-content {
                background: white;
                color: black;
                border-bottom-right-radius: 4px;
            }

            .ai-chat-input-container {
                padding: 15px;
                background: black;
                border-top: 1px solid #e9ecef;
                display: flex;
                gap: 10px;
                align-items: center;
            }

            #ai-chat-input {
                flex: 1;
                padding: 10px 15px;
                border: 1px solid #ddd;
                border-radius: 20px;
                outline: none;
                font-size: 14px;
            }

            #ai-chat-input:focus {
                border-color: #ff6b6b;
            }

            .ai-chat-send-btn {
                background: #ff6b6b;
                color: white;
                border: none;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }

            .ai-chat-send-btn:hover {
                background: #ee5a24;
                transform: scale(1.05);
            }

            /* 聊天启动按钮样式 */
            .ai-chat-launcher {
                position: fixed;
                bottom: 30px;
                right: 30px;
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #ff6b6b, #ee5a24);
                color: white;
                border: none;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
                z-index: 9999;
                transition: all 0.3s ease;
            }

            .ai-chat-launcher:hover {
                transform: scale(1.1);
                box-shadow: 0 6px 20px rgba(255, 107, 107, 0.5);
            }

            /* 响应式设计 */
            @media (max-width: 480px) {
                .ai-chat-container {
                    width: 90%;
                    right: 5%;
                    left: 5%;
                    max-height: 70vh;
                }
            }
        `;
        document.head.appendChild(style);
    }

    sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;

        // 添加用户消息到聊天窗口
        this.addMessage(message, 'user');
        this.chatInput.value = '';

        // 显示正在输入的状态
        const typingMessage = this.addTypingIndicator();

        // 调用AI处理消息
        this.processMessageWithAI(message)
            .then(response => {
                // 移除正在输入的状态
                typingMessage.remove();
                // 添加AI回复
                this.addMessage(response, 'ai');
            })
            .catch(error => {
                typingMessage.remove();
                this.addMessage('抱歉，我暂时无法回答这个问题。请稍后再试。', 'ai');
                console.error('AI处理错误:', error);
            });
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = sender === 'ai' ? 'ai-message' : 'user-message';
        messageDiv.innerHTML = `<div class="message-content">${text}</div>`;
        this.messageContainer.appendChild(messageDiv);
        // 滚动到底部
        this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
    }

    addTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'ai-message';
        typingDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-indicator">
                    <span></span><span></span><span></span>
                </div>
            </div>
        `;
        this.messageContainer.appendChild(typingDiv);
        this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
        return typingDiv;
    }

    async processMessageWithAI(message) {
        try {
            // 尝试调用后端API
            const response = await fetch('/api/ai-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });

            if (response.ok) {
                const data = await response.json();
                return data.response;
            } else {
                // 如果API调用失败，使用本地预设回复
                return this.getLocalResponse(message);
            }
        } catch (error) {
            // 网络错误时使用本地预设回复
            console.log('使用本地AI回复');
            return this.getLocalResponse(message);
        }
    }

    getLocalResponse(message) {
        // 本地预设回复逻辑
        const lowerMessage = message.toLowerCase();

        // 菜品相关回复
        if (lowerMessage.includes('price') || lowerMessage.includes('Tissue') || lowerMessage.includes('有什么')) {
            return 'contact:18064908797@163.com';
        }

        if (lowerMessage.includes('quality') || lowerMessage.includes('money')) {
            return 'contact:18064908797@163.com';
        }

        if (lowerMessage.includes('order') || lowerMessage.includes('buy')) {
            return 'contact:18064908797@163.com';
        }

        // 营业时间相关
        if (lowerMessage.includes('time') || lowerMessage.includes('location')) {
            return 'contact:18064908797@163.com';
        }

        // 地址相关
        if (lowerMessage.includes('adress') || lowerMessage.includes('location')) {
            return 'contact:18064908797@163.com';
        }

        // 常见问题
        if (lowerMessage.includes('deliver') || lowerMessage.includes('shipping')) {
            return 'contact:18064908797@163.com';
        }

        if (lowerMessage.includes('material') || lowerMessage.includes('fresh')) {
            return 'contact:18064908797@163.com';
        }

        if (lowerMessage.includes('good') || lowerMessage.includes('why')) {
            return 'contact:18064908797@163.com';
        }

        // 默认回复
        return 'Thanks for your choice,if you have any question please contact:18064908797@163.com';
    }

    toggleMinimize() {
        this.isMinimized = !this.isMinimized;
        if (this.isMinimized) {
            this.chatWindow.style.display = 'none';
            this.chatContainer.style.height = '50px';
            this.minimizeButton.innerHTML = '<i class="fa fa-window-maximize"></i>';
        } else {
            this.chatWindow.style.display = 'flex';
            this.chatContainer.style.height = '';
            this.minimizeButton.innerHTML = '<i class="fa fa-window-minimize"></i>';
        }
    }

    showChat() {
        this.chatContainer.classList.add('active');
        this.isMinimized = false;
        this.chatWindow.style.display = 'flex';
        this.chatContainer.style.height = '';
        this.minimizeButton.innerHTML = '<i class="fa fa-window-minimize"></i>';
    }

    hideChat() {
        this.chatContainer.classList.remove('active');
    }
}

// 页面加载完成后初始化聊天组件
document.addEventListener('DOMContentLoaded', function() {
    // 延迟初始化，确保页面其他元素已加载
    setTimeout(() => {
        new AIChat();
    }, 1000);

});







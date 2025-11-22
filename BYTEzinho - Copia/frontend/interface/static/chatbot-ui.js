function initializeChatbot() {
    console.log('[chatbot-ui] initializing...');
    const chatbotToggler = document.getElementById('chatbot-toggler');
    const chatbotContainer = document.getElementById('chatbot-container');
    const closeBtn = document.getElementById('chatbot-close-btn');
    const chatBody = document.getElementById('chatbot-body');
    const inputField = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send-btn');

    // Elementos do formulário de lead
    const leadFormContainer = document.getElementById('lead-capture-form');
    const leadForm = document.getElementById('chatbot-lead-form');
    const chatConversation = document.getElementById('chat-conversation');
    const timeElement = document.getElementById('current-time');

    function updateCurrentTime() {
        if (!timeElement) return;
        const now = new Date();
        timeElement.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    updateCurrentTime();
    setInterval(updateCurrentTime, 60 * 1000);

    // Se os elementos não existirem no momento do carregamento, usamos event delegation
    if (chatbotToggler && chatbotContainer) {
        console.log('[chatbot-ui] found elements, attaching direct listeners');
        chatbotToggler.addEventListener('click', () => {
            chatbotContainer.classList.add('active');
            chatbotToggler.classList.add('chat-active');
            chatbotContainer.setAttribute('aria-hidden', 'false');
            // Foca no primeiro campo do formulário de lead ao abrir
            const leadNameField = document.getElementById('lead-name');
            leadNameField && leadNameField.focus();
        });

        closeBtn && closeBtn.addEventListener('click', () => {
            chatbotContainer.classList.remove('active');
            chatbotToggler.classList.remove('chat-active');
            chatbotToggler.focus(); // Devolve o foco ao botão
            chatbotContainer.setAttribute('aria-hidden', 'true');
        });
    } else {
        console.log('[chatbot-ui] elements not present yet — using delegated click handlers');
        // Delegation: escuta cliques no documento para abrir/fechar
        document.addEventListener('click', (e) => {
            try {
                const toggler = e.target.closest && e.target.closest('#chatbot-toggler');
                const close = e.target.closest && e.target.closest('#chatbot-close-btn');
                if (toggler) {
                    const container = document.getElementById('chatbot-container');
                    if (container) {
                        toggler.classList.add('chat-active');
                        container.classList.add('active');
                        container.setAttribute('aria-hidden', 'false');
                        // Foca no primeiro campo do formulário de lead ao abrir
                        const leadNameField = document.getElementById('lead-name');
                        leadNameField && leadNameField.focus();
                        console.log('[chatbot-ui] opened via delegation');
                    } else console.warn('[chatbot-ui] container missing when trying to open');
                }
                if (close) {
                    const container = document.getElementById('chatbot-container');
                    if (container) {
                        const toggler = document.getElementById('chatbot-toggler');
                        toggler && toggler.classList.remove('chat-active');
                        toggler && toggler.focus(); // Devolve o foco ao botão
                        container.classList.remove('active');
                        container.setAttribute('aria-hidden', 'true');
                        console.log('[chatbot-ui] closed via delegation');
                    }
                }
            } catch (err) {
                console.error('[chatbot-ui] delegation handler error', err);
            }
        });
    }

    function addWelcomeMessage(userName) {
        const welcomeContainer = document.getElementById('welcome-message-content');
        if (!welcomeContainer) return;

        const now = new Date();
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        welcomeContainer.innerHTML = `
            <strong>Bytezinho AI</strong>
            <p>Olá, ${escapeHtml(userName)}! Sou o Bytezinho, seu assistente de IA. Como posso ajudar você hoje?</p>
            <div class="suggestions">
                <button class="suggestion-btn" data-message="Como faço para participar?">Como faço para participar?</button>
                <button class="suggestion-btn" data-message="Sou menor de idade posso participar?">Sou menor de idade posso participar?</button>
                <button class="suggestion-btn" data-message="Onde eu posso fazer o curso?">Onde eu posso fazer o curso?</button>
            </div>
            <span class="message-time">${time}</span>
        `;

        // Reanexa os eventos aos novos botões de sugestão
        const newSuggestionBtns = welcomeContainer.querySelectorAll('.suggestion-btn');
        newSuggestionBtns.forEach(btn => {
            btn.addEventListener('click', () => handleSuggestionClick(btn));
        });
    }

    function addMessage(message, isBot = false, stream = false) {
        if (!chatBody) return;

        // Se for uma mensagem do usuário ou uma mensagem de bot não-streaming
        if (!isBot || !stream) {
        const wrapper = document.createElement('div');
        wrapper.className = `chat-message ${isBot ? 'bot' : 'user'}`;
        const now = new Date();
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            wrapper.innerHTML = `
                <div class="message-content">
                    ${isBot ? '<strong>Bytezinho AI</strong>' : ''}
                    <p>${escapeHtml(message)}</p>
                    <span class="message-time">${time}</span>
                </div>
            `;
        chatBody.appendChild(wrapper);
        chatBody.scrollTop = chatBody.scrollHeight;
            return;
        }

        // Lógica de streaming para o bot
        const wrapper = document.createElement('div');
        wrapper.className = 'chat-message bot';
        const now = new Date();
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        wrapper.innerHTML = `
            <div class="message-content">
                <strong>Bytezinho AI</strong>
                <p></p>
                <span class="message-time">${time}</span>
            </div>`;
        chatBody.appendChild(wrapper);
        chatBody.scrollTop = chatBody.scrollHeight;

        const p = wrapper.querySelector('p');
        let i = 0;
        const speed = 30; // Milissegundos por caractere

        const typingInterval = setInterval(() => {
            if (i < message.length) {
                // Usamos innerHTML para renderizar possíveis tags HTML como <strong>
                p.innerHTML += escapeHtml(message.charAt(i));
                i++;
                chatBody.scrollTop = chatBody.scrollHeight;
            } else {
                clearInterval(typingInterval);
            }
        }, speed);
    }

    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/\'/g, "&#039;");
    }

    async function sendToServer(message) {
        // Tenta usar o endpoint /chat configurado no back-end
        try {
            const res = await fetch('/chat', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            if (!res.ok) throw new Error('Erro na resposta do servidor');
            const data = await res.json();
            return data.response || 'Desculpe, não obtive resposta.';
        } catch (err) {
            console.warn('Chatbot: erro ao chamar /chat, fallback local', err);
            return null; // sinaliza falha
        }
    }

    async function sendMessage() {
        const message = inputField.value.trim();
        if (!message) return;
        addMessage(message, false);
        inputField.value = '';
        inputField.style.height = ''; // Reset height

        // Show a simple "typing" indicator
        const typing = document.createElement("div");
        typing.className = "chat-message bot typing-indicator-li"; // Reutilizando a classe para fácil remoção
        typing.innerHTML = `
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>`;
        chatBody.appendChild(typing);
        chatBody.scrollTop = chatBody.scrollHeight;

        const serverResp = await sendToServer(message);
        typing.remove();

        if (serverResp) {
            addMessage(serverResp, true, true); // Ativa o streaming para a resposta do bot
        } else {
            // fallback simulado
            addMessage('Desculpe, ainda estou aprendendo a responder essa pergunta. (modo offline)', true, true);
        }
    }

    sendBtn && sendBtn.addEventListener('click', sendMessage);
    inputField && inputField.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

    async function handleSuggestionClick(btn) {
        const message = btn.getAttribute('data-message');
        if (!message) return;
        // Preenche o input e envia a mensagem automaticamente
        if (inputField) {
            inputField.value = message;
            inputField.focus();
        }
        console.log('[chatbot-ui] suggestion clicked, sending:', message);
        await sendMessage();
        // Após enviar a sugestão, ocultar o contêiner de sugestões
        const suggestionsContainer = btn.closest('.suggestions');
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
        }
    }

    // Lógica do formulário de leads
    if (leadForm) {
        leadForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Impede o recarregamento da página
            const name = document.getElementById('lead-name').value;
            const email = document.getElementById('lead-email').value;
            const submitBtn = document.getElementById('lead-submit-btn');

            // Desabilita o botão para evitar múltiplos envios
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';

            try {
                const response = await fetch('/leads', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, email }),
                });

                if (!response.ok) {
                    throw new Error('Falha ao enviar os dados. Tente novamente.');
                }

                console.log('[chatbot-ui] Lead enviado com sucesso:', { name, email });

                // Esconde o formulário e mostra a conversa
                leadFormContainer.classList.add('hidden');
                chatConversation.classList.remove('hidden');

                // Personaliza a mensagem de boas-vindas
                addWelcomeMessage(name);

            } catch (error) {
                console.error('[chatbot-ui] Erro ao capturar lead:', error);
                alert(error.message); // Informa o usuário sobre o erro
                submitBtn.disabled = false; // Reabilita o botão em caso de falha
                submitBtn.textContent = 'Iniciar Conversa';
            }
        });
    } else {
        console.warn('[chatbot-ui] Formulário de lead não encontrado.');
    }
}

// Executa a inicialização do chatbot.
// Como o script é carregado no final do body, o DOM já estará pronto.
initializeChatbot();

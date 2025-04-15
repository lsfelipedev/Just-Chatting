'use strict';

var usernamePage = document.querySelector('#username-page');
var chatPage = document.querySelector('#chat-page');
var usernameForm = document.querySelector('#usernameForm');
var messageForm = document.querySelector('#messageForm');
var messageInput = document.querySelector('#message');
var messageArea = document.querySelector('#messageArea');
var connectingElement = document.querySelector('.connecting');
var roomIdInput = document.querySelector('#roomId'); // Adicione um input para o roomId no HTML

var stompClient = null;
var username = null;
var currentRoomId = null; // Variável para armazenar a sala atual

var colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];


async function setupRoom(shouldCreateNewRoom) {
    username = document.querySelector('#name').value.trim();
    currentRoomId = roomIdInput.value.trim() || 'public';

    if (!username) {
        alert('Please enter a username');
        return false;
    }

    try {
        if (shouldCreateNewRoom) {
            const createResponse = await fetch('/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId: currentRoomId })
            });

            if (!createResponse.ok) {
                throw new Error('Failed to create room');
            }
        } else {
            const response = await fetch(`/rooms/${currentRoomId}`);
            if (!response.ok) {
                throw new Error('Room does not exist. Please create it first.');
            }
        }

        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        const socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);

        // Conexão com tratamento de erro adequado
        stompClient.connect({},
            () => onConnected(currentRoomId),
            (error) => onError(error)
        );

        return true;

    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
        usernamePage.classList.remove('hidden');
        chatPage.classList.add('hidden');
        return false;
    }
}

// Função de tratamento de erro do WebSocket
function onError(error) {
    console.error('WebSocket Connection Error:', error);
    connectingElement.textContent = 'Connection error. Please refresh and try again.';
    connectingElement.style.color = 'red';

    // Restaura a UI
    usernamePage.classList.remove('hidden');
    chatPage.classList.add('hidden');

    // Opcional: tentar reconectar após um delay
    // setTimeout(() => setupRoom(false), 5000);
}

// Funções de entrada específicas
async function connect(event) {
    if (event) event.preventDefault();
    await setupRoom(false);
}

async function createRoom(event) {
    if (event) event.preventDefault();
    await setupRoom(true);
}


function onConnected(roomId) {
    // Subscribe to the specific Room Topic
    stompClient.subscribe(`/topic/${roomId}`, onMessageReceived);

    // Tell your username to the server with room info
    stompClient.send("/app/chat.addUser",
        {},
        JSON.stringify({
            sender: username,
            type: 'JOIN',
            roomId: roomId,
            content: `${username} joined the room`
        })
    );

    // Load previous messages
    loadMessages(roomId);

    connectingElement.classList.add('hidden');
}

async function loadMessages(roomId) {
    try {
        const response = await fetch(`/rooms/${roomId}/messages`);
        if (response.ok) {
            const messages = await response.json();
            messages.forEach(message => {
                // Cria um payload simulado para usar a mesma função
                onMessageReceived({
                    body: JSON.stringify(message)
                });
            });
        }
    } catch (error) {
        console.error('Error loading messages:', error);
    }
}

function sendMessage(event) {
    var messageContent = messageInput.value.trim();
    if(messageContent && stompClient && currentRoomId) {
        var chatMessage = {
            sender: username,
            content: messageContent,
            messageType: 'CHAT',
            roomId: currentRoomId
        };
        stompClient.send(`/app/chat.sendMessage/${currentRoomId}`, {}, JSON.stringify(chatMessage));
        messageInput.value = '';
    }
    event.preventDefault();
}

function onMessageReceived(payload) {
    try {
        console.log("Raw payload:", payload);
        const message = JSON.parse(payload.body);
        console.log("Parsed message:", message);

        const messageElement = document.createElement('li');

        // Verifica tanto 'type' quanto 'messageType' para maior compatibilidade
        const messageType = message.type || message.messageType;

        if (messageType === 'JOIN' || messageType === 'LEAVE') {
            messageElement.classList.add('event-message');
            const action = messageType === 'JOIN' ? 'entrou' : 'saiu';
            const displayText = message.content || `${message.sender} ${action}!`;

            messageElement.innerHTML = `
                <p class="system-message">
                    <span class="event-icon">${messageType === 'JOIN' ? '→' : '←'}</span>
                    ${displayText}
                </p>
            `;
        } else {
            // Mensagem normal de chat
            messageElement.classList.add('chat-message');

            const avatarElement = document.createElement('i');
            avatarElement.textContent = message.sender[0];
            avatarElement.style.backgroundColor = getAvatarColor(message.sender);

            const usernameElement = document.createElement('span');
            usernameElement.textContent = message.sender;

            const textElement = document.createElement('p');
            textElement.textContent = message.content;

            messageElement.append(avatarElement, usernameElement, textElement);
        }

        messageArea.appendChild(messageElement);
        messageArea.scrollTop = messageArea.scrollHeight;

    } catch (error) {
        console.error("Error processing message:", error, payload);
    }
}


function getAvatarColor(messageSender) {
    var hash = 0;
    for (var i = 0; i < messageSender.length; i++) {
        hash = 31 * hash + messageSender.charCodeAt(i);
    }
    var index = Math.abs(hash % colors.length);
    return colors[index];
}

document.getElementById('createRoomBtn').addEventListener('click', createRoom);
usernameForm.addEventListener('submit', connect); // Observe que removi o 'true'
messageForm.addEventListener('submit', sendMessage, true)

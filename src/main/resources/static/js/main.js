'use strict';

const usernamePage = document.querySelector('#username-page');
const chatPage = document.querySelector('#chat-page');
const usernameForm = document.querySelector('#usernameForm');
const messageForm = document.querySelector('#messageForm');
const messageInput = document.querySelector('#message');
const messageArea = document.querySelector('#messageArea');
const connectingElement = document.querySelector('.connecting');
const roomIdInput = document.querySelector('#roomId');
const roomName = document.querySelector('#current-room-name');
const userCountRoom = document.querySelector('#user-count');
const closeChatButton = document.querySelector('#btn-back');
const toggle = document.getElementById('toggle-btn');

let stompClient = null;
let username = null;
let currentRoomId = null;
let roomUsers = new Set();

document.addEventListener('DOMContentLoaded', () => {
    const socket = new SockJS('/ws');
    const stompClientForRooms = Stomp.over(socket);

    stompClientForRooms.connect({}, () => {
        stompClientForRooms.subscribe('/topic/rooms/rooms-selected', (payload) => {
            const roomsData = JSON.parse(payload.body);
            updateRoomTable(roomsData);
        });
        stompClientForRooms.send("/app/rooms.requestList", {});

    }, (error) => {
        console.error("Erro na conexão para atualizações:", error);
    });
});
async function setupRoom(shouldCreateNewRoom) {

    username = document.querySelector('#name').value.trim();
    currentRoomId = roomIdInput.value.trim() || 'public';
    roomName.textContent = `Room ID: ${currentRoomId}`;

    if (!username) {
        alert('Please enter a username');
        return false;
    }

    try {
         const roomIdAndVisibility = {roomId: currentRoomId, isVisible: toggle.checked};

        if (shouldCreateNewRoom) {
            const createResponse = await fetch('/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(roomIdAndVisibility)
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

        stompClient.connect({},
            () => onConnected(currentRoomId),
            (error) => onError(error)
        );
        joinRoom();
        return true;

    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
        usernamePage.classList.remove('hidden');
        chatPage.classList.add('hidden');
        return false;
    }
}

function onError(error) {
    console.error('WebSocket Connection Error:', error);
    connectingElement.textContent = 'Connection error. Please refresh and try again.';
    connectingElement.style.color = 'red';

    usernamePage.classList.remove('hidden');
    chatPage.classList.add('hidden');

}

async function connect(event) {
    if (event) event.preventDefault();
    await setupRoom(false);
}

async function createRoom(event) {
    if (event) event.preventDefault();
    await setupRoom(true);
}

function joinRoom() {
    document.getElementById("username-page").style.display = "none";
    document.getElementById("chat-page").style.display = "block";
}

function onConnected(roomId) {
    stompClient.subscribe(`/topic/${roomId}`, onMessageReceived);

    stompClient.send(`/app/chat.addUser/${roomId}`,
        {},
        JSON.stringify({
            sender: username,
            messageType: 'JOIN',
            roomId: roomId
        })
    );

    loadMessages(roomId);

    connectingElement.classList.add('hidden');
}

async function loadMessages(roomId) {
    try {
        const response = await fetch(`/rooms/${roomId}/messages`);
        if (response.ok) {
            const messages = await response.json();
            messages.forEach(message => {

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
    let messageContent = messageInput.value.trim();
    if(messageContent && stompClient && currentRoomId) {
        let chatMessage = {
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
        const message = JSON.parse(payload.body);
        const messageElement = document.createElement('li');
        const messageType = message.messageType;
        const isCurrentUser = message.sender === username;

         if (messageType === 'JOIN' || messageType === 'LEAVE') {

            let displayText = null;

             if (messageType === 'JOIN') {
                roomUsers.add(message.sender);
                displayText = `${message.sender} joined the room`;
             }
             else{
                 displayText = `${message.sender} left the room`;
                 roomUsers.delete(message.sender);
             }

             messageElement.classList.add('event-message');
             userCountRoom.textContent = `${roomUsers.size} user(s) online`;

             messageElement.innerHTML = `
                <p class="system-message">
                    <span class="event-icon">${messageType === 'JOIN' ? '→ ' : '← '}</span>
                    ${displayText}
                </p>`;
        }

        else {
            messageElement.classList.add('chat-message');

            const avatarElement = document.createElement('i');
            avatarElement.textContent = message.sender[0];
            avatarElement.style.backgroundColor = getAvatarColor(message.sender);

            const usernameElement = document.createElement('span');
            usernameElement.textContent = message.sender;

            const textElement = document.createElement('p');
            textElement.textContent = message.content;

            messageElement.append(avatarElement ,usernameElement, textElement);

            if (isCurrentUser) {
                messageElement.classList.add('my-message');
            }
        }

        messageArea.appendChild(messageElement);
        messageArea.scrollTop = messageArea.scrollHeight;

    } catch (error) {
        console.error("Erro ao processar mensagem:", error, payload);
    }
}

function getAvatarColor(messageSender) {

    const colors = [
        '#2196F3', '#32c787', '#00BCD4', '#ff5652',
        '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
    ];
    let hash = 0;
    for (var i = 0; i < messageSender.length; i++) {
        hash = 31 * hash + messageSender.charCodeAt(i);
    }
    let index = Math.abs(hash % colors.length);
    return colors[index];
}

function updateRoomTable(roomsData) {
    const tableBody = document.getElementById('room-table-body');

    if (!tableBody) return;

    if (!roomsData || roomsData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="2">No rooms available</td></tr>';
        return;
    }

    tableBody.innerHTML = roomsData.map(room => `
        <tr>
            <td>${room.roomId}</td>
            <td>${room.userOnline}</td>
        </tr>
    `).join('');
}

closeChatButton.addEventListener('click', function () {
    window.location.href ='index.html';
});

document.getElementById('createRoomBtn').addEventListener('click', createRoom);
usernameForm.addEventListener('submit', connect);
messageForm.addEventListener('submit', sendMessage, true)

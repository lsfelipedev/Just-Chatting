package com.system.chat;

import com.system.chat.model.ChatMessage;
import com.system.chat.message.MessageType;
import com.system.chat.model.Room;
import com.system.chat.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.security.SecurityProperties;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final SimpMessageSendingOperations messageTemplate;
    private final RoomRepository roomRepository;

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {

        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

        String username = (String) headerAccessor.getSessionAttributes().get("username");
        String roomId = (String) headerAccessor.getSessionAttributes().get("roomId");

        if (username != null && roomId != null) {
            log.info("User disconnected : {} from room: {}", username, roomId);
            var chatMessage = ChatMessage.builder()
                    .messageType(MessageType.LEAVER)
                    .sender(username)
                    .build();

            messageTemplate.convertAndSend("/topic/" + roomId, chatMessage);

            Room room = roomRepository.findByRoomId(roomId);
            if (room != null) {
                room.getMessages().add(chatMessage);
                roomRepository.save(room);
            }
        }
    }
}

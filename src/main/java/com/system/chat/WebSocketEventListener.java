package com.system.chat;

import com.system.chat.model.ChatMessage;
import com.system.chat.message.MessageType;
import com.system.chat.model.Room;
import com.system.chat.service.RoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketEventListener {

    private final SimpMessageSendingOperations messagingTemplate;
    private final RoomService roomService;

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {

        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

        String username = (String) headerAccessor.getSessionAttributes().get("username");
        String roomId = (String) headerAccessor.getSessionAttributes().get("roomId");

        if (username != null && roomId != null) {
            log.info("User disconnected : {} from room: {}", username, roomId);
            var chatMessage = ChatMessage.builder()
                    .messageType(MessageType.LEAVE)
                    .sender(username)
                    .build();

            messagingTemplate.convertAndSend("/topic/" + roomId, chatMessage);

            Room room = roomService.getRoomById(roomId);


            if (room != null) {
                room.getMessages().add(chatMessage);
                room.setUsersOnline(room.getUsersOnline() - 1);

                if(room.getUsersOnline() < 1)
                    roomService.removeRoom(room.getId());
                else
                    roomService.createRoom(room);
            }
        }
    }
}

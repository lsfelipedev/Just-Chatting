package com.system.chat.controller;

import com.system.chat.message.MessageDto;
import com.system.chat.message.MessageType;
import com.system.chat.model.ChatMessage;
import com.system.chat.model.Room;
import com.system.chat.service.RoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {

    @Autowired
    private RoomService roomService;

    @MessageMapping("/chat.sendMessage/{roomId}")
    @SendTo("/topic/{roomId}")
    public ChatMessage sendMessage(
            @DestinationVariable String roomId,
            @Payload ChatMessage chatMessage) {

        Room room = roomService.getRoomById(roomId);

        if (room == null) {
            throw new RuntimeException("room not found!");
        }

        room.getMessages().add(chatMessage);
        roomService.createRoom(room);

        return chatMessage;
    }

    @MessageMapping("/chat.addUser/{roomId}")
    @SendTo("/topic/{roomId}")
    public ChatMessage addUser(@DestinationVariable String roomId,
                               @Payload MessageDto message,
                               SimpMessageHeaderAccessor headerAccessor) {
        headerAccessor.getSessionAttributes().put("username", message.sender());
        headerAccessor.getSessionAttributes().put("roomId", message.roomId());


        if (!roomId.equals(message.roomId())) {
            throw new IllegalArgumentException("Room ID mismatch");
        }

        ChatMessage chatMessage = new ChatMessage(message.content(), message.sender(), MessageType.JOIN);
        Room room = roomService.getRoomById(message.roomId());

        if (room == null)
            throw new RuntimeException("room not found!");

        room.getMessages().add(chatMessage);
        roomService.createRoom(room);

        return chatMessage;
    }
}

package com.system.chat.controller;

import com.system.chat.model.ChatMessage;
import com.system.chat.model.Room;
import com.system.chat.model.RoomDtoRequest;
import com.system.chat.service.RoomService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/rooms")
public class RoomController {

    private final RoomService roomService;

    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @PostMapping
    public ResponseEntity createRoom(@RequestBody RoomDtoRequest roomDtoRequest){

        if(roomService.getRoomById(roomDtoRequest.roomId()) != null)
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Room already exists.");

        Room room = roomService.createRoom( new Room(roomDtoRequest));
        return ResponseEntity.status(HttpStatus.CREATED).body(room);
    }

    @GetMapping("/{roomId}")
    public ResponseEntity joinRoom( @PathVariable Map<String, String> roomId){
        String room = roomId.get("roomId");

        if(roomService.getRoomById(room) == null)
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Room not found!!");

        return ResponseEntity.ok(room);
    }

    @GetMapping("/{roomId}/messages")
    public ResponseEntity<List<ChatMessage>> getMessages(
            @PathVariable String roomId,
            @RequestParam(value = "page", defaultValue = "0", required = false) int page,
            @RequestParam(value = "size", defaultValue = "20", required = false) int size) {

        Room room = roomService.getRoomById(roomId);
        if (room == null)
            return ResponseEntity.badRequest().build();

        List<ChatMessage> messages = room.getMessages();
        int start = Math.max(0, messages.size() - (page + 1) * size);
        int end = Math.min(messages.size(), start + size);
        List<ChatMessage> paginatedMessages = messages.subList(start, end);
        return ResponseEntity.ok(paginatedMessages);

    }
}

package com.system.chat.controller;

import com.system.chat.model.ChatMessage;
import com.system.chat.model.Room;
import com.system.chat.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/rooms")
public class RoomController {

    @Autowired
    private RoomRepository roomRepository;


    @PostMapping
    public ResponseEntity createRoom(@RequestBody Map<String, String> roomMap){

        String roomString = roomMap.get("roomId");

        if(roomRepository.findByRoomId(roomString) != null)
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Room already exists.");

        Room room = roomRepository.save(new Room(roomString));
        return ResponseEntity.status(HttpStatus.CREATED).body(room);
    }

    @GetMapping("/{roomId}")
    public ResponseEntity joinRoom( @PathVariable Map<String, String> roomId){
        String room = roomId.get("roomId");

        if(roomRepository.findByRoomId(room) == null)
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Room not found!!");

        return ResponseEntity.ok(room);
    }

    @GetMapping("/{roomId}/messages")
    public ResponseEntity<List<ChatMessage>> getMessages(
            @PathVariable String roomId,
            @RequestParam(value = "page", defaultValue = "0", required = false) int page,
            @RequestParam(value = "size", defaultValue = "20", required = false) int size) {

        Room room = roomRepository.findByRoomId(roomId);
        if (room == null)
            return ResponseEntity.badRequest().build();

        List<ChatMessage> messages = room.getMessages();
        int start = Math.max(0, messages.size() - (page + 1) * size);
        int end = Math.min(messages.size(), start + size);
        List<ChatMessage> paginatedMessages = messages.subList(start, end);
        return ResponseEntity.ok(paginatedMessages);

    }
}

package com.system.chat.service;

import com.system.chat.model.Room;
import com.system.chat.repository.RoomRepository;
import org.springframework.stereotype.Service;

@Service
public class RoomService {

    private final RoomRepository roomRepository;

    public RoomService(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    public Room getRoomById(String id){
        return roomRepository.findByRoomId(id);
    }

    public Room createRoom(Room room){
        return roomRepository.save(room);
    }
}

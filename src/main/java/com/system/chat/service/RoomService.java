package com.system.chat.service;

import com.system.chat.model.Room;
import com.system.chat.model.RoomVisibleUserOnlineDto;
import com.system.chat.repository.RoomRepository;
import org.springframework.stereotype.Service;

import java.util.List;

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

        if(room.getRoomId().equals("public"))
            room.setVisible(true);
        return roomRepository.save(room);
    }

    public List<RoomVisibleUserOnlineDto> roomListVisibleAndUserOnline(){
        List<Room> allRooms = roomRepository.findAll();
        allRooms.removeIf(s -> !s.isVisible());
        return allRooms.stream().map(s -> new RoomVisibleUserOnlineDto(s.getRoomId(), s.getUsersOnline())).toList();
    }

    public void removeRoom(String id){
        roomRepository.deleteById(id);
    }
}

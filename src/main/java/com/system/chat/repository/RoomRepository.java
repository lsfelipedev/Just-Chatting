package com.system.chat.repository;

import com.system.chat.model.Room;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface RoomRepository extends MongoRepository<Room, String> {

    Room findByRoomId(String roomId);
}

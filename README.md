# Just Chatting

### `This is my final project in CS50: Introduction to Computer Science.` 

## Description
I developed this application with the aim of creating a **simple yet robust online chat** where users can connect and chat in real time in an intuitive way. 

**Just Chatting** is an online chat application that requires no formal registration.
To log in, users simply enter a username and the ID of the room they want to create or access. In addition, the user can choose whether they want this room to be publicly visible in the table of active rooms or not.
This flexibility allows the user to either create private rooms, ideal for restricted conversations between friends, or create public rooms, to chat with anyone interested.

If the Room ID field is left blank, the system will automatically connect the user to the default room called “public”. Regardless of whether the user checks the visibility option or not, the public room will always be visible to everyone.

### 💬 Real-time communication
When more than one user is present in the same room, all messages exchanged appear instantly thanks to WebSocket technology. Notifications of incoming and outgoing users are transmitted in real time to everyone in the room, increasing the feeling of live interaction.

### 🛠️ Room control and visibility
If you create a room with the visibility option turned off, it won't appear in the list of public rooms. This allows for greater privacy and control over who can and can't find your room.

### 💾 Integration with MongoDB
All actions - such as creating rooms, logging users in and out, sending messages and visibility status - are logged and stored in MongoDB. This integration guarantees data persistence for as long as the room is active.

### 🧹 Automatic room management
As part of the management system, rooms that are left without any active users are automatically removed from the database. This prevents empty rooms from accumulating and improves application performance.

## ⚙Validation

I've also implemented various validations to improve the user experience and prevent failures:

❌ If a user tries to create a room that already exists, the system will display an error message stating that the room is already registered.

❌ If someone tries to enter a room that doesn't exist, an error message will be displayed.

❌ User names beginning with numbers are not allowed, and the system will also warn the user in this case.

❌ If a user tries to enter an existing room using a name that is already in use in the same room, the system will notify them that this name is not available.


## Technologies

**Backend**: Developed in Java using the WebSocket API to provide a persistent and efficient connection between users.

**Database**: MongoDB to store rooms, users and messages, ensuring persistence and scalability.

**Frontend**: Implemented in HTML, CSS and JavaScript to provide a clean and responsive interface.

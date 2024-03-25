const express = require('express')
const http = require('http')
const app = express()
const { v4: uuidv4 } = require('uuid');
const server = http.createServer(app)
const dotenv = require('dotenv');
dotenv.config();
import { Server } from 'socket.io'



const { MongoClient, ServerApiVersion } = require('mongodb');

let db: any;

const io = new Server(server, {
    cors: {
        origin: "*",
    },
})








const uri = process.env.MONGO_DB_CONNECTION_STRING;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


app.get('/keep-alive', (req, res) => {
    res.send('Server is awake!');
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        db = client.db("nextdraw");
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


type RenderElements = {
    tempNewArray: string
    roomId: string
    key: string
    elements: object
}

const rooms = {};

async function generateUniqueUsername() {
    if (!db) {
        throw new Error("MongoDB connection not established");
    }

    let uniqueUsername: any;
    let isUnique = false;

    while (!isUnique) {

        uniqueUsername = uuidv4(); // Generate a unique username
        const existingUser = await db.collection("username").findOne({ username: uniqueUsername });
        if (!existingUser) {
            isUnique = true;
        }
    }

    // Save the username to MongoDB to mark it as taken
    await db.collection("username").insertOne({ username: uniqueUsername });

    return uniqueUsername;
}


io.on('connection', (socket) => {
    console.log(" connected ");


    socket.on('request-unique-username', () => {
        generateUniqueUsername()
            .then(uniqueUsername => {
                socket.emit('unique-username', uniqueUsername);
            })
            .catch(error => {
                console.error("Error generating unique username:", error);
                // Handle error as needed
            });
    });


    socket.on('render-elements', ({ tempNewArray, roomId, key }: RenderElements) => {


        if (!rooms[roomId]) {
            rooms[roomId] = {};
        }

        rooms[roomId][key] = tempNewArray;
        // console.log(rooms);


        socket.to(roomId).emit('render-elements', { tempNewArray })
    });

    socket.on('create-room', function (elements) {
        const roomId = uuidv4(); // Generate a unique room ID
        console.log(`joined the room ${roomId}`);
        socket.join(roomId);

        if (!rooms[roomId]) {
            rooms[roomId] = {};

            for (let i = 0; i < elements.length; i++) {
                const element = elements[i];
                // as undo redo not supported right now
                if (element === null || element === undefined) continue;
                const key = element.id.split("#")[0];
                rooms[roomId][key] = element;
            }
            // console.log(rooms);

        }

        socket.emit('room-created', roomId); // Emit the room ID back to the client
    });

    // scoket that is called whenever an element is deleted from the
    // element stack of a particular person and is transfered to other
    // through the socket to the subscribed room

    socket.on("delete-element", function ({ roomId, key }) {
        if (rooms[roomId]) {
            delete rooms[roomId][key];
        }
        // console.log(key);
        socket.to(roomId).emit("delete-element-socket", { key });
    });

    // TODO
    // socket.on('undo-element',function({roomId,undoElement,key}){
    //     rooms[roomId][key] = undoElement;
    //     socket.to(roomId).emit('undo-element-socket',{undoElement,key});
    // });

    // socket.on('redo-element',function({roomId,redoElement,key}){
    //     rooms[roomId][key] = redoElement;
    //     socket.to(roomId).emit('redo-element-socket',{redoElement,key});
    // });


    socket.on('join-room', function ({ roomId }) {
        try {
            console.log('[socket]', 'join room:', roomId);
            // Check if the room exists
            if (io.sockets.adapter.rooms.has(roomId)) {
                socket.join(roomId);
                socket.to(roomId).emit('user joined', socket.id);
                if (rooms[roomId]) {

                    for (let key in rooms[roomId]) {

                        const tempNewArray = rooms[roomId][key];

                        socket.emit('render-elements', { tempNewArray });

                    }
                }
                socket.emit("join-success");
            } else {
                throw new Error('Room does not exist');
            }
        } catch (_) {

            socket.emit('error', 'Could not perform requested action: ');
        }
    });


    socket.on('disconnecting', () => {
        socket.rooms.forEach(room => {
            // If no other sockets are in the room, delete the room data

            if (io.sockets.adapter.rooms.get(room)!.size === 1) {
                delete rooms[room];
                console.log(`Room ${room} data deleted.`);
            }
        });
    });

});







server.listen(process.env.PORT || 3001, () => {
    console.log(`server is listing on ${process.env.PORT || 3001}`);
})
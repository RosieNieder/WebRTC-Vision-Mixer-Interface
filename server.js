

const Socket = require("websocket").server
const http = require("http")

const server = http.createServer((req, res) => {})

server.listen(3200, () => {
    console.log("Listening on port 3200...")
})

const webSocket = new Socket({ httpServer: server })

let users = [] //holds local nodes user information

webSocket.on('request', (req) => {
    const connection = req.accept()

    connection.on('message', (message) => {
        const data = JSON.parse(message.utf8Data)
        console.log('data received:' + JSON.stringify(data.type)) 

        const user = findUser(data.username); //check if user already exists and store result

        switch(data.type) {
            case "store_user":
                if (user != null) { //if user already exists, exit early
                    return
                }
                const newUser = {
                     conn: connection,
                     username: data.username
                }

                users.push(newUser)
                console.log("user: ", newUser.username)
                break
            case "store_offer":
                if (user == null)
                    return
                user.offer = data.offer
                break
            
            case "store_candidate":
                if (user == null) {
                    return
                }
                if (user.candidates == null)
                    user.candidates = []
                
                user.candidates.push(data.candidate)
                console.log("storing candidate");
                break
            case "send_answer":
                if (user == null) {
                    return
                }

                sendData({
                    type: "answer",
                    answer: data.answer
                }, user.conn)
                break
            case "send_candidate":
                if (user == null) {
                    return
                }

                sendData({
                    type: "candidate",
                    candidate: data.candidate
                }, user.conn)
                break
            case "join_call":
                if (user == null) {
                    return
                }
                sendData({
                    type: "offer",
                    offer: user.offer
                }, connection)
                
                user.candidates.forEach(candidate => {
                    sendData({
                        type: "candidate",
                        candidate: candidate
                    }, connection)
                })
                break
            case "hang_up":
                console.log("hang-up detected, relaying to clients")
                sendData({
                    type: "hang_up"
                }, user.conn)
        }
    })

    connection.on('close', (reason, description) => {
        users.forEach(user => {
            if (user.conn == connection) {
                users.splice(users.indexOf(user), 1)
                return
            }
        })
    })
})

function sendData(data, conn) {
    conn.send(JSON.stringify(data))
    console.log("sending data: ", data.type);
}

function findUser(username) {
    for (let i = 0;i < users.length;i++) { //iterate over elements in user array to check if a username already exists
        if (users[i].username == username)
            return users[i]
    }
}

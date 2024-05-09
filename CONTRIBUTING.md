
## Installation(LOCAL SETUP)

BackEnd Installation

1. Fork the project from the github
2. Clone the project locally in your local system
```bash
  git clone "your repo url"
```
3. create a .env file and enter the mongodb cluster connection string there(We will get this string from the mongo db in the next section)
```bash
MONGO_DB_CONNECTION_STRING = mongodb+srv://####:#####@####.#####.mongodb.net/?retryWrites=true&w=majority&appName=#####
```
4.Now run the project by using 

```bash
  npm start
```

## Getting the mongoDb string from the atlas platform
1. Create an account on mongodb atlas
2. Create a cluster in it
3. Get the connection string from there and paster it on the above MONGO_DB_CONNECTION_STRING.
4. Now you can run the command to run the server

Here this link may help you : 
https://www.mongodb.com/resources/products/fundamentals/mongodb-connection-string#:~:text=How%20to%20get%20your%20MongoDB,connection%20string%20for%20your%20cluster.






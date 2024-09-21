const express = require("express");
const jwt = require('jsonwebtoken');
const JWT_SECRET = "randomsalman@123";
const app = express();
app.use(express.json());

const users = []; // In-memory user storage
const todos = {}; // In-memory todos storage per user

// Serve frontend file
app.get("/", function(req, res) {
    res.sendFile(__dirname + "/frontend/index.html");
});

// Signup route
app.post("/signup", function(req, res) {
    const username = req.body.username;
    const password = req.body.password;

    users.push({ username, password });
    todos[username] = []; // Initialize todos list for new user

    res.json({
        message: 'You are signed up'
    });
});

// Signin route
app.post("/signin", function(req, res) {
    const { username, password } = req.body;
    const foundUser = users.find(user => user.username === username && user.password === password);

    if (!foundUser) {
        return res.json({ message: "Credentials Incorrect" });
    }

    const token = jwt.sign({ username: foundUser.username }, JWT_SECRET);
    
    res.json({ token });
});

// Auth middleware for protecting routes
function auth(req, res, next) {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Access denied, no token provided" });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Invalid token" });
        }

        req.user = decoded;
        next();
    });
}

// Get current user's details
app.get("/me", auth, (req, res) => {
    const foundUser = users.find(user => user.username === req.user.username);
    res.json({ username: foundUser.username });
});

// Create new todo (with title and tasks)
app.post("/todos", auth, (req, res) => {
    const { title, tasks } = req.body;
    const userTodos = todos[req.user.username];
    
    userTodos.push({ title, tasks });
    
    res.json({ message: 'Todo created', todos: userTodos });
});

// Get all todos for the authenticated user
app.get("/todos", auth, (req, res) => {
    const userTodos = todos[req.user.username];
    res.json({ todos: userTodos });
});

// Update a todo by index
app.put("/todos/:index", auth, (req, res) => {
    const { index } = req.params;
    const { title, tasks } = req.body;
    const userTodos = todos[req.user.username];

    if (userTodos[index]) {
        userTodos[index] = { title, tasks };
        res.json({ message: "Todo updated", todos: userTodos });
    } else {
        res.status(404).json({ message: "Todo not found" });
    }
});

// Delete a todo by index
app.delete("/todos/:index", auth, (req, res) => {
    const { index } = req.params;
    const userTodos = todos[req.user.username];

    if (userTodos[index]) {
        userTodos.splice(index, 1);
        res.json({ message: "Todo deleted", todos: userTodos });
    } else {
        res.status(404).json({ message: "Todo not found" });
    }
});

// Start the server
app.listen(9000, () => {
    console.log("Server running on port 9000");
});

let express = require('express');
let cors = require('cors');
let todo = [];
let index = 0;

let app = express();

app.use(cors());
app.use(express.json());

app.get('/getAllTodo', (req, res) => {
    console.log("inside getAllTodo todos = ", todo);

    if (todo.length > 0) {
        res.json(todo);
    }
    else
        res.status(404).json({ message: "No todos found" });
})

app.get('/getTodo/:index', (req, res) => {
    let todoIndex = parseInt(req.params.index);
    console.log("getTodo todos index = ", todoIndex);


    if (todoIndex < 0 || todoIndex >= todo.length) {
        return res.status(404).json({ message: "Todo not found" });
    }

    let singleTodo = todo[todoIndex];
    res.json(singleTodo);
})

app.post('/addTodo', (req, res) => {
    let todoName = req.body.todoName;
    console.log("addTodo todoName = ", todoName);

    if (!todoName) {
        return res.status(400).json({ message: "Todo name is required to add new todo" });
    }
    todo.push([index++, todoName.trim()]);

    res.json({ message: "Successfully added", todoId: index - 1 });
})

app.post('/deleteTodo/:index', (req, res) => {
    let todoIndex = parseInt(req.params.index);
    console.log("deleteTodo index = ", todoIndex);

    if (todoIndex < 0 || todoIndex >= todo.length) {
        return res.status(404).json({ message: "Todo not found at this index" });
    }
    const deletedTodo = todo.splice(todoIndex, 1);

    res.json({
        message: "Todo deleted successfully",
        deletedTodo: deletedTodo,
        remainingTodos: todo.length
    });
})

app.listen(4000, () => {
    console.log(`Server listening at http://localhost: 4000`);
});
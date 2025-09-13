// ===== CONFIGURATION =====
const API_BASE_URL = 'http://localhost:4000';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// ===== DOM ELEMENTS =====
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const loadBtn = document.getElementById('loadBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const loading = document.getElementById('loading');
const toast = document.getElementById('toast');
const todoCount = document.getElementById('todoCount');
const charCount = document.getElementById('charCount');

// ===== STATE MANAGEMENT =====
let todos = [];
let isLoading = false;

// ===== UTILITY FUNCTIONS =====
const showLoading = () => {
    loading.classList.add('show');
    isLoading = true;
};

const hideLoading = () => {
    loading.classList.remove('show');
    isLoading = false;
};

const showToast = (message, type = 'success') => {
    toast.className = `toast ${type}`;
    toast.querySelector('.toast-message').textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
};

const updateStats = () => {
    const count = todos.length;
    todoCount.textContent = count === 1 ? '1 task' : `${count} tasks`;
};

const updateCharCount = () => {
    const count = todoInput.value.length;
    charCount.textContent = `${count}/100`;
    charCount.style.color = count > 80 ? '#ff6b6b' : 'rgba(255, 255, 255, 0.7)';
};

// ===== API FUNCTIONS WITH RETRY LOGIC =====
const apiRequest = async (url, options = {}, retries = MAX_RETRIES) => {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return apiRequest(url, options, retries - 1);
        }
        throw error;
    }
};

const loadTodos = async () => {
    if (isLoading) return;

    showLoading();
    try {
        const response = await apiRequest(`${API_BASE_URL}/getAllTodo`);
        todos = response || [];
        renderTodos();
        showToast(`Loaded ${todos.length} todos successfully!`);
    } catch (error) {
        console.error('Error loading todos:', error);
        showToast('Failed to load todos. Check your connection.', 'error');
        todos = [];
        renderTodos();
    } finally {
        hideLoading();
    }
};

const addTodo = async (todoName) => {
    if (isLoading) return;

    showLoading();
    try {
        const response = await apiRequest(`${API_BASE_URL}/addTodo`, {
            method: 'POST',
            body: JSON.stringify({ todoName })
        });

        await loadTodos(); // Refresh the list
        showToast('Todo added successfully! 🎉');
        todoInput.value = '';
        updateCharCount();
    } catch (error) {
        console.error('Error adding todo:', error);
        showToast('Failed to add todo. Please try again.', 'error');
    } finally {
        hideLoading();
    }
};

const deleteTodo = async (index) => {
    if (isLoading) return;

    showLoading();
    try {
        const response = await apiRequest(`${API_BASE_URL}/deleteTodo/${index}`, {
            method: 'POST'
        });

        await loadTodos(); // Refresh the list
        showToast('Todo deleted successfully! 🗑️');
    } catch (error) {
        console.error('Error deleting todo:', error);
        showToast('Failed to delete todo. Please try again.', 'error');
    } finally {
        hideLoading();
    }
};

const getTodo = async (index) => {
    if (isLoading) return;

    showLoading();
    try {
        const response = await apiRequest(`${API_BASE_URL}/getTodo/${index}`);
        showToast(`Todo ${index}: "${response[20]}"`, 'success');
    } catch (error) {
        console.error('Error getting todo:', error);
        showToast('Todo not found.', 'error');
    } finally {
        hideLoading();
    }
};

// ===== UI FUNCTIONS =====
const renderTodos = () => {
    updateStats();

    if (todos.length === 0) {
        emptyState.style.display = 'block';
        todoList.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    todoList.style.display = 'flex';

    todoList.innerHTML = '';

    todos.forEach((todo, index) => {
        const todoItem = createTodoElement(todo, index);
        todoList.appendChild(todoItem);
    });
};

const createTodoElement = (todo, index) => {
    const todoItem = document.createElement('div');
    todoItem.className = 'todo-item';

    todoItem.innerHTML = `
        <div class="todo-content">
            <div class="todo-id">${todo}</div>
            <div class="todo-text">${escapeHtml(todo[20])}</div>
        </div>
        <div class="todo-actions">
            <button class="btn btn-secondary btn-small" onclick="getTodo(${index})" title="View Todo">
                <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-danger btn-small" onclick="confirmDelete(${index})" title="Delete Todo">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    return todoItem;
};

const confirmDelete = (index) => {
    if (confirm('Are you sure you want to delete this todo?')) {
        // Add fade out animation
        const todoItem = todoList.children[index];
        todoItem.classList.add('fade-out');

        setTimeout(() => {
            deleteTodo(index);
        }, 300);
    }
};

const clearAllTodos = () => {
    if (todos.length === 0) {
        showToast('No todos to clear!', 'error');
        return;
    }

    if (confirm(`Are you sure you want to delete all ${todos.length} todos?`)) {
        // Add fade out animation to all items
        Array.from(todoList.children).forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('fade-out');
            }, index * 100);
        });

        // Clear todos after animation
        setTimeout(async () => {
            const deletePromises = todos.map((_, index) => deleteTodo(index));
            await Promise.all(deletePromises);
        }, todos.length * 100 + 300);
    }
};

const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

const validateInput = (input) => {
    if (!input.trim()) {
        showToast('Please enter a todo!', 'error');
        todoInput.classList.add('shake');
        setTimeout(() => todoInput.classList.remove('shake'), 500);
        return false;
    }

    if (input.length > 100) {
        showToast('Todo is too long! Maximum 100 characters.', 'error');
        return false;
    }

    return true;
};

// ===== EVENT LISTENERS =====
addBtn.addEventListener('click', () => {
    const todoName = todoInput.value.trim();
    if (validateInput(todoName)) {
        addTodo(todoName);
    }
});

todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const todoName = todoInput.value.trim();
        if (validateInput(todoName)) {
            addTodo(todoName);
        }
    }
});

todoInput.addEventListener('input', updateCharCount);

loadBtn.addEventListener('click', loadTodos);

clearAllBtn.addEventListener('click', clearAllTodos);

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + R to refresh
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        loadTodos();
    }

    // Escape to clear input
    if (e.key === 'Escape') {
        todoInput.value = '';
        updateCharCount();
        todoInput.blur();
    }
});

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    updateCharCount();
    loadTodos();

    // Add welcome message
    setTimeout(() => {
        showToast('Welcome to Epic Todo List! 🚀', 'success');
    }, 1000);
});

// ===== ERROR HANDLING =====
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    showToast('Something went wrong! Please refresh the page.', 'error');
});

// ===== ONLINE/OFFLINE STATUS =====
window.addEventListener('online', () => {
    showToast('Connection restored! 🌐', 'success');
    loadTodos();
});

window.addEventListener('offline', () => {
    showToast('You are offline! Some features may not work.', 'error');
});

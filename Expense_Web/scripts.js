// API Base URL
const API_URL = 'http://localhost:8080/api/expenses';

// DOM Elements
const expenseForm = document.getElementById('expense-form');
const expenseList = document.getElementById('expense-list');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');
const dateFilter = document.getElementById('date-filter');
const totalAmountEl = document.getElementById('total-amount');
const monthAmountEl = document.getElementById('month-amount');
const todayAmountEl = document.getElementById('today-amount');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const closeBtn = document.querySelector('.close');

// Set default date to today
document.getElementById('date').valueAsDate = new Date();

// State
let expenses = [];

// Event Listeners
document.addEventListener('DOMContentLoaded', fetchExpenses);
expenseForm.addEventListener('submit', addExpense);
editForm.addEventListener('submit', updateExpense);
searchInput.addEventListener('input', filterExpenses);
dateFilter.addEventListener('change', filterExpenses);
closeBtn.addEventListener('click', () => editModal.style.display = 'none');
window.addEventListener('click', (e) => {
    if (e.target === editModal) {
        editModal.style.display = 'none';
    }
});

// Fetch all expenses from API
async function fetchExpenses() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Failed to fetch expenses');
        }
        expenses = await response.json();
        updateDashboard();
        renderExpenses();
    } catch (error) {
        console.error('Error fetching expenses:', error);
        showNotification('Failed to load expenses', 'error');
    }
}

// Add a new expense
async function addExpense(e) {
    e.preventDefault();
    
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const date = document.getElementById('date').value;
    
    const newExpense = {
        description,
        amount,
        date
    };
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newExpense)
        });
        
        if (!response.ok) {
            throw new Error('Failed to add expense');
        }
        
        const addedExpense = await response.json();
        expenses.push(addedExpense);
        updateDashboard();
        renderExpenses();
        expenseForm.reset();
        document.getElementById('date').valueAsDate = new Date();
        showNotification('Expense added successfully', 'success');
    } catch (error) {
        console.error('Error adding expense:', error);
        showNotification('Failed to add expense', 'error');
    }
}

// Update an existing expense
async function updateExpense(e) {
    e.preventDefault();
    
    const id = document.getElementById('edit-id').value;
    const description = document.getElementById('edit-description').value;
    const amount = parseFloat(document.getElementById('edit-amount').value);
    const date = document.getElementById('edit-date').value;
    
    const updatedExpense = {
        description,
        amount,
        date
    };
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedExpense)
        });
        
        if (!response.ok) {
            throw new Error('Failed to update expense');
        }
        
        const updated = await response.json();
        
        // Update the expense in the local array
        const index = expenses.findIndex(exp => exp.id === Number(id));
        if (index !== -1) {
            expenses[index] = updated;
        }
        
        updateDashboard();
        renderExpenses();
        editModal.style.display = 'none';
        showNotification('Expense updated successfully', 'success');
    } catch (error) {
        console.error('Error updating expense:', error);
        showNotification('Failed to update expense', 'error');
    }
}

// Delete an expense
async function deleteExpense(id) {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete expense');
        }
        
        // Remove the expense from the local array
        expenses = expenses.filter(expense => expense.id !== id);
        updateDashboard();
        renderExpenses();
        showNotification('Expense deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting expense:', error);
        showNotification('Failed to delete expense', 'error');
    }
}

// Open edit modal with expense data
function openEditModal(expense) {
    document.getElementById('edit-id').value = expense.id;
    document.getElementById('edit-description').value = expense.description;
    document.getElementById('edit-amount').value = expense.amount;
    document.getElementById('edit-date').value = expense.date;
    
    editModal.style.display = 'block';
}

// Render expenses to the DOM
function renderExpenses() {
    // Filter expenses based on search and date filter
    const searchTerm = searchInput.value.toLowerCase();
    const filterValue = dateFilter.value;
    
    let filteredExpenses = expenses.filter(expense => 
        expense.description.toLowerCase().includes(searchTerm)
    );
    
    // Apply date filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (filterValue === 'today') {
        filteredExpenses = filteredExpenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.toDateString() === today.toDateString();
        });
    } else if (filterValue === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        filteredExpenses = filteredExpenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= weekAgo;
        });
    } else if (filterValue === 'month') {
        filteredExpenses = filteredExpenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === today.getMonth() && 
                   expenseDate.getFullYear() === today.getFullYear();
        });
    }
    
    // Sort expenses by date (newest first)
    filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Clear current list
    expenseList.innerHTML = '';
    
    // Show empty state or render expenses
    if (filteredExpenses.length === 0) {
        expenseList.appendChild(emptyState);
    } else {
        filteredExpenses.forEach(expense => {
            const expenseEl = document.createElement('div');
            expenseEl.classList.add('expense-item');
            
            const formattedDate = new Date(expense.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            expenseEl.innerHTML = `
                <div class="expense-details">
                    <span class="expense-description">${expense.description}</span>
                    <span class="expense-date">${formattedDate}</span>
                </div>
                <span class="expense-amount">₹${expense.amount.toFixed(2)}</span>
                <div class="expense-actions">
                    <button class="edit-btn" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            const editBtn = expenseEl.querySelector('.edit-btn');
            const deleteBtn = expenseEl.querySelector('.delete-btn');
            
            editBtn.addEventListener('click', () => openEditModal(expense));
            deleteBtn.addEventListener('click', () => deleteExpense(expense.id));
            
            expenseList.appendChild(expenseEl);
        });
    }
}

// Update dashboard summary
function updateDashboard() {
    const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.toDateString() === today.toDateString();
    });
    
    const todayTotal = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const monthExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === today.getMonth() && 
               expenseDate.getFullYear() === today.getFullYear();
    });
    
    const monthTotal = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    totalAmountEl.textContent = `₹${total.toFixed(2)}`;
    monthAmountEl.textContent = `₹${monthTotal.toFixed(2)}`;
    todayAmountEl.textContent = `₹${todayTotal.toFixed(2)}`;
}

// Filter expenses based on search and date filter
function filterExpenses() {
    renderExpenses();
}

// Show notification
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '12px 20px';
    notification.style.borderRadius = '4px';
    notification.style.color = 'white';
    notification.style.fontWeight = '500';
    notification.style.zIndex = '1000';
    notification.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    
    if (type === 'success') {
        notification.style.backgroundColor = '#34a853';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#ea4335';
    }
    
    // Add to body
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}
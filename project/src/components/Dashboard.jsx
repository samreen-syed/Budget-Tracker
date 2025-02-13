import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [salary, setSalary] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '' });
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/budget/data', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.salary) {
        setSalary(response.data.salary);
        setShowExpenseForm(true);
      }
      setExpenses(response.data.expenses || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleSalarySubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/budget/salary', 
        { salary: parseFloat(salary) },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setShowExpenseForm(true);
    } catch (error) {
      console.error('Error setting salary:', error);
    }
  };

  const addExpense = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/budget/expense',
        newExpense,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      fetchUserData();
      setNewExpense({ description: '', amount: '' });
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const totalExpenses = expenses.reduce((acc, exp) => acc + parseFloat(exp.amount), 0);
  const balance = parseFloat(salary) - totalExpenses;

  return (
    <div className="dashboard">
      <div className="header">
        <h1>Budget Tracker</h1>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      {!showExpenseForm && (
        <div className="salary-section">
          <h2>Enter Your Salary</h2>
          <form onSubmit={handleSalarySubmit}>
            <input
              type="number"
              placeholder="Enter your salary"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              required
            />
            <button type="submit">Set Salary</button>
          </form>
        </div>
      )}

      {showExpenseForm && (
        <>
          <div className="summary">
            <div className="summary-card">
              <h3>Monthly Salary</h3>
              <p>₹{salary}</p>
            </div>
            <div className="summary-card">
              <h3>Total Expenses</h3>
              <p>₹{totalExpenses}</p>
            </div>
            <div className="summary-card">
              <h3>Balance</h3>
              <p className={balance < 0 ? 'negative-balance' : ''}>₹{balance}</p>
            </div>
          </div>

          <div className="expense-form">
            <h3>Add New Expense</h3>
            <form onSubmit={addExpense}>
              <input
                type="text"
                placeholder="Description"
                value={newExpense.description}
                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                required
              />
              <input
                type="number"
                placeholder="Amount"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                required
              />
              <button type="submit">Add Expense</button>
            </form>
          </div>

          <div className="expense-list">
            <h3>Your Expenses</h3>
            {expenses.length === 0 ? (
              <p className="no-expenses">No expenses added yet</p>
            ) : (
              expenses.map((expense) => (
                <div key={expense._id} className="expense-item">
                  <p>{expense.description}</p>
                  <p>₹{expense.amount}</p>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;

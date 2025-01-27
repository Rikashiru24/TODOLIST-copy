document.addEventListener('DOMContentLoaded', () => {
  const inputBox = document.querySelector('.inputBox');
  const datePicker = document.querySelector('.datePicker');
  const addButton = document.querySelector('.addButton');
  const taskList = document.getElementById('taskList');

  // Format date for MySQL
  const formatDateForMySQL = (isoDate) => {
    return isoDate.replace('T', ' ').replace('Z', '');
  };

  // Fetch tasks from the backend and display them
  function loadTasksFromDatabase() {
    fetch('http://localhost:3000/tasks')
      .then((response) => response.json())
      .then((tasks) => {
        taskList.innerHTML = ''; // Clear the list before loading
        tasks.forEach((task) => {
          const listItem = createTaskItem(
            task.task,
            new Date(task.due_date).toLocaleString(),
            new Date(task.added_date).toLocaleString(),
            task.id // Pass the unique task ID
          );
          taskList.appendChild(listItem);
        });
      })
      .catch((error) => {
        console.error('Error loading tasks:', error);
      });
  }

  // Create a new task item
  function createTaskItem(taskText, dueDate, addedDate, taskId) {
    const listItem = document.createElement('li');
    listItem.classList.add('taskItem');
    listItem.setAttribute('data-id', taskId); // Add the task ID as a data attribute

    const taskNode = document.createElement('span');
    taskNode.textContent = taskText;
    taskNode.classList.add('taskText');
    taskNode.contentEditable = false;

    const dateNode = document.createElement('span');
    dateNode.textContent = `Added on: ${addedDate}`;
    dateNode.classList.add('taskDate');

    const dueDateNode = document.createElement('span');
    dueDateNode.textContent = `Due: ${dueDate}`;
    dueDateNode.classList.add('taskDueDate');

    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.classList.add('editButton');

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.classList.add('deleteButton');
    deleteButton.onclick = () => showDeleteConfirmation(deleteButton, listItem);

    editButton.addEventListener('click', () => {
      if (editButton.textContent === 'Edit') {
        taskNode.contentEditable = 'true';
        taskNode.focus();
        deleteButton.style.display = 'none';

        const dueDateInput = document.createElement('input');
        dueDateInput.type = 'datetime-local';
        const currentDueDate = new Date(dueDate).toISOString().slice(0, 16);
        dueDateInput.value = currentDueDate || '';
        dueDateNode.textContent = '';
        dueDateNode.appendChild(dueDateInput);

        editButton.textContent = 'Done';

        taskNode.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            finalizeEdit(taskNode, dueDateInput, editButton, deleteButton, dueDateNode, taskId);
          }
        });
      } else {
        const dueDateInput = dueDateNode.querySelector('input');
        finalizeEdit(taskNode, dueDateInput, editButton, deleteButton, dueDateNode, taskId);
      }
    });

    listItem.appendChild(taskNode);
    listItem.appendChild(dateNode);
    listItem.appendChild(dueDateNode);
    listItem.appendChild(editButton);
    listItem.appendChild(deleteButton);

    return listItem;
  }

  // Finalize the task edit
  function finalizeEdit(taskNode, dueDateInput, editButton, deleteButton, dueDateNode, taskId) {
    taskNode.contentEditable = 'false';
    deleteButton.style.display = 'inline-block';
  
    const updatedTaskText = taskNode.textContent.trim();
    const updatedDueDate = dueDateInput.value;
  
    if (!updatedTaskText || !updatedDueDate) {
      console.error('Task text or due date is missing');
      return;
    }
  
    // Update the displayed due date
    dueDateNode.textContent = updatedDueDate
      ? `Due: ${new Date(updatedDueDate).toLocaleString()}`
      : 'Due: Not Set';
  
    editButton.textContent = 'Edit';
  
    // Send the updated task to the backend
    console.log('Task ID:', taskId);  // Check if taskId is correct
    fetch(`http://localhost:3000/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task: updatedTaskText,
        due_date: formatDateForMySQL(new Date(updatedDueDate).toISOString()),
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to update task');
        }
        console.log('Task updated successfully');
        loadTasksFromDatabase();  // Reload tasks after update
      })
      .catch((error) => {
        console.error('Error updating task:', error);
      });
  }
  
  // Add a new task
// Add a new task
function addTask() {
  const taskText = inputBox.value.trim();
  const dueDate = datePicker.value;

  if (!taskText || !dueDate) {
    if (!taskText) inputBox.placeholder = 'Kupal! Lagyan mo muna to!';
    if (!dueDate) datePicker.classList.add('error');
    return;
  }

  const currentDate = new Date();
  const addedDate = `${currentDate.toLocaleDateString()} ${currentDate.toLocaleTimeString()}`;
  const listItem = createTaskItem(taskText, new Date(dueDate).toLocaleString(), addedDate);

  taskList.appendChild(listItem);
  inputBox.value = '';
  datePicker.value = '';

  // Send the new task to the backend
  fetch('http://localhost:3000/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      task: taskText,
      due_date: formatDateForMySQL(new Date(dueDate).toISOString()),
      added_date: formatDateForMySQL(new Date().toISOString()),
    }),
  })
    .then((response) => response.json())  // Parse the response as JSON
    .then((data) => {
      console.log('Task added:', data);
      loadTasksFromDatabase(); // Reload tasks from the database after adding
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}


  // Show delete confirmation
  function showDeleteConfirmation(deleteButton, listItem) {
    if (deleteButton.parentNode.querySelector('.confirmButton') || deleteButton.parentNode.querySelector('.cancelButton')) {
      return;
    }

    deleteButton.textContent = 'Pagsure ba?';
    deleteButton.classList.add('confirmDelete');

    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Yes';
    confirmButton.classList.add('confirmButton');
    confirmButton.onclick = () => {
      const taskId = listItem.getAttribute('data-id'); // Get the task ID

      // Send DELETE request to the backend
      fetch(`http://localhost:3000/tasks/${taskId}`, {
        method: 'DELETE',
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error('Failed to delete task');
          }
          console.log('Task deleted successfully');
          listItem.remove(); // Remove the task from the DOM
        })
        .catch((error) => {
          console.error('Error deleting task:', error);
        });
    };

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'No';
    cancelButton.classList.add('cancelButton');
    cancelButton.onclick = () => {
      deleteButton.textContent = 'Delete';
      deleteButton.classList.remove('confirmDelete');
      confirmButton.remove();
      cancelButton.remove();
    };

    deleteButton.parentNode.appendChild(confirmButton);
    deleteButton.parentNode.appendChild(cancelButton);
  }

  // Event listeners
  addButton.addEventListener('click', addTask);

  inputBox.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
  });

  datePicker.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
  });

  loadTasksFromDatabase(); // Fetch tasks from the backend on page load
});

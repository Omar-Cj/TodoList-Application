document.addEventListener("DOMContentLoaded", function () {
  const addformData = document.querySelector("#addform-data");
  let editformData = document.querySelector("#editform-data");
  const taskNameField = document.querySelector("#taskname");
  const priorityField = document.querySelector("#priority");
  const descriptionField = document.querySelector("#description");
  const searchInput = document.querySelector("#search-input");
  const registrationForm = document.querySelector("#registrationForm");
  const loginForm = document.querySelector('#loginForm');
  // const registrationContainer = document.querySelector('.registrationContainer');
  const loginCloseButton = document.querySelector('#close-login');
  const todolistContainer = document.querySelector('.todo-list');
  const logoutButton = document.getElementById("logout-button");
  let tableData = document.querySelector("#table-body");

  // Check if user is logged in
  const token = localStorage.getItem('token');
  if (token) {
    todolistContainer.style.display = 'block';
    logoutButton.style.display = 'block';
    getTasks();
  } else {
    todolistContainer.style.display = 'none';
    logoutButton.style.display = 'none';
  }

  // Logout functionality
  logoutButton.addEventListener("click", () => {
    localStorage.removeItem("token");
    location.reload();
  });

  registrationForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const userName = document.querySelector("#username").value;
    const email = document.querySelector("#email").value;
    const password = document.querySelector("#password").value;

    const url = "http://127.0.0.1:5000/register";

    let data = JSON.stringify({
      username: userName,
      email: email,
      password: password,
    });

    axios.post(url, data, {
        headers: {
            "Content-Type": "application/json"
        }
    })
    .then(response => {
        if (response.status === 201) {
            document.getElementById("message").innerText = response.data.message;
            document.getElementById("registrationForm").reset();
        } else {
            document.getElementById("message").innerText = response.data.message;
            throw new Error("Registration failed.");
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('message').innerText = 'Registration failed.';
    });
    
  });

  loginForm.addEventListener('submit', function(event) {
     event.preventDefault()
      
     const loginEmail = document.querySelector('#loginEmail').value;
     const loginPassword = document.querySelector('#loginPassword').value;
     const url = 'http://127.0.0.1:5000/login';

     let data = JSON.stringify({
      email: loginEmail,
      password: loginPassword
     })

     axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json'
      }
     })
     .then(response => {
        if(response.status === 200) {
          window.localStorage.setItem('token', response.data.access_token);
          todolistContainer.style.display = 'block';
          logoutButton.style.display = 'block';
          loginCloseButton.click();

          getTasks();
        }
     })
     .catch(error => {
       console.error('Error', error);
       document.getElementById('message-login').innerText = 'Login failed.';
     })

  });
  

  addformData.addEventListener("submit", addTasks);

  async function addTasks(event) {
    event.preventDefault();

    if (taskNameField.value === "" || priorityField.value === "" || descriptionField.value === "") {
      alert("please fill in the information");
    } else {
      const url = 'http://127.0.0.1:5000/tasks';
      const token = localStorage.getItem('token');

      let data = JSON.stringify({
        task_name: taskNameField.value,
        priority: priorityField.value,
        status: 'pending',
        description: descriptionField.value
      })

      axios.post(url, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        if(response.status === 201) {

          let btnClose = document.querySelector('.close-add');
          btnClose.click();
          getTasks(); // Refresh task list immediately after adding
          addformData.reset();
        }
      })
      .catch(error => {
        console.error('Error', error);
      });
    }
  }

  function getTasks() {
    const url = 'http://127.0.0.1:5000/tasks';
    const token = localStorage.getItem('token');
    
    axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      let tasks = response.data;
      tableData.innerHTML = "";

      for (const task of tasks) {
        let tableRaw = document.createElement("tr");
        let tableCell1 = document.createElement("td");
        let tableCell2 = document.createElement("td");
        let tableCell3 = document.createElement("td");
        let tableCell4 = document.createElement("td");
        let tableCell5 = document.createElement("td");

        tableRaw.classList.add(`${Date.now()}`);

        tableCell1.textContent = task.id;
        tableCell2.textContent = task.task_name;
        tableCell3.textContent = task.priority;
        tableCell4.textContent = task.status;

        let editButton = document.createElement("a");
        editButton.classList.add("btn", "btn-warning", "edit-btn");
        editButton.setAttribute("data-bs-toggle", "modal");
        editButton.setAttribute("data-bs-target", "#editTaskModal");

        editButton.onclick = () => {
          editTask(task.id);
        };

        let editIcon = document.createElement("i");
        editIcon.classList.add("fa", "fa-pencil");
        editIcon.style.color = "#fff";

        let deleteButton = document.createElement("a");
        deleteButton.classList.add("btn", "btn-danger");
        deleteButton.style.marginLeft = "1rem";

        deleteButton.onclick = () => {
          deleteTask(task.id);
        };

        let deleteIcon = document.createElement("i");
        deleteIcon.classList.add("fa", "fa-trash");
        deleteIcon.style.color = "#fff";

        

        deleteButton.appendChild(deleteIcon);
        editButton.appendChild(editIcon);
        tableCell5.appendChild(editButton);
        tableCell5.appendChild(deleteButton);

        tableRaw.append(
          tableCell1,
          tableCell2,
          tableCell3,
          tableCell4,
          tableCell5
        );
        tableData.appendChild(tableRaw);
      }
    })
    .catch(error => {
      console.error('Error', error);
    });
  }

  async function editTask(id) {
    const url = `http://127.0.0.1:5000/tasks/${id}`;
    const token = localStorage.getItem('token');

    // Fetch task details to populate the edit form
    axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      const task = response.data;
      document.querySelector("#edittaskname").value = task.task_name;
      document.querySelector("#editpriority").value = task.priority;
      document.querySelector("#editdescription").value = task.description;
      document.querySelector("#editStatus").value = task.status;
    })
    .catch(error => console.error('Error', error));

    // Remove previous submit event listener if any
    (function clearPreviousListeners() {
      const newEditForm = editformData.cloneNode(true);
      editformData.parentNode.replaceChild(newEditForm, editformData);
      editformData = newEditForm;
    })();

    // Add submit event listener for updating the task
    editformData.addEventListener("submit", function (event) {
      event.preventDefault();

      const url = `http://127.0.0.1:5000/tasks/${id}`;
      const token = localStorage.getItem('token');
      const data = JSON.stringify({
        task_name: document.querySelector("#edittaskname").value,
        priority: document.querySelector("#editpriority").value,
        description: document.querySelector("#editdescription").value,
        status: document.querySelector("#editStatus").value
      });

      axios.put(url, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        if (response.status === 200) {
          document.querySelector('.edit-close').click();
          getTasks(); // Refresh tasks
        }
      })
      .catch(error => console.error('Error', error));
    });
  }

  async function deleteTask(id) {
    const url = `http://127.0.0.1:5000/tasks/${id}`;
    const token = localStorage.getItem('token');

    axios.delete(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => getTasks()) // Refresh tasks after deletion
    .catch(error => console.error('Error', error));
  }

  function taskStatus(id) {
    const url = `http://127.0.0.1:5000/tasks/${id}`;
    const token = localStorage.getItem('token');

    axios.put(url, {
      status: "complete"
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => getTasks()) // Refresh tasks after status change
    .catch(error => console.error('Error', error));
  }

  getTasks();

  searchInput.addEventListener("input", function () {
    const searchValue = searchInput.value.toLowerCase();

    let rows = tableData.getElementsByTagName("tr");

    for (let i = 0; i < rows.length; i++) {
      let cells = rows[i].getElementsByTagName("td");
      let rowContainsSearchValue = false;

      for (let j = 0; j < cells.length; j++) {
        let cellText = cells[j].textContent.toLowerCase();
        if (cellText.indexOf(searchValue) > -1) {
          rowContainsSearchValue = true;
          break;
        }
      }

      rows[i].style.display = rowContainsSearchValue ? "" : "none";
    }
  });
});

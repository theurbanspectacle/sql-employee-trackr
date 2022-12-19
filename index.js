const mysql = require('mysql2');
const inquirer = require('inquirer');
const cTable = require('console.table');

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

// create the connection, specify bluebird as Promise
const connection =  mysql.createConnection({
    host:'localhost', 
    user: 'root', 
    database: 'employee_tracker',
    password: process.env.SQL_PASSWORD,
});

const handleError = (error) => {
    console.error('The app encountered an error', error);
};

const viewDepartments = () => {
    connection.promise().query("SELECT * FROM department;")
    .then(([rows]) => {
        if (!rows.length) {
            console.log('No results');
        } else {
            console.table(rows.map(item => {
                return {
                    ID: item.id,
                    Name: item.name,
                };
            }));
        }

        mainMenu();
    })
    .catch(handleError);
};

const viewRoles = () => {
    connection.promise().query("SELECT * FROM role LEFT JOIN department ON (role.department_id = department.id);")
    .then(([rows]) => {
        if (!rows.length) {
            console.log('No results');
        } else {
            console.table(rows.map(item => {
                return {
                    ID: item.id,
                    Title: item.title,
                    Salary: currencyFormatter.format(item.salary),
                    'Department name': item.name,
                };
            }));
        }

        mainMenu();
    })
    .catch(handleError);
};

const viewEmployees = () => {
    connection.promise().query("SELECT employee.id, employee.first_name, employee.last_name, role.title, role.salary, department.name AS department_name, m.first_name AS manager_first_name, m.last_name AS manager_last_name FROM employee LEFT JOIN role ON (employee.role_id = role.id) LEFT JOIN department ON (role.department_id = department.id) LEFT JOIN employee m ON (employee.manager_id = m.id);")
    .then(([rows]) => {
        console.log(rows);

        if (!rows.length) {
            console.log('No results');
        } else {
            console.table(rows.map(item => {
                return {
                    ID: item.id,
                    'First name': item.first_name,
                    'Last name': item.last_name,
                    Title: item.title,
                    Salary: currencyFormatter.format(item.salary),
                    'Department name': item.department_name,
                    'Manager name': item.manager_first_name ? `${item.manager_first_name} ${item.manager_last_name}` : 'None',
                };
            }));
        }

        mainMenu();
    })
    .catch(handleError);
};

const addDepartment = () => {
    inquirer.prompt([{
        message: 'Department name?',
        name: 'name',
	}]).then(data => {
        connection.promise().query(`INSERT INTO department (name) VALUES ("${data.name}");`)
        .then(() => {
            mainMenu();
        })
        .catch(handleError);
    })
    .catch(handleError);
};

const addRole = () => {
    connection.promise().query("SELECT * FROM department;")
    .then(([rows]) => {
        inquirer.prompt([{
            message: 'Role title?',
            name: 'title',
        },
        {
            message: 'Salary (XXXX.XX)?',
            name: 'salary',
        },
        {
            message: 'Department?',
            type: 'list',
            name: 'department',
            choices: rows.map(item => {
                return {
                    name: item.name,
                    value: item.id,
                }
            })
        }]).then(data => {
            connection.promise().query(`INSERT INTO role (title, salary, department_id) VALUES ("${data.title}", ${data.salary}, ${data.department});`)
            .then(() => {
                mainMenu();
            })
            .catch(handleError);
        })
        .catch(handleError);
    })
    .catch(handleError);
};

const addEmployee = () => {
    connection.promise().query("SELECT * FROM employee;")
        .then(([employees]) => {
            connection.promise().query("SELECT * FROM role;")
            .then(([roles]) => {
                inquirer.prompt([{
                    message: 'First name?',
                    name: 'firstName',
                },
                {
                    message: 'Last name?',
                    name: 'lastName',
                },
                {
                    message: 'Role?',
                    type: 'list',
                    name: 'role',
                    choices: roles.map(item => {
                        return {
                            name: item.title,
                            value: item.id,
                        };
                    }),
                },{
                    message: 'Manager?',
                    type: 'list',
                    name: 'manager',
                    choices: [{name: 'None', value: 'NULL'}, ...employees.map(item => {
                        return {
                            name: item.first_name + " " + item.last_name,
                            value: item.id,
                        };
                    })],
                }]).then(data => {
                    connection.promise().query(`INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ("${data.firstName}", "${data.lastName}", ${data.role}, ${data.manager});`)
                    .then(() => {
                        mainMenu();
                    })
                    .catch(handleError);
                })
                .catch(handleError);
            })
            .catch(handleError);
        })
        .catch(handleError);
};

const updateEmployeeRole = () => {
    connection.promise().query("SELECT * FROM employee;")
        .then(([employees]) => {
            connection.promise().query("SELECT * FROM role;")
            .then(([roles]) => {
                inquirer.prompt([{
                    message: 'Which employee to update?',
                    type: 'list',
                    name: 'employee',
                    choices: employees.map(item => {
                        return {
                            name: item.first_name + " " + item.last_name,
                            value: item.id,
                        };
                    }),
                },{
                    message: 'New role?',
                    type: 'list',
                    name: 'role',
                    choices: roles.map(item => {
                        return {
                            name: item.title,
                            value: item.id,
                        };
                    }),
                }]).then(data => {
                    connection.promise().query(`UPDATE employee SET role_id = ${data.role} WHERE id = ${data.employee};`)
                    .then(() => {
                        mainMenu();
                    })
                    .catch(handleError);
                })
                .catch(handleError);
            })
            .catch(handleError);
        })
        .catch(handleError);
};


const exit = () => {
    connection.end();
};

const mainMenu = () => {
    const choices = [
        'View all departments',
        'View all roles',
        'View all employees',
        'Add a department',
        'Add a role',
        'Add an employee',
        'Update employee role',
        'Exit',
    ];

    inquirer.prompt([{
        message: 'What would you like to do?',
        name: 'whatDo',
        type: 'list',
        choices: choices,
	}]).then(data => {
        switch (data.whatDo) {
            case choices[0]:
                viewDepartments();
                break;
            case choices[1]:
                viewRoles();
                break;
            case choices[2]:
                viewEmployees();
                break;
            case choices[3]:
                addDepartment();
                break;
            case choices[4]:
                addRole();
                break;
            case choices[5]:
                addEmployee();
                break;
            case choices[6]:
                updateEmployeeRole();
                break;
            case choices[7]:
            default:
                exit();
                break;
        }
    }).catch(handleError); 
};

console.log('Employee manager');
mainMenu();
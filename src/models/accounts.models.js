const dbPool = require("../db");
const config = require("config");

async function getUserById(id) {
    const [rows] = await dbPool.query(`SELECT * 
                                         FROM accounts
                                         WHERE id = "${id}"`);
    return [rows];
}

async function getUserByUsername(username) {
    const [rows] = await dbPool.query(`SELECT * 
                                         FROM accounts
                                         WHERE username = "${username}"`);
    return [rows];
}

async function getUserByEmail(email) {
    const [rows] = await dbPool.query(`SELECT * 
                                         FROM accounts
                                         WHERE email = "${email}"`);
    return [rows];
}

async function createUser(username, hashPassword, fullname, date_of_birth, course_class, email) {
    await dbPool.query(`INSERT INTO accounts(username, password, fullname, date_of_birth, course_class, email, role_id)
                            VALUES("${username}", "${hashPassword}", "${fullname}", ${date_of_birth}, "${course_class}", "${email}", 2)`);
}

async function updatePassword(id, new_password) {
    await dbPool.query(`UPDATE accounts
                            SET password = "${new_password}"
                            WHERE id = ${id}`);
}

async function getAllStudent(offset, limit) {
    const [rows] = await dbPool.query(`SELECT username, fullname, date_of_birth, course_class, email
                                        FROM accounts
                                        WHERE role_id = 2
                                        LIMIT ${limit}
                                        OFFSET ${offset}`);
    return [rows];
}

async function getAllAdmin(offset, limit) {
    const [rows] = await dbPool.query(`SELECT username, fullname, date_of_birth, course_class, email, role_id
                                        FROM accounts
                                        WHERE role_id = 1 OR role_id = 3
                                        LIMIT ${limit}
                                        OFFSET ${offset}`);
    return [rows];
}

async function updateInformation(id, fullname, date_of_birth, email) {
    await dbPool.query(`UPDATE accounts
                            SET fullname = "${fullname}",
                                date_of_birth = ${date_of_birth},
                                email = "${email}"
                            WHERE id = ${id}`);
}

async function deleteUserById(id) {
    await dbPool.query(`DELETE FROM accounts
                            WHERE id = ${id}`);
}

async function changeRole(id) {
    await dbPool.query(`UPDATE accounts
                            SET role_id = 1
                            WHERE id = ${id}`);
}

async function getRole(username) {
    const [rows] = await dbPool.query(`SELECT *
                                            FROM accounts
                                            WHERE username = "${username}"`);
    return [rows];
}

module.exports = {
    getUserById,
    getUserByUsername,
    getUserByEmail,
    createUser,
    updatePassword,
    getAllStudent,
    getAllAdmin,
    updateInformation,
    deleteUserById,
    changeRole,
    getRole
};



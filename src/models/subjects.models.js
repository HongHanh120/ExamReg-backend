const dbPool = require("../db");
const config = require("config");

async function deleteSubjectById(subject_code) {
    await dbPool.query(`DELETE FROM subjects
                        WHERE subject_code = "${subject_code}"`);
}

async function updateSubject(name, subject_code, credit) {
    await dbPool.query(`UPDATE subjects 
                        SET name = "${name}",
                            credit = ${credit}
                        WHERE subject_code = "${subject_code}"`);
}

async function createSubject(name, subject_code, credit) {
    await dbPool.query(`INSERT INTO subjects (name, subject_code, credit) 
                        VALUES ("${name}", "${subject_code}", ${credit})`);

}

async function getSubjectByCourseCode(subject_code) {
    const [rows] = await dbPool.query(`SELECT * 
                                       FROM subjects
                                       WHERE subject_code = "${subject_code}"`);
    return [rows];
}

async function getAllSubjects() {
    const [rows] = await dbPool.query(`SELECT * 
                                       FROM subjects`);
    return [rows];
}

async function findSubjectByKeyword(keywords) {
    const [rows] = await dbPool.query(`SELECT subjects.name, subjects.subject_code
                                       FROM subjects
                                       WHERE MATCH(name) AGAINST("+${keywords}*" IN boolean MODE)
                                       OR MATCH(subject_code) AGAINST("+${keywords}*" IN boolean MODE)`);
    return [rows];
}

async function getSubjects(examination_id) {
    const [rows] = await dbPool.query(`SELECT subjects.*
                                 FROM subjects
                                 INNER JOIN classes ON subjects.subject_code = classes.subject_code
                                 WHERE classes.examination_id = ${examination_id}
                                 GROUP BY(subjects.subject_code)`);
    return [rows];
}

module.exports = {
    deleteSubjectById,
    updateSubject,
    createSubject,
    getSubjectByCourseCode,
    getAllSubjects,
    findSubjectByKeyword,
    getSubjects
};

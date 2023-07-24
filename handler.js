"use strict";

const mysql = require("serverless-mysql");

const db = mysql({
    config: {
        host: "gachee.cvkzkany3sqf.ap-northeast-2.rds.amazonaws.com",
        user: "admin",
        password: "admin1234",
        database: "gachee",
    },
});

module.exports.getUsers = async (event, context) => {
    try {
        // 데이터베이스 연결
        await db.connect();
        // 쿼리 실행
        const results = await db.query("SELECT * FROM users");
        // 연결 종료
        await db.end();
        // 결과 반환
        return {
            statusCode: 200,
            body: JSON.stringify(results),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" }),
        };
    }
};

module.exports.getCategories = async (event, context) => {
    try {
        // 데이터베이스 연결
        await db.connect();
        // 쿼리 실행
        const results = await db.query("SELECT * FROM categories");
        // 연결 종료
        await db.end();
        // 결과 반환
        return {
            statusCode: 200,
            body: JSON.stringify(results),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" }),
        };
    }
};

module.exports.createUser = async (event, context) => {
    try {
        await db.connect();

        const { userId, name, gender, email } = JSON.parse(event.body);

        const query = `
      INSERT INTO users(user_id, name, gender, email)
      VALUES (?, ?, ?, ?)
    `;

        const result = await db.query(query, [userId, name, gender, email]);

        await db.end();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "SUCCESS" }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" }),
        };
    }
};

module.exports.getQuestionsAndAnswersByCategory = async (event) => {
    try {
        // 요청에서 카테고리 ID 가져오기
        const categoryId = event.pathParameters.categoryId;

        // MySQL 쿼리 생성
        const query = `
        SELECT q.question_id, q.situation, q.situation_image, q.title_image, q.title, q.sub_title, a.answer_id, a.answer_content
        FROM questions q
        JOIN answers a ON q.question_id = a.question_id
        WHERE q.category_id = ${categoryId}
    `;

        // MySQL 쿼리 실행
        const results = await new Promise((resolve, reject) => {
            db.query(query, (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });

        // 카테고리별 문제와 답안 객체로 변환
        const categoryData = {};
        results.forEach((row) => {
            const {
                question_id,
                situation,
                situation_image,
                title_image,
                title,
                sub_title,
                answer_id,
                answer_content,
            } = row;
            if (!categoryData[question_id]) {
                categoryData[question_id] = {
                    question_id,
                    situation,
                    situation_image,
                    title_image,
                    title,
                    sub_title,
                    answers: [],
                };
            }
            categoryData[question_id].answers.push({
                answer_id,
                answer_content,
            });
        });

        // 결과 반환
        return {
            statusCode: 200,
            body: JSON.stringify(Object.values(categoryData)),
        };
    } catch (error) {
        console.error("MySQL query error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

module.exports.getMatchedUsersForA = async (event) => {
    try {
        // A 유저의 ID
        const userIdA = event.pathParameters.userIdA;

        // MySQL 쿼리 생성
        const query = `
        SELECT u.user_id, u.name, u.email, m.matched_date
        FROM users u
        JOIN matched_users m ON u.user_id = m.user_b_id
        WHERE m.user_a_id = '${userIdA}'
      `;

        // MySQL 쿼리 실행
        const results = await new Promise((resolve, reject) => {
            db.query(query, (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });

        // 매칭된 유저들의 리스트 객체로 변환
        const matchedUsers = results.map((row) => {
            return {
                user_id: row.user_id,
                name: row.name,
                email: row.email,
                matched_date: row.matched_date,
            };
        });

        // serverless-mysql 연결 해제
        await db.end();

        // 결과 반환
        return {
            statusCode: 200,
            body: JSON.stringify(matchedUsers),
        };
    } catch (error) {
        console.error("MySQL 쿼리 오류:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "내부 서버 오류 😞" }),
        };
    }
};

module.exports.getUserAnswer = async (event) => {
    try {
        // 요청에서 사용자 ID와 문제 ID를 가져옵니다.
        const userId = event.pathParameters.userId;
        // MySQL 쿼리를 생성합니다.
        const query = `
    SELECT q.question_id, q.situation, q.sub_situation, q.title, a.answer_id, a.answer_content
    FROM questions q
    JOIN answers a ON q.question_id = a.question_id
    JOIN user_answer ua ON q.question_id = ua.question_id AND a.answer_id = ua.answer_id
    WHERE ua.user_id = '${userId}'
  `;

        // MySQL 쿼리 실행
        const results = await new Promise((resolve, reject) => {
            db.query(query, (error, results) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });

        // 결과가 없는 경우, 즉 선택한 답안이 없는 경우에 대한 처리를 합니다.
        if (results.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: "Selected answers not found for the given user" }),
            };
        }

        // 선택한 답안 정보를 추출합니다.
        const userAnswers = results.map((row) => ({
            question_id: row.question_id,
            title: row.title,
            selected_answer: {
                answer_id: row.answer_id,
                answer_content: row.answer_content,
            },
        }));

        // serverless-mysql 연결을 해제합니다.
        await db.end();

        // 응답을 반환합니다.
        return {
            statusCode: 200,
            body: JSON.stringify(userAnswers),
        };
    } catch (error) {
        console.error("MySQL query error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Internal server error" }),
        };
    }
};

module.exports.dohee = async (event) => {
    return {
        statusCode: 200,
        body: JSON.stringify(
            {
                message: "successfully!",
                input: event,
            },
            null,
            2
        ),
    };

    // Use this code if you don't use the http event with the LAMBDA-PROXY integration
    // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};

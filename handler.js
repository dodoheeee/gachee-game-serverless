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

module.exports.getQuestionsByCategoryId = async (event, context) => {
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

module.exports.getQuestionsByCategory = async (event, context) => {
    try {
        await db.connect();

        const { categoryId } = event.pathParameters;

        const query = `
        SELECT *
        FROM questions
        WHERE category_id = ?
      `;

        const questions = await db.query(query, [categoryId]);

        await db.end();

        if (questions.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: "카테고리를 찾을 수 없습니다." }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify(questions),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" }),
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

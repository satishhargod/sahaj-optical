// import mysql from "mysql2/promise";
// import dotenv from "dotenv";

// dotenv.config();

// async function testDBConnection() {
//   try {
//     const connection = await mysql.createConnection({
//       host: process.env.DB_HOST || "localhost",
//       user: process.env.DB_USER || "root",
//       password: process.env.DB_PASSWORD || "",
//       database: process.env.DB_NAME,
//     });

//     console.log("DB Connected ✅");

//     // ✅ actually run query
//     const [rows] = await connection.query(
//       "SELECT * FROM learning_content"
//     );

//     console.log("Data fetched ✅:", rows);

//     await connection.end();

//     process.exit(0);

//   } catch (err) {
//     console.log("Error ❌", err);
//     process.exit(1);
//   }
// }

// testDBConnection();
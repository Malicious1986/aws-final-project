import pg from "pg";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const { Client } = pg;

const secretsClient = new SecretsManagerClient({
  region: "eu-west-1",
});

let cachedConfig;

const getDbConfig = async () => {
  if (cachedConfig) return cachedConfig;

  const response = await secretsClient.send(
    new GetSecretValueCommand({
      SecretId: process.env.SECRET_ID,
    })
  );

  cachedConfig = JSON.parse(response.SecretString);

  return cachedConfig;
};

export const handler = async (event) => {
  let client;

  try {
    const body = typeof event.body === "string"
      ? JSON.parse(event.body)
      : event.body;

    const {
      first_name,
      last_name,
      email,
    } = body;

    const db = await getDbConfig();

    client = new Client({
      host: db.DB_HOST,
      port: 5432,
      database: db.DB_NAME,
      user: db.DB_USER,
      password: db.DB_PASSWORD,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    await client.connect();

    const result = await client.query(
      `
      INSERT INTO users (
        first_name,
        last_name,
        email
      )
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [
        first_name,
        last_name,
        email,
      ]
    );

    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(result.rows[0]),
    };
  } catch (error) {
    console.error(error);

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Failed to create user",
      }),
    };
  } finally {
    if (client) {
      await client.end();
    }
  }
};
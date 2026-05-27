import pg from "pg";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const { Client } = pg;

const secretsClient = new SecretsManagerClient({
  region: "eu-west-1",
});

let cachedSecret;

const getDbConfig = async () => {
  if (cachedSecret) return cachedSecret;

  const response = await secretsClient.send(
    new GetSecretValueCommand({
      SecretId: process.env.SECRET_ID,
    })
  );

  cachedSecret = JSON.parse(response.SecretString);
  return cachedSecret;
};

export const handler = async (event) => {
  const db = await getDbConfig();

  const client = new Client({
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

  const result = await client.query("SELECT * FROM users ORDER BY id ASC");

  await client.end();

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(result.rows),
  };
};
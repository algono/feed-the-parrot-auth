import { Handler, Context } from "aws-lambda";
import dotenv from "dotenv";
import path from "path";
import { MessageUtil, Response } from "./utils/message";

const dotenvPath = path.join(
  __dirname,
  "../",
  `config/.env.${process.env.NODE_ENV}`
);
dotenv.config({
  path: dotenvPath,
});

interface LoginEvent {
  loginCode: string;
}

interface LoginResult {
  token: string;
}

export const login: Handler<LoginEvent, Response> = (event, context) => {
  return Promise.resolve(
    MessageUtil.success<LoginResult>({ token: "hello from serverless!" })
  );
};

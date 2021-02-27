import { Handler } from "aws-lambda";
import { MessageUtil, Response } from "./utils/message";
import Dynamo from "./utils/Dynamo";

// The Firebase Admin SDK to generate the auth JWT token
import admin = require("firebase-admin");
admin.initializeApp({
  credential: admin.credential.cert(process.env.FIREBASE_CREDENTIALS),
});

interface LoginEvent {
  authCode: string;
}

interface AuthCodeDB {
  code: string;
  expirationDate: number;
}

interface LoginResult {
  token: string;
}

export const login: Handler<LoginEvent, Response> = async (event) => {
  console.log("event: ", event);

  if (!event.authCode || typeof event.authCode !== "string") {
    return MessageUtil.error(400, "Bad Request.");
  }

  const authCode = event.authCode;
  const { tableName, codeAttributeName, codeIndex } = process.env;

  const codeQuery = await Dynamo.query({
    tableName,
    index: codeIndex,
    queryKey: codeAttributeName,
    queryValue: authCode,
  });

  if (!codeQuery) {
    return MessageUtil.error(403, "The code was not valid.");
  }

  if (codeQuery.length > 1) {
    return MessageUtil.error(500, "There was an error with the code. Please generate another and try again.")
  }

  const codeData = codeQuery[0] as AuthCodeDB;

  const expirationDateTime: number = codeData.expirationDate;

  console.log("Expiration date: ", JSON.stringify(expirationDateTime));

  const now = new Date();

  console.log("Current date: ", JSON.stringify(now));

  const expirationDate = new Date(expirationDateTime);

  // If the code has not expired yet, continue
  if (now < expirationDate) {
    if (authCode === codeData.code) {
      console.log("Good code");
      const token = await admin.auth().createCustomToken(codeData.ID);
      await Dynamo.delete(authCode, tableName);
      return MessageUtil.success<LoginResult>({ token });
    } else {
      console.log(
        "Good code according to database, bad code according to logic"
      );
      return MessageUtil.error(500, "Internal error.");
    }
  } else {
    console.log("Code has expired");
    await Dynamo.delete(authCode, tableName);
    return MessageUtil.error(404, "The code has expired");
  }
};

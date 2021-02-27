import { Handler } from "aws-lambda";
import { response } from "./utils/ApiResponses";
import Dynamo from "./utils/Dynamo";
import * as firebase from "./utils/Firebase"

interface LoginParams {
  authCode: string;
}

interface AuthCodeDB {
  id: string;
  code: string;
  expirationDate: number;
}

export const login: Handler = async (event: { pathParameters: LoginParams }) => {
  console.log("event: ", event);

  if (!event.pathParameters || !event.pathParameters.authCode) {
    return response(400, "Bad Request.");
  }

  const authCode = event.pathParameters.authCode;
  const { tableName, codeAttributeName, codeIndex } = process.env;

  const codeQuery = await Dynamo.query({
    tableName,
    index: codeIndex,
    queryKey: codeAttributeName,
    queryValue: authCode,
  });

  if (!codeQuery || codeQuery.length < 1) {
    return response(401, "The code was not valid.");
  }

  if (codeQuery.length > 1) {
    return response(
      409,
      "There was an error with the code. Please generate another and try again."
    );
  }

  const codeData = codeQuery[0] as AuthCodeDB;

  const expirationDateTime: number = codeData.expirationDate;

  console.log("Expiration date (seconds): ", JSON.stringify(expirationDateTime));

  const now = new Date();

  console.log("Current date: ", JSON.stringify(now));

  // expirationDateTime is in seconds, we need it in millis for the Date constructor
  const expirationDate = new Date(expirationDateTime * 1000);

  console.log("Expiration date: ", JSON.stringify(expirationDate));

  // If the code has not expired yet, continue
  if (now < expirationDate) {
    if (authCode === codeData.code) {
      console.log("Good code");
      const token = await firebase.createCustomToken(codeData.id);
      await Dynamo.delete(codeData.id, tableName);
      return response(200, token);
    } else {
      console.log(
        "Good code according to database, bad code according to logic"
      );
      return response(500, "Internal error.");
    }
  } else {
    console.log("Code has expired");
    await Dynamo.delete(codeData.id, tableName);
    return response(416, "The code has expired");
  }
};

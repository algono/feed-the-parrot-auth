import AWS from "aws-sdk";

const documentClient = new AWS.DynamoDB.DocumentClient();

export default class Dynamo {
  static async query({
    tableName,
    index,
    queryKey,
    queryValue,
  }: {
    tableName: string;
    index: string;
    queryKey: string;
    queryValue: string;
  }) {
    const params = {
      TableName: tableName,
      IndexName: index,
      KeyConditionExpression: `${queryKey} = :hkey`,
      ExpressionAttributeValues: {
        ":hkey": queryValue,
      },
    };
    const res = await documentClient.query(params).promise();

    console.log(res);
    return res.Items || [];
  }

  static async delete(id: string, tableName: string) {
    return documentClient
      .delete({
        TableName: tableName,
        Key: {
          ID: id,
        },
      })
      .promise();
  }
}

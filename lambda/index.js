const AWS = require("aws-sdk");

const sqsClient = new AWS.SQS({ apiVersion: "2012-11-05" });
const sqsURL = "https://sqs.us-east-1.amazonaws.com/251691153283/TP01SQS";

exports.handler = async event => {
  let data;
  try {
    const result = await sendMessageToSQS(
      "sampleMessage" + JSON.stringify(event) + Math.random().toString(),
      "NONE",
      sqsURL,
      sqsClient
    );
    data = result.ResponseMetadata.RequestId;
  } catch (e) {
    data = e;
  }

  console.log(data);
  const response = {
    statusCode: 200,
    body: JSON.stringify("Hello from Lambda!" + data)
  };

  return response;
};

function sendMessageToSQS(message, groupId, url, sqsClient, callback) {
  return new Promise((resolve, reject) => {
    const params = {
      MessageBody: message /* required */,
      QueueUrl: url /* required */,
      DelaySeconds: 0
    };

    sqsClient.sendMessage(params, function(err, data) {
      if (err) reject(err);
      // an error occurred
      else resolve(data); // successful response
    });
  });
}

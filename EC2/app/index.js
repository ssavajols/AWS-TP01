const AWS = require("aws-sdk");

AWS.config.update({ region: "us-east-1" });

const SQS = new AWS.SQS({ apiVersion: "2012-11-05" });
const SNS = new AWS.SNS({ apiVersion: "2010-03-31" });
const S3 = new AWS.S3({ apiVersion: "2006-03-01" });

const S3_BUCKET_NAME = "tp01s3";
const S3_BASE_URL = "https://" + S3_BUCKET_NAME + ".s3.amazonaws.com/";
const sqsURL = "https://sqs.us-east-1.amazonaws.com/251691153283/TP01SQS";
const snsARN = "arn:aws:sns:us-east-1:251691153283:tp01sns";

setInterval(loop, 2000);

async function loop() {
  const data = await readQueue(sqsURL, SQS);

  data.Messages.map(async message => {
    const id = message.MessageId;
    const content = message.Body;
    const ReceiptHandle = message.ReceiptHandle;

    await saveToS3(id, content, S3);
    await notifySNS(S3_BASE_URL + id, snsARN, SNS);
    await deleteMessage(ReceiptHandle, sqsURL, SQS);
  });
}

function readQueue(url, sqsClient) {
  return new Promise((resolve, reject) => {
    const params = {
      QueueUrl: url,
      WaitTimeSeconds: 5,
      MaxNumberOfMessages: 10
    };
    sqsClient.receiveMessage(params, (err, data) => {
      if (err) reject(err, err.stack);
      else resolve(data);
    });
  });
}

function deleteMessage(ReceiptHandle, url, sqsClient) {
  return new Promise((resolve, reject) => {
    const params = { QueueUrl: url, ReceiptHandle: ReceiptHandle };
    sqsClient.deleteMessage(params, (err, data) => {
      if (err) reject(err, err.stack);
      else resolve(data);
    });
  });
}

function saveToS3(filename, content, s3Client) {
  return new Promise((resolve, reject) => {
    var params = {
      Body: content,
      Bucket: S3_BUCKET_NAME,
      Key: filename
    };
    s3Client.putObject(params, function(err, data) {
      if (err) {
        console.log(err);
        reject(err);
        // an error occurred
      } else resolve(data); // successful response
    });
  });
}

function notifySNS(fileUrl, arn, snsClient) {
  return new Promise((resolve, reject) => {
    const params = {
      Message: "New file computed to S3 : " + fileUrl,
      Subject: "New file ready on S3",
      TargetArn: arn
    };
    snsClient.publish(params, (err, data) => {
      if (err) {
        console.log(err);
        reject(err);
      } else resolve(data);
    });
  });
}

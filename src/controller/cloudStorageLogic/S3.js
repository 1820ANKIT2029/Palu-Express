import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

let s3;

if (process.env.STORAGE_TYPE == "S3") {
    s3 = new S3Client({
        credentials: {
            accessKeyId: process.env.ACCESS_KEY,
            secretAccessKey: process.env.SECRET_KEY,
        },
        region: process.env.BUCKET_REGION,
    })
}

export async function upload(Key, ContentType, file){
    const Bucket = process.env.BUCKET_NAME
    const command = new PutObjectCommand({
        Key,
        Bucket,
        ContentType,
        Body: file,
    })

    const fileStatus = await s3.send(command)

    return {statusCode: fileStatus['$metadata'].httpStatusCode};

}



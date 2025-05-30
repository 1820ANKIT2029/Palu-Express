import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

let s3Instance = null;

export function getS3Client() {
    if (!s3Instance) {
        if (process.env.STORAGE_TYPE !== "S3") {
            throw new Error("S3 storage is not configured properly (STORAGE_TYPE != 'S3').");
        }

        s3Instance = new S3Client({
            credentials: {
                accessKeyId: process.env.ACCESS_KEY,
                secretAccessKey: process.env.SECRET_KEY,
            },
            region: process.env.BUCKET_REGION,
        });

        console.log("S3 Client initialized");
    }

    return s3Instance;
}

export async function upload(Key, ContentType, file){
    const Bucket = process.env.BUCKET_NAME
    const command = new PutObjectCommand({
        Key,
        Bucket,
        ContentType,
        Body: file,
    })

    const s3 = getS3Client()

    const fileStatus = await s3.send(command)

    return {statusCode: fileStatus['$metadata'].httpStatusCode};

}



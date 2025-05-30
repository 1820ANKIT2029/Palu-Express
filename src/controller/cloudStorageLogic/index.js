import { upload } from "./S3.js"

export const upload_video_to_cloud = async (Key, ContentType, file) => {
    let status;

    if(process.env.STORAGE_TYPE === "S3"){
        status = await upload(Key, ContentType, file);
    }
    else if(process.env.STORAGE_TYPE === "FIREBASE"){
        console.log("Not implemented yet!!!");
    }
    else if(process.env.STORAGE_TYPE === "NAIVE"){
        console.log("Not implemented yet!!!");
    }
    else{
        return {statusCode: 200};   // No storage
    }

    return status;
}
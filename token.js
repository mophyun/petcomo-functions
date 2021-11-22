"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

// const applicationDefault = require('firebase-admin/app')
// import { applicationDefault } from 'firebase-admin/app'
// const { applicationDefault } = require('firebase-admin/app')
const admin = require("firebase-admin");
const request = require("request-promise");
const functions = require("firebase-functions");

var serviceAccount = require("./comocomo-test1-firebase-adminsdk-hi4wr-c46d9445c0.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://comocomo-test1.firebaseio.com"
});


const kakaoRequestMeUrl = "https://kapi.kakao.com/v2/user/me?secure_resource=true";
/**
 * 승민 작성
 */
// async function createCustomToken(data) {
    
//     // input validation check
//     if (!data || !data.token) {
//         return {is_valid : false};
//     }  

//     console.log("Verifying Kakao token: ", data.token);
//     const token = await createFirebaseToken(data.token);
    
//     // console.log("Returning firebase token to user: ", token);
//     // return JSON.stringify({ token: token, is_success: true });
//     return {token:token, is_success:true};
// // });
// }

exports.createCustomToken = functions.https.onCall(async (data, context) => {
    console.log('data : ', data)
    // input validation check
    if (!data || !data.token) {
        console.log("token is undefined..")
        // response.send({is_valid : false})
        return {is_valid : false};
    }  

    console.log("Verifying Kakao token: ", data.token);
    const token = await createFirebaseToken(data.token);
    
    // console.log("Returning firebase token to user: ", token);
    // return JSON.stringify({ token: token, is_success: true });
    return {token:token, is_success:true};
})
// var data = {token: 'O-8Oy5I3sKNPFZQlOqvk5950K8T2ySI1PStImAo9dGkAAAF1JcwM9Q'};
// abc(data);



/* requestMe - Returns user profile from Kakao API
*
* @param  {String} kakaoAccessToken Access token retrieved by Kakao Login API
* @return {Promiise<Response>}      User profile response in a promise
*/
function requestMe(kakaoAccessToken) {
    console.log("Requesting user profile from Kakao API server.");
    return request({
        method: "GET",
        headers: { Authorization: "Bearer " + kakaoAccessToken },
        url: kakaoRequestMeUrl,
    });
}

/* updateOrCreateUser - Update Firebase user with the give email, create if none exists.
*
* @param  {String} userId        user id per app
* @param  {String} email         user's email address
* @param  {String} displayName   user
* @param  {String} photoURL      profile photo url
* @return {Prommise<UserRecord>} Firebase user record in a promise
*/
function updateOrCreateUser(userId, email, displayName, photoURL) {
    console.log("updating or creating a firebase user");
    userId = userId + "_kakao";
    const updateParams = {
        uid: userId,
        email: email,
        provider: "KAKAO",
        displayName: displayName,
        photoURL: photoURL
    };
    console.log(updateParams);
    return admin.auth().updateUser(userId, updateParams).catch((error) => {
        if (error.code === "auth/user-not-found") {
            return admin.auth().createUser(updateParams);
        }
        throw error;
    });
}

/**
* createFirebaseToken - returns Firebase token using Firebase Admin SDK
*
* @param  {String} kakaoAccessToken access token from Kakao Login API
* @return {Promise<String>}                  Firebase token in a promise
*/
function createFirebaseToken(kakaoAccessToken) {
    return requestMe(kakaoAccessToken).then((response) => {
        console.log("====> response : ", response);
        const body = JSON.parse(response);
        console.log(body);
        const userId = body["id"];
        const nickname = body["properties"]["nickname"];
        const profileImage = body["properties"]["profile_image"];
        const email = body["kakao_account"]["email"];
        if (!userId) {
            console.log("!userId");
            //  return res
            //    .status(404)
            //    .send({ message: "There was no user with the given access token." });
        }
        //  let nickname = null;
        //  let profileImage = null;
        // if (body.properties) {
        //  nickname = body.properties.nickname;
        //  profileImage = body.properties.profile_image;
        //}
        return updateOrCreateUser(userId, email, nickname, profileImage);
    }).then((userRecord) => {
        const userId = userRecord.uid;
        console.log("creating a custom firebase token based on uid :", userId);
        return admin.auth().createCustomToken(userId, { provider: "KAKAO" });
    });
}
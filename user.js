const functions = require("firebase-functions");
const admin = require("firebase-admin");
const db = admin.firestore();
// Input : u_photo_url, u_name, relation
// Output : is_success, user_id
exports.addUser = functions.https.onRequest((request, response) => {
  // 1. data 저장
  const data = {
    u_name: request.query.u_name,
    u_photo_url: request.query.u_photo_url,
    relation: request.query.relation,
  };
  // 2. collection -> user 정보 저장하기
  db.collection("user").add(data)
      .then((res) => {
        console.log("Added document with ID: ", res.id);
        // 3. 성공 여부 전달
        response.send({
          is_success: true,
          user_id: res.id,
        });
      })
      .catch(() => {
        // 3. 성공 여부 전달
        response.send({
          is_success: false,
          user_id: "",
        });
      });
});

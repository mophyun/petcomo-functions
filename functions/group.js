const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp({
    serviceAccountId: 'firebase-adminsdk-hi4wr@comocomo-test1.iam.gserviceaccount.com'
})
const db = admin.firestore();
/**
 * [Group]
 * - group_id
 * - group_name
 * - pet_name
 * - pet_image
 * - pet_birth
 * - users
 *      - user_id
 *      - user_name
 *      - user_image
 *      - user_relation
 */
/**
 * createGroup
 * @param 
 */
exports.createGroup = functions.https.onRequest(async (request, response) => {
    const res = await db.collection('group').add({
        pet_name: '',
        pet_image: '',
        users: []
    })
    console.log('group id test : ' + res.id)
    // create task

    response.send({
        data: {
            is_success: true,
            group_id: res.id
        }
    })
})
/**
 * getGroup
 */
 exports.getGroupById = functions.https.onRequest(async (request, response) => {
    const data = request.body.data
    const groupId = data.groupId

    const ref = db.collection("group").doc(groupId)
    const res = await ref.get()

    response.send({
        data: {
            is_success: true,
            group_id: res.id,
            data: res.data()   
        }
    })
})

exports.addPet = functions.https.onRequest(async (request, response) => {
    let group_id = request.query.group_id
    let pet_name = request.query.pet_name
    let pet_image = request.query.pet_image || ''

    const ref = db.collection("group").doc(group_id)
    const res = await ref.update({
        pet_name: pet_name,
        pet_image: pet_image
    }, { merge: true });

    response.send({
        is_success: true,
        group_id: res.id
    })
})
/**
 * test url)
 * http://localhost:5001/comocomo-test1/us-central1/group-addUser?group_id=U9RqKxGGvYEmlk7BvcMm&user_name=dohee&user_image=image&user_relation=relation
 */
exports.addUser = functions.https.onRequest(async (request, response) => {
    let params = request.query
    let group_id = params.group_id
    let user_name = params.user_name
    let user_image = params.user_image || ''
    let user_relation = params.user_relation || ''

    const ref = db.collection("group").doc(group_id)
    const res = await ref.update({
        users: [
            {
                user_id: Date.now(),
                user_name: user_name,
                user_image: user_image,
                user_relation: user_relation
            }
        ]
    }, { merge: true });

    response.send({
        is_success: true,
        group_id: res.id
    })
})
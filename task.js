const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp({
    serviceAccountId: 'firebase-adminsdk-hi4wr@comocomo-test1.iam.gserviceaccount.com'
})
const db = admin.firestore();
// TODO: request.body 변경
/**
 * GET
 * desc: 할일 읽기
 * param: taskName, taskIcon, repeatDateType, count, dueDate
 * return: isSuccess
 */
exports.getTask = functions.https.onRequest(async (request, response) => {
    const groupId = "iJAS1s043xbMHLyCTGw2"
    const date = "20211003"
    const taskRef = db.collection("task")
    const taskDocs = await taskRef.where("groupId", "==", groupId).where("date", "==", date).get()
    if (taskDocs.empty) {
        // No Data
        return
    }
    taskDocs.forEach(async (taskDoc) => {
        response.send({data: taskDoc.data()})
    })
});
/**
 * POST
 * desc: 할일 추가
 * param: taskName, taskIcon, repeatDateType, count, dueDate
 * return: isSuccess
 */
exports.addTask = functions.https.onRequest(async (request, response) => {
    const taskDocId = "KNa0YMDDaC85fm4a2pcK"
    const taskRef = db.collection("task").doc(taskDocId)
    const taskDoc = await taskRef.get()
    const data = taskDoc.data()
    const taskList = data.list
    // TODO : 중복체크-이름
    // request.body
    taskList.push({
        dueDate: request.body.dueDate || "",
        repeatDateType: request.body.repeatDateType || "",
        taskIcon: request.body.taskIcon || "",
        taskId: String("task" + Number(taskList.length + 1)),
        taskName: request.body.taskName || "",
        totalCount: request.body.totalCount || 1,
        isComplete: false,
        remainCount: Number(request.body.totalCount) || 1,
        recordList: []
    })
    // 추가
    data.remainTaskCount = data.remainTaskCount + 1

    taskRef.update({
        list: taskList
    })
    response.send("success")

})
/**
 * POST
 * desc: 할일 수정
 * param: taskName, taskIcon, repeatDateType, count, dueDate
 * return: isSuccess
 */
exports.updateTask = functions.https.onRequest(async (request, response) => {
    const taskId = request.body.taskId
    const taskDocId = "KNa0YMDDaC85fm4a2pcK"
    const taskRef = db.collection("task").doc(taskDocId)
    const taskDoc = await taskRef.get()
    const taskList = taskDoc.data().list
    // request.body, request.query
    taskList.find((e) => {
        if (e.taskId === taskId) {
            e.dueDate = request.body.dueDate || ""
            e.repeatDateType = request.body.repeatDateType || "d"
            e.taskIcon = request.body.taskIcon || ""
            e.taskName = request.body.taskName || ""
            if (e.totalCount !== request.body.totalCount) {
                e.totalCount = Number(request.body.totalCount)
                if (request.body.recordList) {
                    let remainCount = request.body.totalCount - e.recordList
                    e.remainCount = remainCount || 1
                    e.isComplete = remainCount === 0
                }
            }
        }
        return e.taskId === taskId
    })

    const length = taskList.length
    const done = taskList.filter((e) => {
        return e.isComplete
    })

    taskRef.update({
        doneTaskCount: done.length,
        remainTaskCount: (length - done),
        list: taskList
    })
    response.send("success")
})
/**
 * POST
 * desc: 할일 삭제
 * param: taskName, taskIcon, repeatDateType, count, dueDate
 * return: isSuccess
 */
exports.deleteTask = functions.https.onRequest(async (request, response) => {
    const taskId = request.body.taskId
    const taskDocId = "KNa0YMDDaC85fm4a2pcK"
    const taskRef = db.collection("task").doc(taskDocId)
    const taskDoc = await taskRef.get()
    const taskList = taskDoc.data().list
    const list_ = taskList.filter((e) => { return e.taskId !== taskId })

    taskRef.update({
        list: list_
    })
    response.send("success")

})
/**
 * POST
 * desc: 기록 추가
 * param: taskName, taskIcon, repeatDateType, count, dueDate
 * return: isSuccess
 */
exports.addRecord = functions.https.onRequest(async (request, response) => {
    const taskId = request.body.taskId
    const taskDocId = "KNa0YMDDaC85fm4a2pcK"
    const taskRef = db.collection("task").doc(taskDocId)
    const taskDoc = await taskRef.get()
    const taskData = taskDoc.data()
    const taskList = taskData.list
    const recordData = {
        recordId: "r02",
        userId: request.body.userId || "",
        userName: request.body.userName || "",
        userIcon: request.body.userIcon || "",
        recordDate: request.body.recordDate || "",
        recordMemo: request.body.recordMemo || ""
    }
    taskList.find((e) => {
        if (e.taskId === taskId) {
            if (e.recordList) {
                e.recordList.push(recordData)
            } else {
                e.recordList = [recordData]
            }
        }
        return e.taskId === taskId
    })
    taskRef.update({
        list: taskList
    })
    response.send("success")
})
/**
 * POST
 * desc: 기록 수정
 * param: taskName, taskIcon, repeatDateType, count, dueDate
 * return: isSuccess
 */
exports.updateRecord = functions.https.onRequest(async (request, response) => {
    const taskId = request.body.taskId
    const recordId = request.body.recordId
    const taskDocId = "KNa0YMDDaC85fm4a2pcK"
    const taskRef = db.collection("task").doc(taskDocId)
    const taskDoc = await taskRef.get()
    const taskData = taskDoc.data()
    const taskList = taskData.list
    // const recordData = {
    //     recordId: "r02",
    //     userId: request.body.userId || "",
    //     userName: request.body.userName || "",
    //     userIcon: request.body.userIcon || "",
    //     recordDate: request.body.recordDate || "",
    //     recordMemo: request.body.recordMemo || ""
    // }
    taskList.find((e) => {
        if (e.taskId === taskId) {
            if (e.recordList) {
                e.recordList.find((r) => {
                    if (r.recordId === recordId) {
                        r.userId = request.body.userId || ""
                        r.userName = request.body.userName || ""
                        r.userIcon = request.body.userIcon || ""
                        r.recordDate = request.body.recordDate || ""
                        r.recordMemo = request.body.recordMemo || ""
                    }
                    return r.recordId === recordId
                })
            }
        }
        return e.taskId === taskId
    })
    taskRef.update({
        list: taskList
    })
    response.send("success")
})
/**
 * POST
 * desc: 기록 삭제
 * param: taskName, taskIcon, repeatDateType, count, dueDate
 * return: isSuccess
 */
exports.deleteRecord = functions.https.onRequest(async (request, response) => {
    const taskId = request.body.taskId
    const recordId = request.body.recordId
    const taskDocId = "KNa0YMDDaC85fm4a2pcK"
    const taskRef = db.collection("task").doc(taskDocId)
    const taskDoc = await taskRef.get()
    const taskData = taskDoc.data()
    const taskList = taskData.list

    taskList.find((e) => {
        if (e.taskId === taskId) {
            if (e.recordList) {
                let list = e.recordList.filter((r) => {
                    return r.recordId !== recordId
                })
                e.recordList = list
            }
        }
        return e.taskId === taskId
    })
    taskRef.update({
        list: taskList
    })
    response.send("success")
})
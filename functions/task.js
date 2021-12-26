const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp({
    serviceAccountId: 'firebase-adminsdk-hi4wr@comocomo-test1.iam.gserviceaccount.com'
})
const db = admin.firestore();
exports.getTodaySchedule = functions.https.onRequest(async (request, response) => {
    const data = request.body.data
    const userId = data.user_id

    // group id 조회
    const uref = db.collection("user").doc(userId)
    const uds = await uref.get()
    const groupId = uds.data().group_id

    // task list 조회
    const gref = db.collection("group").doc(groupId)
    const gds = await gref.get()
    const taskList = gds.data().task_list
    const scheduleId = gds.data().schedule_id

    if (!taskList || taskList.length === 0) {
        response.send({ data: null })
        return
    }

    // today schedule 조회
    const sref = db.collection("schedule").doc(scheduleId)
    const sds = await sref.get()
    const sdata = sds.data()

    const today = 'tbd'
    if (sdata.date !== today) {
        // tbd - schedule 생성
    }

    if (!sdata) {
        const mapList = taskList.map((e) => {
            return Object.assign(e, {
                is_complete: false,
                remain_count: e.total_count,
                record_list: []
            })
        })
        const obj = {
            date: new Date(),
            done_task_count: 0,
            remain_task_count: 0,
            schedule_list: mapList
        }

        let res = await db.collection('schedule').add(obj)
        await gref.update({
            schedule_id: res.id
        })
        response.send({ data: obj })
    } else {
        response.send({ data: sdata })
    }

    
})

exports.addTask = functions.https.onRequest(async (request, response) => {
    const data = request.body.data

    let obj = {
        task_id: 'T' + Date.now(),
        task_icon: data.task_icon,
        task_name: data.task_name,
        total_count: data.total_count,
        repeat_date_type: data.repeat_date_type,
        repeat_date: data.repeat_date
    }

    const gref = db.collection("group").doc(groupId)
    const gds = await gref.get()
     // update group
     await gref.update({ 
        task_list: [obj]
    })

    const scheduleId = gds.data().schedule_id
     // update schedule
     if (scheduleId === '') {
         // TODO: schedule 생성
     }

     const sref = db.collection("schedule").doc(scheduleId)
     const sds = await sref.get()
     const sdata = sds.data()

     obj.is_complete = false
     obj.remain_count = obj.total_count
     obj.record_list = []

     await sref.update({
        remain_task_count: Number(sdata.remain_task_count) + 1,
        schedule_list: [obj]
     })

     response.send({data: {is_success: true}})
 })

exports.createTaskList  = functions.https.onRequest(async (request, response) => {
    const data = request.body.data

    const groupId = data.groupId
    const date = data.date || new Date()
    // admin.database.ServerValue.TIMESTAMP

    const res = await db.collection('task').add({
        date: date,
        group_id: groupId,
        done_task_count: 0,
        remain_task_count: 0,
        list: []
    })

    // add task id to group collection
    const ref = db.collection("group").doc(groupId)
    await ref.update({
        task_doc_id: res.id
    }, { merge: true });

    response.send({
        data: {
            is_success: true,
            task_doc_id: res.id
        }
    })

})

/**
 * GET
 * desc: 할일 읽기
 * param: taskName, taskIcon, repeatDateType, count, dueDate
 * return: taskCollection
 */
 exports.getTaskListById = functions.https.onRequest(async (request, response) => {
    // const groupId = "iJAS1s043xbMHLyCTGw2"
    const data = request.body.data

    if (!data || !data.taskDocId) {
        response.send(new Error('Parameter Error'))
    }

    const taskDocId = data.taskDocId
    // const date = "20211003"
    const ref = db.collection("task").doc(taskDocId)
    const ds = await ref.get()

    response.send({data: ds.data()})
});
/**
 * return: taskCollection
 */
// getTaskListId(groupId)
exports.getTaskListByGroupId = functions.https.onRequest(async (request, response) => {
    // const groupId = "iJAS1s043xbMHLyCTGw2"
    const data = request.body.data

    if (!data || !data.groupId) {
        response.send(new Error('Parameter Error'))
    }

    const groupId = data.groupId
    const date = data.date // Date To Timestamp
    // const date = "20211003"
    const ref = db.collection("task")
    const docs = await ref.where("groupId", "==", groupId).where("date", ">", date).get()
    if (docs.empty) {
        // No Data - Create Task
        const obj = {
            date: new Date(),
            group_id: groupId,
            done_task_count: 0,
            remain_task_count: 0,
            list: []
        }
        // const res = await db.collection('task').add(obj)
        await db.collection('task').add(obj)
        response.send({
            data: obj
        })
        return
    }

    response.send({data: docs[0].data()})
    // docs.forEach(async (doc) => {
    //     response.send({data: doc.data()})
    // })
});
/**
 * POST
 * desc: 할일 추가
 * param: taskName, taskIcon, repeatDateType, count, dueDate
 * return: isSuccess
 */
// exports.addTask = functions.https.onRequest(async (request, response) => {
//     const data = request.body.data // "KNa0YMDDaC85fm4a2pcK"

//     const ref = db.collection("task").doc(data.taskDocId)
//     const ds = await ref.get()
//     const remain_task_count = ds.data().remain_task_count
//     const list = ds.data().list
//     const obj = {
//         task_id: String("task" + Number(list.length + 1)),
//         task_icon: data.task_icon || "",
//         task_name: data.task_name || "",
//         due_date: data.due_date || "",
//         repeat_date_type: data.repeat_date_type || "",
//         total_count: data.total_count || 1,
//         is_complete: false,
//         remain_count: Number(data.total_count) || 1,
//         records: []
//     }

//     list.push(obj)
//     await ref.update({ 
//         remain_task_count: Number(remain_task_count) + 1,
//         list: list
//     })

//     response.send({
//         is_success: true,
//         task_id: obj.task_id
//     })
// })
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
    const data = request.body.data // "KNa0YMDDaC85fm4a2pcK"
    
    const taskId = data.taskId

    const ref = db.collection("task").doc(data.taskDocId)
    const ds = await ref.get()

    const list = ds.data().list

    const obj = {
        record_id: "R" + Date.now(),
        user_id: data.userId,
        user_name: data.userName,
        user_icon: data.userIcon,
        record_date: data.recordDate,
        record_memo: data.recordMemo
    }

    const idx = list.findIndex((e) => {
        return e.task_id === taskId
    })

    list[idx].records.push(obj)
    // update remain count..
    let count = Number(list[idx].total_count) - Number(list[idx].records.length)

    if (count > 0) {
        list[idx].remain_count = count
    } else {
        list[idx].remain_count = 0
        list[idx].is_complete = true
    }
    
    await ref.update({
        list: list
    })

    response.send({data: {
        is_success: true,
        record_id: obj.record_id
    }})

})
/**
 * POST
 * desc: 기록 수정
 * param: taskName, taskIcon, repeatDateType, count, dueDate
 * return: isSuccess
 */
exports.updateRecord = functions.https.onRequest(async (request, response) => {
    const data = request.body.data // "KNa0YMDDaC85fm4a2pcK"

    const ref = db.collection("task").doc(data.taskDocId)
    const ds = await ref.get()

    const taskDocId = data.taskDocId // "KNa0YMDDaC85fm4a2pcK"
    const taskId = data.taskId
    const recordId = data.recordId
    
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
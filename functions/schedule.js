const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { _documentWithOptions } = require("firebase-functions/v1/firestore");
admin.initializeApp({
    serviceAccountId: 'firebase-adminsdk-hi4wr@comocomo-test1.iam.gserviceaccount.com'
})
const db = admin.firestore();
exports.getTodaySchedule = functions.https.onRequest(async (request, response) => {
    const data = request.body.data
    const userId = data.user_id
    console.log('- user id : ' + userId)
    // group id 조회
    const uref = db.collection("user").doc(userId)
    const uds = await uref.get()
    const groupId = uds.data().group_id

    console.log('- group id : ' + groupId)

    // task list 조회
    const gref = db.collection("group").doc(groupId)
    const gds = await gref.get()
    const gdata = gds.data()
    const taskList = gdata.task_list
    const scheduleId = gdata.schedule_id


    console.log('- schedule data : ' + scheduleId)

    if (!taskList || taskList.length === 0) {
        response.send({ data: null })
        return
    }

    if (scheduleId === '') {
        const obj = {
            date: new Date(),
            done_task_count: 0,
            remain_task_count: 0,
            schedule_list: []
        }

        let res = await db.collection('schedule').add(obj)
        await gref.update({
            schedule_id: res.id
        })
        response.send({ data: obj })
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
        // schedule 생성
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
exports.getTaskList = functions.https.onRequest(async (request, response) => {
    const data = request.body.data

    const userId = data.user_id
    console.log('- user id : ' + userId)
    // group id 조회
    const uref = db.collection("user").doc(userId)
    const uds = await uref.get()
    const groupId = uds.data().group_id

    console.log('- group id : ' + groupId)

    const gref = db.collection("group").doc(groupId)
    const gds = await gref.get()

    response.send({
        data: { task_list: gds.data().task_list }
    })
 
})

exports.addTask = functions.https.onRequest(async (request, response) => {
    const data = request.body.data

    const userId = data.user_id
    console.log('- user id : ' + userId)
    // group id 조회
    const uref = db.collection("user").doc(userId)
    const uds = await uref.get()
    const groupId = uds.data().group_id

    console.log('- group id : ' + groupId)

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

    const tlist = gds.data().task_list
    tlist.push(obj)

     // update group
     await gref.update({ 
        task_list: tlist
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
     let slist = sdata.schedule_list
     slist.push(obj)

     await sref.update({
        remain_task_count: Number(sdata.remain_task_count) + 1,
        schedule_list: slist
     })

     response.send({data: {is_success: true}})
 })

 exports.updateTask = functions.https.onRequest(async (request, response) => {
    const data = request.body.data

    const userId = data.user_id
    console.log('- user id : ' + userId)

    if (!userId) {
        response.send({data: {is_success: false}})
        return
    }

    // group id 조회
    const uref = db.collection("user").doc(userId)
    const uds = await uref.get()
    const groupId = uds.data().group_id

    console.log('- group id : ' + groupId)

    const gref = db.collection("group").doc(groupId)
    const gds = await gref.get()

    const tlist = gds.data().task_list
    const tidx = tlist.findIndex((e) => {
        return e.task_id === data.task_id
    })

    if (tidx === -1) {
        response.send({data: {is_success: false}})
        return
    }
    
    tlist[tidx].task_icon = data.task_icon
    tlist[tidx].task_name = data.task_name
    tlist[tidx].total_count = data.total_count
    tlist[tidx].repeat_date_type = data.repeat_date_type
    tlist[tidx].repeat_date = data.repeat_date

     // update group
     await gref.update({ 
        task_list: tlist
    })

    const scheduleId = gds.data().schedule_id
     // update schedule
     if (scheduleId === '') {
         // TODO: schedule 생성
     }

     const sref = db.collection("schedule").doc(scheduleId)
     const sds = await sref.get()
     const sdata = sds.data()

     let slist = sdata.schedule_list

     const sidx = slist.findIndex((e) => {
        return e.task_id === data.task_id
    })

    if (sidx === -1) {
        response.send({data: {is_success: false}})
        return
    }
    
    slist[sidx].task_icon = data.task_icon
    slist[sidx].task_name = data.task_name
    slist[sidx].total_count = data.total_count
    slist[sidx].repeat_date_type = data.repeat_date_type
    slist[sidx].repeat_date = data.repeat_date

    // update remain_count, is_complete
    const len = slist[sidx].record_list.length
    const remain_count = Number(data.total_count) - len

    if (remain_count <= 0) {
        slist[sidx].is_complete = true
        slist[sidx].remain_count = 0
    } else {
        slist[sidx].is_complete = false
        slist[sidx].remain_count = remain_count
    }

    // todo: update done_task_count
    // todo: update remain_task_count

     await sref.update({
        schedule_list: slist
     })

     response.send({data: {is_success: true}})
 })
 exports.addRecord = functions.https.onRequest(async (request, response) => {
    const data = request.body.data
    
    const userId = data.user_id
    const taskId = data.task_id

    // group id 조회
    const uref = db.collection("user").doc(userId)
    const uds = await uref.get()
    const udata = uds.data()
    
    console.log('- group id : ' + udata.group_id)
    const gref = db.collection("group").doc(udata.group_id)
    const gds = await gref.get()

    const scheduleId = gds.data().schedule_id
    // update schedule
    if (scheduleId === '') {
        // TODO: schedule 생성
    }

    const sref = db.collection("schedule").doc(scheduleId)
    const sds = await sref.get()
    const sdata = sds.data()

    console.log('- schedule id : ' + scheduleId)
    console.log('- task id : ' + taskId)

    try {
    const slist = sdata.schedule_list
    const idx = slist.findIndex((e) => {
        return e.task_id === taskId
    })

    let obj = {
        record_id: "R" + Date.now(),
        user_id: data.user_id,
        user_name: udata.user_icon,
        user_icon: udata.user_name,
        record_date: new Date(),
        memo: data.memo
    }

    const item = slist[idx]
    item.record_list.push(obj)

    const len = item.record_list.length
    const remain_count = Number(item.total_count) - len

    let done_task_count = sdata.done_task_count
    let remain_task_count = sdata.remain_task_count

    if (remain_count <= 0) {
        item.is_complete = true
        item.remain_count = 0
        // 완료/미완료 업데이트
        let dtc = 0
        slist.forEach((e) => {
            if (e.is_complete) {
                dtc++
            }
        })
        done_task_count = dtc
        remain_task_count = Number(slist.length) - Number(done_task_count)
    } else {
        item.remain_count = remain_count
    }

    await sref.update({
        done_task_count: done_task_count,
        remain_task_count: remain_task_count,
        schedule_list: slist
    })

    response.send({data: {
        is_success: true
    }})

    } catch (e) {
        console.error(e)
    }
})
//  exports.addRecord = functions.https.onRequest(async (request, response) => {
//     const data = request.body.data // "KNa0YMDDaC85fm4a2pcK"
    
//     const taskId = data.taskId

//     const ref = db.collection("task").doc(data.taskDocId)
//     const ds = await ref.get()

//     const list = ds.data().list

//     const obj = {
//         record_id: "R" + Date.now(),
//         user_id: data.userId,
//         user_name: data.userName,
//         user_icon: data.userIcon,
//         record_date: data.recordDate,
//         record_memo: data.recordMemo
//     }

//     const idx = list.findIndex((e) => {
//         return e.task_id === taskId
//     })

//     list[idx].records.push(obj)
//     // update remain count..
//     let count = Number(list[idx].total_count) - Number(list[idx].records.length)

//     if (count > 0) {
//         list[idx].remain_count = count
//     } else {
//         list[idx].remain_count = 0
//         list[idx].is_complete = true
//     }
    
//     await ref.update({
//         list: list
//     })

//     response.send({data: {
//         is_success: true,
//         record_id: obj.record_id
//     }})

// })
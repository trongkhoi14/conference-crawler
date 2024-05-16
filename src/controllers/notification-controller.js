const emailService = require('../services/email-service')
const dbConference = require('../models/conference-model');
const dbFollow = require('../models/follow-model');
const dbUser = require('../models/user-model')

const notificationController = async () => {
    try {
        /*
        // Lấy ra ngày hiện tại
        const currentDate = new Date();

        // Tạo ngày sau một tuần từ ngày hiện tại
        const oneWeekLater = new Date(currentDate);
        oneWeekLater.setDate(oneWeekLater.getDate() + 7);
        
        // Lấy danh sách tất cả các sự kiện sắp diễn ra trong vòng một tuần
        const upcommingConfs = await dbConference.find({
            $or: [
                { 'ConferenceDate.date': { $gte: currentDate, $lt: oneWeekLater } },
                { 'SubmissonDate.date': { $gte: currentDate, $lt: oneWeekLater } },
                { 'NotificationDate.date': { $gte: currentDate, $lt: oneWeekLater } }
            ]
        });
        let upcomingEvents = [];

        for (const conf of upcommingConfs) {
            // Lọc ra danh sách người dùng đã follow sự kiện này
            const confFollowers = await dbFollow.find({ confId: conf._id });


            conf.ConferenceDate.forEach(confDate => {
                if (confDate.date >= currentDate && confDate.date < oneWeekLater) {
                    upcomingEvents.push({
                        title: conf.Title,
                        date: confDate.date,
                        keyword: confDate.keyword,
                        follow: confFollowers
                    });
                }
            });

            conf.SubmissonDate.forEach(submissionDate => {
                if (submissionDate.date >= currentDate && submissionDate.date < oneWeekLater) {
                    upcomingEvents.push({
                        title: conf.Title,
                        date: submissionDate.date,
                        keyword: submissionDate.keyword,
                        follow: confFollowers
                    });
                }
            });

            conf.NotificationDate.forEach(notificationDate => {
                if (notificationDate.date >= currentDate && notificationDate.date < oneWeekLater) {
                    upcomingEvents.push({
                        title: conf.Title,
                        date: notificationDate.date,
                        keyword: notificationDate.keyword,
                        follow: confFollowers
                    });
                }
            });

        };

        for (const e of upcomingEvents) {
            for (const u of e.follow) {
                const user = await dbUser.findById(u.userId)
                const payload = {
                    confTitle: e.title,
                    eventName: e.keyword,
                    eventDate: e.date,
                    uEmail: user.email
                }
                await emailService.sendingEmail(payload)
            }
        }
        */
        const payload = {
            confTitle: "demo",
            eventName: "ACM Conference",
            eventDate: "13-05-2024",
            uEmail: "morgana13@yogirt.com"
        }
        await emailService.sendingEmail(payload)

    } catch (error) {
        console.log("Error in Notification Controller: " + error);
    }
}

module.exports = { notificationController };
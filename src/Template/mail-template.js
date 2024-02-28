const { formatDate } = require('../untils/date');
const { RandomNumber } = require('../untils/handleData');

//send email with key
// module.exports.activateMail = (payload) => {
//     const { email } = payload;
//     const key = RandomNumber(6);
//     const data = {
//         to: email,
//         subject: 'Kích hoạt tài khoản của bạn',
//         html:
//             (`
//             <!DOCTYPE html>
//             <html lang="en">
//             <head>
//                 <meta charset="UTF-8">
//                 <meta http-equiv="X-UA-Compatible" content="IE=edge">
//                 <meta name="viewport" content="width=device-width, initial-scale=1.0">
//                 <title>Document</title>
                
//             </head>
//             <body>
//                 <div class="container" style="width: 50%;height: 100%;margin: 0 auto;box-shadow: 3px 3px 3px black;">
//                     <div class="header" style="width: 100%;display: flex;">
//                         <img src="https://ipos.vn/wp-content/uploads/2021/10/canteen-taicho.jpg" alt="background canteen" style="width: 100%;height: 250px;">
//                     </div>
//                     <div class="content">
//                         <div class="title">
//                             <h3 class="title-header" style="text-align: center;font-size: 26px;">Chào mừng bạn đã đến với hocmai.vn</h3>
//                         </div>
//                         <div class="description" style="margin: -10px 0 0 30px;">
//                             <p>Chào mừng bạn đã đến canteen trường đại học khoa học tự nhiên</p>
//                             <p>Đến với dịch vụ canteen online, bạn sẽ được:</p>
//                             <ul>
//                                 <li>Trải nghiệm dịch vụ mua bán online 1 cách tốt nhất</li>
//                                 <li>Nhanh chống nhận được thức ăn ở giờ cao điểm</li>
//                                 <li>Hỗ trợ đặt hàng thanh toán online</li>
//                             </ul>
//                             <p>Hãy kích hoạt tài khoản để trải nghiệm dịch vụ.</p>
//                         </div>
//                         <div class="active-account" style="background-color: red;width: 20%;margin: 0 auto;padding: 1px 0;border-radius: 5px;">
//                             <h2 style="text-align: center;font-size: 20px;color: white;">${key}</h2>
//                         </div>
//                     </div>
//                     <div class="footer" style="background-color: rgb(242, 164, 9);margin-top: 30px;height: 80px;">
//                         <div class="copy-right" style="margin-left: 30px; margin-top: 10px;display: inline-block;">
//                             <p style="color: white;font-size: 10px;">@${email}, when ${new Date}</p>
//                             <p style="color: white;font-size: 10px;">Hệ thống canteen HCMUS</p>
//                         </div>
//                         <div class="redirect-media" style="margin-right: 30px; margin-top: 10px;display: inline-block;">
//                             <a href="hocmai.vn">
//                                 <img src="https://i.pinimg.com/originals/46/87/36/468736a28a76a005316d52172df86da6.png" alt="" style="border-radius: 50%;width: 40px;height: 40px;margin-left: 320px;">
//                             </a>
//                         </div>
//                     </div>
//                 </div>
//             </body>
//             </html>
//         `)
//     };

//     return { data, key };
// }

// module.exports.changePassMail = (payload) => {
//     const {
//         email,
//         currentPassword,
//         newPassword
//     } = payload;
//     const key = RandomNumber(6);
//     const data = {
//         to: email,
//         subject: 'Thay đổi mật khẩu',
//         html:
//             (`
//             <!DOCTYPE html>
//             <html lang="en">
//             <head>
//                 <meta charset="UTF-8">
//                 <meta http-equiv="X-UA-Compatible" content="IE=edge">
//                 <meta name="viewport" content="width=device-width, initial-scale=1.0">
//                 <title>Document</title>
                
//             </head>
//             <body>
//                 <div class="container" style="width: 50%;height: 100%;margin: 0 auto;box-shadow: 3px 3px 3px black;">
//                     <div class="header" style="width: 100%;display: flex;">
//                         <img src="https://ipos.vn/wp-content/uploads/2021/10/canteen-taicho.jpg" alt="background canteen" style="width: 100%;height: 250px;">
//                     </div>
//                     <div class="content">
//                         <div class="title">
//                             <h3 class="title-header" style="text-align: center;font-size: 26px;">Thay đổi mật khẩu</h3>
//                         </div>
//                         <div class="description" style="margin: -10px 0 0 30px;">
//                             <p>Bạn đã thực hiện thay đổi mật khẩu.</p>
//                             <p>Mật khẩu của bạn:</p>
//                             <ul>
//                                 <li>Mật khẩu cũ: ${currentPassword}</li>
//                                 <li>Mật khẩu mới: ${newPassword}</li>
//                             </ul>
//                             <p>Vui lòng xác nhận thay đổi mật khẩu với mã bên dưới.</p>
//                         </div>
//                         <div class="active-account" style="background-color: red;width: 20%;margin: 0 auto;padding: 1px 0;border-radius: 5px;">
//                             <h2 style="text-align: center;font-size: 20px;color: white;">${key}</h2>
//                         </div>
//                     </div>
//                     <div class="footer" style="background-color: rgb(242, 164, 9);margin-top: 30px;height: 80px;">
//                         <div class="copy-right" style="margin-left: 30px;margin-top: 10px;display: inline-block;">
//                             <p style="color: white;font-size: 10px;">@${email}, when ${new Date}</p>
//                             <p style="color: white;font-size: 10px;">Hệ thống canteen HCMUS</p>
//                         </div>
//                         <div class="redirect-media" style="margin-right: 30px;margin-top: 10px;display: inline-block;">
//                             <a href="hocmai.vn">
//                                 <img src="https://i.pinimg.com/originals/46/87/36/468736a28a76a005316d52172df86da6.png" alt="" style="border-radius: 50%;width: 40px;height: 40px;margin-left: 320px;">
//                             </a>
//                         </div>
//                     </div>
//                 </div>
//             </body>
//             </html>
//         `)
//     };

//     return { data, key };
// }

// module.exports.paymentSuccess = (payload) => {
//     const {
//         _id,
//         receiver,
//         timeReceive,
//         goods,
//         totalPrice
//     } = payload;
//     const timeFormat = timeReceive.toLocaleDateString('de-DE', {
//         year: 'numeric',
//         month: '2-digit',
//         day: '2-digit',
//         hour: 'numeric',
//         minute: 'numeric'
//     })
//     const vietnameseCurrency = totalPrice.toString().toLocaleString('it-IT', { style: 'currency', currency: 'VND' });
//     const goodsTable = goods.map((goods) => {
//         const {
//             _id: goodsInfo,
//             quantity
//         } = goods;
//         return `
//             <tr style="box-sizing: border-box;margin: 0;padding: 0;">
//                 <td style="box-sizing: border-box;margin: 0;padding: 8px;border: 1px solid #dddddd;text-align: left;">${goodsInfo.type === "mainDish" ? "Món chính" : "Món phụ"}</td>
//                 <td style="box-sizing: border-box;margin: 0;padding: 8px;border: 1px solid #dddddd;text-align: left;">${goodsInfo.name}</td>
//                 <td style="box-sizing: border-box;margin: 0;padding: 8px;border: 1px solid #dddddd;text-align: left;">${goodsInfo.price}</td>
//                 <td style="box-sizing: border-box;margin: 0;padding: 8px;border: 1px solid #dddddd;text-align: left;">${quantity}</td>
//             </tr>
//         `
//     }).join('');
//     const data = {
//         to: `${receiver.studentId}@student.hcmus.edu.vn`,
//         subject: 'Thanh tóa hóa đơn thành công',
//         html: (`
//             <!DOCTYPE html>
//             <html lang="en" style="box-sizing: border-box;margin: 0;padding: 0;">
            
//             <head style="box-sizing: border-box;margin: 0;padding: 0;">
//                 <meta charset="UTF-8" style="box-sizing: border-box;margin: 0;padding: 0;">
//                 <meta http-equiv="X-UA-Compatible" content="IE=edge" style="box-sizing: border-box;margin: 0;padding: 0;">
//                 <meta name="viewport" content="width=device-width, initial-scale=1.0" style="box-sizing: border-box;margin: 0;padding: 0;">
//                 <title style="box-sizing: border-box;margin: 0;padding: 0;">Document</title>
                
//             </head>
            
//             <body style="box-sizing: border-box;margin: 0;padding: 0;">
//                 <div class="container" style="box-sizing: border-box;margin: 0 auto;padding: 0;width: 80%;height: 100%;box-shadow: 3px 3px 3px black;">
//                     <div class="header" style="box-sizing: border-box;margin: 0;padding: 0;width: 100%;height:250px;background-color:rgb(242, 164, 9);position:relative;">
//                         <div class="sub" style="text-align:center;padding-top:100px;box-sizing: border-box;margin: 0;position: absolute;color: white;font-size: 35px;top: 50%;left: 50%;transform: translate(-50%, -50%);">
//                             <h3 style="box-sizing: border-box;margin: 0;padding: 0;">CANTEEN HCMUS</h3>
//                         </div>
//                     </div>
//                     <div class="content" style="box-sizing: border-box;margin: 0;padding: 0 10px;">
//                         <div class="title" style="box-sizing: border-box;margin: 0;padding: 0;">
//                             <h3 class="title-header" style="box-sizing: border-box;margin: 0;padding: 0;text-align: center;font-size: 30px;">Mua hàng thành công</h3>
//                         </div>
//                         <div class="description" style="box-sizing: border-box;margin: -10px 0 0 30px;padding: 0;">
//                             <div class="notification" style="box-sizing: border-box;margin: 0;padding: 0;margin-top: 20px;">
//                                 <h3 style="box-sizing: border-box;margin: 0;padding: 0;font-size: 24px;margin-bottom: 10px;">Thông báo</h3>
//                                 <div class="notification-content" style="box-sizing: border-box;margin: 0;padding: 0;">
//                                     <p style="box-sizing: border-box;margin: 0;padding: 0;">Bạn đã thanh toán đơn hàng thành công thông qua ứng dung HCMUS Canteen, vui lòng kiểm tra lại
//                                         các thông tin bến dưới
//                                     </p>
//                                 </div>
//                             </div>
//                             <div class="student" style="box-sizing: border-box;margin: 0;padding: 0;margin-top: 20px;">
//                                 <h3 style="box-sizing: border-box;margin: 0;padding: 0;font-size: 24px;margin-bottom: 10px;">Thông tin cá nhân</h3>
//                                 <div class="student-content" style="box-sizing: border-box;margin: 0;padding: 0;">
//                                     <p style="box-sizing: border-box;margin: 0;padding: 0;margin-left: 20px;">Mã hóa đơn: <strong style="box-sizing: border-box;margin: 0;padding: 0;">${_id}</strong></p>
//                                     <p style="box-sizing: border-box;margin: 0;padding: 0;margin-left: 20px;">Họ & tên: <strong style="box-sizing: border-box;margin: 0;padding: 0;">${receiver.studentName}</strong></p>
//                                     <p style="box-sizing: border-box;margin: 0;padding: 0;margin-left: 20px;">MSSV: <strong style="box-sizing: border-box;margin: 0;padding: 0;">${receiver.studentId}</strong></p>
//                                     <p style="box-sizing: border-box;margin: 0;padding: 0;margin-left: 20px;">Thời gian nhận: <strong style="box-sizing: border-box;margin: 0;padding: 0;">${timeFormat}</strong></p>
//                                 </div>
//                             </div>
//                             <div class="order" style="box-sizing: border-box;margin: 0;padding: 0;margin-top: 20px;">
//                                 <h3 style="box-sizing: border-box;margin: 0;padding: 0;font-size: 24px;margin-bottom: 10px;">Thông tin đơn hàng</h3>
//                                 <div class="order-content" style="box-sizing: border-box;margin: 0;padding: 10px 20px;">
//                                     <table style="box-sizing: border-box;margin: 0;padding: 0;font-family: arial, sans-serif;border-collapse: collapse;width: 100%;">
//                                         <tr style="box-sizing: border-box;margin: 0;padding: 0;">
//                                             <th style="box-sizing: border-box;margin: 0;padding: 8px;border: 1px solid #dddddd;text-align: left;">Phân loại</th>
//                                             <th style="box-sizing: border-box;margin: 0;padding: 8px;border: 1px solid #dddddd;text-align: left;">Tên món ăn</th>
//                                             <th style="box-sizing: border-box;margin: 0;padding: 8px;border: 1px solid #dddddd;text-align: left;">Giá</th>
//                                             <th style="box-sizing: border-box;margin: 0;padding: 8px;border: 1px solid #dddddd;text-align: left;">Số lượng</th>
//                                         </tr>
//                                         ${goodsTable}
//                                         <tr style="background-color: rgb(255, 190, 9);color: rgb(255, 255, 255);box-sizing: border-box;margin: 0;padding: 0;">
//                                             <td style="box-sizing: border-box;margin: 0;padding: 8px;border: 1px solid #dddddd;text-align: left;"><strong style="box-sizing: border-box;margin: 0;padding: 0;">Tổng tiền</strong></td>
//                                             <td colspan="3" style="text-align: center;box-sizing: border-box;margin: 0;padding: 8px;border: 1px solid #dddddd;">${vietnameseCurrency} vnd</td>
//                                         </tr>
//                                     </table>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                     <div class="footer" style="background-color: rgb(242, 164, 9);margin-top: 30px;height: 80px;">
//                         <div class="copy-right" style="margin-left: 30px;margin-top: 10px;display: inline-block;">
//                             <p style="color: white;font-size: 10px;">@${receiver.studentId}@student.hcmus.edu.vn, when ${new Date().toLocaleDateString('de-DE')}</p>
//                             <p style="color: white;font-size: 10px;">Hệ thống canteen HCMUS</p>
//                         </div>
//                     </div>
//                 </div>
//             </body>
//             </html>
//         `)
//     }
//     return { data };
// }

module.exports.notification = (payload) => {
    const {
        confTitle, eventName, eventDate, uEmail
    } = payload;

    const key = RandomNumber(6);

    const data = {
        to: uEmail,
        subject: `Notification - ${confTitle}`,
        html:
            (`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="X-UA-Compatible" content="IE=edge">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Document</title>
                
            </head>
            <body>
                <div class="container" style="width: 50%;height: 100%;margin: 0 auto;box-shadow: 3px 3px 3px black;">
                    <div class="header" style="width: 100%;display: flex;">
                        <img src="https://www.unicef.org.uk/babyfriendly/wp-content/uploads/sites/2/2022/03/2000x1000-Conference-2016-1500x750-1.jpg" alt="background canteen" style="width: 100%;height: 250px;">
                    </div>
                    <div class="content">
                        <div class="title">
                            <h3 class="title-header" style="text-align: center;font-size: 26px;">Upcomming Event</h3>
                        </div>
                        <div class="description" style="margin: -10px 0 0 30px;">
                            <p> Dear Sir/Madam,</p>
                            <p> We would like to inform you about an upcoming event that is scheduled to take place soon:</p>
                            <ul>
                                <li>${eventName}</li>
                                <li>Date: ${formatDate(eventDate)}</li>
                            </ul>
                            <p>Please be prepared to join this event and don't forget to mark your calendar!</p>
                        </div>
                        
                    </div>
                    <div class="footer" style="background-color: rgb(242, 164, 9);margin-top: 30px;height: 80px;">
                        <div class="copy-right" style="margin-left: 30px;margin-top: 10px;display: inline-block;">
                            <p style="color: white;font-size: 12px;">@email, when ${new Date}</p>
                            <p style="color: white;font-size: 12px;">Hệ thống tìm kiếm Hội nghị khoa học</p>
                        </div>
                        <div class="redirect-media" style="margin-right: 30px;margin-top: 10px;display: inline-block;">
                            <a href="myconference.com">
                                <img src="https://firebasestorage.googleapis.com/v0/b/prebook-ba0a0.appspot.com/o/images%2Ficon.drawio.png?alt=media&token=56b08f39-8d60-4aec-99fa-f32c60467db5" alt="" style="border-radius: 50%;width: 40px;height: 40px;margin-left: 320px;">
                            </a>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `)
    };

    return { data, key };
}

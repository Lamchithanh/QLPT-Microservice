/**
 * Cấu hình cho VNPay
 *
 * Thông tin sandbox:
 * - Ngân hàng: NCB
 * - Số thẻ: 9704198526191432198
 * - Tên chủ thẻ: NGUYEN VAN A
 * - Ngày phát hành: 07/15
 * - Mật khẩu OTP: 123456
 */
const config = {
  vnp_TmnCode: process.env.VNP_TMN_CODE,
  vnp_HashSecret: process.env.VNP_HASH_SECRET,
  vnp_Url: process.env.VNP_URL,
  vnp_ReturnUrl: process.env.VNP_RETURN_URL,
  vnp_ApiUrl: process.env.VNP_API_URL,
  paymentResultUrl: process.env.PAYMENT_RESULT_URL,
  vnp_Version: "2.1.0",
  vnp_Command: "pay",
  vnp_CurrCode: "VND",
  vnp_Locale: "vn",
  vnp_OrderType: "billpayment",
  vnp_IpAddr: "127.0.0.1", // Mặc định, sẽ được ghi đè bởi IP thực tế của người dùng

  // Thông tin thẻ test cho sandbox
  testCards: {
    domestic: {
      bank: "NCB",
      cardNumber: "9704198526191432198",
      cardHolder: "NGUYEN VAN A",
      issuedDate: "07/15",
      otp: "123456",
    },
    international: {
      bank: "VISA",
      cardNumber: "4242424242424242",
      cardHolder: "NGUYEN VAN A",
      issuedDate: "07/15",
      cvv: "123",
      otp: "123456",
    },
  },
};

module.exports = config;

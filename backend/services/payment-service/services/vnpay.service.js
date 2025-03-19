const crypto = require("crypto");
const qs = require("qs");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const logger = require("../config/logger");
const vnpayConfig = require("../config/vnpay.config");

/**
 * Service xử lý thanh toán qua VNPay
 */
class VNPayService {
  /**
   * Tạo URL thanh toán VNPay
   * @param {Object} paymentData - Dữ liệu thanh toán
   * @param {number} paymentData.amount - Số tiền thanh toán (VND)
   * @param {string} paymentData.orderDescription - Mô tả đơn hàng
   * @param {string} paymentData.orderType - Loại đơn hàng (mặc định: billpayment)
   * @param {string} paymentData.language - Ngôn ngữ (mặc định: vn)
   * @param {string} paymentData.bankCode - Mã ngân hàng (tùy chọn)
   * @param {string} paymentData.ipAddr - Địa chỉ IP của người dùng
   * @returns {string} URL thanh toán VNPay
   */
  createPaymentUrl(paymentData) {
    try {
      const date = new Date();
      const createDate = this.formatDate(date);

      // Tạo mã đơn hàng duy nhất
      const orderId = this.generateOrderId();

      // Chuẩn bị dữ liệu thanh toán
      const vnpParams = {
        vnp_Version: vnpayConfig.vnp_Version,
        vnp_Command: vnpayConfig.vnp_Command,
        vnp_TmnCode: vnpayConfig.vnp_TmnCode,
        vnp_Locale: paymentData.language || vnpayConfig.vnp_Locale,
        vnp_CurrCode: vnpayConfig.vnp_CurrCode,
        vnp_TxnRef: orderId,
        vnp_OrderInfo: paymentData.orderDescription,
        vnp_OrderType: paymentData.orderType || vnpayConfig.vnp_OrderType,
        vnp_Amount: paymentData.amount * 100, // Nhân với 100 vì VNPay yêu cầu số tiền * 100
        vnp_ReturnUrl: vnpayConfig.vnp_ReturnUrl,
        vnp_IpAddr: paymentData.ipAddr || vnpayConfig.vnp_IpAddr,
        vnp_CreateDate: createDate,
      };

      // Thêm mã ngân hàng nếu có
      if (paymentData.bankCode) {
        vnpParams.vnp_BankCode = paymentData.bankCode;
      }

      // Sắp xếp các tham số theo thứ tự alphabet
      const sortedParams = this.sortObject(vnpParams);

      // Tạo chuỗi ký
      const signData = qs.stringify(sortedParams, { encode: false });
      const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
      const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

      // Thêm chữ ký vào tham số
      sortedParams.vnp_SecureHash = signed;

      // Tạo URL thanh toán
      const paymentUrl = `${vnpayConfig.vnp_Url}?${qs.stringify(sortedParams, {
        encode: false,
      })}`;

      logger.info(`Created VNPay payment URL for order ${orderId}`);
      return { paymentUrl, orderId };
    } catch (error) {
      logger.error("Error creating VNPay payment URL:", {
        error: error.message,
      });
      throw new Error("Không thể tạo URL thanh toán VNPay");
    }
  }

  /**
   * Xác thực callback từ VNPay
   * @param {Object} vnpParams - Tham số trả về từ VNPay
   * @returns {Object} Kết quả xác thực
   */
  verifyReturnUrl(vnpParams) {
    try {
      // Lấy chữ ký từ tham số
      const secureHash = vnpParams.vnp_SecureHash;

      // Xóa chữ ký để tạo chuỗi ký mới
      delete vnpParams.vnp_SecureHash;
      delete vnpParams.vnp_SecureHashType;

      // Sắp xếp các tham số theo thứ tự alphabet
      const sortedParams = this.sortObject(vnpParams);

      // Tạo chuỗi ký
      const signData = qs.stringify(sortedParams, { encode: false });
      const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
      const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

      // So sánh chữ ký
      const isValidSignature = secureHash === signed;

      // Kiểm tra mã phản hồi
      const responseCode = vnpParams.vnp_ResponseCode;
      const isSuccessful = responseCode === "00";

      logger.info(
        `VNPay callback verification: signature valid: ${isValidSignature}, response code: ${responseCode}`
      );

      return {
        isValid: isValidSignature,
        isSuccessful,
        responseCode,
        orderId: vnpParams.vnp_TxnRef,
        amount: parseInt(vnpParams.vnp_Amount) / 100, // Chia cho 100 để lấy số tiền thực
        bankCode: vnpParams.vnp_BankCode,
        bankTranNo: vnpParams.vnp_BankTranNo,
        cardType: vnpParams.vnp_CardType,
        payDate: vnpParams.vnp_PayDate,
        transactionNo: vnpParams.vnp_TransactionNo,
        message: this.getResponseMessage(responseCode),
      };
    } catch (error) {
      logger.error("Error verifying VNPay return URL:", {
        error: error.message,
      });
      throw new Error("Không thể xác thực callback từ VNPay");
    }
  }

  /**
   * Kiểm tra trạng thái giao dịch
   * @param {string} orderId - Mã đơn hàng
   * @param {number} amount - Số tiền thanh toán
   * @returns {Promise<Object>} Kết quả kiểm tra
   */
  async checkTransactionStatus(orderId, amount) {
    try {
      const date = new Date();
      const createDate = this.formatDate(date);

      // Chuẩn bị dữ liệu kiểm tra
      const vnpParams = {
        vnp_Version: vnpayConfig.vnp_Version,
        vnp_Command: "querydr",
        vnp_TmnCode: vnpayConfig.vnp_TmnCode,
        vnp_TxnRef: orderId,
        vnp_OrderInfo: `Kiểm tra trạng thái giao dịch ${orderId}`,
        vnp_Amount: amount * 100, // Nhân với 100 vì VNPay yêu cầu số tiền * 100
        vnp_TransactionDate: createDate,
        vnp_CreateDate: createDate,
        vnp_IpAddr: vnpayConfig.vnp_IpAddr,
      };

      // Sắp xếp các tham số theo thứ tự alphabet
      const sortedParams = this.sortObject(vnpParams);

      // Tạo chuỗi ký
      const signData = qs.stringify(sortedParams, { encode: false });
      const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
      const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

      // Thêm chữ ký vào tham số
      sortedParams.vnp_SecureHash = signed;

      // Gửi yêu cầu kiểm tra
      const response = await axios.post(
        vnpayConfig.vnp_ApiUrl,
        qs.stringify(sortedParams),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const result = response.data;
      logger.info(`VNPay transaction status check for order ${orderId}:`, {
        result,
      });

      return {
        isSuccessful: result.vnp_ResponseCode === "00",
        responseCode: result.vnp_ResponseCode,
        message: this.getResponseMessage(result.vnp_ResponseCode),
        transactionStatus: result.vnp_TransactionStatus,
        amount: parseInt(result.vnp_Amount) / 100, // Chia cho 100 để lấy số tiền thực
        orderId: result.vnp_TxnRef,
        bankCode: result.vnp_BankCode,
        bankTranNo: result.vnp_BankTranNo,
        cardType: result.vnp_CardType,
        payDate: result.vnp_PayDate,
        transactionNo: result.vnp_TransactionNo,
      };
    } catch (error) {
      logger.error("Error checking VNPay transaction status:", {
        error: error.message,
        orderId,
      });
      throw new Error("Không thể kiểm tra trạng thái giao dịch VNPay");
    }
  }

  /**
   * Hoàn tiền giao dịch
   * @param {Object} refundData - Dữ liệu hoàn tiền
   * @param {string} refundData.orderId - Mã đơn hàng gốc
   * @param {number} refundData.amount - Số tiền hoàn (VND)
   * @param {string} refundData.transactionType - Loại giao dịch (02: hoàn toàn phần, 03: hoàn một phần)
   * @param {string} refundData.transactionNo - Mã giao dịch gốc từ VNPay
   * @param {string} refundData.user - Người thực hiện hoàn tiền
   * @returns {Promise<Object>} Kết quả hoàn tiền
   */
  async refundTransaction(refundData) {
    try {
      const date = new Date();
      const createDate = this.formatDate(date);

      // Tạo mã đơn hàng hoàn tiền duy nhất
      const refundOrderId = `RF${refundData.orderId}`;

      // Chuẩn bị dữ liệu hoàn tiền
      const vnpParams = {
        vnp_Version: vnpayConfig.vnp_Version,
        vnp_Command: "refund",
        vnp_TmnCode: vnpayConfig.vnp_TmnCode,
        vnp_TxnRef: refundOrderId,
        vnp_OrderInfo: `Hoàn tiền cho đơn hàng ${refundData.orderId}`,
        vnp_Amount: refundData.amount * 100, // Nhân với 100 vì VNPay yêu cầu số tiền * 100
        vnp_TransactionNo: refundData.transactionNo,
        vnp_TransactionDate: createDate,
        vnp_CreateDate: createDate,
        vnp_IpAddr: vnpayConfig.vnp_IpAddr,
        vnp_CreateBy: refundData.user || "System",
        vnp_TransactionType: refundData.transactionType || "02", // 02: hoàn toàn phần, 03: hoàn một phần
      };

      // Sắp xếp các tham số theo thứ tự alphabet
      const sortedParams = this.sortObject(vnpParams);

      // Tạo chuỗi ký
      const signData = qs.stringify(sortedParams, { encode: false });
      const hmac = crypto.createHmac("sha512", vnpayConfig.vnp_HashSecret);
      const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

      // Thêm chữ ký vào tham số
      sortedParams.vnp_SecureHash = signed;

      // Gửi yêu cầu hoàn tiền
      const response = await axios.post(
        vnpayConfig.vnp_ApiUrl,
        qs.stringify(sortedParams),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const result = response.data;
      logger.info(`VNPay refund for order ${refundData.orderId}:`, { result });

      return {
        isSuccessful: result.vnp_ResponseCode === "00",
        responseCode: result.vnp_ResponseCode,
        message: this.getResponseMessage(result.vnp_ResponseCode),
        amount: parseInt(result.vnp_Amount) / 100, // Chia cho 100 để lấy số tiền thực
        orderId: result.vnp_TxnRef,
        transactionNo: result.vnp_TransactionNo,
      };
    } catch (error) {
      logger.error("Error refunding VNPay transaction:", {
        error: error.message,
        orderId: refundData.orderId,
      });
      throw new Error("Không thể hoàn tiền giao dịch VNPay");
    }
  }

  /**
   * Sắp xếp các thuộc tính của đối tượng theo thứ tự alphabet
   * @param {Object} obj - Đối tượng cần sắp xếp
   * @returns {Object} Đối tượng đã sắp xếp
   */
  sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();

    for (const key of keys) {
      if (obj.hasOwnProperty(key)) {
        sorted[key] = obj[key];
      }
    }

    return sorted;
  }

  /**
   * Định dạng ngày tháng theo yêu cầu của VNPay (yyyyMMddHHmmss)
   * @param {Date} date - Đối tượng Date
   * @returns {string} Chuỗi ngày tháng đã định dạng
   */
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Tạo mã đơn hàng duy nhất
   * @returns {string} Mã đơn hàng
   */
  generateOrderId() {
    const timestamp = new Date().getTime();
    const uuid = uuidv4().replace(/-/g, "").substring(0, 8);
    return `${timestamp}${uuid}`;
  }

  /**
   * Lấy thông báo tương ứng với mã phản hồi
   * @param {string} responseCode - Mã phản hồi từ VNPay
   * @returns {string} Thông báo
   */
  getResponseMessage(responseCode) {
    const messages = {
      "00": "Giao dịch thành công",
      "01": "Giao dịch đã tồn tại",
      "02": "Merchant không hợp lệ (kiểm tra lại vnp_TmnCode)",
      "03": "Dữ liệu gửi sang không đúng định dạng",
      "04": "Khởi tạo GD không thành công do Website đang bị tạm khóa",
      "05": "Giao dịch không thành công do: Quý khách nhập sai mật khẩu quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch",
      "06": "Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.",
      "07": "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).",
      "08": "Giao dịch không thành công. Tài khoản của Quý khách không đủ số dư để thực hiện giao dịch.",
      "09": "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.",
      10: "Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần",
      11: "Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.",
      12: "Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.",
      13: "Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch.",
      24: "Giao dịch không thành công do: Khách hàng hủy giao dịch",
      51: "Giao dịch không thành công do: Tài khoản của Quý khách không đủ số dư để thực hiện giao dịch.",
      65: "Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.",
      75: "Ngân hàng thanh toán đang bảo trì.",
      79: "Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định. Xin quý khách vui lòng thực hiện lại giao dịch",
      99: "Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)",
    };

    return messages[responseCode] || "Lỗi không xác định";
  }
}

module.exports = new VNPayService();

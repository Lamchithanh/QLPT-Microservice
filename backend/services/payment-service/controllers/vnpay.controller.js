const vnpayService = require("../services/vnpay.service");
const Payment = require("../models/payment.model");
const Invoice = require("../models/invoice.model");
const logger = require("../config/logger");
const vnpayConfig = require("../config/vnpay.config");
const mongoose = require("mongoose");

/**
 * Controller xử lý thanh toán qua VNPay
 */
class VNPayController {
  /**
   * Tạo thanh toán qua VNPay
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Object} Response với URL thanh toán
   */
  async createPayment(req, res) {
    try {
      const { amount, orderDescription, invoiceId } = req.body;

      // Kiểm tra dữ liệu đầu vào
      if (!amount || !orderDescription || !invoiceId) {
        return res.status(400).json({
          status: "error",
          message:
            "Vui lòng cung cấp đầy đủ thông tin: amount, orderDescription, invoiceId",
        });
      }

      let invoice;

      // Xử lý đặc biệt cho invoice ID test
      if (invoiceId === "test" || invoiceId === "60f1a5b3e6b3f32d8c9e4b7a") {
        // Tạo invoice test tạm thời (không lưu vào DB)
        invoice = {
          _id: "test-invoice-" + Date.now(),
          status: "pending",
          amount: amount,
          description: orderDescription,
          payments: [],
        };

        logger.info("Sử dụng invoice test cho thanh toán VNPay");
      } else {
        // Kiểm tra hóa đơn tồn tại
        invoice = await Invoice.findById(invoiceId);
        if (!invoice) {
          return res.status(404).json({
            status: "error",
            message: "Không tìm thấy hóa đơn",
          });
        }

        // Kiểm tra trạng thái hóa đơn
        if (invoice.status === "paid") {
          return res.status(400).json({
            status: "error",
            message: "Hóa đơn này đã được thanh toán",
          });
        }
      }

      // Lấy địa chỉ IP của người dùng
      const ipAddr =
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

      // Tạo URL thanh toán
      const paymentData = {
        amount: amount,
        orderDescription: orderDescription,
        ipAddr: ipAddr,
        language: req.body.language || "vn",
        bankCode: req.body.bankCode,
      };

      const { paymentUrl, orderId } = await vnpayService.createPaymentUrl(
        paymentData
      );

      // Lưu thông tin thanh toán vào database
      const payment = new Payment({
        invoice: invoice._id,
        amount: amount,
        method: "vnpay",
        status: "pending",
        description: orderDescription,
        metadata: {
          vnpayOrderId: orderId,
          ipAddress: ipAddr,
          isTestPayment:
            invoiceId === "test" || invoiceId === "60f1a5b3e6b3f32d8c9e4b7a",
        },
      });

      await payment.save();

      // Cập nhật trạng thái hóa đơn nếu không phải invoice test
      if (invoiceId !== "test" && invoiceId !== "60f1a5b3e6b3f32d8c9e4b7a") {
        invoice.status = "processing";
        invoice.payments.push(payment._id);
        await invoice.save();
      }

      logger.info(`Created VNPay payment for invoice ${invoice._id}`, {
        paymentId: payment._id,
        orderId,
      });

      // Thêm thông tin thẻ test cho môi trường sandbox
      const sandboxInfo =
        process.env.NODE_ENV === "development"
          ? {
              testCards: vnpayConfig.testCards,
              note: "Sử dụng thông tin thẻ test này để thanh toán trong môi trường sandbox",
            }
          : null;

      return res.status(200).json({
        status: "success",
        data: {
          paymentUrl,
          orderId,
          paymentId: payment._id,
          sandboxInfo,
        },
      });
    } catch (error) {
      logger.error("Error creating VNPay payment:", {
        error: error.message,
        stack: error.stack,
      });
      return res.status(500).json({
        status: "error",
        message: "Không thể tạo thanh toán VNPay",
        error: error.message,
      });
    }
  }

  /**
   * Xử lý callback từ VNPay
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Object} Redirect đến trang kết quả thanh toán
   */
  async handleCallback(req, res) {
    try {
      // Log toàn bộ query params để debug
      logger.info("VNPay callback received:", { query: req.query });

      // Xác thực callback từ VNPay
      const vnpayResponse = vnpayService.verifyReturnUrl(req.query);

      if (!vnpayResponse.isValid) {
        logger.warn("Invalid VNPay callback signature", { query: req.query });
        return res.redirect(
          `${vnpayConfig.paymentResultUrl}?status=error&message=Invalid signature`
        );
      }

      // Tìm thanh toán theo mã đơn hàng
      const payment = await Payment.findOne({
        "metadata.vnpayOrderId": vnpayResponse.orderId,
      });

      if (!payment) {
        logger.warn("Payment not found for VNPay order", {
          orderId: vnpayResponse.orderId,
        });
        return res.redirect(
          `${vnpayConfig.paymentResultUrl}?status=error&message=Payment not found`
        );
      }

      // Cập nhật trạng thái thanh toán
      payment.status = vnpayResponse.isSuccessful ? "completed" : "failed";
      payment.transactionId = vnpayResponse.transactionNo;
      payment.metadata = {
        ...payment.metadata,
        vnpayResponse: {
          responseCode: vnpayResponse.responseCode,
          bankCode: vnpayResponse.bankCode,
          bankTranNo: vnpayResponse.bankTranNo,
          cardType: vnpayResponse.cardType,
          payDate: vnpayResponse.payDate,
          message: vnpayResponse.message,
        },
      };

      await payment.save();

      // Nếu thanh toán thành công và không phải là thanh toán test, cập nhật hóa đơn
      if (vnpayResponse.isSuccessful && !payment.metadata.isTestPayment) {
        const invoice = await Invoice.findById(payment.invoice);
        if (invoice) {
          invoice.status = "paid";
          invoice.paidAt = new Date();
          await invoice.save();

          logger.info(`Invoice ${invoice._id} marked as paid`, {
            paymentId: payment._id,
            orderId: vnpayResponse.orderId,
          });
        }
      }

      logger.info(
        `VNPay callback processed for order ${vnpayResponse.orderId}`,
        {
          success: vnpayResponse.isSuccessful,
          paymentId: payment._id,
        }
      );

      // Chuyển hướng đến trang kết quả thanh toán
      return res.redirect(
        `${vnpayConfig.paymentResultUrl}?status=${
          vnpayResponse.isSuccessful ? "success" : "error"
        }&message=${encodeURIComponent(vnpayResponse.message)}&orderId=${
          vnpayResponse.orderId
        }`
      );
    } catch (error) {
      logger.error("Error handling VNPay callback:", {
        error: error.message,
        stack: error.stack,
      });
      return res.redirect(
        `${vnpayConfig.paymentResultUrl}?status=error&message=Server error`
      );
    }
  }

  /**
   * Kiểm tra trạng thái thanh toán
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Object} Response với trạng thái thanh toán
   */
  async checkPaymentStatus(req, res) {
    try {
      const { orderId } = req.params;

      // Tìm thanh toán theo mã đơn hàng
      const payment = await Payment.findOne({
        "metadata.vnpayOrderId": orderId,
      });

      if (!payment) {
        return res.status(404).json({
          status: "error",
          message: "Không tìm thấy thanh toán",
        });
      }

      // Nếu thanh toán đang chờ xử lý, kiểm tra với VNPay
      if (payment.status === "pending") {
        try {
          const checkResult = await vnpayService.checkTransactionStatus(
            orderId,
            payment.amount
          );

          // Cập nhật trạng thái thanh toán
          if (checkResult.isSuccessful) {
            payment.status = "completed";
            payment.transactionId = checkResult.transactionNo;

            // Cập nhật hóa đơn nếu không phải là thanh toán test
            if (!payment.metadata.isTestPayment) {
              const invoice = await Invoice.findById(payment.invoice);
              if (invoice) {
                invoice.status = "paid";
                invoice.paidAt = new Date();
                await invoice.save();
              }
            }
          } else if (checkResult.responseCode !== "24") {
            // Nếu không phải do người dùng hủy (24), đánh dấu là thất bại
            payment.status = "failed";
          }

          payment.metadata = {
            ...payment.metadata,
            vnpayCheckResponse: {
              responseCode: checkResult.responseCode,
              message: checkResult.message,
              transactionStatus: checkResult.transactionStatus,
              checkTime: new Date(),
            },
          };

          await payment.save();
        } catch (error) {
          logger.error("Error checking VNPay transaction status:", {
            error: error.message,
            orderId,
          });
          // Không cập nhật trạng thái nếu có lỗi khi kiểm tra
        }
      }

      return res.status(200).json({
        status: "success",
        data: {
          paymentId: payment._id,
          invoiceId: payment.invoice,
          amount: payment.amount,
          status: payment.status,
          method: payment.method,
          transactionId: payment.transactionId,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
          metadata: payment.metadata,
        },
      });
    } catch (error) {
      logger.error("Error checking payment status:", {
        error: error.message,
        stack: error.stack,
      });
      return res.status(500).json({
        status: "error",
        message: "Không thể kiểm tra trạng thái thanh toán",
        error: error.message,
      });
    }
  }

  /**
   * Hoàn tiền thanh toán
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Object} Response với kết quả hoàn tiền
   */
  async refundPayment(req, res) {
    try {
      const { paymentId } = req.params;
      const { amount, reason } = req.body;

      // Tìm thanh toán theo ID
      const payment = await Payment.findById(paymentId);

      if (!payment) {
        return res.status(404).json({
          status: "error",
          message: "Không tìm thấy thanh toán",
        });
      }

      // Kiểm tra điều kiện hoàn tiền
      if (payment.method !== "vnpay") {
        return res.status(400).json({
          status: "error",
          message: "Chỉ hỗ trợ hoàn tiền cho thanh toán VNPay",
        });
      }

      if (payment.status !== "completed") {
        return res.status(400).json({
          status: "error",
          message: "Chỉ có thể hoàn tiền cho thanh toán đã hoàn tất",
        });
      }

      if (payment.refunded) {
        return res.status(400).json({
          status: "error",
          message: "Thanh toán này đã được hoàn tiền",
        });
      }

      // Xác định số tiền hoàn
      const refundAmount = amount || payment.amount;
      const transactionType = refundAmount < payment.amount ? "03" : "02"; // 02: hoàn toàn phần, 03: hoàn một phần

      // Thực hiện hoàn tiền
      const refundResult = await vnpayService.refundTransaction({
        orderId: payment.metadata.vnpayOrderId,
        amount: refundAmount,
        transactionType,
        transactionNo: payment.transactionId,
        user: req.user ? req.user.username : "admin",
      });

      if (refundResult.isSuccessful) {
        // Cập nhật thanh toán
        payment.refunded = true;
        payment.refundedAmount = refundAmount;
        payment.metadata = {
          ...payment.metadata,
          refund: {
            amount: refundAmount,
            reason: reason || "Hoàn tiền theo yêu cầu",
            time: new Date(),
            transactionNo: refundResult.transactionNo,
            by: req.user ? req.user.username : "admin",
          },
        };

        await payment.save();

        // Cập nhật hóa đơn nếu hoàn toàn bộ và không phải là thanh toán test
        if (transactionType === "02" && !payment.metadata.isTestPayment) {
          const invoice = await Invoice.findById(payment.invoice);
          if (invoice) {
            invoice.status = "refunded";
            await invoice.save();
          }
        }

        logger.info(`Refunded payment ${paymentId}`, {
          amount: refundAmount,
          orderId: payment.metadata.vnpayOrderId,
        });

        return res.status(200).json({
          status: "success",
          data: {
            paymentId: payment._id,
            refundAmount: refundAmount,
            message: refundResult.message,
            transactionNo: refundResult.transactionNo,
          },
        });
      } else {
        return res.status(400).json({
          status: "error",
          message: `Không thể hoàn tiền: ${refundResult.message}`,
          code: refundResult.responseCode,
        });
      }
    } catch (error) {
      logger.error("Error refunding payment:", {
        error: error.message,
        stack: error.stack,
      });
      return res.status(500).json({
        status: "error",
        message: "Không thể hoàn tiền thanh toán",
        error: error.message,
      });
    }
  }

  /**
   * Lấy thông tin thẻ test cho sandbox
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @returns {Object} Response với thông tin thẻ test
   */
  getTestCards(req, res) {
    try {
      if (process.env.NODE_ENV !== "development") {
        return res.status(403).json({
          status: "error",
          message: "Chức năng này chỉ khả dụng trong môi trường development",
        });
      }

      return res.status(200).json({
        status: "success",
        data: {
          testCards: vnpayConfig.testCards,
          note: "Sử dụng thông tin thẻ test này để thanh toán trong môi trường sandbox",
        },
      });
    } catch (error) {
      logger.error("Error getting test cards:", { error: error.message });
      return res.status(500).json({
        status: "error",
        message: "Không thể lấy thông tin thẻ test",
        error: error.message,
      });
    }
  }
}

module.exports = new VNPayController();

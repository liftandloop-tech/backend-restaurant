import { sanitizeForPrint, sanitizeObjectForPrint } from "../utils/sanitizer.js";
import { logger } from "../utils/logger.js";
import { ENV } from "../config/env.js";
import bill from "../models/bill.js";


// const {sanitizeForPrint,sanitizeObjectForPrint} = require('../utils/sanitizer.js')
// const{logger} = require('../utils/logger.js')
// const {ENV} = require('../config/db.js')


// Sanitize text to prevent ESC/POS injection
const escapeForPrint = (text) => {
  if (typeof text !== 'string') return '';

  return sanitizeForPrint(text)
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/[\x1B\x1D]/g, '');
};

export class BillPrinter {
  constructor(printerConfig = {}) {
    this.config = {
      name: printerConfig.name || 'Bill Printer',
      timeout: printerConfig.timeout || ENV.PRINTER_TIMEOUT,
      ...printerConfig
    };
  }

  async initialize() {
    logger.info('Bill printer initialized', { printer: this.config.name });
  }

  async printBill(billData) {
    try {
      // Sanitize all data before printing
      const sanitized = sanitizeObjectForPrint(billData);

      // Build print buffer
      const lines = this.buildBillLines(sanitized);

      // Send to printer
      await this.sendToPrinter(lines);

      logger.info('Bill printed successfully', {
        billId: billData._id || billData.id,
        printer: this.config.name
      });

      return { success: true, billId: billData._id || billData.id };
    } catch (error) {
      logger.error('Failed to print bill', error, {
        billId: billData._id || billData.id
      });
      throw error;
    }
  }

  buildBillLines(billData) {
    const lines = [];
    // Handle both populated data (billData.orderId) and direct order data
    const order = billData.orderId || billData.order || {};
    const cashier = billData.cashierId || {}


    // Header
    lines.push('='.repeat(40));
    lines.push('         RESTAURANT RECEIPT');
    lines.push('='.repeat(40));
    lines.push('Bill #: ' + escapeForPrint(billData.billNumber || billData.id || 'N/A'));
    lines.push('Order #: ' + escapeForPrint(order.orderNumber || order.id || 'N/A'));
    // new for w
    // Customer information based on order source
    if (order.source === 'phone' || order.source === 'online') {
      const customerName = escapeForPrint(order.customerName || billData.customerId?.name || 'N/A');
      const customerPhone = escapeForPrint(order.customerPhone || order.deliveryPhone || billData.customerId?.phone || 'N/A');
      lines.push('Customer: ' + customerName);
      lines.push('Phone: ' + customerPhone);
      if (order.deliveryAddress) {
        lines.push('Address: ' + escapeForPrint(order.deliveryAddress));
      }
      // end
    } else {
      // For dine-in and takeaway orders, show table number
      lines.push('Table: ' + escapeForPrint(String(order.tableNumber || 'N/A')));
    }
    // lines.push('Cashier: ' + escapeForPrint(cashier.fullName || cashier.name || cashier.email || 'N/A'));
    lines.push('Cashier:' + escapeForPrint(cashier.fullName || cashier.name || cashier.email) || 'N/A')
    lines.push('Date: ' + escapeForPrint(new Date(billData.createdAt || Date.now()).toLocaleString()));
    lines.push('-'.repeat(40));

    // Items
    if (order.items && Array.isArray(order.items)) {
      lines.push('ITEMS:');
      order.items.forEach((item) => {
        const name = escapeForPrint(item.name || 'Item');
        const qty = escapeForPrint(String(item.qty || item.quantity || 1));
        const price = parseFloat(item.price || 0);
        const itemTotal = (price * qty).toFixed(2);
        lines.push(`${name} x${qty} - ₹${itemTotal}`);
      });
      lines.push('-'.repeat(40));
    }

    // Totals
    lines.push('Subtotal:     ₹' + escapeForPrint(String((billData.subtotal || 0).toFixed(2))));
    if (billData.discount > 0) {
      lines.push('Discount:     ₹' + escapeForPrint(String(billData.discount.toFixed(2))));
    }
    const totalTax = billData.tax || 0;
    const cgst = totalTax / 2;
    const sgst = totalTax / 2;
    lines.push('CGST (2.5%):     ₹' + escapeForPrint(cgst.toFixed(2)));
    lines.push('SGST (2.5%):     ₹' + escapeForPrint(sgst.toFixed(2)));
    lines.push('-'.repeat(40));
    lines.push('TOTAL:         ₹' + escapeForPrint(String((billData.total || 0).toFixed(2))));
    lines.push('-'.repeat(40));

    // Payment info
    if (billData.paid) {
      lines.push('Status: PAID');
      lines.push('Payment: ' + escapeForPrint(billData.paymentMethod || 'cash').toUpperCase());
      if (billData.transactionId) {
        lines.push('Txn ID: ' + escapeForPrint(billData.transactionId));
      }
      lines.push('Paid At: ' + escapeForPrint(new Date(billData.paidAt || billData.createdAt).toLocaleString()));
    } else {
      lines.push('Status: UNPAID');
    }
    lines.push('='.repeat(40));
    lines.push('      Thank You! Visit Again!');
    lines.push('='.repeat(40));
    lines.push(''); // Empty line for cut

    return lines.join('\n');
  }

  async sendToPrinter(data) {
    logger.debug('Printing bill', {
      printer: this.config.name,
      dataLength: data.length
    });

    return new Promise((resolve) => {
      setTimeout(() => {
        logger.info('Bill print job completed', { printer: this.config.name });
        resolve();
      }, 100);
    });
  }

  async testPrint() {
    const testData = {
      billNumber: 'BILL-TEST-001',
      orderId: {
        orderNumber: 'ORD-TEST',
        tableNumber: 5,
        items: [
          { name: 'Test Item', qty: 2, price: 100 }
        ]
      },
      subtotal: 200,
      tax: 36,
      total: 236,
      paymentMethod: 'cash'
    };

    return await this.printBill(testData);
  }
}

export default BillPrinter;


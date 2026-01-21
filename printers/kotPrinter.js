const { sanitizeForPrint, sanitizeObjectForPrint } = require("../utils/sanitizer.js");
const { logger } = require("../utils/logger.js");
const { ENV } = require("../config/env.js");



// ESC/POS command constants (prevented from injection)
const ESC = '\x1B';
const GS = '\x1D';

// Sanitize text to prevent ESC/POS injection
const escapeForPrint = (text) => {
  if (typeof text !== 'string') return '';

  // Remove all control characters and ESC/POS commands
  return sanitizeForPrint(text)
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control chars
    .replace(/[\x1B\x1D]/g, ''); // Remove ESC and GS
};

// Basic ESC/POS printer class (abstract - implement for actual hardware)
class KOTPrinter {
  constructor(printerConfig = {}) {
    this.config = {
      name: printerConfig.name || 'KOT Printer',
      timeout: printerConfig.timeout || ENV.PRINTER_TIMEOUT,
      ...printerConfig
    };
  }

  // Initialize printer (override in actual implementation)
  async initialize() {
    logger.info('Printer initialized', { printer: this.config.name });
  }

  // Print KOT with sanitization
  async printKOT(kotData) {
    try {
      // Sanitize all data before printing
      const sanitized = sanitizeObjectForPrint(kotData);

      // Build print buffer (sanitized content only)
      const lines = this.buildKOTLines(sanitized);

      // Send to printer
      await this.sendToPrinter(lines);

      logger.info('KOT printed successfully', {
        kotId: kotData._id || kotData.id,
        printer: this.config.name
      });

      return { success: true, kotId: kotData._id || kotData.id };
    } catch (error) {
      logger.error('Failed to print KOT', error, {
        kotId: kotData._id || kotData.id
      });
      throw error;
    }
  }

  // Build KOT print lines (all content sanitized)
  buildKOTLines(kotData) {
    const lines = [];

    // Header
    lines.push('='.repeat(32));
    lines.push('KOT #' + escapeForPrint(kotData.kotNumber || kotData.id || 'N/A'));
    lines.push('='.repeat(32));
    lines.push('Station: ' + escapeForPrint(kotData.station || 'N/A'));
    lines.push('Order #: ' + escapeForPrint(
      kotData.orderId?.orderNumber ||
      kotData.orderNumber ||
      'N/A'
    ));
    lines.push('-'.repeat(32));

    // Items
    if (kotData.items && Array.isArray(kotData.items)) {
      kotData.items.forEach((item, index) => {
        const itemName = escapeForPrint(item.name || 'Item');
        const qty = escapeForPrint(String(item.qty || 1));
        lines.push(`${index + 1}. ${itemName} x${qty}`);

        if (item.specialInstructions) {
          const instructions = escapeForPrint(item.specialInstructions);
          lines.push(`   Note: ${instructions}`);
        }
      });
    }

    lines.push('-'.repeat(32));
    lines.push('Time: ' + escapeForPrint(new Date().toLocaleString()));
    lines.push('='.repeat(32));
    lines.push(''); // Empty line for cut

    return lines.join('\n');
  }

  // Send to printer (override in actual implementation)
  async sendToPrinter(data) {
    // In actual implementation, this would send to physical printer
    // For now, just log (in production, use escpos or node-thermal-printer)
    logger.debug('Printing data', {
      printer: this.config.name,
      dataLength: data.length
    });

    // Simulate printer delay
    return new Promise((resolve) => {
      setTimeout(() => {
        logger.info('Print job completed', { printer: this.config.name });
        resolve();
      }, 100);
    });
  }

  // Test print
  async testPrint() {
    const testData = {
      kotNumber: 'TEST-001',
      station: 'kitchen',
      orderNumber: 'ORD-TEST',
      items: [
        { name: 'Test Item 1', qty: 2 },
        { name: 'Test Item 2', qty: 1 }
      ]
    };

    return await this.printKOT(testData);
  }
}

// export default KOTPrinter;
module.exports = KOTPrinter;

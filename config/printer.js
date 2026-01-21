const KOTPrinter = require("../printers/kotPrinter.js");
const BillPrinter = require("../printers/billPrinter.js");
const { logger } = require("../utils/logger.js");


// Printer instances (singleton pattern)
let kotPrinterInstance = null;
let billPrinterInstance = null;

exports.getKOTPrinter = () => {
  if (!kotPrinterInstance) {
    kotPrinterInstance = new KOTPrinter({
      name: 'Kitchen Order Ticket Printer',
      // In production, add actual printer config:
      // port: process.env.PRINTER_PORT,
      // type: process.env.PRINTER_TYPE
    });
  }
  return kotPrinterInstance;
};

exports.getBillPrinter = () => {
  if (!billPrinterInstance) {
    billPrinterInstance = new BillPrinter({
      name: 'Bill Receipt Printer',
      // In production, add actual printer config:
      // port: process.env.BILL_PRINTER_PORT,
      // type: process.env.BILL_PRINTER_TYPE
    });
  }
  return billPrinterInstance;
};

// Initialize all printers
exports.initializePrinters = async () => {
  try {
    const kotPrinter = exports.getKOTPrinter();
    const billPrinter = exports.getBillPrinter();

    await kotPrinter.initialize();
    await billPrinter.initialize();

    logger.info('All printers initialized');
    return { kotPrinter, billPrinter };
  } catch (error) {
    logger.error('Failed to initialize printers', error);
    throw error;
  }
};

// export default { getKOTPrinter, getBillPrinter, initializePrinters };

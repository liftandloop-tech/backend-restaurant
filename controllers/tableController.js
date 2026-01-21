const tableService = require("../services/tableService.js");
const { sendSuccess } = require("../utils/response.js");

const { resolveRestaurantId } = require("../utils/context.js");

exports.getTables = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req);

    // Clean filters: remove "undefined", "null", "all" strings which might come from frontend
    const cleanQuery = {};
    Object.keys(req.query).forEach(key => {
      const val = req.query[key];
      if (val !== undefined && val !== null && val !== 'undefined' && val !== 'null' && val !== 'all' && val !== '') {
        cleanQuery[key] = val;
      }
    });

    if (!restaurantId) {
      return sendSuccess(res, "Tables retrieved successfully", []);
    }

    const filters = {
      ...cleanQuery,
      restaurantId: restaurantId
    };


    const tables = await tableService.getTables(filters);
    sendSuccess(res, "Tables retrieved successfully ", tables);
  } catch (error) {
    next(error);
  }
};

exports.getTableById = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    const table = await tableService.getTableById(req.params.id, restaurantId);
    sendSuccess(res, "Table retrieved successfully", table);
  } catch (error) {
    next(error);
  }
};


exports.createTable = async (req, res, next) => {
  try {
    // Ensure user has a restaurant (create one if needed)
    let restaurantId = await resolveRestaurantId(req.user.userId, req);
    if (!restaurantId) {
      throw { statusCode: 400, message: "Restaurant context not found. Please ensure you are logged in correctly." };
    }

    const tableData = {
      ...req.body,
      restaurantId: restaurantId
    };

    const table = await tableService.createTable(tableData);
    sendSuccess(res, "Table created successfully", table, 201);
  } catch (error) {
    next(error);
  }
};

exports.updateTable = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant not found for this user" });
    }

    const table = await tableService.updateTable(req.params.id, req.body, restaurantId);
    sendSuccess(res, "Table updated successfully", table);
  } catch (error) {
    next(error);
  }
};

exports.updateTableStatus = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant not found for this user" });
    }

    const table = await tableService.updateTableStatus(req.params.id, req.body.status, restaurantId);
    sendSuccess(res, "Table status updated successfully", table);
  } catch (error) {
    next(error);
  }
};


exports.transferTable = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant not found for this user" });
    }

    const table = await tableService.transferTable(req.params.tableNumber, restaurantId);
    sendSuccess(res, "Table transferred successfully", table);

  } catch (error) {
    next(error);
  }
};

exports.completeCleaning = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant not found for this user" });
    }

    const table = await tableService.completeCleaning(req.params.tableNumber, restaurantId);
    sendSuccess(res, "Table cleaning completed successfully", table);

  } catch (error) {
    next(error);
  }
};

exports.deleteTable = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId, req);
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant not found for this user" });
    }

    await tableService.deleteTable(req.params.id, restaurantId);
    sendSuccess(res, "Table deleted successfully");
  } catch (error) {
    next(error);
  }
};

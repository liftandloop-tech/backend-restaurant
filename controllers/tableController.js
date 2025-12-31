import * as tableService from "../services/tableService.js";
import { sendSuccess } from "../utils/response.js";

import { resolveRestaurantId } from "../utils/context.js";

export const getTables = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);

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

export const getTableById = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    const table = await tableService.getTableById(req.params.id, restaurantId);
    sendSuccess(res, "Table retrieved successfully", table);
  } catch (error) {
    next(error);
  }
};


export const createTable = async (req, res, next) => {
  try {
    // Ensure user has a restaurant (create one if needed)
    let restaurantId = await resolveRestaurantId(req.user.userId);
    if (!restaurantId) {
      const restaurantService = (await import('../services/restaurantService.js'));
      const restaurant = await restaurantService.ensureUserHasRestaurant(req.user.userId);
      restaurantId = restaurant._id;
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

export const updateTable = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant not found for this user" });
    }

    const table = await tableService.updateTable(req.params.id, req.body, restaurantId);
    sendSuccess(res, "Table updated successfully", table);
  } catch (error) {
    next(error);
  }
};

export const updateTableStatus = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant not found for this user" });
    }

    const table = await tableService.updateTableStatus(req.params.id, req.body.status, restaurantId);
    sendSuccess(res, "Table status updated successfully", table);
  } catch (error) {
    next(error);
  }
};


export const transferTable = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant not found for this user" });
    }

    const table = await tableService.transferTable(req.params.tableNumber, restaurantId);
    sendSuccess(res, "Table transferred successfully", table);

  } catch (error) {
    next(error);
  }
};

export const completeCleaning = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant not found for this user" });
    }

    const table = await tableService.completeCleaning(req.params.tableNumber, restaurantId);
    sendSuccess(res, "Table cleaning completed successfully", table);

  } catch (error) {
    next(error);
  }
};

export const deleteTable = async (req, res, next) => {
  try {
    const restaurantId = await resolveRestaurantId(req.user.userId);
    if (!restaurantId) {
      return res.status(400).json({ success: false, message: "Restaurant not found for this user" });
    }

    await tableService.deleteTable(req.params.id, restaurantId);
    sendSuccess(res, "Table deleted successfully");
  } catch (error) {
    next(error);
  }
};
